import type { SupabaseClient } from '@supabase/supabase-js'

const PUSH_WORKER = '/duepoint-push-sw.js'
const VAPID_KEY = import.meta.env.VITE_PUSH_VAPID_PUBLIC_KEY as string | undefined

function decodeVapidKey(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes.buffer
}

export function phonePushSupported() {
  return typeof window !== 'undefined' && window.isSecureContext &&
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function requiresHomeScreenInstall() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const standalone = window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return ios && !standalone
}

export async function getPhonePushEnabled() {
  if (!phonePushSupported()) return false
  const registration = await navigator.serviceWorker.getRegistration('/')
  if (!registration) return false
  return Boolean(await registration.pushManager.getSubscription())
}

export async function enablePhonePush(client: SupabaseClient, userId: string) {
  if (!phonePushSupported()) throw new Error('Phone push requires HTTPS and a supported browser.')
  if (requiresHomeScreenInstall()) throw new Error('On iPhone, open Due₱oint from its Home Screen icon, not a Safari tab.')
  if (!VAPID_KEY) throw new Error('Push is not configured on this deployment yet. Add the VAPID key in Vercel settings.')

  // Request permission immediately from the user's button press: required on iPhone.
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notifications were not allowed. Check iPhone Settings → Notifications → Due₱oint.')

  const registration = await navigator.serviceWorker.register(PUSH_WORKER, { scope: '/', updateViaCache: 'none' })
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeVapidKey(VAPID_KEY),
  })
  const { error } = await client.from('duepoint_push_subscriptions').upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
    subscription: subscription.toJSON(),
    enabled: true,
    timezone: 'Asia/Manila',
  }, { onConflict: 'endpoint' })
  if (error) throw new Error(`Could not register this phone: ${error.message}. Apply the push SQL setup first.`)
}

export async function disablePhonePush(client: SupabaseClient) {
  const registration = await navigator.serviceWorker.getRegistration('/')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  const { error } = await client.from('duepoint_push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  if (error) throw new Error(`Could not remove phone reminders: ${error.message}`)
  await subscription.unsubscribe()
}
