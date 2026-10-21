import { createClient } from '@supabase/supabase-js'
import webPush from 'web-push'

const DAY_MS = 86400000
const MAX_SUBSCRIPTIONS_PER_RUN = 300

function manilaDay() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return { year: get('year'), month: get('month'), day: get('day') }
}

function isoDate(year, month, day) {
  const safeDay = Math.min(Math.max(1, day), new Date(Date.UTC(year, month, 0)).getUTCDate())
  return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
}

function getDaysUntil(value, today) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return Infinity
  const a = Date.parse(`${value}T00:00:00.000Z`)
  const b = Date.parse(`${today}T00:00:00.000Z`)
  return Number.isFinite(a) && Number.isFinite(b) ? Math.round((a - b) / DAY_MS) : Infinity
}

function dayOfMonthFromText(raw) {
  if (typeof raw !== 'string') return null
  const iso = raw.match(/^\d{4}-\d{2}-(\d{2})$/)
  const match = iso ?? raw.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/i)
  const day = Number(match?.[1])
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null
}

function remindersFromCloud(finance, now) {
  const today = isoDate(now.year, now.month, now.day)
  const monthKey = today.slice(0, 7)
  const items = []
  const threshold = (days) => [0, 1, 3, 7, -1, -3, -7].includes(days)

  for (const bill of finance.recurringExpenses ?? []) {
    const frequency = String(bill.frequency ?? 'monthly').toLowerCase()
    if (!frequency.includes('month')) continue // No guessed schedules for unsupported frequencies.
    const day = dayOfMonthFromText(bill.nextDue)
    if (!day) continue
    const date = isoDate(now.year, now.month, day)
    const days = getDaysUntil(date, today)
    if (!threshold(days)) continue
    // A completed previous month does not mean the new month is paid.
    const amount = bill.periodKey === monthKey
      ? Number(bill.remainingBalance ?? bill.amount)
      : Number(bill.amount)
    if (!Number.isFinite(amount) || amount <= 0) continue
    items.push({ name: String(bill.name ?? 'Bill'), days, kind: 'bill', date })
  }

  for (const card of finance.creditCards ?? []) {
    const minimum = Number(card.minimumDue)
    if (!Number.isFinite(minimum) || minimum <= 0) continue // Never estimate missing minimums.
    let date = typeof card.paymentDueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(card.paymentDueDate)
      ? card.paymentDueDate : null
    if (!date) {
      const day = Number(card.dueDay)
      if (!Number.isInteger(day) || day < 1 || day > 31) continue
      date = isoDate(now.year, now.month, day)
    }
    const days = getDaysUntil(date, today)
    if (!threshold(days)) continue
    items.push({ name: String(card.name ?? 'Card'), days, kind: 'card', date })
  }

  for (const debt of finance.debts ?? []) {
    if (debt.kind === 'credit-card-installment') continue // SOA installment may already be included in card minimum.
    const day = dayOfMonthFromText(debt.due)
    if (!day) continue
    const due = Number(debt.monthly)
    if (!(due > 0) || !(Number(debt.balance) > 0)) continue
    const date = isoDate(now.year, now.month, day)
    const days = getDaysUntil(date, today)
    if (!threshold(days)) continue
    const paid = (finance.transactions ?? []).filter((txn) =>
      txn.label === `Debt payment - ${debt.name}` && String(txn.createdAt ?? '').slice(0, 7) === monthKey,
    ).reduce((sum, txn) => sum + (Number(txn.amount) || 0), 0)
    if (paid >= due) continue
    items.push({ name: String(debt.name ?? 'Loan'), days, kind: 'debt', date })
  }

  // One aggregate notification, no balances or amounts exposed on iPhone lock screen.
  items.sort((a, b) => a.days - b.days || a.name.localeCompare(b.name))
  return items
}

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' })
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.authorization !== `Bearer ${secret}`) {
    return response.status(401).json({ error: 'Unauthorized' })
  }
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  const publicVapid = process.env.VITE_PUSH_VAPID_PUBLIC_KEY
  const privateVapid = process.env.PUSH_VAPID_PRIVATE_KEY
  const contact = process.env.PUSH_CONTACT_EMAIL
  if (!url || !serviceRole || !publicVapid || !privateVapid || !contact) {
    return response.status(503).json({ error: 'Push environment is not configured' })
  }
  webPush.setVapidDetails(`mailto:${contact}`, publicVapid, privateVapid)
  const client = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } })
  const todayParts = manilaDay()
  const today = isoDate(todayParts.year, todayParts.month, todayParts.day)
  let sent = 0
  let failed = 0
  let skipped = 0
  const { data: devices, error: listError } = await client.from('duepoint_push_subscriptions')
    .select('endpoint,user_id,subscription,last_sent_local_date')
    .eq('enabled', true).limit(MAX_SUBSCRIPTIONS_PER_RUN)
  if (listError) return response.status(500).json({ error: 'Could not load device subscriptions' })

  for (const device of devices ?? []) {
    if (device.last_sent_local_date === today) { skipped++; continue }
    const { data: row, error: financeError } = await client.from('duewise_user_data')
      .select('data').eq('user_id', device.user_id).maybeSingle()
    if (financeError || !row?.data) { skipped++; continue }
    const reminders = remindersFromCloud(row.data, todayParts)
    if (reminders.length === 0) { skipped++; continue }
    const urgent = reminders.filter((item) => item.days <= 0).length
    const title = urgent > 0 ? `Due₱oint · ${urgent} payment${urgent === 1 ? '' : 's'} due` : 'Due₱oint · upcoming payments'
    const summary = reminders.slice(0, 3).map((item) => `${item.name} (${item.days < 0 ? 'overdue' : item.days === 0 ? 'today' : `in ${item.days}d`})`).join(' · ')
    const body = reminders.length > 3 ? `${summary} · +${reminders.length - 3} more` : summary
    try {
      await webPush.sendNotification(device.subscription, JSON.stringify({ title, body }), { TTL: 86400, urgency: 'normal' })
      await client.from('duepoint_push_subscriptions').update({ last_sent_local_date: today })
        .eq('endpoint', device.endpoint)
      sent++
    } catch (error) {
      failed++
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await client.from('duepoint_push_subscriptions').delete().eq('endpoint', device.endpoint)
      }
    }
  }
  response.setHeader('Cache-Control', 'no-store')
  return response.status(200).json({ sent, failed, skipped, date: today })
}
