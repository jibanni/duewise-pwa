import './index.css'

import { createClient, type Session } from '@supabase/supabase-js'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Bell,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Home,
  Landmark,
  Moon,
  Pencil,
  Plus,
  Repeat2,
  Search,
  Sun,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react'

type TabKey = 'today' | 'wallet' | 'plan' | 'insights'
type PlanSectionKey = 'bills' | 'budget' | 'savings' | 'debts'
type QuickAction = 'income' | 'expense' | 'transfer'
type TransactionFilter = 'all' | QuickAction
type AccountAccent = 'green' | 'blue' | 'teal'
type DialogTone = 'default' | 'danger'

type BudgetCategory = string

type Account = {
  id: number
  name: string
  type: string
  balance: number
  accent: AccountAccent
}

type CreditCardAccount = {
  id: number
  name: string
  currentBalance: number
  creditLimit: number
  cutOffDay: number
  dueDay: number
  annualRate?: number
  minimumDue?: number
  statementDate?: string
  paymentDueDate?: string
  lastPaymentAt?: string
}

type CreditCardInsight = {
  card: CreditCardAccount
  utilization: number
  availableCredit: number
  daysToCutOff: number
  daysToDue: number
  score: number
  status: 'recommended' | 'watch' | 'avoid'
  reason: string
}

type SavingsGoal = {
  id: number
  name: string
  current: number
  target: number
  targetDate: string
}

type Debt = {
  id: number
  name: string
  balance: number
  monthly: number
  due: string
  annualRate?: number
  source?: string
  kind?: 'loan' | 'credit-card-installment' | 'other'
  linkedCardId?: number
}

type CardInstallmentInput = {
  id?: number
  description: string
  remainingBalance: number
  monthlyAmount: number
}

type RecurringExpense = {
  id: number
  name: string
  category: string
  amount: number
  frequency: string
  nextDue: string
  remainingBalance?: number
  periodKey?: string
  lastPaidAt?: string
}

type MonthlyBudget = {
  id: number
  category: BudgetCategory
  limit: number
}

type Transaction = {
  id: string
  type: QuickAction
  amount: number
  label: string
  accountLabel: string
  createdAt: string
  category?: BudgetCategory
}

type FinanceData = {
  accounts: Account[]
  creditCards: CreditCardAccount[]
  savingsGoals: SavingsGoal[]
  debts: Debt[]
  recurringExpenses: RecurringExpense[]
  monthlyBudgets: MonthlyBudget[]
  transactions: Transaction[]
}

type BudgetMetric = {
  budget: MonthlyBudget
  spent: number
  remaining: number
  progress: number
  overBudget: boolean
}

type FinancialHealthSummary = {
  score: number
  status: string
  message: string
  tone: 'good' | 'watch' | 'risk'
}

type CashflowPoint = {
  day: string
  balance: number
}

type SpendingMixPoint = {
  category: string
  amount: number
}

type DebtPlanningItem = {
  id: string
  name: string
  balance: number
  minimumPayment: number
  annualRate: number
  kind: 'Credit card' | 'Debt'
}

type DebtPayoffPlan = {
  method: 'Avalanche' | 'Snowball' | 'Hybrid'
  months: number
  totalInterest: number
  focusName: string
  reason: string
  schedule: { month: string; balance: number }[]
}

type DebtPlanComparison = {
  avalanche: DebtPayoffPlan
  snowball: DebtPayoffPlan
  hybrid: DebtPayoffPlan
  recommended: DebtPayoffPlan
  interestSaved: number
}

type SmartInsight = {
  label: string
  title: string
  message: string
  tone: 'good' | 'watch' | 'risk'
}

type PaydayAllocationPlan = {
  income: number
  bills: number
  creditCards: number
  loanDebts: number
  savings: number
  flexibleCash: number
  focusName: string
  message: string
  tone: 'good' | 'watch' | 'risk'
}

type AffordabilityResult = {
  status: string
  tone: 'good' | 'watch' | 'risk'
  remainingCash: number
  message: string
  paymentAdvice: string
}

type StatementInstallmentDraft = {
  id: string
  description: string
  monthlyAmount: number
  remainingBalance: number
  monthsRemaining: number
  annualRate: number
  confidence: 'High' | 'Medium' | 'Low'
}

type StatementDebtComponentDraft = {
  id: string
  type: 'revolving' | 'installment' | 'interest'
  name: string
  balance: number
  monthlyDue: number
  annualRate: number
  priority: 'High' | 'Medium' | 'Low'
  note: string
}

type StatementAvalanchePreview = {
  totalDebtExposure: number
  requiredThisMonth: number
  focusName: string
  focusRate: number
  focusNote: string
  componentCount: number
}

type StatementImportDraft = {
  fileName: string
  rawText: string
  cardName: string
  statementDate: string
  dueDate: string
  totalAmountDue: number
  minimumAmountDue: number
  outstandingBalance: number
  creditLimit: number
  financeCharge: number
  annualRate: number
  installments: StatementInstallmentDraft[]
  notes: string[]
}

type StatementImportSavePayload = {
  selectedCardId: string
  draft: StatementImportDraft
  updateCreditCard: boolean
  addFinanceCharge: boolean
  addInstallments: boolean
}

type StatementPasswordFormat = 'manual' | 'dob-ddmmmyyyy-upper' | 'dob-mmddyyyy' | 'dob-ddmmmyyyy-title'

type StatementPasswordProfile = {
  id: string
  label: string
  format: StatementPasswordFormat
  hint: string
  example: string
}

type SoaParserFieldKey =
  | 'statementDate'
  | 'dueDate'
  | 'totalAmountDue'
  | 'minimumAmountDue'
  | 'outstandingBalance'
  | 'creditLimit'
  | 'financeCharge'
  | 'installments'

type SoaParserProfile = {
  id: string
  bankName: string
  passwordProfileId: string
  keywords: string[]
  fields: Record<SoaParserFieldKey, string[]>
  defaultAnnualRate: number
}

type SoaParserMatch = {
  profile: SoaParserProfile
  score: number
  confidence: 'High' | 'Medium' | 'Low'
}


type MessageDialogState = {
  type: 'alert' | 'confirm'
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: DialogTone
  onConfirm?: () => void
}

type NavItem = {
  key: TabKey
  label: string
  icon: ElementType
}

const STORAGE_KEY = 'duewise-local-data-v1'
const THEME_KEY = 'duewise-theme'
const DAY_IN_MS = 1000 * 60 * 60 * 24
const CLOUD_SYNC_KEY = 'duewise-last-cloud-sync-at'
const DEFAULT_SOA_BIRTHDATE = ''

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const statementPasswordProfiles: StatementPasswordProfile[] = [
  {
    id: 'security-bank',
    label: 'Security Bank',
    format: 'dob-ddmmmyyyy-upper',
    hint: 'Birthday in DDMMMYYYY format',
    example: '05NOV1980',
  },
  {
    id: 'rcbc-flex-classic',
    label: 'RCBC Flex / Classic',
    format: 'dob-mmddyyyy',
    hint: 'Birthday in MMDDYYYY format',
    example: '11051981',
  },
  {
    id: 'unionbank',
    label: 'UnionBank',
    format: 'dob-ddmmmyyyy-title',
    hint: 'Birthday in ddMmmyyyy format',
    example: '22Jun1994',
  },
]

const soaParserProfiles: SoaParserProfile[] = [
  {
    id: 'unionbank',
    bankName: 'UnionBank',
    passwordProfileId: 'unionbank',
    keywords: [
      'UnionBank',
      'Union Bank',
      'UBP',
      'Payment Due Date',
      'Total Amount Due',
      'Minimum Amount Due',
      'Statement Date',
      'Credit Limit',
      'Finance Charge',
    ],
    fields: {
      statementDate: ['statement date', 'billing period', 'statement period', 'statement as of', 'cycle date'],
      dueDate: ['payment due date', 'due date', 'pay on or before', 'please pay on or before'],
      totalAmountDue: ['total amount due', 'amount due', 'total payment due', 'payment amount due'],
      minimumAmountDue: ['minimum amount due', 'minimum payment due', 'minimum payment', 'minimum due'],
      outstandingBalance: ['statement balance', 'outstanding balance', 'new balance', 'current balance', 'total balance'],
      creditLimit: ['credit limit', 'total credit limit', 'approved credit limit'],
      financeCharge: ['finance charge', 'interest charge', 'retail interest', 'monthly interest', 'cash advance interest'],
      installments: ['installment', 'instalment', 'installment plan', 'easy pay', 'easypay', 'payeasy', 'balance conversion'],
    },
    defaultAnnualRate: 0.36,
  },
  {
    id: 'security-bank',
    bankName: 'Security Bank',
    passwordProfileId: 'security-bank',
    keywords: [
      'Security Bank',
      'Security Bank Corporation',
      'Total Amount Due',
      'Minimum Amount Due',
      'Payment Due Date',
      'Statement Date',
      'Finance Charge',
    ],
    fields: {
      statementDate: ['statement date', 'billing date', 'statement period', 'cut-off date'],
      dueDate: ['payment due date', 'due date', 'payment date', 'please pay on or before'],
      totalAmountDue: ['total amount due', 'amount due', 'total payment due'],
      minimumAmountDue: ['minimum amount due', 'minimum payment required', 'minimum payment due', 'minimum due'],
      outstandingBalance: ['outstanding balance', 'statement balance', 'new balance', 'current balance', 'total balance'],
      creditLimit: ['credit limit', 'total credit limit', 'available credit limit'],
      financeCharge: ['finance charge', 'interest charge', 'retail interest', 'monthly interest charge'],
      installments: ['installment', 'instalment', 'charge light', 'balance transfer', 'balance conversion', 'monthly amortization'],
    },
    defaultAnnualRate: 0.36,
  },
  {
    id: 'rcbc-flex-classic',
    bankName: 'RCBC',
    passwordProfileId: 'rcbc-flex-classic',
    keywords: [
      'RCBC',
      'Bankard',
      'Flex',
      'Classic',
      'Payment Due Date',
      'Minimum Amount Due',
      'Total Amount Due',
      'Statement Balance',
    ],
    fields: {
      statementDate: ['statement date', 'billing date', 'statement period'],
      dueDate: ['payment due date', 'due date', 'pay by', 'payment date'],
      totalAmountDue: ['total amount due', 'amount due', 'total payment due'],
      minimumAmountDue: ['minimum amount due', 'minimum due', 'minimum payment', 'minimum payment due'],
      outstandingBalance: ['statement balance', 'outstanding balance', 'new balance', 'current balance', 'total balance'],
      creditLimit: ['credit limit', 'total credit limit'],
      financeCharge: ['retail interest', 'finance charge', 'interest charge', 'cash advance interest'],
      installments: ['installment', 'instalment', 'unli 0%', 'unli zero', 'unlipay', 'balance conversion', 'monthly amortization'],
    },
    defaultAnnualRate: 0.36,
  },
]

const budgetCategories: BudgetCategory[] = [
  'Food',
  'Transportation',
  'Bills',
  'Subscriptions',
  'Shopping',
  'Savings',
  'Debt Payment',
  'Other',
]

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const initialMonthlyBudgets: MonthlyBudget[] = []

const legacyDefaultBudgetLimits: Record<string, number> = {
  Food: 8000,
  Transportation: 4000,
  Bills: 7000,
  Subscriptions: 1500,
  Shopping: 5000,
  Savings: 10000,
  'Debt Payment': 8500,
  Other: 3000,
}

const initialFinanceData: FinanceData = {
  accounts: [
    { id: 1, name: 'Cash Wallet', type: 'Cash', balance: 4200, accent: 'green' },
    { id: 2, name: 'BPI Savings', type: 'Bank Account', balance: 28500, accent: 'blue' },
    { id: 3, name: 'GCash', type: 'E-Wallet', balance: 3150, accent: 'teal' },
  ],
  creditCards: [
    { id: 1, name: 'BPI Visa', currentBalance: 8200, creditLimit: 50000, cutOffDay: 12, dueDay: 2 },
    { id: 2, name: 'Metrobank Mastercard', currentBalance: 18400, creditLimit: 60000, cutOffDay: 28, dueDay: 18 },
  ],
  savingsGoals: [
    { id: 1, name: 'Emergency Fund', current: 25000, target: 100000, targetDate: 'December 2027' },
    { id: 2, name: 'Travel Fund', current: 8500, target: 30000, targetDate: 'May 2027' },
  ],
  debts: [
    { id: 1, name: 'Phone Installment', balance: 24500, monthly: 3500, due: 'Every 20th' },
    { id: 2, name: 'Personal Loan', balance: 45000, monthly: 5000, due: 'Every 15th' },
  ],
  recurringExpenses: [
    { id: 1, name: 'Internet', category: 'Utilities', amount: 1699, frequency: 'Monthly', nextDue: 'June 30' },
    { id: 2, name: 'Netflix', category: 'Subscription', amount: 549, frequency: 'Monthly', nextDue: 'July 5' },
    { id: 3, name: 'Electricity', category: 'Utilities', amount: 3200, frequency: 'Monthly', nextDue: 'July 10' },
  ],
  monthlyBudgets: initialMonthlyBudgets,
  transactions: [],
}

const navItems: NavItem[] = [
  { key: 'today', label: 'Today', icon: Home },
  { key: 'wallet', label: 'Wallet', icon: WalletCards },
  { key: 'plan', label: 'Plan', icon: ClipboardList },
  { key: 'insights', label: 'Insights', icon: BarChart3 },
]

type MonthlyObligation = {
  id: string
  kind: 'card' | 'bill' | 'debt'
  sourceId: number
  name: string
  date: Date
  amount: number | null
  paid: boolean
}

function monthKeyForDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function parseValidIsoDate(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

function recurringDayFromText(value: string): number | null {
  const match = value.match(/\b(?:every\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/i)
  if (!match) return null
  const day = Number(match[1])
  return day >= 1 && day <= 31 ? day : null
}

function sumPaymentsForDebt(transactions: Transaction[], name: string, year: number, month: number) {
  return transactions.reduce((total, transaction) => {
    const date = new Date(transaction.createdAt)
    return transaction.label === `Debt payment - ${name}` && date.getFullYear() === year && date.getMonth() === month
      ? total + transaction.amount : total
  }, 0)
}

function getMonthlyObligations(year: number, month: number, financeData: FinanceData): MonthlyObligation[] {
  const events = monthMoneyEvents(
    year, month, getCreditCardInsights(financeData.creditCards),
    financeData.recurringExpenses, financeData.debts, financeData.transactions,
  )
  const result: MonthlyObligation[] = []
  for (const event of events) {
    if (event.billId !== undefined) {
      result.push({id:event.id,kind:'bill',sourceId:event.billId,name:event.title,date:event.date,amount:event.amount,paid:Boolean(event.paid)})
    } else if (event.cardId !== undefined && event.type === 'Due') {
      const card = financeData.creditCards.find((item) => item.id === event.cardId)
      if (!card || card.currentBalance <= 0) continue
      result.push({id:event.id,kind:'card',sourceId:event.cardId,name:card.name,date:event.date,amount:event.amount,paid:Boolean(event.paid)})
    } else if (event.debtId !== undefined) {
      result.push({id:event.id,kind:'debt',sourceId:event.debtId,name:event.title,date:event.date,amount:event.amount,paid:Boolean(event.paid)})
    }
  }
  return result.sort((a,b)=>a.date.getTime()-b.date.getTime() || a.name.localeCompare(b.name))
}

function getUpcomingNotifications(financeData: FinanceData): MonthlyObligation[] {
  const today = startOfDay(new Date())
  const year = today.getFullYear(), month = today.getMonth()
  const obligations = [
    ...getMonthlyObligations(year,month,financeData),
    ...getMonthlyObligations(new Date(year,month+1,1).getFullYear(),new Date(year,month+1,1).getMonth(),financeData),
  ]
  return obligations.filter((item) => {
    if (item.paid || item.amount === null || item.amount <= 0) return false
    const days = Math.round((startOfDay(item.date).getTime()-today.getTime())/DAY_IN_MS)
    return days <= 7 && item.date >= new Date(year,month,1)
  }).sort((a,b)=>a.date.getTime()-b.date.getTime())
}

function MonthlyPayablesModal({items,onClose,onPay}: {
  items: MonthlyObligation[]
  onClose: () => void
  onPay: (item: MonthlyObligation) => void
}) {
  const active = items.filter((item)=>!item.paid && (item.amount===null || item.amount>0))
  const total = active.reduce((sum,item)=>sum+(item.amount ?? 0),0)
  const unknown = active.filter((item)=>item.amount===null).length
  return (
    <ModalShell eyebrow="Payments" title="To Pay This Month" onClose={onClose}>
      <div className="dp13-sheet">
        <div className="dp13-sheet-total"><span>Unpaid known amounts</span><strong>{peso.format(total)}</strong></div>
        {unknown > 0 && <p className="dp13-sheet-note">{unknown} card minimum{unknown>1?'s':''} not entered and excluded from the total.</p>}
        {active.length === 0 && <p className="dp13-sheet-note">No unpaid payments scheduled this month.</p>}
        {active.map((item)=><div className="dp13-sheet-item" key={item.id}>
          <div><strong>{item.name}</strong><small>{item.kind === 'bill'?'Bill':item.kind==='card'?'Card minimum':'Loan'} · {item.date.toLocaleDateString('en-PH',{month:'short',day:'numeric'})}</small></div>
          <span>{item.amount === null?'Not entered':peso.format(item.amount)}</span>
          <button type="button" onClick={()=>onPay(item)}>{item.amount===null?'Add minimum':'Pay'}</button>
        </div>)}
      </div>
    </ModalShell>
  )
}

function NotificationCenterPopover({items,onClose,onOpen,onCloud}: {
  items: MonthlyObligation[]
  onClose: () => void
  onOpen: (item: MonthlyObligation) => void
  onCloud: () => void
}) {
  const today = startOfDay(new Date())
  const overdue = items.filter((item) => startOfDay(item.date).getTime() < today.getTime())
  const dueToday = items.filter((item) => startOfDay(item.date).getTime() === today.getTime())
  const comingUp = items.filter((item) => startOfDay(item.date).getTime() > today.getTime())

  function renderItem(item: MonthlyObligation) {
    const date = startOfDay(item.date)
    const days = Math.round((date.getTime() - today.getTime()) / DAY_IN_MS)
    return (
      <div className="dp14-notif-item" key={item.id}>
        <span className={`dp14-notif-status ${days < 0 ? 'is-overdue' : days === 0 ? 'is-today' : 'is-soon'}`} aria-hidden="true" />
        <div className="dp14-notif-info">
          <strong>{item.name}</strong>
          <small>{item.kind === 'card' ? 'Card minimum' : item.kind === 'bill' ? 'Bill' : 'Loan'} · {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `Due ${item.date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`}</small>
        </div>
        <div className="dp14-notif-action">
          <strong>{item.amount === null ? '—' : peso.format(item.amount)}</strong>
          <button type="button" onClick={() => onOpen(item)}>Pay</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <button className="dp14-notif-dismiss" type="button" tabIndex={-1} aria-label="Close notifications" onClick={onClose} />
      <section
        className="dp14-notif-popover"
        role="dialog"
        aria-modal="false"
        aria-labelledby="dp14-notifications-title"
        onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }}
      >
        <div className="dp14-notif-head">
          <div>
            <h2 id="dp14-notifications-title">Notifications</h2>
            <p>{items.length === 0 ? 'Nothing needs attention' : `${items.length} upcoming or overdue payment${items.length === 1 ? '' : 's'}`}</p>
          </div>
          <button type="button" className="dp14-notif-close" aria-label="Close notifications" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="dp14-notif-scroll">
          {items.length === 0 && <p className="dp14-notif-empty">You're all caught up for the next 7 days.</p>}
          {overdue.length > 0 && <div className="dp14-notif-group"><h3>Overdue</h3>{overdue.map(renderItem)}</div>}
          {dueToday.length > 0 && <div className="dp14-notif-group"><h3>Today</h3>{dueToday.map(renderItem)}</div>}
          {comingUp.length > 0 && <div className="dp14-notif-group"><h3>Next 7 days</h3>{comingUp.map(renderItem)}</div>}
        </div>
        <button type="button" className="dp14-notif-cloud" onClick={onCloud}>Cloud backup settings</button>
      </section>
    </>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('today')
  const [navHidden, setNavHidden] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null)
  const [financeData, setFinanceData] = useState<FinanceData>(loadFinanceData)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark')
  const [messageDialog, setMessageDialog] = useState<MessageDialogState | null>(null)
  const [transactionHistoryOpen, setTransactionHistoryOpen] = useState(false)
  const [cloudSyncOpen, setCloudSyncOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [payablesOpen, setPayablesOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [cloudReady, setCloudReady] = useState(false)
  const [cloudSyncBusy, setCloudSyncBusy] = useState(false)
  const [syncStatus, setSyncStatus] = useState(
    supabase ? 'Cloud sync ready to connect' : 'Missing cloud environment variables',
  )
  const [lastSyncedAt, setLastSyncedAt] = useState(() => localStorage.getItem(CLOUD_SYNC_KEY))

  const [accountEditor, setAccountEditor] = useState<Account | 'new' | null>(null)
  const [cardEditor, setCardEditor] = useState<CreditCardAccount | 'new' | null>(null)
  const [billEditor, setBillEditor] = useState<RecurringExpense | 'new' | null>(null)
  const [budgetEditor, setBudgetEditor] = useState<MonthlyBudget | 'new' | null>(null)
  const [goalEditor, setGoalEditor] = useState<SavingsGoal | 'new' | null>(null)
  const [debtEditor, setDebtEditor] = useState<Debt | 'new' | null>(null)
  const [billPaymentTarget, setBillPaymentTarget] = useState<RecurringExpense | null>(null)
  const [cardPaymentTarget, setCardPaymentTarget] = useState<CreditCardAccount | null>(null)
  const [goalMoneyTarget, setGoalMoneyTarget] = useState<{ goal: SavingsGoal; mode: 'deposit' | 'withdraw' } | null>(null)
  const [debtPaymentTarget, setDebtPaymentTarget] = useState<Debt | null>(null)
  const [statementImporterOpen, setStatementImporterOpen] = useState(false)

  const overlayVisible = Boolean(
    notificationsOpen || payablesOpen || messageDialog || transactionHistoryOpen ||
    cloudSyncOpen || activeAction || accountEditor || cardEditor || billEditor ||
    budgetEditor || goalEditor || debtEditor || billPaymentTarget ||
    cardPaymentTarget || goalMoneyTarget || debtPaymentTarget || statementImporterOpen,
  )

  // Show the dock while scrolling upward; tuck it below the screen while scrolling down.
  // DuePoint scrolls inside .mobile-app, not window, so observe that exact element.
  useEffect(() => {
    const viewport = document.querySelector<HTMLElement>('#root .mobile-app')
    if (!viewport) return
    if (overlayVisible || fabOpen) {
      setNavHidden(false)
      return
    }

    setNavHidden(false)
    let previousY = Math.max(0, viewport.scrollTop)
    let direction = 0
    let distance = 0

    function handleScroll() {
      if (!viewport) return
      const maximum = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
      const currentY = Math.min(maximum, Math.max(0, viewport.scrollTop))
      const movement = currentY - previousY
      previousY = currentY

      // Never hide when the page is short or near the top.
      if (maximum < 100 || currentY < 60) {
        direction = 0
        distance = 0
        setNavHidden(false)
        return
      }
      if (Math.abs(movement) < 1) return

      const nextDirection = movement > 0 ? 1 : -1
      distance = direction === nextDirection ? distance + Math.abs(movement) : Math.abs(movement)
      direction = nextDirection

      // Avoid jitter on small finger movements and iOS momentum scrolling.
      if (distance >= 18) {
        if (nextDirection > 0 && currentY > 110) setNavHidden(true)
        if (nextDirection < 0) setNavHidden(false)
        distance = 0
      }
    }

    viewport.addEventListener('scroll', handleScroll, { passive: true })
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [activeTab, overlayVisible, fabOpen])

  // Lock the app's actual scroll container while any popup or dialog is open.
  // Keep scrolling enabled inside modal panels and the notification callout.
  useEffect(() => {
    if (!overlayVisible) return
    const viewport = document.querySelector<HTMLElement>('#root .mobile-app')
    if (!viewport) return
    const oldOverflow = viewport.style.getPropertyValue('overflow-y')
    const oldPriority = viewport.style.getPropertyPriority('overflow-y')
    const oldOverscroll = viewport.style.overscrollBehaviorY
    const position = viewport.scrollTop
    viewport.style.setProperty('overflow-y', 'hidden', 'important')
    viewport.style.overscrollBehaviorY = 'none'
    return () => {
      if (oldOverflow) viewport.style.setProperty('overflow-y', oldOverflow, oldPriority)
      else viewport.style.removeProperty('overflow-y')
      viewport.style.overscrollBehaviorY = oldOverscroll
      viewport.scrollTop = position
    }
  }, [overlayVisible])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(financeData))

    if (!supabase || !session || !cloudReady) return

    const syncTimer = window.setTimeout(() => {
      void syncDataToCloud(financeData, { silent: true })
    }, 1200)

    return () => window.clearTimeout(syncTimer)
  }, [financeData, session, cloudReady])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (!supabase) return

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session) setSyncStatus('Checking cloud backup...')
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setCloudReady(false)
      setSyncStatus(nextSession ? 'Checking cloud backup...' : 'Signed out from cloud sync')
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    void initializeCloudSync()
  }, [session?.user.id])

  const activeBills = useMemo(
    () => financeData.recurringExpenses.filter((expense) => getBillRemainingBalance(expense) > 0),
    [financeData.recurringExpenses],
  )

  const totalCash = useMemo(
    () => financeData.accounts.reduce((total, account) => total + account.balance, 0),
    [financeData.accounts],
  )

  const totalCreditCardDebt = useMemo(
    () => financeData.creditCards.reduce((total, card) => total + card.currentBalance, 0),
    [financeData.creditCards],
  )

  const totalSavings = useMemo(
    () => financeData.savingsGoals.reduce((total, goal) => total + goal.current, 0),
    [financeData.savingsGoals],
  )

  const totalDebt = useMemo(
    () => financeData.debts.reduce((total, debt) => total + debt.balance, 0) + totalCreditCardDebt,
    [financeData.debts, totalCreditCardDebt],
  )

  const recurringTotal = useMemo(
    () => activeBills.reduce((total, expense) => total + getBillRemainingBalance(expense), 0),
    [activeBills],
  )

  const creditCardInsights = useMemo(
    () => getCreditCardInsights(financeData.creditCards),
    [financeData.creditCards],
  )

  const monthlyObligations = useMemo(() => {
    const date = new Date()
    return getMonthlyObligations(date.getFullYear(), date.getMonth(), financeData)
  }, [financeData])
  const monthlyOutstanding = monthlyObligations.filter((item) => !item.paid && item.amount !== null && item.amount > 0)
  const monthlyPayableTotal = monthlyOutstanding.reduce((sum, item) => sum + (item.amount ?? 0), 0)
  const cardMinimumTotal = monthlyOutstanding.filter((item) => item.kind === 'card').reduce((sum, item) => sum + (item.amount ?? 0), 0)
  const billsTotal = monthlyOutstanding.filter((item) => item.kind === 'bill').reduce((sum, item) => sum + (item.amount ?? 0), 0)
  const loanTotal = monthlyOutstanding.filter((item) => item.kind === 'debt').reduce((sum, item) => sum + (item.amount ?? 0), 0)
  const missingMinimumCount = monthlyObligations.filter((item) => item.kind === 'card' && item.amount === null).length
  const notificationItems = useMemo(() => getUpcomingNotifications(financeData), [financeData])

  const budgetMetrics = useMemo(
    () => getBudgetMetrics(financeData.monthlyBudgets, financeData.transactions),
    [financeData.monthlyBudgets, financeData.transactions],
  )

  const expenseCategoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...budgetCategories,
            ...financeData.monthlyBudgets
              .map((budget) => budget.category.trim())
              .filter((category) => category.length > 0),
          ],
        ),
      ),
    [financeData.monthlyBudgets],
  )

  function showAlert(title: string, message: string) {
    setMessageDialog({ type: 'alert', title, message, confirmLabel: 'Okay' })
  }

  function showConfirm(config: Omit<MessageDialogState, 'type'>) {
    setMessageDialog({
      type: 'confirm',
      cancelLabel: 'Cancel',
      confirmLabel: 'Confirm',
      tone: 'danger',
      ...config,
    })
  }

  async function initializeCloudSync() {
    if (!supabase || !session) return

    setCloudSyncBusy(true)
    setSyncStatus('Checking cloud backup...')

    try {
      const { data, error } = await supabase
        .from('duewise_user_data')
        .select('data, updated_at')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) throw error

      if (data?.data) {
        const normalizedData = normalizeFinanceData(data.data as Partial<FinanceData>)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData))
        setFinanceData(normalizedData)
        updateLastSyncedAt(data.updated_at ?? new Date().toISOString())
        setSyncStatus('Restored from cloud')
      } else {
        await upsertFinanceDataToCloud(financeData)
        setSyncStatus('Created cloud backup')
      }

      setCloudReady(true)
    } catch (error) {
      setCloudReady(false)
      setSyncStatus('Cloud sync needs attention')
      showAlert('Cloud Sync Error', getErrorMessage(error))
    } finally {
      setCloudSyncBusy(false)
    }
  }

  function updateLastSyncedAt(value: string) {
    setLastSyncedAt(value)
    localStorage.setItem(CLOUD_SYNC_KEY, value)
  }

  async function upsertFinanceDataToCloud(dataToSync: FinanceData) {
    if (!supabase || !session) throw new Error('Sign in to Due₱oint Cloud first.')

    const syncedAt = new Date().toISOString()
    const { error } = await supabase.from('duewise_user_data').upsert(
      {
        user_id: session.user.id,
        data: dataToSync,
        updated_at: syncedAt,
      },
      { onConflict: 'user_id' },
    )

    if (error) throw error
    updateLastSyncedAt(syncedAt)
    return syncedAt
  }

  async function syncDataToCloud(dataToSync: FinanceData = financeData, options: { silent?: boolean } = {}) {
    if (!supabase) {
      if (!options.silent) showAlert('Cloud Setup Needed', 'Add your cloud URL and anon key in .env.local first.')
      return
    }

    if (!session) {
      if (!options.silent) showAlert('Sign In Required', 'Sign in to Due₱oint Cloud before syncing.')
      return
    }

    if (!options.silent) setCloudSyncBusy(true)
    setSyncStatus(options.silent ? 'Auto syncing...' : 'Syncing to cloud...')

    try {
      await upsertFinanceDataToCloud(dataToSync)
      setCloudReady(true)
      setSyncStatus('Saved to cloud')
      if (!options.silent) showAlert('Success', 'Saved to cloud.')
    } catch (error) {
      setSyncStatus('Cloud sync failed')
      if (!options.silent) showAlert('Cloud Sync Error', getErrorMessage(error))
    } finally {
      if (!options.silent) setCloudSyncBusy(false)
    }
  }

  async function restoreDataFromCloud(options: { silent?: boolean } = {}) {
    if (!supabase || !session) {
      if (!options.silent) showAlert('Sign In Required', 'Sign in to Due₱oint Cloud before restoring.')
      return
    }

    if (!options.silent) setCloudSyncBusy(true)
    setSyncStatus('Restoring from cloud...')

    try {
      const { data, error } = await supabase
        .from('duewise_user_data')
        .select('data, updated_at')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) throw error

      if (!data?.data) {
        setSyncStatus('No cloud backup found')
        if (!options.silent) showAlert('No Cloud Backup', 'No saved Due₱oint backup was found for this account.')
        return
      }

      const normalizedData = normalizeFinanceData(data.data as Partial<FinanceData>)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData))
      setFinanceData(normalizedData)
      updateLastSyncedAt(data.updated_at ?? new Date().toISOString())
      setCloudReady(true)
      setSyncStatus('Restored from cloud')
      if (!options.silent) showAlert('Success', 'Restored from cloud.')
    } catch (error) {
      setSyncStatus('Restore failed')
      if (!options.silent) showAlert('Cloud Restore Error', getErrorMessage(error))
    } finally {
      if (!options.silent) setCloudSyncBusy(false)
    }
  }

  function confirmRestoreFromCloud() {
    showConfirm({
      title: 'Are you sure?',
      message: 'This will replace the local Due₱oint data on this browser with your saved cloud backup.',
      confirmLabel: 'Restore',
      onConfirm: () => {
        void restoreDataFromCloud()
      },
    })
  }

  async function signInToCloud(email: string, password: string) {
    if (!supabase) return showAlert('Cloud Setup Needed', 'Add your cloud URL and anon key in .env.local first.')

    setCloudSyncBusy(true)
    setSyncStatus('Signing in...')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setCloudSyncBusy(false)

    if (error) {
      setSyncStatus('Sign in failed')
      showAlert('Sign In Failed', error.message)
      return
    }

    setSyncStatus('Signed in. Checking cloud backup...')
  }

  async function signUpForCloud(email: string, password: string) {
    if (!supabase) return showAlert('Cloud Setup Needed', 'Add your cloud URL and anon key in .env.local first.')

    setCloudSyncBusy(true)
    setSyncStatus('Creating account...')

    const { error } = await supabase.auth.signUp({ email, password })

    setCloudSyncBusy(false)

    if (error) {
      setSyncStatus('Sign up failed')
      showAlert('Sign Up Failed', error.message)
      return
    }

    setSyncStatus('Account created')
    showAlert('Account Created', 'Check your email if confirmation is required. After signing in, Due₱oint will sync your data.')
  }

  async function signOutFromCloud() {
    if (!supabase) return

    setCloudSyncBusy(true)
    const { error } = await supabase.auth.signOut()
    setCloudSyncBusy(false)

    if (error) {
      showAlert('Sign Out Failed', error.message)
      return
    }

    setSession(null)
    setCloudReady(false)
    setSyncStatus('Signed out from cloud sync')
  }

  function handleQuickIncome(accountId: number, amount: number, note: string) {
    const account = financeData.accounts.find((item) => item.id === accountId)
    if (!account) return showAlert('Invalid Account', 'Please select a valid account.')

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) =>
        item.id === accountId ? { ...item, balance: item.balance + amount } : item,
      ),
      transactions: [
        {
          id: createId(),
          type: 'income',
          amount,
          label: note || 'Income',
          accountLabel: account.name,
          createdAt: new Date().toISOString(),
        } as Transaction,
        ...current.transactions,
      ].slice(0, 200),
    }))
    setActiveAction(null)
  }

  function handleQuickExpense(paymentSource: string, amount: number, note: string, category: BudgetCategory) {
    const [kind, rawId] = paymentSource.split(':')
    const sourceId = Number(rawId)

    if (kind === 'account') {
      const account = financeData.accounts.find((item) => item.id === sourceId)
      if (!account) return showAlert('Invalid Account', 'Please select a valid account.')
      if (amount > account.balance) return showAlert('Insufficient Balance', 'Your selected account has insufficient balance.')

      setFinanceData((current) => ({
        ...current,
        accounts: current.accounts.map((item) =>
          item.id === sourceId ? { ...item, balance: item.balance - amount } : item,
        ),
        transactions: [
          {
            id: createId(),
            type: 'expense',
            amount,
            label: note || category,
            accountLabel: account.name,
            createdAt: new Date().toISOString(),
            category,
          } as Transaction,
          ...current.transactions,
        ].slice(0, 200),
      }))
      setActiveAction(null)
      return
    }

    if (kind === 'card') {
      const card = financeData.creditCards.find((item) => item.id === sourceId)
      if (!card) return showAlert('Invalid Card', 'Please select a valid credit card.')
      if (amount > card.creditLimit - card.currentBalance) {
        return showAlert('Insufficient Credit', 'Your selected credit card has insufficient available credit.')
      }

      setFinanceData((current) => ({
        ...current,
        creditCards: current.creditCards.map((item) =>
          item.id === sourceId ? { ...item, currentBalance: item.currentBalance + amount } : item,
        ),
        transactions: [
          {
            id: createId(),
            type: 'expense',
            amount,
            label: note || category,
            accountLabel: card.name,
            createdAt: new Date().toISOString(),
            category,
          } as Transaction,
          ...current.transactions,
        ].slice(0, 200),
      }))
      setActiveAction(null)
    }
  }

  function handleQuickTransfer(fromId: number, toId: number, amount: number, note: string) {
    if (fromId === toId) return showAlert('Invalid Transfer', 'Source and destination accounts must be different.')

    const source = financeData.accounts.find((item) => item.id === fromId)
    const destination = financeData.accounts.find((item) => item.id === toId)

    if (!source || !destination) return showAlert('Invalid Accounts', 'Please select valid accounts.')
    if (amount > source.balance) return showAlert('Insufficient Balance', 'Your source account has insufficient balance.')

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) => {
        if (item.id === fromId) return { ...item, balance: item.balance - amount }
        if (item.id === toId) return { ...item, balance: item.balance + amount }
        return item
      }),
      transactions: [
        {
          id: createId(),
          type: 'transfer',
          amount,
          label: note || 'Transfer',
          accountLabel: `${source.name} → ${destination.name}`,
          createdAt: new Date().toISOString(),
        } as Transaction,
        ...current.transactions,
      ].slice(0, 200),
    }))
    setActiveAction(null)
  }

  function clearTransactionHistory() {
    showConfirm({
      title: 'Are you sure?',
      message: 'This will clear all transaction history. Current account, card, savings, and debt balances will stay the same.',
      confirmLabel: 'Clear History',
      onConfirm: () =>
        setFinanceData((current) => ({
          ...current,
          transactions: [],
        })),
    })
  }

  function saveAccount(account: Omit<Account, 'id'>, id?: number) {
    setFinanceData((current) => ({
      ...current,
      accounts:
        typeof id === 'number'
          ? current.accounts.map((item) => (item.id === id ? { ...item, ...account } : item))
          : [...current.accounts, { ...account, id: createNumericId(current.accounts) }],
    }))
    setAccountEditor(null)
  }

  function deleteAccount(id: number) {
    if (financeData.accounts.length <= 1) {
      showAlert('Account Required', 'At least one cash account is required.')
      return
    }

    showConfirm({
      title: 'Delete Account?',
      message: 'This will remove the selected account from your wallet.',
      confirmLabel: 'Delete',
      onConfirm: () =>
        setFinanceData((current) => ({
          ...current,
          accounts: current.accounts.filter((item) => item.id !== id),
        })),
    })
  }

  function saveCreditCard(
    card: Omit<CreditCardAccount, 'id' | 'lastPaymentAt'>,
    id?: number,
    installments: CardInstallmentInput[] = [],
  ) {
    setFinanceData((current) => {
      const cardId = typeof id === 'number' ? id : createNumericId(current.creditCards)
      const creditCards = typeof id === 'number'
        ? current.creditCards.map((item) => item.id === id ? { ...item, ...card } : item)
        : [...current.creditCards, { ...card, id: cardId }]
      const oldCard = current.creditCards.find((item) => item.id === id)
      const linked = oldCard ? getLinkedCardInstallments(current.debts, oldCard) : []
      const linkedIds = new Set(linked.map((item) => item.id))
      const retainedDebts = current.debts.filter((debt) => !linkedIds.has(debt.id))
      let nextId = createNumericId(current.debts)
      const installmentDebts: Debt[] = installments.map((installment) => {
        const existing = linked.find((debt) => debt.id === installment.id)
        return {
          ...existing,
          id: existing?.id ?? nextId++,
          name: `${card.name} - ${installment.description}`,
          balance: installment.remainingBalance,
          monthly: installment.monthlyAmount,
          due: `Every ${formatOrdinalDay(card.dueDay)}`,
          annualRate: existing?.annualRate ?? 0,
          source: 'Credit card details',
          kind: 'credit-card-installment',
          linkedCardId: cardId,
        }
      })
      return { ...current, creditCards, debts: [...retainedDebts, ...installmentDebts] }
    })
    setCardEditor(null)
  }

  function deleteCreditCard(id: number) {
    showConfirm({
      title: 'Delete Credit Card?',
      message: 'This will remove the card and any future installments linked to it. Recorded payments will remain in your history.',
      confirmLabel: 'Delete',
      onConfirm: () =>
        setFinanceData((current) => ({
          ...current,
          creditCards: current.creditCards.filter((item) => item.id !== id),
          debts: current.debts.filter((debt) => {
            const card = current.creditCards.find((item) => item.id === id)
            return !card || !getLinkedCardInstallments(current.debts, card).some((linked) => linked.id === debt.id)
          }),
        })),
    })
  }

  function payCreditCard(cardId: number, accountId: number, amount: number) {
    const card = financeData.creditCards.find((item) => item.id === cardId)
    const account = financeData.accounts.find((item) => item.id === accountId)

    if (!card || !account) return showAlert('Invalid Payment', 'Please select valid payment details.')
    if (amount > account.balance) return showAlert('Insufficient Balance', 'Your selected account has insufficient balance.')
    if (amount > card.currentBalance) return showAlert('Invalid Amount', 'Payment is higher than the current card balance.')

    const paidAt = new Date().toISOString()

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) =>
        item.id === accountId ? { ...item, balance: item.balance - amount } : item,
      ),
      creditCards: current.creditCards.map((item) =>
        item.id === cardId
          ? { ...item, currentBalance: Math.max(item.currentBalance - amount, 0), minimumDue: typeof item.minimumDue === 'number' ? Math.max(item.minimumDue - amount, 0) : undefined, lastPaymentAt: paidAt }
          : item,
      ),
      transactions: [
        {
          id: createId(),
          type: 'transfer',
          amount,
          label: `Credit card payment - ${card.name}`,
          accountLabel: `${account.name} → ${card.name}`,
          createdAt: paidAt,
          category: 'Debt Payment',
        } as Transaction,
        ...current.transactions,
      ].slice(0, 200),
    }))
    setCardPaymentTarget(null)
  }

  function saveStatementImport({
    selectedCardId,
    draft,
    updateCreditCard,
    addInstallments,
  }: StatementImportSavePayload) {
    const statementBalance = Math.max(draft.outstandingBalance || draft.totalAmountDue || 0, 0)
    const dueDay = parseDayFromStatementDate(draft.dueDate, 15)
    const cutOffDay = parseDayFromStatementDate(draft.statementDate, 1)
    const cleanedAnnualRate = Number.isFinite(draft.annualRate) && draft.annualRate >= 0 ? draft.annualRate : 0.36

    setFinanceData((current) => {
      let importedCardName = draft.cardName.trim() || 'Imported Credit Card'
      let creditCards = current.creditCards

      if (updateCreditCard) {
        if (selectedCardId === 'new') {
          const newCard: CreditCardAccount = {
            id: createNumericId(current.creditCards),
            name: importedCardName,
            currentBalance: statementBalance,
            creditLimit: Math.max(draft.creditLimit, statementBalance, 1),
            cutOffDay,
            dueDay,
            annualRate: cleanedAnnualRate,
            minimumDue: draft.minimumAmountDue,
          }
          creditCards = [...current.creditCards, newCard]
        } else {
          const parsedCardId = Number(selectedCardId)
          const existingCard = current.creditCards.find((card) => card.id === parsedCardId)
          if (existingCard) importedCardName = existingCard.name

          creditCards = current.creditCards.map((card) =>
            card.id === parsedCardId
              ? {
                  ...card,
                  currentBalance: statementBalance,
                  creditLimit: draft.creditLimit > 0 ? draft.creditLimit : card.creditLimit,
                  dueDay,
                  cutOffDay: cutOffDay || card.cutOffDay,
                  annualRate: cleanedAnnualRate,
                  minimumDue: draft.minimumAmountDue,
                }
              : card,
          )
        }
      }

      const nextDebtId = Math.max(0, ...current.debts.map((debt) => debt.id)) + 1
      const importedDebts: Debt[] = addInstallments
        ? draft.installments
            .filter((installment) => installment.monthlyAmount > 0 || installment.remainingBalance > 0)
            .map((installment, index) => {
              const monthly = Math.max(installment.monthlyAmount, 1)
              const balance = (installment.remainingBalance > 0 ? installment.remainingBalance : installment.monthlyAmount * Math.max(installment.monthsRemaining, 1))

              return {
                id: nextDebtId + index,
                name: `${importedCardName} - ${installment.description}`,
                balance,
                monthly,
                due: draft.dueDate ? `Every ${formatOrdinalDay(dueDay)}` : 'Every month',
                annualRate: installment.annualRate,
                source: 'Imported credit card SOA',
                kind: 'credit-card-installment',
              }
            })
        : []


      return {
        ...current,
        creditCards,
        debts: mergeImportedInstallmentDebts(current.debts, importedDebts),
      }
    })

    setStatementImporterOpen(false)
    showAlert(
      'Statement Saved',
      'Card balance and future installment plans saved. Payments and interest already included in the statement were not posted again.',
    )
  }

  function saveBill(bill: Omit<RecurringExpense, 'id' | 'remainingBalance' | 'periodKey' | 'lastPaidAt'>, id?: number) {
    const periodKey = getCurrentPeriodKey()

    setFinanceData((current) => ({
      ...current,
      recurringExpenses:
        typeof id === 'number'
          ? current.recurringExpenses.map((item) => {
              if (item.id !== id) return item
              const paid = Math.max(item.amount - getBillRemainingBalance(item), 0)
              return {
                ...item,
                ...bill,
                periodKey,
                remainingBalance: Math.max(bill.amount - paid, 0),
              }
            })
          : [
              ...current.recurringExpenses,
              {
                ...bill,
                id: createNumericId(current.recurringExpenses),
                remainingBalance: bill.amount,
                periodKey,
              },
            ],
    }))
    setBillEditor(null)
  }

  function deleteBill(id: number) {
    showConfirm({
      title: 'Delete Bill?',
      message: 'This will remove the selected bill from your plan.',
      confirmLabel: 'Delete',
      onConfirm: () =>
        setFinanceData((current) => ({
          ...current,
          recurringExpenses: current.recurringExpenses.filter((item) => item.id !== id),
        })),
    })
  }

  function payBill(billId: number, accountId: number, amount: number) {
    const bill = financeData.recurringExpenses.find((item) => item.id === billId)
    const account = financeData.accounts.find((item) => item.id === accountId)

    if (!bill || !account) return showAlert('Invalid Payment', 'Please select valid payment details.')
    if (amount > account.balance) return showAlert('Insufficient Balance', 'Your selected account has insufficient balance.')

    const balanceDue = getBillRemainingBalance(bill)
    if (amount > balanceDue) return showAlert('Invalid Amount', 'Payment is higher than the remaining bill balance.')

    const paidAt = new Date().toISOString()

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) =>
        item.id === accountId ? { ...item, balance: item.balance - amount } : item,
      ),
      recurringExpenses: current.recurringExpenses.map((item) =>
        item.id === billId
          ? {
              ...item,
              remainingBalance: Math.max(balanceDue - amount, 0),
              periodKey: getCurrentPeriodKey(),
              lastPaidAt: paidAt,
            }
          : item,
      ),
      transactions: [
        {
          id: createId(),
          type: 'expense',
          amount,
          label: `Bill payment - ${bill.name}`,
          accountLabel: account.name,
          createdAt: paidAt,
          category: 'Bills',
        } as Transaction,
        ...current.transactions,
      ].slice(0, 200),
    }))
    setBillPaymentTarget(null)
  }

  function saveBudget(budget: Omit<MonthlyBudget, 'id'>, id?: number) {
    const category = budget.category.trim()
    const limit = Number(budget.limit)

    if (!category) {
      showAlert('Budget Name Required', 'Please enter a budget name or category.')
      return
    }

    if (!Number.isFinite(limit) || limit < 0) {
      showAlert('Invalid Budget', 'Please enter a valid monthly budget amount.')
      return
    }

    setFinanceData((current) => {
      const duplicate = current.monthlyBudgets.find(
        (item) => item.category.trim().toLowerCase() === category.toLowerCase() && item.id !== id,
      )

      if (duplicate) {
        showAlert('Budget Already Exists', `${duplicate.category} already has a budget. Edit the existing budget instead.`)
        return current
      }

      return {
        ...current,
        monthlyBudgets:
          typeof id === 'number'
            ? current.monthlyBudgets.map((item) =>
                item.id === id ? { ...item, category, limit } : item,
              )
            : [
                ...current.monthlyBudgets,
                {
                  id: createNumericId(current.monthlyBudgets),
                  category,
                  limit,
                },
              ],
      }
    })

    setBudgetEditor(null)
  }

  function saveSavingsGoal(goal: Omit<SavingsGoal, 'id'>, id?: number) {
    setFinanceData((current) => ({
      ...current,
      savingsGoals:
        typeof id === 'number'
          ? current.savingsGoals.map((item) => (item.id === id ? { ...item, ...goal } : item))
          : [...current.savingsGoals, { ...goal, id: createNumericId(current.savingsGoals) }],
    }))
    setGoalEditor(null)
  }

  function deleteSavingsGoal(id: number) {
    showConfirm({
      title: 'Delete Savings Goal?',
      message: 'This will remove the selected savings goal.',
      confirmLabel: 'Delete',
      onConfirm: () =>
        setFinanceData((current) => ({
          ...current,
          savingsGoals: current.savingsGoals.filter((item) => item.id !== id),
        })),
    })
  }

  function moveSavingsMoney(goalId: number, accountId: number, amount: number, mode: 'deposit' | 'withdraw') {
    const goal = financeData.savingsGoals.find((item) => item.id === goalId)
    const account = financeData.accounts.find((item) => item.id === accountId)

    if (!goal || !account) return showAlert('Invalid Details', 'Please select valid details.')
    if (mode === 'deposit' && amount > account.balance) return showAlert('Insufficient Balance', 'Your selected account has insufficient balance.')
    if (mode === 'deposit' && amount > goal.target - goal.current) return showAlert('Target Exceeded', 'Deposit is higher than the remaining target amount.')
    if (mode === 'withdraw' && amount > goal.current) return showAlert('Invalid Withdrawal', 'Withdrawal is higher than the current saved amount.')

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) =>
        item.id === accountId
          ? { ...item, balance: mode === 'deposit' ? item.balance - amount : item.balance + amount }
          : item,
      ),
      savingsGoals: current.savingsGoals.map((item) =>
        item.id === goalId
          ? { ...item, current: mode === 'deposit' ? item.current + amount : Math.max(item.current - amount, 0) }
          : item,
      ),
      transactions: [
        {
          id: createId(),
          type: 'transfer',
          amount,
          label: mode === 'deposit' ? `Add to savings - ${goal.name}` : `Withdraw from savings - ${goal.name}`,
          accountLabel: mode === 'deposit' ? `${account.name} → ${goal.name}` : `${goal.name} → ${account.name}`,
          createdAt: new Date().toISOString(),
          category: mode === 'deposit' ? 'Savings' : undefined,
        } as Transaction,
        ...current.transactions,
      ].slice(0, 200),
    }))
    setGoalMoneyTarget(null)
  }

  function saveDebt(debt: Omit<Debt, 'id'>, id?: number) {
    setFinanceData((current) => ({
      ...current,
      debts:
        typeof id === 'number'
          ? current.debts.map((item) => (item.id === id ? { ...item, ...debt } : item))
          : [...current.debts, { ...debt, id: createNumericId(current.debts) }],
    }))
    setDebtEditor(null)
  }

  function deleteDebt(id: number) {
    showConfirm({
      title: 'Delete Debt?',
      message: 'This will remove the selected debt.',
      confirmLabel: 'Delete',
      onConfirm: () =>
        setFinanceData((current) => ({
          ...current,
          debts: current.debts.filter((item) => item.id !== id),
        })),
    })
  }

  function payDebt(debtId: number, accountId: number, amount: number) {
    const debt = financeData.debts.find((item) => item.id === debtId)
    const account = financeData.accounts.find((item) => item.id === accountId)

    if (!debt || !account) return showAlert('Invalid Payment', 'Please select valid payment details.')
    if (amount > account.balance) return showAlert('Insufficient Balance', 'Your selected account has insufficient balance.')
    if (amount > debt.balance) return showAlert('Invalid Amount', 'Payment is higher than the remaining debt balance.')

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) =>
        item.id === accountId ? { ...item, balance: item.balance - amount } : item,
      ),
      debts: current.debts.map((item) =>
        item.id === debtId ? { ...item, balance: Math.max(item.balance - amount, 0) } : item,
      ),
      transactions: [
        {
          id: createId(),
          type: 'expense',
          amount,
          label: `Debt payment - ${debt.name}`,
          accountLabel: account.name,
          createdAt: new Date().toISOString(),
          category: 'Debt Payment',
        } as Transaction,
        ...current.transactions,
      ].slice(0, 200),
    }))
    setDebtPaymentTarget(null)
  }

  function resetLocalData() {
    showConfirm({
      title: 'Reset Due₱oint?',
      message: 'This will clear local data and restore the sample records.',
      confirmLabel: 'Reset',
      onConfirm: () => {
        setCloudReady(false)
        setSyncStatus('Local sample data restored. Use Sync now if you want to overwrite cloud data.')
        localStorage.removeItem(STORAGE_KEY)
        setFinanceData(normalizeFinanceData(initialFinanceData))
      },
    })
  }

  return (
    <main className={`app-shell ${darkMode ? 'theme-dark' : ''}`}>
      <section className={`mobile-app ${navHidden && !overlayVisible && !fabOpen ? 'dp15-nav-hidden' : ''}`}>
        <header className="app-header">
          <div className="dp-header-title">
            <span className="dp-header-wordmark">DUEPOINT</span>
            <h1>{getPageTitle(activeTab)}</h1>
          </div>

          <div className="header-actions">
            <button
              className="theme-toggle-button"
              type="button"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setDarkMode((current) => !current)}
            >
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            <div className="dp14-bell-anchor">
              <button
                className="dp13-bell-button"
                type="button"
                aria-label={`${notificationItems.length} upcoming payment reminders`}
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={20} />
                {notificationItems.length > 0 && <span className="dp13-bell-count">{notificationItems.length > 99 ? '99+' : notificationItems.length}</span>}
              </button>
              {notificationsOpen && (
                <NotificationCenterPopover
                  items={notificationItems}
                  onClose={() => setNotificationsOpen(false)}
                  onOpen={(item) => {
                    setNotificationsOpen(false)
                    if (item.kind === 'bill') {
                      const bill = financeData.recurringExpenses.find((entry) => entry.id === item.sourceId)
                      if (bill) setBillPaymentTarget(bill)
                    } else if (item.kind === 'card') {
                      const card = financeData.creditCards.find((entry) => entry.id === item.sourceId)
                      if (card) setCardPaymentTarget(card)
                    } else {
                      const debt = financeData.debts.find((entry) => entry.id === item.sourceId)
                      if (debt) setDebtPaymentTarget(debt)
                    }
                  }}
                  onCloud={() => { setNotificationsOpen(false); setCloudSyncOpen(true) }}
                />
              )}
            </div>
          </div>
        </header>

        {activeTab === 'today' && (
          <button type="button" className="balance-hero dp13-payables-hero dp134-payables-hero" onClick={() => setPayablesOpen(true)} aria-label={`Open monthly payables, ${peso.format(monthlyPayableTotal)}`}>
            <span className="hero-label">To Pay This Month <ChevronRight size={19}/></span>
            <strong className="dp13-hero-amount">{peso.format(monthlyPayableTotal)}</strong>
            <span className="dp14-hero-breakdown">
              <span><small>Bills</small><strong>{peso.format(billsTotal)}</strong></span>
              <span><small>Cards</small><strong>{peso.format(cardMinimumTotal)}</strong></span>
              {loanTotal > 0 && <span><small>Loans</small><strong>{peso.format(loanTotal)}</strong></span>}
            </span>
            {missingMinimumCount > 0 && <span className="dp14-hero-notice">{missingMinimumCount} card minimum{missingMinimumCount > 1 ? 's' : ''} missing · not included</span>}
          </button>
        )}

        <section className="page-content">
          {activeTab === 'today' && (
            <TodayPage
              creditCardInsights={creditCardInsights}
              recurringExpenses={financeData.recurringExpenses}
              debts={financeData.debts}
              transactions={financeData.transactions}
              onOpenCard={setCardEditor}
              onOpenBill={setBillEditor}
              onOpenDebt={setDebtEditor}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletPage
              accounts={financeData.accounts}
              creditCards={financeData.creditCards}
              creditCardInsights={creditCardInsights}
              onAddAccount={() => setAccountEditor('new')}
              onEditAccount={setAccountEditor}
              onDeleteAccount={deleteAccount}
              onAddCreditCard={() => setCardEditor('new')}
              onEditCreditCard={setCardEditor}
              onDeleteCreditCard={deleteCreditCard}
              onPayCreditCard={setCardPaymentTarget}
            />
          )}

          {activeTab === 'plan' && (
            <PlanPage
              recurringExpenses={activeBills}
              recurringTotal={recurringTotal}
              creditCards={financeData.creditCards}
              onPayCard={setCardPaymentTarget}
              onEditCard={setCardEditor}
              savingsGoals={financeData.savingsGoals}
              debts={financeData.debts}
              budgetMetrics={budgetMetrics}
              onAddBill={() => setBillEditor('new')}
              onEditBill={setBillEditor}
              onDeleteBill={deleteBill}
              onPayBill={setBillPaymentTarget}
              onAddBudget={() => setBudgetEditor('new')}
              onEditBudget={setBudgetEditor}
              onAddGoal={() => setGoalEditor('new')}
              onEditGoal={setGoalEditor}
              onDeleteGoal={deleteSavingsGoal}
              onMoveGoalMoney={(goal, mode) => setGoalMoneyTarget({ goal, mode })}
              onAddDebt={() => setDebtEditor('new')}
              onEditDebt={setDebtEditor}
              onDeleteDebt={deleteDebt}
              onPayDebt={setDebtPaymentTarget}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsPage
              totalCash={totalCash}
              totalSavings={totalSavings}
              totalDebt={totalDebt}
              recurringTotal={recurringTotal}
              transactions={financeData.transactions}
              creditCardInsights={creditCardInsights}
              budgetMetrics={budgetMetrics}
              recurringExpenses={activeBills}
              debts={financeData.debts}
              onOpenTransactions={() => setTransactionHistoryOpen(true)}
            />
          )}
        </section>

        <div
          className={`fab-backdrop ${fabOpen ? 'visible' : ''}`}
          onClick={() => setFabOpen(false)}
          aria-hidden="true"
        />

        <div className={`fab-actions ${fabOpen ? 'visible' : ''}`}>
          <button type="button" className="fab-action income" onClick={() => { setActiveAction('income'); setFabOpen(false) }}>
            <ArrowDownLeft size={19} />
            <span>Income</span>
          </button>

          <button type="button" className="fab-action expense" onClick={() => { setActiveAction('expense'); setFabOpen(false) }}>
            <ArrowUpRight size={19} />
            <span>Expense</span>
          </button>

          <button type="button" className="fab-action transfer" onClick={() => { setActiveAction('transfer'); setFabOpen(false) }}>
            <ArrowRightLeft size={19} />
            <span>Transfer</span>
          </button>
        </div>


        <button
          className={`main-fab dp-fab-v3 ${fabOpen ? 'open' : ''}`}
          type="button"
          aria-label={fabOpen ? 'Close quick actions' : 'Open quick actions'}
          onClick={() => setFabOpen((current) => !current)}
        >
          {fabOpen ? <X size={25} /> : <Plus size={27} />}
        </button>

        <nav className="bottom-nav dp-navbar-v3" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key

            return (
              <button
                key={item.key}
                type="button"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={isActive ? 'active' : ''}
                onClick={() => {
                  setActiveTab(item.key)
                  setFabOpen(false)
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.8} />
              </button>
            )
          })}
        </nav>

        {activeAction && (
          <QuickActionModal
            action={activeAction}
            accounts={financeData.accounts}
            creditCards={financeData.creditCards}
            expenseCategories={expenseCategoryOptions}
            onClose={() => setActiveAction(null)}
            onAddIncome={handleQuickIncome}
            onAddExpense={handleQuickExpense}
            onTransfer={handleQuickTransfer}
            onNotify={showAlert}
          />
        )}

        {accountEditor && (
          <AccountEditorModal
            account={accountEditor === 'new' ? undefined : accountEditor}
            onClose={() => setAccountEditor(null)}
            onSave={saveAccount}
            onNotify={showAlert}
          />
        )}

        {cardEditor && (
          <CreditCardEditorModal
            card={cardEditor === 'new' ? undefined : cardEditor}
            installments={cardEditor === 'new' ? [] : getLinkedCardInstallments(financeData.debts, cardEditor)}
            onClose={() => setCardEditor(null)}
            onSave={saveCreditCard}
            onNotify={showAlert}
          />
        )}

        {statementImporterOpen && (
          <StatementImportModal
            creditCards={financeData.creditCards}
            debts={financeData.debts}
            onClose={() => setStatementImporterOpen(false)}
            onSave={saveStatementImport}
            onNotify={showAlert}
          />
        )}

        {billEditor && (
          <BillEditorModal
            bill={billEditor === 'new' ? undefined : billEditor}
            onClose={() => setBillEditor(null)}
            onSave={saveBill}
            onNotify={showAlert}
          />
        )}

        {budgetEditor && (
          <BudgetEditorModal
            budget={budgetEditor === 'new' ? undefined : budgetEditor}
            onClose={() => setBudgetEditor(null)}
            onSave={saveBudget}
            onNotify={showAlert}
          />
        )}

        {goalEditor && (
          <SavingsGoalEditorModal
            goal={goalEditor === 'new' ? undefined : goalEditor}
            onClose={() => setGoalEditor(null)}
            onSave={saveSavingsGoal}
            onNotify={showAlert}
          />
        )}

        {debtEditor && (
          <DebtEditorModal
            debt={debtEditor === 'new' ? undefined : debtEditor}
            onClose={() => setDebtEditor(null)}
            onSave={saveDebt}
            onNotify={showAlert}
          />
        )}

        {billPaymentTarget && (
          <BillPaymentModal
            bill={billPaymentTarget}
            accounts={financeData.accounts}
            onClose={() => setBillPaymentTarget(null)}
            onSave={payBill}
            onNotify={showAlert}
          />
        )}

        {cardPaymentTarget && (
          <CreditCardPaymentModal
            card={cardPaymentTarget}
            accounts={financeData.accounts}
            onClose={() => setCardPaymentTarget(null)}
            onSave={payCreditCard}
            onNotify={showAlert}
          />
        )}

        {goalMoneyTarget && (
          <GoalMoneyModal
            target={goalMoneyTarget}
            accounts={financeData.accounts}
            onClose={() => setGoalMoneyTarget(null)}
            onSave={moveSavingsMoney}
            onNotify={showAlert}
          />
        )}

        {debtPaymentTarget && (
          <DebtPaymentModal
            debt={debtPaymentTarget}
            accounts={financeData.accounts}
            onClose={() => setDebtPaymentTarget(null)}
            onSave={payDebt}
            onNotify={showAlert}
          />
        )}

        {payablesOpen && (
          <MonthlyPayablesModal
            items={monthlyObligations}
            onClose={() => setPayablesOpen(false)}
            onPay={(item) => {
              setPayablesOpen(false)
              if (item.kind === 'bill') {
                const bill = financeData.recurringExpenses.find((entry) => entry.id === item.sourceId)
                if (bill) setBillPaymentTarget(bill)
              } else if (item.kind === 'card') {
                const card = financeData.creditCards.find((entry) => entry.id === item.sourceId)
                if (card) item.amount === null ? setCardEditor(card) : setCardPaymentTarget(card)
              } else {
                const debt = financeData.debts.find((entry) => entry.id === item.sourceId)
                if (debt) setDebtPaymentTarget(debt)
              }
            }}
          />
        )}

        {cloudSyncOpen && (
          <CloudSyncModal
            isConfigured={Boolean(supabase)}
            sessionEmail={session?.user.email ?? null}
            syncStatus={syncStatus}
            lastSyncedAt={lastSyncedAt}
            busy={cloudSyncBusy}
            onClose={() => setCloudSyncOpen(false)}
            onSignIn={signInToCloud}
            onSignUp={signUpForCloud}
            onSignOut={signOutFromCloud}
            onSyncNow={() => {
              void syncDataToCloud()
            }}
            onRestore={confirmRestoreFromCloud}
            onResetLocal={resetLocalData}
            onNotify={showAlert}
          />
        )}

        {transactionHistoryOpen && (
          <TransactionHistoryModal
            transactions={financeData.transactions}
            onClose={() => setTransactionHistoryOpen(false)}
            onClear={clearTransactionHistory}
          />
        )}

        {messageDialog && (
          <MessageDialogModal
            dialog={messageDialog}
            onClose={() => setMessageDialog(null)}
            onConfirm={() => {
              const action = messageDialog.onConfirm
              setMessageDialog(null)
              action?.()
            }}
          />
        )}
      </section>
    </main>
  )
}

type MoneyCalendarEvent = {
  id: string
  title: string
  date: Date
  amount: number | null
  type: 'Recurring' | 'Cut-off' | 'Due' | 'Debt'
  cardId?: number
  billId?: number
  debtId?: number
  paid?: boolean
}

function monthMoneyEvents(
  year: number,
  month: number,
  creditCardInsights: CreditCardInsight[],
  recurringExpenses: RecurringExpense[],
  debts: Debt[] = [],
  transactions: Transaction[] = [],
): MoneyCalendarEvent[] {
  const result: MoneyCalendarEvent[] = []
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const currentMonth = year === new Date().getFullYear() && month === new Date().getMonth()

  const appendBill = (bill: RecurringExpense, date: Date) => {
    if (date.getFullYear() !== year || date.getMonth() !== month) return
    const amount = currentMonth ? getBillRemainingBalance(bill) : bill.amount
    const isPaid = currentMonth && amount <= 0 && bill.periodKey === `${year}-${String(month + 1).padStart(2, '0')}` && Boolean(bill.lastPaidAt)
    result.push({
      id: `bill-${bill.id}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      title: bill.name,
      date,
      amount,
      paid: isPaid,
      type: 'Recurring',
      billId: bill.id,
    })
  }

  for (const bill of recurringExpenses) {
    const frequency = bill.frequency.toLowerCase()
    const raw = bill.nextDue.trim()

    if (frequency.includes('month')) {
      // Supports a stored ISO date, "Oct 30", "Every 30th", and similar bill labels.
      const isoDay = raw.match(/^\d{4}-\d{2}-(\d{2})$/)
      const dayMatch = raw.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/i)
      const day = Number(isoDay?.[1] ?? dayMatch?.[1])
      if (day >= 1 && day <= 31) appendBill(bill, buildDateForDay(year, month, day))
      continue
    }

    if (frequency.includes('year') || frequency.includes('annual')) {
      const reference = new Date(`${raw} ${year}`)
      if (!Number.isNaN(reference.getTime())) appendBill(bill, startOfDay(reference))
      continue
    }

    // Repeating weekly/daily bills need a known anchor. Never invent a date.
    const anchor = getUpcomingBillDueDate(bill)
    const interval = frequency.includes('biweekly') || frequency.includes('fortnight') ? 14
      : frequency.includes('week') ? 7 : frequency.includes('daily') ? 1 : 0
    if (!anchor || !interval) continue

    let candidate = startOfDay(anchor)
    while (candidate >= monthStart) candidate = addDays(candidate, -interval)
    candidate = addDays(candidate, interval)
    let safety = 0
    while (candidate <= monthEnd && safety++ < 32) {
      appendBill(bill, candidate)
      candidate = addDays(candidate, interval)
    }
  }

  for (const { card } of creditCardInsights) {
    if (isValidDayOfMonth(card.cutOffDay)) {
      const cutoff = buildDateForDay(year, month, card.cutOffDay)
      result.push({ id: `cutoff-${card.id}`, title: `${card.name} Cut-off`, date: cutoff, amount: null, type: 'Cut-off', cardId: card.id })
    }
    if (isValidDayOfMonth(card.dueDay)) {
      let dueDate = buildDateForDay(year, month, card.dueDay)
      const bankDate = parseValidIsoDate(card.paymentDueDate)
      const bankDueThisMonth = Boolean(bankDate && bankDate.getFullYear() === year && bankDate.getMonth() === month)
      if (bankDate && bankDueThisMonth) dueDate = bankDate
      // A known future SOA date supersedes this month's recurring forecast.
      if (currentMonth && bankDate && bankDate >= startOfDay(new Date()) && !bankDueThisMonth) continue
      const paidThisMonth = Boolean(card.lastPaymentAt && card.minimumDue === 0 && monthKeyForDate(new Date(card.lastPaymentAt)) === `${year}-${String(month + 1).padStart(2, '0')}`)
      result.push({
        id: `due-${card.id}`,
        title: `${card.name} Due Date`,
        date: dueDate,
        amount: (currentMonth || bankDueThisMonth) && typeof card.minimumDue === 'number' ? Math.max(0, card.minimumDue) : null,
        type: 'Due',
        paid: currentMonth && paidThisMonth,
        cardId: card.id,
      })
    }
  }

  for (const debt of debts) {
    if (debt.kind === 'credit-card-installment') continue // Future card installments are not separately billed minimums.
    const dueDay = recurringDayFromText(debt.due)
    if (dueDay === null) continue
    const amountPaid = sumPaymentsForDebt(transactions, debt.name, year, month)
    if (debt.balance <= 0 && !(currentMonth && amountPaid > 0)) continue
    const date = buildDateForDay(year, month, dueDay)
    const cycleDue = Math.max(0, Math.min(debt.monthly, debt.balance + (currentMonth ? amountPaid : 0)))
    const paid = currentMonth && amountPaid >= cycleDue && cycleDue > 0
    result.push({
      id: `debt-${debt.id}-${year}-${month}`,
      title: debt.name,
      date,
      type: 'Debt',
      debtId: debt.id,
      amount: currentMonth ? Math.max(0, cycleDue - amountPaid) : Math.min(debt.monthly, debt.balance),
      paid,
    })
  }

  return result.sort((a, b) => a.date.getTime() - b.date.getTime() || a.title.localeCompare(b.title))
}

function TodayPage({
  creditCardInsights,
  recurringExpenses,
  debts,
  transactions,
  onOpenCard,
  onOpenBill,
  onOpenDebt,
}: {
  creditCardInsights: CreditCardInsight[]
  recurringExpenses: RecurringExpense[]
  debts: Debt[]
  transactions: Transaction[]
  onOpenCard: (card: CreditCardAccount) => void
  onOpenBill: (bill: RecurringExpense) => void
  onOpenDebt: (debt: Debt) => void
}) {
  const today = startOfDay(new Date())
  const [displayMonth, setDisplayMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(() => today.getDate())
  const year = displayMonth.getFullYear()
  const month = displayMonth.getMonth()
  const monthEvents = useMemo(
    () => monthMoneyEvents(year, month, creditCardInsights, recurringExpenses, debts, transactions),
    [year, month, creditCardInsights, recurringExpenses, debts, transactions],
  )
  const eventsByDay = useMemo(() => {
    const grouped = new Map<number, MoneyCalendarEvent[]>()
    for (const event of monthEvents) {
      const day = event.date.getDate()
      grouped.set(day, [...(grouped.get(day) ?? []), event])
    }
    return grouped
  }, [monthEvents])

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedEvents = eventsByDay.get(selectedDay) ?? []
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const upcomingEvents = monthEvents
    .filter((event) => (!isCurrentMonth || event.date.getDate() >= today.getDate()) && event.date.getDate() !== selectedDay)
    .slice(0, 4)

  const moveMonth = (direction: number) => {
    const nextMonth = new Date(year, month + direction, 1)
    setDisplayMonth(nextMonth)
    setSelectedDay(1)
  }
  const showCurrentMonth = () => {
    setDisplayMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDay(today.getDate())
  }
  const dailyRecommendation = getDailyRecommendation(creditCardInsights)
  const recommendedCard = creditCardInsights.find((item) => item.status === 'recommended' || item.status === 'watch')?.card
  const eventLabel = (type: MoneyCalendarEvent['type']) => type === 'Cut-off' ? 'Cut' : type === 'Due' ? 'Due' : type === 'Debt' ? 'Debt' : 'Bill'

  const openEvent = (event: MoneyCalendarEvent) => {
    if (event.cardId !== undefined) {
      const card = creditCardInsights.find((insight) => insight.card.id === event.cardId)?.card
      if (card) onOpenCard(card)
    } else if (event.billId !== undefined) {
      const bill = recurringExpenses.find((item) => item.id === event.billId)
      if (bill) onOpenBill(bill)
    } else if (event.debtId !== undefined) {
      const debt = debts.find((item) => item.id === event.debtId)
      if (debt) onOpenDebt(debt)
    }
  }
  const renderEvent = (event: MoneyCalendarEvent, showDate: boolean) => (
    <button key={event.id} type="button" className="dp12-event-row" onClick={() => openEvent(event)} aria-label={`Open ${event.title} details`}>
      <span className={`dp12-event-dot dp12-event-dot--${event.paid ? 'paid' : getEventClass(event.type)}`} aria-hidden="true" />
      <span className="dp12-event-description">
        <strong>{event.title}</strong>
        {showDate && <span>{event.date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>}
      </span>
      <span className="dp12-event-amount">{event.paid ? 'Paid' : event.amount !== null ? peso.format(event.amount) : eventLabel(event.type)}</span>
    </button>
  )

  return (
    <>
      <section className="dp12-calendar dp134-money-calendar" aria-label="Monthly money events calendar">
        <div className="dp12-month-header">
          <div className="dp12-month-title">
            <strong>{displayMonth.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</strong>
            <span>{year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth()) ? 'Scheduled dates (not payment history)' : `${monthEvents.length} scheduled event${monthEvents.length === 1 ? '' : 's'}`}</span>
          </div>
          <div className="dp12-month-controls">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
            <button type="button" className="dp12-month-today" onClick={showCurrentMonth}>Today</button>
            <button type="button" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="dp12-calendar-grid" role="group" aria-label="Choose a date">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((weekday, index) => (
            <div className="dp12-calendar-weekday" key={index} aria-hidden="true">{weekday}</div>
          ))}
          {cells.map((day, index) => {
            const todaysDate = day !== null && isCurrentMonth && day === today.getDate()
            const dayEvents = day === null ? [] : (eventsByDay.get(day) ?? [])
            return day === null ? (
              <div className="dp12-calendar-empty" key={`empty-${index}`} aria-hidden="true" />
            ) : (
              <button
                key={`${year}-${month}-${day}`}
                type="button"
                className={`dp12-calendar-day${selectedDay === day ? ' is-selected' : ''}${todaysDate ? ' is-today' : ''}`}
                aria-pressed={selectedDay === day}
                aria-label={`${new Date(year, month, day).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}`}
                onClick={() => setSelectedDay(day)}
              >
                <span className="dp12-calendar-number">{day}</span>
                {dayEvents.length > 0 && (
                  <span className="dp12-calendar-markers" aria-hidden="true">
                    <span className="dp12-calendar-dots">
                      {dayEvents.slice(0, 3).map((event) => (
                        <i key={event.id} className={`dp12-calendar-dot dp12-event-dot--${event.paid ? 'paid' : getEventClass(event.type)}`} />
                      ))}
                    </span>
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="dp12-calendar-legend" aria-label="Calendar event legend">
          <span><i className="dp12-event-dot dp12-event-dot--due" />Due</span>
          <span><i className="dp12-event-dot dp12-event-dot--cutoff" />Cut-off</span>
          <span><i className="dp12-event-dot dp12-event-dot--recurring" />Bill</span>
          <span><i className="dp12-event-dot dp12-event-dot--paid" />Paid</span>
        </div>

        <div className="dp12-calendar-detail" aria-live="polite">
          <h3>{new Date(year, month, selectedDay).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}</h3>
          {selectedEvents.length ? selectedEvents.map((event) => renderEvent(event, false)) : <p className="dp12-empty-events">No events on this date</p>}
        </div>
      </section>

      <button
        type="button"
        className="dp134-recommendation"
        disabled={!recommendedCard}
        onClick={() => { if (recommendedCard) onOpenCard(recommendedCard) }}
        title={dailyRecommendation.description}
        aria-label={`Best card today: ${dailyRecommendation.title}. ${dailyRecommendation.description}`}
      >
        <CreditCard size={18} aria-hidden="true" />
        <span className="dp134-recommendation-label">Best card today</span>
        <strong>{dailyRecommendation.title}</strong>
        {recommendedCard && <ChevronRight size={16} aria-hidden="true" />}
      </button>

      {upcomingEvents.length > 0 && (
        <details className="dp12-upcoming dp134-upcoming" aria-label="Other upcoming events in this month">
          <summary>{isCurrentMonth ? 'More upcoming events' : 'Other events this month'} <span>{upcomingEvents.length}</span></summary>
          {upcomingEvents.map((event) => renderEvent(event, true))}
        </details>
      )}
    </>
  )
}

function WalletPage({
  accounts,
  creditCards,
  creditCardInsights,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onAddCreditCard,
  onEditCreditCard,
  onDeleteCreditCard,
  onPayCreditCard,
}: {
  accounts: Account[]
  creditCards: CreditCardAccount[]
  creditCardInsights: CreditCardInsight[]
  onAddAccount: () => void
  onEditAccount: (account: Account) => void
  onDeleteAccount: (id: number) => void
  onAddCreditCard: () => void
  onEditCreditCard: (card: CreditCardAccount) => void
  onDeleteCreditCard: (id: number) => void
  onPayCreditCard: (card: CreditCardAccount) => void
}) {
  const [walletView, setWalletView] = useState<'cash' | 'cards'>('cash')
  const swipeStart = useRef<number | null>(null)
  return (
    <section className="dp13-wallet-deck">
      <div className="dp13-deck-tabs" onTouchStart={(event) => { swipeStart.current = event.touches[0]?.clientY ?? null }} onTouchEnd={(event) => {
        const end = event.changedTouches[0]?.clientY
        if (swipeStart.current !== null && end !== undefined && Math.abs(end - swipeStart.current) > 35) setWalletView(end < swipeStart.current ? 'cards' : 'cash')
        swipeStart.current = null
      }}>
        <button type="button" className={walletView === 'cash' ? 'active' : ''} aria-pressed={walletView === 'cash'} onClick={() => setWalletView('cash')}>Cash Accounts <small>{accounts.length}</small></button>
        <button type="button" className={walletView === 'cards' ? 'active' : ''} aria-pressed={walletView === 'cards'} onClick={() => setWalletView('cards')}>Credit Cards <small>{creditCards.length}</small></button>
      </div>
      <div className="dp13-deck-hint">Swipe up or down on the heading to switch</div>
      <div className="dp13-deck-content">
      {walletView === 'cash' && <>
      <button type="button" className="dp13-inline-add" onClick={onAddAccount}><Plus size={16} /> Add cash account</button>

      <SectionTitle title="Cash Accounts" subtitle="Cash, banks, and e-wallets" />

      <div className="card-list">
        {accounts.map((account) => (
          <article key={account.id} className="account-card">
            <div className={`account-icon ${account.accent}`}>
              <Landmark size={22} />
            </div>

            <div className="card-main-content">
              <h3>{account.name}</h3>
              <p>{account.type}</p>
            </div>

            <div style={amountActionColumnStyle}>
              <strong>{peso.format(account.balance)}</strong>
              <div style={miniActionRowStyle}>
                <IconButton label={`Edit ${account.name}`} onClick={() => onEditAccount(account)}>
                  <Pencil size={14} />
                </IconButton>
                <IconButton danger label={`Delete ${account.name}`} onClick={() => onDeleteAccount(account.id)}>
                  <Trash2 size={14} />
                </IconButton>
              </div>
            </div>
          </article>
        ))}
      </div>

      </>}
      {walletView === 'cards' && <>
      <button type="button" className="dp13-inline-add" onClick={onAddCreditCard}><Plus size={16} /> Add credit card</button>
      <SectionTitle title="Credit Cards" subtitle="Your card balances and payment dates" />

      <div className="card-list">
        {creditCards.length === 0 && (
          <article className="account-card">
            <div className="card-main-content">
              <h3>No credit cards yet</h3>
              <p>Add your first card to enable recommendations.</p>
            </div>
          </article>
        )}

        {creditCards.map((card) => {
          const insight = creditCardInsights.find((item) => item.card.id === card.id)
          const utilization = insight?.utilization ?? 0

          return (
            <article key={card.id} className="credit-card dp-v9-credit-card">
              <div className="dp-v9-card-heading">
                <h3>{card.name}</h3>
                <span className="dp-v9-card-utilization">{utilization}% used</span>
              </div>

              <div className="dp-v9-balances">
                <div>
                  <span>Balance</span>
                  <strong>{peso.format(card.currentBalance)}</strong>
                </div>
                <div>
                  <span>Available</span>
                  <strong>{peso.format(card.creditLimit - card.currentBalance)}</strong>
                </div>
              </div>

              <div className="dp-v9-card-facts">
                <span>Cut-off: {formatOrdinalDay(card.cutOffDay).replace(/^Every /, '')}</span>
                <span>Due: {card.paymentDueDate ? formatCreditCardDueDate(card.paymentDueDate) : formatOrdinalDay(card.dueDay).replace(/^Every /, '')}</span>
              </div>

              <div className={`dp-v9-card-footer ${typeof card.minimumDue === 'number' && Number.isFinite(card.minimumDue) ? '' : 'dp-v10-no-minimum'}`}>
                {typeof card.minimumDue === 'number' && Number.isFinite(card.minimumDue) && (
                  <div className="dp-v9-card-minimum">
                    <span>Minimum due</span>
                    <strong>{peso.format(getCreditCardMinimumPayment(card))}</strong>
                  </div>
                )}
                <div className="dp-v9-card-actions">
                  <IconButton label={`Pay ${card.name}`} onClick={() => onPayCreditCard(card)}>
                    <ArrowDownLeft size={16} />
                  </IconButton>
                  <button type="button" onClick={() => onEditCreditCard(card)} aria-label={`Edit card details for ${card.name}`}>
                    <Pencil size={16} />
                  </button>
                  <IconButton danger label={`Delete ${card.name}`} onClick={() => onDeleteCreditCard(card.id)}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      </>}
      </div>
    </section>
  )
}

function PlanPage({
  recurringExpenses,
  recurringTotal,
  creditCards,
  onPayCard,
  onEditCard,
  savingsGoals,
  debts,
  budgetMetrics,
  onAddBill,
  onEditBill,
  onDeleteBill,
  onPayBill,
  onAddBudget,
  onEditBudget,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onMoveGoalMoney,
  onAddDebt,
  onEditDebt,
  onDeleteDebt,
  onPayDebt,
}: {
  recurringExpenses: RecurringExpense[]
  recurringTotal: number
  creditCards: CreditCardAccount[]
  onPayCard: (card: CreditCardAccount) => void
  onEditCard: (card: CreditCardAccount) => void
  savingsGoals: SavingsGoal[]
  debts: Debt[]
  budgetMetrics: BudgetMetric[]
  onAddBill: () => void
  onEditBill: (bill: RecurringExpense) => void
  onDeleteBill: (id: number) => void
  onPayBill: (bill: RecurringExpense) => void
  onAddBudget: () => void
  onEditBudget: (budget: MonthlyBudget) => void
  onAddGoal: () => void
  onEditGoal: (goal: SavingsGoal) => void
  onDeleteGoal: (id: number) => void
  onMoveGoalMoney: (goal: SavingsGoal, mode: 'deposit' | 'withdraw') => void
  onAddDebt: () => void
  onEditDebt: (debt: Debt) => void
  onDeleteDebt: (id: number) => void
  onPayDebt: (debt: Debt) => void
}) {
  const [activePlanSection, setActivePlanSection] =
    useState<PlanSectionKey>('bills')

  const totalSaved = savingsGoals.reduce(
    (total, goal) => total + goal.current,
    0,
  )
  const totalTarget = savingsGoals.reduce(
    (total, goal) => total + goal.target,
    0,
  )
  const totalLoanBalance = debts.reduce((total, debt) => total + debt.balance, 0)

  const knownCardMinimums = creditCards.filter((card) => typeof card.minimumDue === 'number' && getCreditCardMinimumPayment(card) > 0)
  const missingMinimumCards = creditCards.filter((card) => card.currentBalance > 0 && typeof card.minimumDue !== 'number')
  const planTabs: Array<{key: PlanSectionKey, label: string}> = [
    {key:'bills', label:'Payments'}, {key:'debts', label:'Debts'}, {key:'budget', label:'Budget'}, {key:'savings', label:'Savings'},
  ]

  return (
    <>
      <div className="dp13-plan-heading">
        <h2>Payments & Plans</h2>
        <p>Choose what you want to manage.</p>
      </div>
      <div className="dp13-plan-tabs" role="group" aria-label="Plan sections">
        {planTabs.map((tab) => <button key={tab.key} type="button" className={activePlanSection === tab.key ? 'active' : ''} aria-pressed={activePlanSection === tab.key} onClick={() => setActivePlanSection(tab.key)}>{tab.label}</button>)}
      </div>

      {activePlanSection === 'bills' && (
        <>
          <div className="dp13-plan-brief">
            <span>Unpaid bills</span><strong>{peso.format(recurringTotal)}</strong>
          </div>
          <div className="dp13-plan-card-payments">
            <h3>Card minimums</h3>
            {knownCardMinimums.length === 0 && <p>No unpaid card minimums entered.</p>}
            {knownCardMinimums.map((card) => <div key={card.id} className="dp13-pay-line"><div><strong>{card.name}</strong><small>Minimum due · {formatOrdinalDay(card.dueDay)}</small></div><strong>{peso.format(getCreditCardMinimumPayment(card))}</strong><button type="button" onClick={() => onPayCard(card)}>Pay</button></div>)}
            {missingMinimumCards.map((card) => <button type="button" className="dp13-missing-min" key={card.id} onClick={() => onEditCard(card)}>Add minimum due for {card.name} <ChevronRight size={14}/></button>)}
          </div>

          <div style={{ marginTop: 14 }}>
            <button type="button" style={softButtonStyle} onClick={onAddBill}>
              <Plus size={16} />
              Add Bill
            </button>
          </div>

          <SectionTitle
            title="Bills"
            subtitle="Only unpaid bills are shown here"
          />

          <div className="card-list">
            {recurringExpenses.length === 0 && (
              <article className="account-card">
                <div className="card-main-content">
                  <h3>No unpaid bills</h3>
                  <p>Fully paid monthly bills will reappear next month.</p>
                </div>
              </article>
            )}

            {recurringExpenses.map((expense) => {
              const balanceDue = getBillRemainingBalance(expense)
              const hasPartialPayment = balanceDue < expense.amount

              return (
                <article key={expense.id} className="recurring-card">
                  <div className="recurring-icon">
                    <Repeat2 size={20} />
                  </div>

                  <div className="card-main-content">
                    <h3>{expense.name}</h3>
                    <p>
                      {expense.category} · {expense.frequency}
                    </p>
                    <span>Next due: {getUpcomingBillDueDate(expense) ? formatChartDate(getUpcomingBillDueDate(expense)!) : expense.nextDue}</span>
                    {hasPartialPayment && (
                      <span>Original amount: {peso.format(expense.amount)}</span>
                    )}
                  </div>

                  <div style={amountActionColumnStyle}>
                    <strong>{peso.format(balanceDue)}</strong>
                    <div style={miniActionRowStyle}>
                      <IconButton
                        label={`Pay ${expense.name}`}
                        onClick={() => onPayBill(expense)}
                      >
                        <ArrowDownLeft size={14} />
                      </IconButton>
                      <IconButton
                        label={`Edit ${expense.name}`}
                        onClick={() => onEditBill(expense)}
                      >
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton
                        danger
                        label={`Delete ${expense.name}`}
                        onClick={() => onDeleteBill(expense.id)}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      {activePlanSection === 'budget' && (
        <BudgetSection
          budgetMetrics={budgetMetrics}
          onAddBudget={onAddBudget}
          onEditBudget={onEditBudget}
        />
      )}

      {activePlanSection === 'savings' && (
        <>
          <section className="recurring-summary">
            <div>
              <p>Total Saved</p>
              <h2>{peso.format(totalSaved)}</h2>
              <span>
                {totalTarget > 0
                  ? `${Math.round((totalSaved / totalTarget) * 100)}% of total target`
                  : 'No target yet'}
              </span>
            </div>
            <strong>{savingsGoals.length}</strong>
          </section>

          <div style={{ marginTop: 14 }}>
            <button type="button" style={softButtonStyle} onClick={onAddGoal}>
              <Plus size={16} />
              Add Savings Goal
            </button>
          </div>

          <SectionTitle
            title="Savings Goals"
            subtitle="Track progress toward your financial targets"
          />

          <div className="card-list">
            {savingsGoals.length === 0 && (
              <article className="account-card">
                <div className="card-main-content">
                  <h3>No savings goals yet</h3>
                  <p>Add your first goal to start tracking progress.</p>
                </div>
              </article>
            )}

            {savingsGoals.map((goal) => {
              const progress =
                goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0

              return (
                <article key={goal.id} className="goal-card">
                  <div className="goal-header">
                    <div>
                      <h3>{goal.name}</h3>
                      <p>Target: {goal.targetDate}</p>
                    </div>
                    <strong>{Math.min(progress, 100)}%</strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill savings"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  <div className="goal-values">
                    <span>
                      Saved
                      <strong>{peso.format(goal.current)}</strong>
                    </span>
                    <span>
                      Remaining
                      <strong>
                        {peso.format(Math.max(goal.target - goal.current, 0))}
                      </strong>
                    </span>
                  </div>

                  <div style={cardActionGridStyle}>
                    <button
                      type="button"
                      style={compactButtonStyle}
                      onClick={() => onMoveGoalMoney(goal, 'deposit')}
                    >
                      Add Money
                    </button>
                    <button
                      type="button"
                      style={compactButtonStyle}
                      onClick={() => onMoveGoalMoney(goal, 'withdraw')}
                    >
                      Withdraw
                    </button>
                    <button
                      type="button"
                      style={compactButtonStyle}
                      onClick={() => onEditGoal(goal)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={compactDangerButtonStyle}
                      onClick={() => onDeleteGoal(goal.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      {activePlanSection === 'debts' && (
        <>
          <section className="debt-summary">
            <p>Tracked Loan Balance</p>
            <h2>{peso.format(totalLoanBalance)}</h2>
            <span>Excludes your separate credit card balances</span>
          </section>

          <button
            type="button"
            style={softButtonWithTopMarginStyle}
            onClick={onAddDebt}
          >
            <Plus size={16} />
            Add Debt
          </button>

          <SectionTitle
            title="Debt Tracker"
            subtitle="Monitor balances and monthly payments"
          />

          <div className="card-list">
            {debts.length === 0 && (
              <article className="account-card">
                <div className="card-main-content">
                  <h3>No debts yet</h3>
                  <p>Add loans, installments, or other obligations here.</p>
                </div>
              </article>
            )}

            {debts.map((debt) => (
              <article key={debt.id} className="debt-card">
                <div className="card-main-content">
                  <h3>{debt.name}</h3>
                  <p>
                    {peso.format(debt.monthly)} monthly · {debt.due}
                    {typeof debt.annualRate === 'number' ? ` · ${Math.round(debt.annualRate * 100)}% APR` : ''}
                  </p>
                </div>

                <strong>{peso.format(debt.balance)}</strong>

                <div style={inlineCardActionsStyle}>
                  <IconButton
                    label={`Pay ${debt.name}`}
                    onClick={() => onPayDebt(debt)}
                  >
                    <ArrowDownLeft size={14} />
                  </IconButton>
                  <IconButton
                    label={`Edit ${debt.name}`}
                    onClick={() => onEditDebt(debt)}
                  >
                    <Pencil size={14} />
                  </IconButton>
                  <IconButton
                    danger
                    label={`Delete ${debt.name}`}
                    onClick={() => onDeleteDebt(debt.id)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              </article>
            ))}
          </div>

          {debts.length > 0 && (
            <section className="strategy-card">
              <p>Suggested Strategy</p>
              <h3>Snowball Method</h3>
              <span>
                Pay the smallest balance first while maintaining minimum payments
                on other debts.
              </span>
            </section>
          )}
        </>
      )}
    </>
  )
}

function BudgetSection({
  budgetMetrics,
  onAddBudget,
  onEditBudget,
}: {
  budgetMetrics: BudgetMetric[]
  onAddBudget: () => void
  onEditBudget: (budget: MonthlyBudget) => void
}) {
  const totalBudget = budgetMetrics.reduce((total, metric) => total + metric.budget.limit, 0)
  const totalSpent = budgetMetrics.reduce((total, metric) => total + metric.spent, 0)
  const remaining = totalBudget - totalSpent
  const progress = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const visibleBudgetMetrics = budgetMetrics.filter((metric) => metric.budget.limit > 0 || metric.spent > 0)

  return (
    <>
      <SectionTitle title="Monthly Budget" subtitle="Create only the budgets you want to track" />

      <section className="recurring-summary">
        <div>
          <p>Budget Used</p>
          <h2>{peso.format(totalSpent)}</h2>
          <span>
            {totalBudget <= 0
              ? 'No monthly budgets yet'
              : remaining >= 0
                ? `${peso.format(remaining)} remaining`
                : `${peso.format(Math.abs(remaining))} over budget`}
          </span>
        </div>
        <strong>{totalBudget <= 0 ? '—' : `${Math.min(progress, 999)}%`}</strong>
      </section>

      <div className="plan-inline-actions">
        <button type="button" onClick={onAddBudget}>
          <Plus size={16} />
          Add Budget
        </button>
      </div>

      {visibleBudgetMetrics.length > 0 ? (
        <div className="card-list" style={{ marginTop: 12 }}>
          {visibleBudgetMetrics.map((metric) => (
            <article key={metric.budget.id} className="goal-card">
              <div className="goal-header">
                <div>
                  <h3>{metric.budget.category}</h3>
                  <p>Monthly limit: {peso.format(metric.budget.limit)}</p>
                </div>
                <strong style={metric.overBudget ? dangerTextStyle : undefined}>{metric.progress}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className={`progress-fill ${metric.overBudget ? 'warning' : 'savings'}`}
                  style={{ width: `${Math.min(metric.progress, 100)}%` }}
                />
              </div>

              <div className="goal-values">
                <span>
                  Spent
                  <strong>{peso.format(metric.spent)}</strong>
                </span>
                <span>
                  {metric.overBudget ? 'Over' : 'Remaining'}
                  <strong>{peso.format(Math.abs(metric.remaining))}</strong>
                </span>
              </div>

              <div style={budgetActionRowStyle}>
                <button type="button" style={compactButtonStyle} onClick={() => onEditBudget(metric.budget)}>
                  Edit Budget
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <article className="account-card budget-empty-card">
          <div className="card-main-content">
            <h3>No budgets yet</h3>
            <p>Tap Add Budget and create your own categories, like Grocery, Fuel, Coffee, or Family Support.</p>
          </div>
        </article>
      )}
    </>
  )
}

type InsightSectionKey = 'overview' | 'cashflow' | 'budget' | 'debt' | 'tools' | 'actions'
type BudgetInsightView = 'usage' | 'mix'

function InsightsPage({
  totalCash,
  totalSavings,
  totalDebt,
  recurringTotal,
  transactions,
  creditCardInsights,
  budgetMetrics,
  recurringExpenses,
  debts,
  onOpenTransactions,
}: {
  totalCash: number
  totalSavings: number
  totalDebt: number
  recurringTotal: number
  transactions: Transaction[]
  creditCardInsights: CreditCardInsight[]
  budgetMetrics: BudgetMetric[]
  recurringExpenses: RecurringExpense[]
  debts: Debt[]
  onOpenTransactions: () => void
}) {
  const [extraPayment, setExtraPayment] = useState(2000)
  const [activeSection, setActiveSection] = useState<InsightSectionKey>('overview')
  const [budgetView, setBudgetView] = useState<BudgetInsightView>('usage')
  const [paydayAmount, setPaydayAmount] = useState('10000')
  const [affordAmount, setAffordAmount] = useState('')

  const netWorth = totalCash + totalSavings - totalDebt
  const monthlyIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const monthlyExpenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const netCashflow = monthlyIncome - monthlyExpenses

  const totalBudget = budgetMetrics.reduce((total, metric) => total + metric.budget.limit, 0)
  const totalBudgetSpent = budgetMetrics.reduce((total, metric) => total + metric.spent, 0)
  const overBudgetCount = budgetMetrics.filter((metric) => metric.overBudget).length
  const budgetUsage = totalBudget > 0 ? Math.round((totalBudgetSpent / totalBudget) * 100) : 0
  const budgetRemaining = totalBudget - totalBudgetSpent

  const debtItems = useMemo(
    () => getDebtPlanningItems(creditCardInsights, debts),
    [creditCardInsights, debts],
  )
  const creditCardMinimums = creditCardInsights.reduce(
    (total, insight) => total + getCreditCardMinimumPayment(insight.card), 0,
  )
  const missingMinimumCards = creditCardInsights.filter(({ card }) =>
    card.currentBalance > 0 && (typeof card.minimumDue !== 'number' || !Number.isFinite(card.minimumDue)),
  )
  const loanMinimums = debts.reduce(
    (total, debt) => total + getStandaloneDebtMinimum(debt), 0,
  )
  const minimumTotal = creditCardMinimums + loanMinimums
  const mandatoryReserve = recurringTotal + minimumTotal
  const reserveShortfall = Math.max(0, mandatoryReserve - totalCash)

  const healthSummary = useMemo(
    () =>
      getFinancialHealthSummary({
        totalCash,
        totalSavings,
        totalDebt,
        recurringTotal: mandatoryReserve,
        totalBudget,
        totalBudgetSpent,
        overBudgetCount,
        creditCardInsights,
        netCashflow,
      }),
    [
      totalCash,
      totalSavings,
      totalDebt,
      mandatoryReserve,
      totalBudget,
      totalBudgetSpent,
      overBudgetCount,
      creditCardInsights,
      netCashflow,
    ],
  )

  const forecastData = useMemo(
    () =>
      getCashflowForecast({
        totalCash,
        recurringExpenses,
        creditCardInsights,
        debts,
      }),
    [totalCash, recurringExpenses, creditCardInsights, debts],
  )

  const spendingMixData = useMemo(() => getSpendingMixData(transactions), [transactions])
  const budgetChartData = useMemo(() => getBudgetChartData(budgetMetrics), [budgetMetrics])

  const debtComparison = useMemo(
    () => getDebtPlanComparison(debtItems, extraPayment),
    [debtItems, extraPayment],
  )

  const smartInsights = useMemo(
    () =>
      getSmartInsightCards({
        totalCash,
        recurringTotal,
        netCashflow,
        budgetMetrics,
        creditCardInsights,
        debts,
        debtPlan: debtComparison.recommended,
      }),
    [
      totalCash,
      recurringTotal,
      netCashflow,
      budgetMetrics,
      creditCardInsights,
      debts,
      debtComparison.recommended,
    ],
  )

  const parsedPaydayAmount = Math.max(0, Number(paydayAmount) || 0)
  const parsedAffordAmount = Math.max(0, Number(affordAmount) || 0)

  const paydayPlan = useMemo(
    () =>
      getPaydayAllocationPlan({
        income: parsedPaydayAmount,
        totalCash,
        recurringTotal,
        creditCardInsights,
        debts,
        debtPlan: debtComparison.recommended,
      }),
    [parsedPaydayAmount, totalCash, recurringTotal, creditCardInsights, debts, debtComparison.recommended],
  )

  const affordabilityResult = useMemo(
    () =>
      getAffordabilityResult({
        amount: parsedAffordAmount,
        totalCash,
        recurringTotal,
        creditCardInsights,
        debts,
      }),
    [parsedAffordAmount, totalCash, recurringTotal, creditCardInsights, debts],
  )

  const forecastLowPoint = forecastData.reduce(
    (lowest, point) => (point.balance < lowest.balance ? point : lowest),
    forecastData[0],
  )

  const sectionCards: Array<{
    key: InsightSectionKey
    label: string
    value: string
    detail: string
  }> = [
    {
      key: 'overview',
      label: 'Overview',
      value: `${healthSummary.score}/100`,
      detail: healthSummary.status,
    },
    {
      key: 'cashflow',
      label: 'Cashflow',
      value: peso.format(forecastLowPoint.balance),
      detail: `Lowest on ${forecastLowPoint.day}`,
    },
    {
      key: 'budget',
      label: 'Budget',
      value: `${Math.min(budgetUsage, 999)}%`,
      detail: budgetRemaining >= 0 ? `${peso.format(budgetRemaining)} left` : `${peso.format(Math.abs(budgetRemaining))} over`,
    },
    {
      key: 'debt',
      label: 'Debt',
      value: monthsToText(debtComparison.recommended.months),
      detail: debtComparison.recommended.focusName,
    },
    {
      key: 'tools',
      label: 'AI Tools',
      value: '2',
      detail: 'Payday + afford',
    },
    {
      key: 'actions',
      label: 'Actions',
      value: String(smartInsights.length),
      detail: 'Smart next steps',
    },
  ]

  return (
    <>
      <FinancialHealthCard summary={healthSummary} netWorth={netWorth} />

      <section className="insights-section-switcher" aria-label="Insights sections">
        {sectionCards.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`insights-section-card ${activeSection === item.key ? 'active' : ''}`}
            onClick={() => setActiveSection(item.key)}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </button>
        ))}
      </section>

      {activeSection === 'overview' && (
        <>
          <section className="analysis-grid compact-insight-metrics">
            <InfoCard label="Total Cash" value={peso.format(totalCash)} />
            <InfoCard label="Savings" value={peso.format(totalSavings)} />
            <InfoCard label="Total Debt" value={peso.format(totalDebt)} />
            <InfoCard label="Net Worth" value={peso.format(netWorth)} />
          </section>

          <section className="insight-card ai-insight-card compact-ai-card">
            <p>AI Cashflow Insight</p>
            <h3>
              {forecastLowPoint.balance < recurringTotal
                ? `Cash may get tight around ${forecastLowPoint.day}.`
                : netCashflow >= 0
                  ? 'Your current cashflow is stable.'
                  : 'Expenses are moving faster than income.'}
            </h3>
            <span>
              Lowest projected balance in the next 30 days is {peso.format(forecastLowPoint.balance)}.
            </span>
          </section>

          <div className="smart-insight-list compact-smart-list">
            {smartInsights.slice(0, 3).map((item) => (
              <article key={item.title} className={`smart-insight-card ${item.tone}`}>
                <p>{item.label}</p>
                <h3>{item.title}</h3>
                <span>{item.message}</span>
              </article>
            ))}
          </div>

          <section style={previewCardStyle}>
            <p>Review income, expenses, transfers, savings movements, and payments.</p>
            <button type="button" style={textLinkButtonStyle} onClick={onOpenTransactions}>
              Open transaction history
            </button>
          </section>
        </>
      )}

      {activeSection === 'cashflow' && (
        <>
          <SectionTitle title="Cashflow Forecast" subtitle="Projected balance for the next 30 days based on known payables" />

          <ChartCard
            title="Projected cash balance"
            subtitle="Watch the low points before paying extra debt or spending on wants."
          >
            <ResponsiveContainer width="100%" height={208}>
              <LineChart data={forecastData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 113, 108, 0.18)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8a857d' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={46}
                  tick={{ fontSize: 10, fill: '#8a857d' }}
                  tickFormatter={(value) => compactPeso(Number(value))}
                />
                <Tooltip formatter={(value) => peso.format(Number(value))} labelFormatter={(label) => `Date: ${label}`} />
                <Line type="monotone" dataKey="balance" stroke="#2f7d5a" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}

      {activeSection === 'budget' && (
        <>
          <SectionTitle title="Budget Intelligence" subtitle="Switch between category usage and spending mix" />

          <div className="insight-chart-toggle" role="group" aria-label="Budget chart view">
            <button
              type="button"
              className={budgetView === 'usage' ? 'active' : ''}
              onClick={() => setBudgetView('usage')}
            >
              Budget usage
            </button>
            <button
              type="button"
              className={budgetView === 'mix' ? 'active' : ''}
              onClick={() => setBudgetView('mix')}
            >
              Spending mix
            </button>
          </div>

          {budgetView === 'usage' ? (
            <ChartCard title="Budget used by category" subtitle={`${overBudgetCount} categor${overBudgetCount === 1 ? 'y is' : 'ies are'} over budget.`}>
              <ResponsiveContainer width="100%" height={238}>
                <BarChart data={budgetChartData} layout="vertical" margin={{ top: 4, right: 10, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(120, 113, 108, 0.16)" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={92}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#6f685f' }}
                  />
                  <Tooltip formatter={(value) => peso.format(Number(value))} />
                  <Bar dataKey="limit" name="Budget" fill="rgba(47, 125, 90, 0.16)" radius={[0, 12, 12, 0]} />
                  <Bar dataKey="spent" name="Spent" fill="#2f7d5a" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : (
            <ChartCard title="Spending mix" subtitle="This month’s recorded expenses by category.">
              {spendingMixData.length > 0 ? (
                <ResponsiveContainer width="100%" height={218}>
                  <PieChart>
                    <Pie
                      data={spendingMixData}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={54}
                      outerRadius={84}
                      paddingAngle={3}
                    >
                      {spendingMixData.map((item, index) => (
                        <Cell key={item.category} fill={spendingMixColors[index % spendingMixColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => peso.format(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyInsightState title="No expense mix yet" message="Add categorized expenses to see where your money is going." />
              )}
            </ChartCard>
          )}
        </>
      )}

      {activeSection === 'debt' && (
        <>
          <SectionTitle title="Debt Freedom Coach" subtitle="Pay all minimums before directing extra money to your focus debt" />

          <section className="minimum-summary-card" aria-label="Required minimum payments">
            <div className="minimum-summary-heading">
              <div>
                <p>Minimum Payment Check</p>
                <h3>{peso.format(minimumTotal)} <span>{missingMinimumCards.length ? 'known minimums' : 'still required'}</span></h3>
              </div>
              <span className={reserveShortfall > 0 || missingMinimumCards.length > 0 ? 'minimum-status-risk' : 'minimum-status-ok'}>
                {reserveShortfall > 0 ? 'Cash shortfall' : missingMinimumCards.length > 0 ? 'Needs minimums' : 'Covered by cash'}
              </span>
            </div>
            <div className="minimum-summary-grid">
              <div><span>Credit cards</span><strong>{peso.format(creditCardMinimums)}</strong></div>
              <div><span>Loans / debts</span><strong>{peso.format(loanMinimums)}</strong></div>
              <div><span>Unpaid bills</span><strong>{peso.format(recurringTotal)}</strong></div>
            </div>
            <p className={reserveShortfall > 0 || missingMinimumCards.length > 0 ? 'minimum-warning' : 'minimum-footnote'}>
              {missingMinimumCards.length > 0
                ? `Enter the actual minimum due for ${missingMinimumCards.length} card${missingMinimumCards.length > 1 ? 's' : ''} in Wallet. Totals are incomplete until then.${reserveShortfall > 0 ? ` Tracked cash is already ${peso.format(reserveShortfall)} short of known bills and minimums.` : ''}`
                : reserveShortfall > 0
                  ? `Current cash is ${peso.format(reserveShortfall)} short of bills and required minimums. Prioritize due dates; avoid allocating extra debt payments until covered.`
                  : `${peso.format(Math.max(0, totalCash - mandatoryReserve))} remains after reserving unpaid bills and debt minimums from current cash.`}
            </p>
            {creditCardInsights.length > 0 && (
              <div className="minimum-card-list">
                {creditCardInsights.map(({ card }) => (
                  <div key={card.id}>
                    <span>{card.name}</span>
                    <strong>{typeof card.minimumDue === 'number' && Number.isFinite(card.minimumDue) ? peso.format(getCreditCardMinimumPayment(card)) : 'Not entered'}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="debt-coach-card compact-debt-coach-card">
            <div className="debt-coach-header">
              <div>
                <p>Recommended Strategy</p>
                <h3>{debtComparison.recommended.method}</h3>
                <span>{debtComparison.recommended.reason}</span>
              </div>
              <strong>{monthsToText(debtComparison.recommended.months)}</strong>
            </div>

            <label className="extra-payment-field">
              <span>Extra debt payment per month</span>
              <input
                type="number"
                min="0"
                step="500"
                value={extraPayment}
                onChange={(event) => setExtraPayment(Math.max(0, Number(event.target.value) || 0))}
              />
            </label>

            <div className="debt-plan-grid compact-debt-plan-grid">
              <DebtPlanMiniCard plan={debtComparison.avalanche} />
              <DebtPlanMiniCard plan={debtComparison.snowball} />
              <DebtPlanMiniCard plan={debtComparison.hybrid} />
            </div>

            <div className="debt-focus-card">
              <span>Focus payment first</span>
              <strong>{debtComparison.recommended.focusName}</strong>
              <p>
                Estimated debt-free date: {getDebtFreeDateLabel(debtComparison.recommended.months)} · Estimated interest saved: {peso.format(debtComparison.interestSaved)}
              </p>
            </div>
          </section>

          <p className="minimum-field-help">Debt forecasts estimate future payment cycles; bank minimums and interest rates may change. Installment balances imported from an SOA are tracked as future exposure and are not added to this month's card minimum.</p>
          <ChartCard title="Debt-free projection" subtitle="Illustrative balance projection using the recommended strategy.">
            {debtComparison.recommended.schedule.length > 0 ? (
              <ResponsiveContainer width="100%" height={208}>
                <LineChart data={debtComparison.recommended.schedule} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 113, 108, 0.18)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8a857d' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={46}
                    tick={{ fontSize: 10, fill: '#8a857d' }}
                    tickFormatter={(value) => compactPeso(Number(value))}
                  />
                  <Tooltip formatter={(value) => peso.format(Number(value))} />
                  <Line type="monotone" dataKey="balance" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyInsightState title="No active debt" message="Add credit cards or debts to generate a payoff plan." />
            )}
          </ChartCard>
        </>
      )}

      {activeSection === 'tools' && (
        <>
          <SectionTitle title="AI Money Tools" subtitle="Plan the next payday and check purchases before spending" />

          <PaydayAllocationTool
            amount={paydayAmount}
            onAmountChange={setPaydayAmount}
            plan={paydayPlan}
          />

          <AffordabilityTool
            amount={affordAmount}
            onAmountChange={setAffordAmount}
            result={affordabilityResult}
          />
        </>
      )}

      {activeSection === 'actions' && (
        <>
          <SectionTitle title="Smart Action Cards" subtitle="Practical next steps based on your local data" />

          <div className="smart-insight-list compact-smart-list">
            {smartInsights.map((item) => (
              <article key={item.title} className={`smart-insight-card ${item.tone}`}>
                <p>{item.label}</p>
                <h3>{item.title}</h3>
                <span>{item.message}</span>
              </article>
            ))}
          </div>

          <section style={previewCardStyle}>
            <p>Review income, expenses, transfers, savings movements, and payments.</p>
            <button type="button" style={textLinkButtonStyle} onClick={onOpenTransactions}>
              Open transaction history
            </button>
          </section>
        </>
      )}
    </>
  )
}

function FinancialHealthCard({ summary, netWorth }: { summary: FinancialHealthSummary; netWorth: number }) {
  return (
    <section className={`financial-health-card ${summary.tone}`}>
      <div className="health-score-ring">
        <strong>{summary.score}</strong>
        <span>/100</span>
      </div>

      <div>
        <p>Financial Health</p>
        <h3>{summary.status}</h3>
        <span>{summary.message}</span>
        <small>Net worth: {peso.format(netWorth)}</small>
      </div>
    </section>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="insights-chart-card">
      <header>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>
      {children}
    </section>
  )
}

function EmptyInsightState({ title, message }: { title: string; message: string }) {
  return (
    <div className="empty-insight-state">
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  )
}

function DebtPlanMiniCard({ plan }: { plan: DebtPayoffPlan }) {
  return (
    <article className="debt-plan-mini-card">
      <span>{plan.method}</span>
      <strong>{monthsToText(plan.months)}</strong>
      <p>{peso.format(plan.totalInterest)} interest</p>
    </article>
  )
}

function PaydayAllocationTool({
  amount,
  onAmountChange,
  plan,
}: {
  amount: string
  onAmountChange: (value: string) => void
  plan: PaydayAllocationPlan
}) {
  const rows = [
    { label: 'Unpaid bills reserve', value: plan.bills },
    { label: 'Credit card payment', value: plan.creditCards },
    { label: 'Loan / installment payment', value: plan.loanDebts },
    { label: 'Savings buffer', value: plan.savings },
    { label: 'Flexible cash', value: plan.flexibleCash },
  ]

  return (
    <section className={`ai-money-tool-card ${plan.tone}`}>
      <header>
        <div>
          <p>Payday Allocation</p>
          <h3>Where should the next income go?</h3>
        </div>
        <strong>{peso.format(plan.income)}</strong>
      </header>

      <label className="ai-tool-input-row">
        <span>Income amount</span>
        <input
          type="number"
          min="0"
          step="500"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          placeholder="10000"
        />
      </label>

      <div className="allocation-list">
        {rows.map((row) => (
          <article key={row.label} className="allocation-row">
            <span>{row.label}</span>
            <strong>{peso.format(row.value)}</strong>
          </article>
        ))}
      </div>

      <div className="ai-tool-result">
        <span>Suggested focus</span>
        <strong>{plan.focusName}</strong>
        <p>{plan.message}</p>
      </div>
    </section>
  )
}

function AffordabilityTool({
  amount,
  onAmountChange,
  result,
}: {
  amount: string
  onAmountChange: (value: string) => void
  result: AffordabilityResult
}) {
  return (
    <section className={`ai-money-tool-card ${result.tone}`}>
      <header>
        <div>
          <p>Can I Afford This?</p>
          <h3>Check before spending</h3>
        </div>
        <strong>{result.status}</strong>
      </header>

      <label className="ai-tool-input-row">
        <span>Purchase amount</span>
        <input
          type="number"
          min="0"
          step="100"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          placeholder="3500"
        />
      </label>

      <div className="affordability-result-grid">
        <article>
          <span>Cash after purchase</span>
          <strong>{peso.format(result.remainingCash)}</strong>
        </article>
        <article>
          <span>Payment advice</span>
          <strong>{result.paymentAdvice}</strong>
        </article>
      </div>

      <div className="ai-tool-result">
        <span>Due₱oint check</span>
        <p>{result.message}</p>
      </div>
    </section>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <article className="account-card">
      <div className={`account-icon ${getTransactionAccent(transaction.type)}`}>
        {transaction.type === 'income' && <ArrowDownLeft size={21} />}
        {transaction.type === 'expense' && <ArrowUpRight size={21} />}
        {transaction.type === 'transfer' && <ArrowRightLeft size={21} />}
      </div>

      <div className="card-main-content">
        <h3>{transaction.label}</h3>
        <p>
          {transaction.accountLabel} · {transaction.category ?? 'No category'} · {formatShortDate(transaction.createdAt)}
        </p>
      </div>

      <strong>
        {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
        {peso.format(transaction.amount)}
      </strong>
    </article>
  )
}

function TransactionHistoryModal({
  transactions,
  onClose,
  onClear,
}: {
  transactions: Transaction[]
  onClose: () => void
  onClear: () => void
}) {
  const [filter, setFilter] = useState<TransactionFilter>('all')
  const [query, setQuery] = useState('')

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return transactions.filter((transaction) => {
      const matchesType = filter === 'all' || transaction.type === filter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        transaction.label.toLowerCase().includes(normalizedQuery) ||
        transaction.accountLabel.toLowerCase().includes(normalizedQuery) ||
        transaction.type.toLowerCase().includes(normalizedQuery) ||
        transaction.category?.toLowerCase().includes(normalizedQuery)

      return matchesType && matchesQuery
    })
  }, [transactions, filter, query])

  const incomeTotal = filteredTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const expenseTotal = filteredTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const transferTotal = filteredTransactions
    .filter((transaction) => transaction.type === 'transfer')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const netTotal = incomeTotal - expenseTotal

  return (
    <div style={historyBackdropStyle}>
      <section className="transaction-history-panel" style={historyPanelStyle}>
        <header style={historyHeaderStyle}>
          <div>
            <p style={modalEyebrowStyle}>Transactions</p>
            <h2 style={modalTitleStyle}>History</h2>
          </div>

          <button type="button" style={modalCloseButtonStyle} onClick={onClose}>
            <X size={21} />
          </button>
        </header>

        <section className="history-summary-grid" style={historySummaryGridStyle}>
          <HistoryMetric label="Income" value={peso.format(incomeTotal)} />
          <HistoryMetric label="Expenses" value={peso.format(expenseTotal)} />
          <HistoryMetric label="Transfers" value={peso.format(transferTotal)} />
          <HistoryMetric label="Net" value={peso.format(netTotal)} />
        </section>

        <label className="history-search-wrap" style={historySearchWrapStyle}>
          <Search size={17} />
          <input
            className="history-search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search note, account, bill, category..."
            style={historySearchInputStyle}
          />
          {query.trim().length > 0 && (
            <button
              type="button"
              className="history-search-clear"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </label>

        <div className="history-actions-row">
          <span>{filteredTransactions.length} shown</span>
          <button
            type="button"
            className="history-clear-button"
            onClick={onClear}
            disabled={transactions.length === 0}
          >
            <Trash2 size={15} />
            Clear History
          </button>
        </div>

        <div style={historyFilterGridStyle}>
          {(['all', 'income', 'expense', 'transfer'] as TransactionFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              style={historyFilterButtonStyle(filter === item)}
              onClick={() => setFilter(item)}
            >
              {capitalize(item)}
            </button>
          ))}
        </div>

        <div style={historyListStyle}>
          {filteredTransactions.length === 0 && (
            <article className="account-card">
              <div className="card-main-content">
                <h3>No matching transactions</h3>
                <p>Try changing the filter or search keyword.</p>
              </div>
            </article>
          )}

          {filteredTransactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </section>
    </div>
  )
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="history-metric" style={historyMetricStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function QuickActionModal({
  action,
  accounts,
  creditCards,
  expenseCategories,
  onClose,
  onAddIncome,
  onAddExpense,
  onTransfer,
  onNotify,
}: {
  action: QuickAction
  accounts: Account[]
  creditCards: CreditCardAccount[]
  expenseCategories: BudgetCategory[]
  onClose: () => void
  onAddIncome: (accountId: number, amount: number, note: string) => void
  onAddExpense: (paymentSource: string, amount: number, note: string, category: BudgetCategory) => void
  onTransfer: (sourceAccountId: number, destinationAccountId: number, amount: number, note: string) => void
  onNotify: (title: string, message: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<BudgetCategory>(expenseCategories[0] ?? 'Other')
  const [incomeAccountId, setIncomeAccountId] = useState(accounts[0]?.id.toString() ?? '')
  const [paymentSource, setPaymentSource] = useState(accounts[0] ? `account:${accounts[0].id}` : '')
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id.toString() ?? '')
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id.toString() ?? accounts[0]?.id.toString() ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      onNotify('Invalid Amount', 'Please enter a valid amount.')
      return
    }

    if (action === 'income') {
      onAddIncome(Number(incomeAccountId), parsedAmount, note.trim())
      return
    }

    if (action === 'expense') {
      onAddExpense(paymentSource, parsedAmount, note.trim(), category)
      return
    }

    onTransfer(Number(sourceAccountId), Number(destinationAccountId), parsedAmount, note.trim())
  }

  return (
    <ModalShell eyebrow="Quick Action" title={action === 'income' ? 'Add Income' : action === 'expense' ? 'Add Expense' : 'Transfer Money'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={modalFormStyle}>
        <TextField label="Amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" autoFocus />

        {action === 'income' && (
          <SelectField label="Deposit to" value={incomeAccountId} onChange={setIncomeAccountId}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {peso.format(account.balance)}
              </option>
            ))}
          </SelectField>
        )}

        {action === 'expense' && (
          <>
            <SelectField label="Category" value={category} onChange={(value) => setCategory(value as BudgetCategory)}>
              {expenseCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>

            <SelectField label="Payment method" value={paymentSource} onChange={setPaymentSource}>
              <optgroup label="Cash Accounts">
                {accounts.map((account) => (
                  <option key={account.id} value={`account:${account.id}`}>
                    {account.name} · {peso.format(account.balance)}
                  </option>
                ))}
              </optgroup>

              <optgroup label="Credit Cards">
                {creditCards.map((card) => (
                  <option key={card.id} value={`card:${card.id}`}>
                    {card.name} · Available {peso.format(card.creditLimit - card.currentBalance)}
                  </option>
                ))}
              </optgroup>
            </SelectField>
          </>
        )}

        {action === 'transfer' && (
          <>
            <SelectField label="From" value={sourceAccountId} onChange={setSourceAccountId}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {peso.format(account.balance)}
                </option>
              ))}
            </SelectField>

            <SelectField label="To" value={destinationAccountId} onChange={setDestinationAccountId}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </SelectField>
          </>
        )}

        <TextField label="Note" value={note} onChange={setNote} placeholder="Optional note" />

        <button type="submit" style={submitButtonStyle}>Save</button>
      </form>
    </ModalShell>
  )
}

function AccountEditorModal({
  account,
  onClose,
  onSave,
  onNotify,
}: {
  account?: Account
  onClose: () => void
  onSave: (account: Omit<Account, 'id'>, id?: number) => void
  onNotify: (title: string, message: string) => void
}) {
  const [name, setName] = useState(account?.name ?? '')
  const [type, setType] = useState(account?.type ?? 'Bank Account')
  const [balance, setBalance] = useState(account?.balance.toString() ?? '')
  const [accent, setAccent] = useState<AccountAccent>(account?.accent ?? 'blue')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedBalance = Number(balance)

    if (!name.trim()) return onNotify('Account Name Required', 'Please enter an account name.')
    if (!Number.isFinite(parsedBalance) || parsedBalance < 0) return onNotify('Invalid Balance', 'Please enter a valid balance.')

    onSave({ name: name.trim(), type, balance: parsedBalance, accent }, account?.id)
  }

  return (
    <ModalShell eyebrow="Account" title={account ? 'Edit Account' : 'Add Account'} onClose={onClose}>
      <form onSubmit={submit} style={modalFormStyle}>
        <TextField label="Account name" value={name} onChange={setName} placeholder="Example: BDO Savings" autoFocus />
        <SelectField label="Type" value={type} onChange={setType}>
          <option>Cash</option>
          <option>Bank Account</option>
          <option>E-Wallet</option>
          <option>Savings Account</option>
        </SelectField>
        <TextField label="Current balance" type="number" value={balance} onChange={setBalance} placeholder="0.00" />
        <SelectField label="Color" value={accent} onChange={(value) => setAccent(value as AccountAccent)}>
          <option value="green">Green</option>
          <option value="blue">Blue</option>
          <option value="teal">Teal</option>
        </SelectField>
        <button type="submit" style={submitButtonStyle}>Save Account</button>
      </form>
    </ModalShell>
  )
}


const duewiseLegacySoaParserReferences = [
  DEFAULT_SOA_BIRTHDATE,
  getStatementPasswordCandidatePreview,
  extractPdfTextWithAutoPassword,
  parseCreditCardStatement,
]

void duewiseLegacySoaParserReferences


function StatementImportModal({
  creditCards,
  debts,
  onClose,
  onSave,
  onNotify,
}: {
  creditCards: CreditCardAccount[]
  debts: Debt[]
  onClose: () => void
  onSave: (payload: StatementImportSavePayload) => void
  onNotify: (title: string, message: string) => void
}) {
  const firstCard = creditCards[0]
  const [selectedCardId, setSelectedCardId] = useState(firstCard ? firstCard.id.toString() : 'new')
  const selectedCard = creditCards.find((card) => card.id.toString() === selectedCardId)

  const [cardName, setCardName] = useState(firstCard?.name ?? '')
  const [statementDate, setStatementDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [previousBalance, setPreviousBalance] = useState('')
  const [paymentsMade, setPaymentsMade] = useState('')
  const [currentCharges, setCurrentCharges] = useState('')
  const [currentInstallmentDue, setCurrentInstallmentDue] = useState('')
  const [otherFees, setOtherFees] = useState('')
  const [actualStatementBalance, setActualStatementBalance] = useState('')
  const [minimumAmountDue, setMinimumAmountDue] = useState('')
  const [creditLimit, setCreditLimit] = useState(firstCard?.creditLimit ? firstCard.creditLimit.toString() : '')
  const [financeCharge, setFinanceCharge] = useState('')
  const [annualRate, setAnnualRate] = useState(Math.round((firstCard?.annualRate ?? 0.36) * 100).toString())
  const [installments, setInstallments] = useState<StatementInstallmentDraft[]>([])
  const moduleOrder = ['overview', 'balance', 'payment', 'installments', 'preview'] as const
  type ManualSoaModuleKey = (typeof moduleOrder)[number]
  const [activeModule, setActiveModule] = useState<ManualSoaModuleKey>('overview')

  const computedStatementBalance = Math.max(
    parseMoneyValue(previousBalance) -
      parseMoneyValue(paymentsMade) +
      parseMoneyValue(currentCharges) +
      parseMoneyValue(currentInstallmentDue) +
      parseMoneyValue(financeCharge) +
      parseMoneyValue(otherFees),
    0,
  )
  const actualBalance = parseMoneyValue(actualStatementBalance)
  const hasBreakdown = [previousBalance, paymentsMade, currentCharges, currentInstallmentDue, financeCharge, otherFees].some((value) => value.trim() !== '')
  const statementBalance = actualBalance > 0 ? actualBalance : computedStatementBalance
  const balanceDifference = actualBalance > 0 && hasBreakdown ? actualBalance - computedStatementBalance : 0

  const moduleLabels: Record<ManualSoaModuleKey, string> = {
    overview: 'Card',
    balance: 'Balance',
    payment: 'Payment',
    installments: 'Plans',
    preview: 'Review',
  }

  const moduleMeta: Record<ManualSoaModuleKey, { title: string; subtitle: string }> = {
    overview: {
      title: 'Card and due dates',
      subtitle: 'Choose the credit card, statement date, and payment due date.',
    },
    balance: {
      title: 'Balance builder',
      subtitle: 'Build the new balance from previous balance, payment, new charges, installment, and fees.',
    },
    payment: {
      title: 'Payment requirement',
      subtitle: 'Encode the minimum due, card limit, and APR for debt prioritization.',
    },
    installments: {
      title: 'Future installment plans',
      subtitle: 'Add only active installment plans that still have remaining balances.',
    },
    preview: {
      title: 'Review and save',
      subtitle: 'Check the payment requirement, total exposure, and avalanche recommendation.',
    },
  }

  const activeModuleIndex = moduleOrder.indexOf(activeModule)
  const progressPercent = ((activeModuleIndex + 1) / moduleOrder.length) * 100

  function goToNextModule() {
    const nextModule = moduleOrder[Math.min(activeModuleIndex + 1, moduleOrder.length - 1)]
    setActiveModule(nextModule)
  }

  function goToPreviousModule() {
    const previousModule = moduleOrder[Math.max(activeModuleIndex - 1, 0)]
    setActiveModule(previousModule)
  }

  function handleCardChange(value: string) {
    setSelectedCardId(value)

    if (value === 'new') {
      setCardName('')
      setPreviousBalance('')
      setActualStatementBalance('')
      setCreditLimit('')
      setAnnualRate('36')
      return
    }

    const card = creditCards.find((item) => item.id.toString() === value)
    if (!card) return

    setCardName(card.name)
    setPreviousBalance('')
    setActualStatementBalance('')
    setCreditLimit(card.creditLimit > 0 ? card.creditLimit.toString() : '')
    setAnnualRate(Math.round((card.annualRate ?? 0.36) * 100).toString())
  }

  function addInstallment() {
    setInstallments((current) => [
      ...current,
      {
        id: createId(),
        description: '',
        monthlyAmount: 0,
        remainingBalance: 0,
        monthsRemaining: 1,
        annualRate: 0,
        confidence: 'High',
      },
    ])
  }

  function removeInstallment(index: number) {
    setInstallments((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  function updateInstallment(index: number, field: keyof StatementInstallmentDraft, value: string) {
    setInstallments((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item

        if (field === 'description') {
          return {
            ...item,
            description: value,
          }
        }

        if (field === 'monthsRemaining') {
          return {
            ...item,
            monthsRemaining: Math.max(1, Math.round(parseMoneyValue(value))),
          }
        }

        if (field === 'annualRate') {
          return {
            ...item,
            annualRate: Math.max(parseMoneyValue(value), 0) / 100,
          }
        }

        if (field === 'monthlyAmount' || field === 'remainingBalance') {
          return {
            ...item,
            [field]: Math.max(parseMoneyValue(value), 0),
          }
        }

        return item
      }),
    )
  }

  function buildManualDraft(): StatementImportDraft {
    const cleanInstallments = installments
      .map((installment) => ({
        ...installment,
        description: installment.description.trim() || 'Manual installment',
        monthlyAmount: Math.max(installment.monthlyAmount, 0),
        remainingBalance: installment.remainingBalance > 0
          ? installment.remainingBalance
          : installment.monthlyAmount * Math.max(installment.monthsRemaining, 1),
        monthsRemaining: Math.max(installment.monthsRemaining, 1),
        annualRate: Math.max(installment.annualRate, 0),
        confidence: 'High' as const,
      }))
      .filter((installment) => installment.monthlyAmount > 0 || installment.remainingBalance > 0)

    const balanceBreakdown = [
      `Previous balance: ${formatStatementAmount(parseMoneyValue(previousBalance))}`,
      `Less payments/credits made: ${formatStatementAmount(parseMoneyValue(paymentsMade))}`,
      `Current purchases/charges: ${formatStatementAmount(parseMoneyValue(currentCharges))}`,
      `Current installment billed: ${formatStatementAmount(parseMoneyValue(currentInstallmentDue))}`,
      `Finance charge/interest: ${formatStatementAmount(parseMoneyValue(financeCharge))}`,
      `Other fees/adjustments: ${formatStatementAmount(parseMoneyValue(otherFees))}`,
      `Computed new balance: ${formatStatementAmount(computedStatementBalance)}`,
    ]

    if (actualBalance > 0) {
      balanceBreakdown.push(`Actual SOA new balance used: ${formatStatementAmount(actualBalance)}`)
    }

    if (Math.abs(balanceDifference) >= 1) {
      balanceBreakdown.push(`Difference between actual and computed balance: ${formatStatementAmount(balanceDifference)}`)
    }

    return {
      fileName: 'Manual SOA Entry',
      rawText: '',
      cardName: selectedCard?.name ?? cardName.trim(),
      statementDate,
      dueDate,
      totalAmountDue: statementBalance,
      minimumAmountDue: Math.max(parseMoneyValue(minimumAmountDue), 0),
      outstandingBalance: statementBalance,
      creditLimit: Math.max(parseMoneyValue(creditLimit), statementBalance, 0),
      financeCharge: Math.max(parseMoneyValue(financeCharge), 0),
      annualRate: Math.max(parseMoneyValue(annualRate), 0) / 100,
      installments: cleanInstallments,
      notes: [
        'Manual SOA entry used. No PDF capture was applied.',
        'Previous balance is for calculation/reference only. Due₱oint saves the New Balance / Total Amount Due as the active card balance.',
        ...balanceBreakdown,
      ],
    }
  }

  const previewDraft = buildManualDraft()
  const statementComponents = buildStatementDebtComponents(previewDraft)
  const validationWarnings = getStatementValidationWarnings(previewDraft)
  const balanceWarnings = Math.abs(balanceDifference) >= 1
    ? [
        `Actual SOA balance differs from computed balance by ${formatStatementAmount(balanceDifference)}. This may be normal if the SOA has taxes, fees, refunds, or adjustments not encoded.`,
      ]
    : []
  const avalanchePreview = getStatementAvalanchePreview(creditCards, debts, previewDraft)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const draft = buildManualDraft()
    const balance = draft.outstandingBalance || draft.totalAmountDue

    if (!draft.cardName.trim()) {
      setActiveModule('overview')
      return onNotify('Card Required', 'Select an existing card or enter a card name.')
    }

    if (actualBalance <= 0 || balance <= 0) {
      setActiveModule('balance')
      return onNotify('Statement Balance Required', 'Enter the actual New Balance / Total Amount Due printed on your SOA before saving.')
    }

    if (!draft.dueDate) {
      setActiveModule('overview')
      return onNotify('Due Date Required', 'Enter the payment due date from your SOA.')
    }

    if (draft.minimumAmountDue <= 0) {
      setActiveModule('payment')
      return onNotify('Minimum Due Required', 'Enter the minimum amount due printed on your SOA.')
    }

    if (installments.some((item) => (item.monthlyAmount > 0 || item.remainingBalance > 0) && !item.description.trim())) {
      setActiveModule('installments')
      return onNotify('Plan Description Required', 'Name every active installment plan before saving to prevent accidental duplicates.')
    }

    onSave({
      selectedCardId,
      updateCreditCard: true,
      addFinanceCharge: draft.financeCharge > 0,
      addInstallments: draft.installments.length > 0,
      draft,
    })
  }

  return (
    <ModalShell eyebrow="Manual SOA" title="Add Statement" onClose={onClose}>
      <form className="manual-soa-clean-form" onSubmit={submit} style={modalFormStyle}>
        <section className="soa-clean-top-card">
          <div className="soa-clean-progress-copy">
            <span>Step {activeModuleIndex + 1} of {moduleOrder.length}</span>
            <h3>{moduleMeta[activeModule].title}</h3>

          </div>


          <div className="soa-clean-progress-track">
            <i style={{ width: `${progressPercent}%` }} />
          </div>
        </section>

        <nav className="soa-clean-stepper" aria-label="Manual SOA modules">
          {moduleOrder.map((moduleKey, index) => (
            <button
              key={moduleKey}
              type="button"
              className={activeModule === moduleKey ? 'active' : ''}
              onClick={() => setActiveModule(moduleKey)}
            >
              <span>{index + 1}</span>
              <strong>{moduleLabels[moduleKey]}</strong>
            </button>
          ))}
        </nav>


        {activeModule === 'overview' && (
          <section className="soa-clean-panel">
            <div className="soa-clean-panel-title">
              <h3>Card details</h3>
              <p>Start here. This keeps the entry connected to the correct card.</p>
            </div>

            <SelectField label="Credit card" value={selectedCardId} onChange={handleCardChange}>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id.toString()}>
                  {card.name}
                </option>
              ))}
              <option value="new">New card</option>
            </SelectField>

            {selectedCardId === 'new' && (
              <TextField
                label="Card name"
                value={cardName}
                onChange={setCardName}
                placeholder="Example: UnionBank Mastercard"
              />
            )}

            <div className="soa-clean-grid">
              <TextField label="Statement date" type="date" value={statementDate} onChange={setStatementDate} />
              <TextField label="Due date" type="date" value={dueDate} onChange={setDueDate} />
            </div>

            <article className="soa-clean-helper">
              <strong>Rule</strong>
              <p>Enter the statement amount printed by the bank. The previous balance is for reference, not another payment.</p>
            </article>
          </section>
        )}

        {activeModule === 'balance' && (
          <section className="soa-clean-panel">
            <div className="soa-clean-panel-title">
              <h3>Balance builder</h3>
              <p>Enter the exact new balance printed by your bank. The optional breakdown helps double-check it.</p>
            </div>

            <div className="dp-primary-amount">
              <MoneyField
                label="New Balance / Total Amount Due (from SOA)"
                value={actualStatementBalance}
                onChange={setActualStatementBalance}
                placeholder="0.00"
              />
              <p>This is the amount Due₱oint will save as the card balance. The bank's printed figure takes priority.</p>
            </div>

            <details className="dp-reconcile">
              <summary>Reconcile statement breakdown <span>Optional</span></summary>
              <div className="soa-clean-grid">
                <MoneyField label="Previous Balance" value={previousBalance} onChange={setPreviousBalance} />
                <MoneyField label="Payments / Credits" value={paymentsMade} onChange={setPaymentsMade} />
                <MoneyField label="Current Purchases / Charges" value={currentCharges} onChange={setCurrentCharges} />
                <MoneyField label="Current Installment Billed" value={currentInstallmentDue} onChange={setCurrentInstallmentDue} />
                <MoneyField label="Finance Charge / Interest" value={financeCharge} onChange={setFinanceCharge} />
                <MoneyField label="Other Fees / Adjustments" value={otherFees} onChange={setOtherFees} />
              </div>
              <div className="dp-reconcile-total">
                <span>Calculated from breakdown</span>
                <strong>{formatStatementAmount(computedStatementBalance)}</strong>
              </div>
              {hasBreakdown && Math.abs(balanceDifference) >= 0.01 && (
                <p className="dp-difference-note">Difference: {formatStatementAmount(balanceDifference)}. Check taxes, refunds, or adjustments.</p>
              )}
            </details>
            <div className="dp-current-balance"><span>Current card balance to save</span><strong>{formatStatementAmount(statementBalance)}</strong></div>
          </section>
        )}

        {activeModule === 'payment' && (
          <section className="soa-clean-panel">
            <div className="soa-clean-panel-title">
              <h3>Payment requirement</h3>
              <p>Minimum due is your must-pay amount. APR helps Due₱oint prioritize extra payments.</p>
            </div>

            <div className="soa-clean-grid">
              <MoneyField
                label="Minimum Amount Due"
                value={minimumAmountDue}
                onChange={setMinimumAmountDue}
                placeholder="0.00"
              />
              <MoneyField
                label="Credit Limit"
                value={creditLimit}
                onChange={setCreditLimit}
                placeholder="0.00"
              />
              <TextField
                label="Card APR %"
                type="number"
                value={annualRate}
                onChange={setAnnualRate}
                placeholder="36"
              />
            </div>

            <article className="soa-clean-focus-card">
              <span>Required this month</span>
              <strong>{formatStatementAmount(avalanchePreview.requiredThisMonth)}</strong>
              <p>From the bank’s minimum amount due. Billed installments are already reflected in the SOA.</p>
            </article>
          </section>
        )}

        {activeModule === 'installments' && (
          <section className="soa-clean-panel">
            <div className="soa-clean-panel-title action-title">
              <div>
                <h3>Future installment plans</h3>
                <p>Add only future UNBILLED installment balance, excluding the amount already included in this statement.</p>
              </div>
              <button type="button" onClick={addInstallment}>
                Add Plan
              </button>
            </div>

            <p className="dp-installment-guidance">Enter the remaining unbilled principal only. If the amount is already included in your SOA New Balance, do not add it again here.</p>
            {installments.length === 0 ? (
              <article className="soa-clean-empty">
                <strong>No future installment plan</strong>
                <p>Skip this module if the card has no active installment balance.</p>
              </article>
            ) : (
              <div className="soa-clean-installment-list">
                {installments.map((installment, index) => (
                  <article key={installment.id} className="soa-clean-installment">
                    <div className="soa-clean-installment-title">
                      <strong>Plan {index + 1}</strong>
                      <button type="button" onClick={() => removeInstallment(index)}>
                        Remove
                      </button>
                    </div>

                    <TextField
                      label="Description"
                      value={installment.description}
                      onChange={(value) => updateInstallment(index, 'description', value)}
                      placeholder="Example: Phone installment"
                    />

                    <div className="soa-clean-grid">
                      <MoneyField
                        label="Future monthly amortization"
                        value={installment.monthlyAmount ? installment.monthlyAmount.toString() : ''}
                        onChange={(value) => updateInstallment(index, 'monthlyAmount', value)}
                        placeholder="0.00"
                      />
                      <TextField
                        label="Months remaining"
                        type="number"
                        value={installment.monthsRemaining.toString()}
                        onChange={(value) => updateInstallment(index, 'monthsRemaining', value)}
                        placeholder="1"
                      />
                      <MoneyField
                        label="Future unbilled balance"
                        value={installment.remainingBalance ? installment.remainingBalance.toString() : ''}
                        onChange={(value) => updateInstallment(index, 'remainingBalance', value)}
                        placeholder="0.00"
                      />
                      <TextField
                        label="Installment APR %"
                        type="number"
                        value={Math.round((installment.annualRate || 0) * 100).toString()}
                        onChange={(value) => updateInstallment(index, 'annualRate', value)}
                        placeholder="0"
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeModule === 'preview' && (
          <section className="soa-clean-panel">
            <div className="soa-clean-panel-title">
              <h3>Final review</h3>
              <p>Only the bank's statement balance is saved as current card debt. Future unbilled plans stay separate.</p>
            </div>

            <article className="dp-final-check">
              <span>Card</span><strong>{selectedCard?.name ?? cardName.trim()}</strong>
              <span>SOA balance</span><strong>{formatStatementAmount(statementBalance)}</strong>
              <span>Minimum due</span><strong>{formatStatementAmount(previewDraft.minimumAmountDue)}</strong>
              <span>Future installment plans</span><strong>{installments.length}</strong>
            </article>
            <section className="soa-clean-review-grid">
              <article>
                <span>Required this month</span>
                <strong>{formatStatementAmount(avalanchePreview.requiredThisMonth)}</strong>
                <p>Statement minimum due only; future installments are tracked separately.</p>
              </article>
              <article>
                <span>Total debt exposure</span>
                <strong>{formatStatementAmount(avalanchePreview.totalDebtExposure)}</strong>
                <p>Cards, debts, and remaining installment balances.</p>
              </article>
              <article className="wide">
                <span>Avalanche focus</span>
                <strong>{avalanchePreview.focusName}</strong>
                <p>{avalanchePreview.focusNote}</p>
              </article>
            </section>

            {[...validationWarnings, ...balanceWarnings].length > 0 && (
              <section className="soa-clean-warning-list">
                {[...validationWarnings, ...balanceWarnings].map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </section>
            )}

            <details className="soa-clean-details">
              <summary>
                <span>Debt components</span>
                <strong>{statementComponents.length}</strong>
              </summary>

              <section className="manual-soa-component-list">
                {statementComponents.map((component) => (
                  <article key={component.id} className={`statement-component-item ${component.priority.toLowerCase()}`}>
                    <div>
                      <span>{component.type === 'revolving' ? 'Current SOA balance' : component.type === 'installment' ? 'Installment' : 'Interest / fee'}</span>
                      <strong>{component.name}</strong>
                      <p>{component.note}</p>
                    </div>
                    <div>
                      <strong>{formatStatementAmount(component.balance)}</strong>
                      <small>{formatStatementAmount(component.monthlyDue)} monthly · {Math.round(component.annualRate * 100)}% APR · {component.priority} priority</small>
                    </div>
                  </article>
                ))}
              </section>
            </details>
          </section>
        )}

        <section className="soa-clean-footer">
          <button type="button" onClick={goToPreviousModule} disabled={activeModuleIndex === 0}>
            Previous
          </button>

          {activeModule !== 'preview' ? (
            <button type="button" className="primary" onClick={goToNextModule}>
              Next step
            </button>
          ) : (
            <button type="submit" className="primary">
              Save statement
            </button>
          )}
        </section>
      </form>
    </ModalShell>
  )
}


function getAutomaticCardDueDate(dueDay: number, statementDate: string, today = new Date()): string {
  if (!isValidDayOfMonth(dueDay)) return ''
  let anchor = startOfDay(today)
  let fromStatement = false
  if (/^\d{4}-\d{2}-\d{2}$/.test(statementDate)) {
    const [year, month, day] = statementDate.split('-').map(Number)
    const candidate = new Date(year, month - 1, day)
    if (candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day) {
      anchor = candidate
      fromStatement = true
    }
  }
  let target = buildDateForDay(anchor.getFullYear(), anchor.getMonth(), dueDay)
  if (fromStatement ? target.getTime() <= anchor.getTime() : target.getTime() < anchor.getTime()) {
    target = buildDateForDay(anchor.getFullYear(), anchor.getMonth() + 1, dueDay)
  }
  const year = target.getFullYear()
  const month = String(target.getMonth() + 1).padStart(2, '0')
  const day = String(target.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatCreditCardDueDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number)
  if (parts.length !== 3 || !parts.every(Number.isFinite)) return 'Set recurring due day'
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  if (date.getFullYear() !== parts[0] || date.getMonth() !== parts[1] - 1 || date.getDate() !== parts[2]) return 'Set recurring due day'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CreditCardEditorModal({
  card,
  installments,
  onClose,
  onSave,
  onNotify,
}: {
  card?: CreditCardAccount
  installments: Debt[]
  onClose: () => void
  onSave: (card: Omit<CreditCardAccount, 'id' | 'lastPaymentAt'>, id?: number, installments?: CardInstallmentInput[]) => void
  onNotify: (title: string, message: string) => void
}) {
  const [name, setName] = useState(card?.name ?? '')
  const [currentBalance, setCurrentBalance] = useState(card?.currentBalance.toString() ?? '')
  const [creditLimit, setCreditLimit] = useState(card?.creditLimit.toString() ?? '')
  const [cutOffDay, setCutOffDay] = useState(card?.cutOffDay.toString() ?? '')
  const [dueDay, setDueDay] = useState(card?.dueDay.toString() ?? '')
  const [statementDate, setStatementDate] = useState(card?.statementDate ?? '')
  const [paymentDueDate, setPaymentDueDate] = useState(card?.paymentDueDate ?? '')
  const [hasBankDueDateOverride, setHasBankDueDateOverride] = useState(() => Boolean(
    card?.paymentDueDate && Number(card.paymentDueDate.slice(-2)) !== card.dueDay,
  ))
  const [minimumDue, setMinimumDue] = useState(card?.minimumDue?.toString() ?? '')
  const [annualRate, setAnnualRate] = useState(
    typeof card?.annualRate === 'number' ? (card.annualRate * 100).toString() : '',
  )
  const [installmentRows, setInstallmentRows] = useState<{ key: string; id?: number; description: string; remainingBalance: string; monthlyAmount: string }[]>(
    installments.map((debt) => ({
      key: `existing-${debt.id}`,
      id: debt.id,
      description: debt.name.startsWith(`${card?.name} - `) ? debt.name.slice(`${card?.name} - `.length) : debt.name,
      remainingBalance: debt.balance.toString(),
      monthlyAmount: debt.monthly.toString(),
    })),
  )

  const recurringDay = Number(dueDay)
  const automaticDueDate = getAutomaticCardDueDate(recurringDay, statementDate)
  const effectiveDueDate = hasBankDueDateOverride ? paymentDueDate : automaticDueDate

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedBalance = Number(currentBalance)
    const parsedLimit = Number(creditLimit)
    const parsedCutOff = Number(cutOffDay)
    const parsedDue = Number(dueDay)
    const parsedMinimum = minimumDue.trim() === '' ? undefined : Number(minimumDue)
    const parsedAnnualRate = annualRate.trim() === '' ? undefined : Number(annualRate)

    if (!name.trim()) return onNotify('Card Name Required', 'Please enter a credit card name.')
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) return onNotify('Invalid Credit Limit', 'Please enter a valid credit limit.')
    if (!Number.isFinite(parsedBalance) || parsedBalance < 0 || parsedBalance > parsedLimit) return onNotify('Invalid Balance', 'Enter the latest outstanding amount, not higher than your credit limit.')
    if (!isValidDayOfMonth(parsedCutOff)) return onNotify('Invalid Cut-off Day', 'Enter a cut-off day from 1 to 31 under Card Settings.')
    if (!isValidDayOfMonth(parsedDue)) return onNotify('Invalid Due Day', 'Enter a recurring due day from 1 to 31 under Card Settings.')
    if (statementDate && !/^\d{4}-\d{2}-\d{2}$/.test(statementDate)) return onNotify('Invalid SOA Date', 'Check the statement date.')
    if (statementDate && formatCreditCardDueDate(statementDate) === 'Set recurring due day') return onNotify('Invalid SOA Date', 'Check the statement date.')
    if (hasBankDueDateOverride && !/^\d{4}-\d{2}-\d{2}$/.test(paymentDueDate)) return onNotify('Invalid Due Date', 'Choose your actual bank due date.')
    if (hasBankDueDateOverride && formatCreditCardDueDate(paymentDueDate) === 'Set recurring due day') return onNotify('Invalid Due Date', 'Choose a valid bank due date.')
    if (statementDate && effectiveDueDate && effectiveDueDate < statementDate) return onNotify('Due Date Before SOA', 'The payment due date cannot be before the statement date.')
    if (parsedMinimum !== undefined && (!Number.isFinite(parsedMinimum) || parsedMinimum < 0 || parsedMinimum > parsedBalance)) {
      return onNotify('Invalid Minimum Due', 'Enter the unpaid minimum from your latest SOA, not exceeding the outstanding balance.')
    }
    if (parsedAnnualRate !== undefined && (!Number.isFinite(parsedAnnualRate) || parsedAnnualRate < 0 || parsedAnnualRate > 100)) {
      return onNotify('Invalid APR', 'Enter an annual rate between 0% and 100%.')
    }

    const parsedInstallments: CardInstallmentInput[] = []
    for (const row of installmentRows) {
      const balance = Number(row.remainingBalance)
      const monthly = Number(row.monthlyAmount)
      if (!row.description.trim() || !Number.isFinite(balance) || balance <= 0 || !Number.isFinite(monthly) || monthly <= 0) {
        return onNotify('Check Installment', 'Every added plan requires a description, positive unbilled balance, and monthly amount. Delete an empty row if not needed.')
      }
      parsedInstallments.push({ id: row.id, description: row.description.trim(), remainingBalance: balance, monthlyAmount: monthly })
    }

    onSave(
      {
        name: name.trim(),
        currentBalance: parsedBalance,
        creditLimit: parsedLimit,
        cutOffDay: parsedCutOff,
        dueDay: parsedDue,
        statementDate: statementDate || undefined,
        paymentDueDate: effectiveDueDate || undefined,
        minimumDue: parsedMinimum,
        annualRate: parsedAnnualRate === undefined ? undefined : parsedAnnualRate / 100,
      },
      card?.id,
      parsedInstallments,
    )
  }

  return (
    <ModalShell eyebrow="Wallet / Credit Card" title={card ? `${card.name} Details` : 'Add Credit Card'} onClose={onClose}>
      <form onSubmit={submit} style={modalFormStyle} className="dp-card-details-form dp-v7-card-editor">
        <div className="dp-v7-card-identity">
          <TextField label="Card name" value={name} onChange={setName} placeholder="e.g., BPI Visa" autoFocus />
          <TextField label="Credit limit" type="number" value={creditLimit} onChange={setCreditLimit} placeholder="0.00" />
        </div>
        <section className="dp-v7-monthly" aria-label="Monthly statement">
          <h3>Monthly statement</h3>
          <div className="dp-v7-money-grid">
            <TextField label="Outstanding balance" type="number" value={currentBalance} onChange={setCurrentBalance} placeholder="0.00" />
            <TextField label="Minimum due (SOA)" type="number" value={minimumDue} onChange={setMinimumDue} placeholder="Enter amount" />
          </div>
          <div className="dp-v7-due-field">
            <div className="dp-v7-due-header">
              <span>Payment due</span>
              <button
                type="button"
                className="dp-v7-due-toggle"
                aria-label={hasBankDueDateOverride ? 'Use recurring due date' : 'Use actual SOA due date'}
                onClick={() => {
                  if (hasBankDueDateOverride) {
                    setHasBankDueDateOverride(false)
                    setPaymentDueDate('')
                  } else {
                    setPaymentDueDate(automaticDueDate)
                    setHasBankDueDateOverride(true)
                  }
                }}
              >
                {hasBankDueDateOverride ? 'Use automatic' : 'Change date'}
              </button>
            </div>
            {hasBankDueDateOverride ? (
              <TextField label="Bank SOA due date" type="date" value={paymentDueDate} onChange={setPaymentDueDate} />
            ) : (
              <div className="dp-v7-automatic-date" aria-live="polite">
                <strong>{formatCreditCardDueDate(automaticDueDate)}</strong>
                <span>Auto</span>
              </div>
            )}
          </div>
        </section>
        <details className="dp-card-advanced dp-v7-advanced" open={!card}>
          <summary>Card settings</summary>
          <div className="dp-card-advanced-content dp-v8-settings-stack">
            <div className="dp-v8-settings-full">
              <TextField label="Statement date" type="date" value={statementDate} onChange={setStatementDate} />
            </div>
            <div className="dp-v8-settings-grid">
              <TextField label="Cut-off day" type="number" value={cutOffDay} onChange={setCutOffDay} placeholder="1–31" />
              <TextField label="Recurring due day" type="number" value={dueDay} onChange={setDueDay} placeholder="1–31" />
              <TextField label="Annual interest (%)" type="number" value={annualRate} onChange={setAnnualRate} placeholder="Optional" />
            </div>
          </div>
        </details>
        <details className="dp-card-advanced">
          <summary>Future installments{installmentRows.length > 0 ? ` (${installmentRows.length})` : ''}</summary>
          <div className="dp-card-advanced-content">
            {installmentRows.map((row) => (
              <div className="dp-card-installment-row" key={row.key}>
                <div className="dp-card-installment-heading">
                  <strong>{row.description.trim() || 'Installment plan'}</strong>
                  <button type="button" onClick={() => setInstallmentRows((current) => current.filter((item) => item.key !== row.key))} aria-label={`Remove ${row.description || 'installment'}`}><Trash2 size={15} /> Remove</button>
                </div>
                <TextField label="Description" value={row.description} onChange={(value) => setInstallmentRows((current) => current.map((item) => item.key === row.key ? { ...item, description: value } : item))} placeholder="e.g., Laptop, 6 months" />
                <div className="dp-card-installment-amounts">
                  <TextField label="Unbilled balance" type="number" value={row.remainingBalance} onChange={(value) => setInstallmentRows((current) => current.map((item) => item.key === row.key ? { ...item, remainingBalance: value } : item))} placeholder="0.00" />
                  <TextField label="Monthly installment" type="number" value={row.monthlyAmount} onChange={(value) => setInstallmentRows((current) => current.map((item) => item.key === row.key ? { ...item, monthlyAmount: value } : item))} placeholder="0.00" />
                </div>
              </div>
            ))}
            <button className="dp-card-add-installment" type="button" onClick={() => setInstallmentRows((current) => [...current, { key: `new-${Date.now()}-${current.length}`, description: '', remainingBalance: '', monthlyAmount: '' }])}>
              <Plus size={16} /> Add installment
            </button>
          </div>
        </details>
        <button type="submit" className="dp-v7-save-button" style={submitButtonStyle}>Save card</button>
      </form>
    </ModalShell>
  )
}

function BillEditorModal({
  bill,
  onClose,
  onSave,
  onNotify,
}: {
  bill?: RecurringExpense
  onClose: () => void
  onSave: (bill: Omit<RecurringExpense, 'id' | 'remainingBalance' | 'periodKey' | 'lastPaidAt'>, id?: number) => void
  onNotify: (title: string, message: string) => void
}) {
  const [name, setName] = useState(bill?.name ?? '')
  const [category, setCategory] = useState(bill?.category ?? 'Utilities')
  const [amount, setAmount] = useState(bill?.amount.toString() ?? '')
  const [frequency, setFrequency] = useState(bill?.frequency ?? 'Monthly')
  const [nextDue, setNextDue] = useState(bill?.nextDue ?? '')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)

    if (!name.trim()) return onNotify('Bill Name Required', 'Please enter a bill name.')
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return onNotify('Invalid Amount', 'Please enter a valid amount.')
    if (!nextDue.trim()) return onNotify('Due Date Required', 'Please enter the next due date.')

    onSave(
      {
        name: name.trim(),
        category,
        amount: parsedAmount,
        frequency,
        nextDue: nextDue.trim(),
      },
      bill?.id,
    )
  }

  return (
    <ModalShell eyebrow="Plan" title={bill ? 'Edit Bill' : 'Add Bill'} onClose={onClose}>
      <form onSubmit={submit} style={modalFormStyle}>
        <TextField label="Bill name" value={name} onChange={setName} placeholder="Example: Internet, Rent, Netflix" autoFocus />
        <SelectField label="Category" value={category} onChange={setCategory}>
          <option>Utilities</option>
          <option>Subscription</option>
          <option>Rent</option>
          <option>Insurance</option>
          <option>Loan Payment</option>
          <option>Food</option>
          <option>Transportation</option>
          <option>Other</option>
        </SelectField>
        <TextField label="Amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" />
        <SelectField label="Frequency" value={frequency} onChange={setFrequency}>
          <option>Daily</option>
          <option>Weekly</option>
          <option>Biweekly</option>
          <option>Monthly</option>
          <option>Quarterly</option>
          <option>Yearly</option>
        </SelectField>
        <TextField label="Next due date" value={nextDue} onChange={setNextDue} placeholder="Example: July 10 or Every 10th" />
        <button type="submit" style={submitButtonStyle}>Save Bill</button>
      </form>
    </ModalShell>
  )
}

function BudgetEditorModal({
  budget,
  onClose,
  onSave,
  onNotify,
}: {
  budget?: MonthlyBudget
  onClose: () => void
  onSave: (budget: Omit<MonthlyBudget, 'id'>, id?: number) => void
  onNotify: (title: string, message: string) => void
}) {
  const [category, setCategory] = useState(budget?.category ?? '')
  const [limit, setLimit] = useState(budget?.limit.toString() ?? '')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedLimit = Number(limit)

    if (!category.trim()) {
      onNotify('Budget Name Required', 'Please enter a budget name or category.')
      return
    }

    if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
      onNotify('Invalid Budget', 'Please enter a valid monthly budget amount.')
      return
    }

    onSave({ category: category.trim(), limit: parsedLimit }, budget?.id)
  }

  return (
    <ModalShell eyebrow="Monthly Budget" title={budget ? 'Edit Budget' : 'Add Budget'} onClose={onClose}>
      <form onSubmit={submit} style={modalFormStyle}>
        <TextField
          label="Budget name or category"
          value={category}
          onChange={setCategory}
          placeholder="Example: Grocery, Fuel, Coffee"
          autoFocus
        />
        <TextField label="Monthly budget limit" type="number" value={limit} onChange={setLimit} placeholder="0.00" />
        <button type="submit" style={submitButtonStyle}>{budget ? 'Save Budget' : 'Add Budget'}</button>
      </form>
    </ModalShell>
  )
}

function SavingsGoalEditorModal({
  goal,
  onClose,
  onSave,
  onNotify,
}: {
  goal?: SavingsGoal
  onClose: () => void
  onSave: (goal: Omit<SavingsGoal, 'id'>, id?: number) => void
  onNotify: (title: string, message: string) => void
}) {
  const [name, setName] = useState(goal?.name ?? '')
  const [current, setCurrent] = useState(goal?.current.toString() ?? '')
  const [target, setTarget] = useState(goal?.target.toString() ?? '')
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedCurrent = Number(current)
    const parsedTarget = Number(target)

    if (!name.trim()) return onNotify('Goal Name Required', 'Please enter a savings goal name.')
    if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) return onNotify('Invalid Amount', 'Please enter a valid saved amount.')
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) return onNotify('Invalid Target', 'Please enter a valid target amount.')
    if (parsedCurrent > parsedTarget) return onNotify('Invalid Goal', 'Saved amount cannot be higher than the target.')
    if (!targetDate.trim()) return onNotify('Target Date Required', 'Please enter a target date.')

    onSave({ name: name.trim(), current: parsedCurrent, target: parsedTarget, targetDate: targetDate.trim() }, goal?.id)
  }

  return (
    <ModalShell eyebrow="Savings Goal" title={goal ? 'Edit Savings Goal' : 'Add Savings Goal'} onClose={onClose}>
      <form onSubmit={submit} style={modalFormStyle}>
        <TextField label="Goal name" value={name} onChange={setName} placeholder="Example: Emergency Fund" autoFocus />
        <TextField label="Current saved amount" type="number" value={current} onChange={setCurrent} placeholder="0.00" />
        <TextField label="Target amount" type="number" value={target} onChange={setTarget} placeholder="100000" />
        <TextField label="Target date" value={targetDate} onChange={setTargetDate} placeholder="Example: December 2027" />
        <button type="submit" style={submitButtonStyle}>Save Goal</button>
      </form>
    </ModalShell>
  )
}

function DebtEditorModal({
  debt,
  onClose,
  onSave,
  onNotify,
}: {
  debt?: Debt
  onClose: () => void
  onSave: (debt: Omit<Debt, 'id'>, id?: number) => void
  onNotify: (title: string, message: string) => void
}) {
  const [name, setName] = useState(debt?.name ?? '')
  const [balance, setBalance] = useState(debt?.balance.toString() ?? '')
  const [monthly, setMonthly] = useState(debt?.monthly.toString() ?? '')
  const [due, setDue] = useState(debt?.due ?? '')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedBalance = Number(balance)
    const parsedMonthly = Number(monthly)

    if (!name.trim()) return onNotify('Debt Name Required', 'Please enter a debt name.')
    if (!Number.isFinite(parsedBalance) || parsedBalance < 0) return onNotify('Invalid Balance', 'Please enter a valid debt balance.')
    if (!Number.isFinite(parsedMonthly) || parsedMonthly <= 0) return onNotify('Invalid Payment', 'Please enter a valid monthly payment.')
    if (!due.trim()) return onNotify('Due Schedule Required', 'Please enter a due schedule.')

    onSave({ name: name.trim(), balance: parsedBalance, monthly: parsedMonthly, due: due.trim() }, debt?.id)
  }

  return (
    <ModalShell eyebrow="Debt" title={debt ? 'Edit Debt' : 'Add Debt'} onClose={onClose}>
      <form onSubmit={submit} style={modalFormStyle}>
        <TextField label="Debt name" value={name} onChange={setName} placeholder="Example: Personal Loan" autoFocus />
        <TextField label="Remaining balance" type="number" value={balance} onChange={setBalance} placeholder="0.00" />
        <TextField label="Monthly payment" type="number" value={monthly} onChange={setMonthly} placeholder="5000" />
        <TextField label="Due schedule" value={due} onChange={setDue} placeholder="Example: Every 15th" />
        <button type="submit" style={submitButtonStyle}>Save Debt</button>
      </form>
    </ModalShell>
  )
}

function BillPaymentModal({
  bill,
  accounts,
  onClose,
  onSave,
  onNotify,
}: {
  bill: RecurringExpense
  accounts: Account[]
  onClose: () => void
  onSave: (billId: number, accountId: number, amount: number) => void
  onNotify: (title: string, message: string) => void
}) {
  const balanceDue = getBillRemainingBalance(bill)
  const [amount, setAmount] = useState(balanceDue.toString())
  const [accountId, setAccountId] = useState(accounts[0]?.id.toString() ?? '')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return onNotify('Invalid Amount', 'Please enter a valid payment amount.')
    if (parsedAmount > balanceDue) return onNotify('Invalid Amount', 'Payment is higher than the remaining bill balance.')

    onSave(bill.id, Number(accountId), parsedAmount)
  }

  return (
    <ModalShell eyebrow="Bill Payment" title={`Pay ${bill.name}`} onClose={onClose}>
      <form onSubmit={submit} style={modalFormStyle}>
        <section style={modalNoteStyle}>
          <span>Remaining balance</span>
          <strong>{peso.format(balanceDue)}</strong>
        </section>
        <AccountSelect accounts={accounts} value={accountId} onChange={setAccountId} label="Pay from" />
        <TextField label="Payment amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" autoFocus />
        <button type="submit" style={submitButtonStyle}>Record Payment</button>
      </form>
    </ModalShell>
  )
}

function CreditCardPaymentModal({
  card,
  accounts,
  onClose,
  onSave,
  onNotify,
}: {
  card: CreditCardAccount
  accounts: Account[]
  onClose: () => void
  onSave: (cardId: number, accountId: number, amount: number) => void
  onNotify: (title: string, message: string) => void
}) {
  const knownMinimum = getCreditCardMinimumPayment(card)
  const [amount, setAmount] = useState((knownMinimum > 0 ? knownMinimum : card.currentBalance).toString())
  const [accountId, setAccountId] = useState(accounts[0]?.id.toString() ?? '')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return onNotify('Invalid Amount', 'Please enter a valid payment amount.')
    if (parsedAmount > card.currentBalance) return onNotify('Invalid Amount', 'Payment is higher than the current card balance.')

    onSave(card.id, Number(accountId), parsedAmount)
  }

  return (
    <ModalShell eyebrow="Credit Card Payment" title={`Pay ${card.name}`} onClose={onClose}>
      <form onSubmit={submit} style={modalFormStyle}>
        <AccountSelect accounts={accounts} value={accountId} onChange={setAccountId} label="Pay from" />
        <div className="dp13-payment-presets">
          {knownMinimum > 0 && <button type="button" onClick={()=>setAmount(knownMinimum.toFixed(2))}>Minimum {peso.format(knownMinimum)}</button>}
          <button type="button" onClick={()=>setAmount(card.currentBalance.toFixed(2))}>Full balance</button>
        </div>
        <TextField label="Payment amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" autoFocus />
        <button type="submit" style={submitButtonStyle}>Record Payment</button>
      </form>
    </ModalShell>
  )
}

function GoalMoneyModal({
  target,
  accounts,
  onClose,
  onSave,
  onNotify,
}: {
  target: { goal: SavingsGoal; mode: 'deposit' | 'withdraw' }
  accounts: Account[]
  onClose: () => void
  onSave: (goalId: number, accountId: number, amount: number, mode: 'deposit' | 'withdraw') => void
  onNotify: (title: string, message: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id.toString() ?? '')
  const isDeposit = target.mode === 'deposit'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return onNotify('Invalid Amount', 'Please enter a valid amount.')

    onSave(target.goal.id, Number(accountId), parsedAmount, target.mode)
  }

  return (
    <ModalShell
      eyebrow="Savings"
      title={`${isDeposit ? 'Add Money to' : 'Withdraw from'} ${target.goal.name}`}
      onClose={onClose}
    >
      <form onSubmit={submit} style={modalFormStyle}>
        <AccountSelect accounts={accounts} value={accountId} onChange={setAccountId} label={isDeposit ? 'From account' : 'To account'} />
        <TextField label="Amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" autoFocus />
        <button type="submit" style={submitButtonStyle}>{isDeposit ? 'Add Money' : 'Withdraw'}</button>
      </form>
    </ModalShell>
  )
}

function DebtPaymentModal({
  debt,
  accounts,
  onClose,
  onSave,
  onNotify,
}: {
  debt: Debt
  accounts: Account[]
  onClose: () => void
  onSave: (debtId: number, accountId: number, amount: number) => void
  onNotify: (title: string, message: string) => void
}) {
  const [amount, setAmount] = useState(Math.min(debt.monthly, debt.balance).toString())
  const [accountId, setAccountId] = useState(accounts[0]?.id.toString() ?? '')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return onNotify('Invalid Amount', 'Please enter a valid payment amount.')

    onSave(debt.id, Number(accountId), parsedAmount)
  }

  return (
    <ModalShell eyebrow="Debt Payment" title={`Pay ${debt.name}`} onClose={onClose}>
      <form onSubmit={submit} style={modalFormStyle}>
        <AccountSelect accounts={accounts} value={accountId} onChange={setAccountId} label="Pay from" />
        <TextField label="Payment amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" autoFocus />
        <button type="submit" style={submitButtonStyle}>Record Payment</button>
      </form>
    </ModalShell>
  )
}

function AccountSelect({
  accounts,
  value,
  onChange,
  label,
}: {
  accounts: Account[]
  value: string
  onChange: (value: string) => void
  label: string
}) {
  return (
    <SelectField label={label} value={value} onChange={onChange}>
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.name} · {peso.format(account.balance)}
        </option>
      ))}
    </SelectField>
  )
}

function ModalShell({
  eyebrow,
  title,
  children,
  onClose,
}: {
  eyebrow: string
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div style={modalBackdropStyle}>
      <section style={modalPanelStyle}>
        <div style={modalHeaderStyle}>
          <div>
            <p style={modalEyebrowStyle}>{eyebrow}</p>
            <h2 style={modalTitleStyle}>{title}</h2>
          </div>

          <button type="button" style={modalCloseButtonStyle} onClick={onClose}>
            <X size={21} />
          </button>
        </div>

        {children}
      </section>
    </div>
  )
}


function CloudSyncModal({
  isConfigured,
  sessionEmail,
  syncStatus,
  lastSyncedAt,
  busy,
  onClose,
  onSignIn,
  onSignUp,
  onSignOut,
  onSyncNow,
  onRestore,
  onResetLocal,
  onNotify,
}: {
  isConfigured: boolean
  sessionEmail: string | null
  syncStatus: string
  lastSyncedAt: string | null
  busy: boolean
  onClose: () => void
  onSignIn: (email: string, password: string) => void
  onSignUp: (email: string, password: string) => void
  onSignOut: () => void
  onSyncNow: () => void
  onRestore: () => void
  onResetLocal: () => void
  onNotify: (title: string, message: string) => void
}) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanEmail = email.trim()
    if (!cleanEmail) return onNotify('Email Required', 'Enter your email address.')
    if (password.length < 6) return onNotify('Password Too Short', 'Use at least 6 characters for your password.')

    if (mode === 'sign-in') onSignIn(cleanEmail, password)
    else onSignUp(cleanEmail, password)
  }

  return (
    <ModalShell eyebrow="Due₱oint Cloud" title={sessionEmail ? 'Cloud Sync' : 'Sign in to sync'} onClose={onClose}>
      {!isConfigured ? (
        <section className="cloud-sync-panel warning">
          <p>Cloud sync is not configured.</p>
          <span>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local, then restart the dev server.</span>
        </section>
      ) : sessionEmail ? (
        <section className="cloud-sync-panel">
          <div className="cloud-sync-status-card">
            <p>Signed in as</p>
            <h3>{sessionEmail}</h3>
            <span>{syncStatus}</span>
            <small>{lastSyncedAt ? `Last synced ${formatShortDate(lastSyncedAt)}` : 'No successful cloud sync yet'}</small>
          </div>

          <div className="cloud-sync-action-grid">
            <button type="button" onClick={onSyncNow} disabled={busy}>
              {busy ? 'Syncing...' : 'Sync now'}
            </button>
            <button type="button" onClick={onRestore} disabled={busy}>
              Restore cloud
            </button>
          </div>

          <button type="button" className="cloud-sync-secondary-button" onClick={onSignOut} disabled={busy}>
            Sign out
          </button>

          <button type="button" className="cloud-sync-danger-button" onClick={onResetLocal} disabled={busy}>
            Reset local sample data
          </button>
        </section>
      ) : (
        <form className="cloud-sync-panel" onSubmit={handleSubmit}>
          <p className="cloud-sync-note">
            Sign in so Due₱oint can restore your data after clearing browser storage.
          </p>

          <label className="cloud-sync-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
          </label>

          <label className="cloud-sync-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
            />
          </label>

          <button type="submit" className="cloud-sync-primary-button" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'sign-in' ? 'Sign in and restore' : 'Create account'}
          </button>

          <button
            type="button"
            className="cloud-sync-secondary-button"
            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            disabled={busy}
          >
            {mode === 'sign-in' ? 'Create new Due₱oint Cloud account' : 'I already have an account'}
          </button>
        </form>
      )}
    </ModalShell>
  )
}

function MessageDialogModal({
  dialog,
  onClose,
  onConfirm,
}: {
  dialog: MessageDialogState
  onClose: () => void
  onConfirm: () => void
}) {
  const isConfirm = dialog.type === 'confirm'

  return (
    <div style={messageBackdropStyle}>
      <section style={messagePanelStyle}>
        <div style={messageGripStyle} />

        <div style={messageIconWrapStyle(dialog.tone ?? 'default')}>
          {dialog.tone === 'danger' ? <Trash2 size={22} /> : <CreditCard size={22} />}
        </div>

        <h2 style={messageTitleStyle}>{dialog.title}</h2>
        <p style={messageTextStyle}>{dialog.message}</p>

        <div style={messageActionRowStyle}>
          {isConfirm && (
            <button type="button" style={messageCancelButtonStyle} onClick={onClose}>
              {dialog.cancelLabel ?? 'Cancel'}
            </button>
          )}

          <button type="button" style={messageConfirmButtonStyle(dialog.tone ?? 'default')} onClick={isConfirm ? onConfirm : onClose}>
            {dialog.confirmLabel ?? 'Okay'}
          </button>
        </div>
      </section>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number' | 'password' | 'date'
  autoFocus?: boolean
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '0.01' : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        autoFocus={autoFocus}
      />
    </label>
  )
}

function MoneyField({
  label,
  value,
  onChange,
  placeholder = '0.00',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [displayValue, setDisplayValue] = useState(() =>
    value.trim() ? parseMoneyValue(value).toFixed(2) : '',
  )

  useEffect(() => {
    if (!editing) setDisplayValue(value.trim() ? parseMoneyValue(value).toFixed(2) : '')
  }, [value, editing])

  return (
    <label className="dp-money-field" style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <div className="dp-money-control">
        <span aria-hidden="true">₱</span>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onFocus={() => setEditing(true)}
          onChange={(event) => {
            const next = event.target.value.replace(/[^0-9.]/g, '')
            if (!/^\d*(?:\.\d{0,2})?$/.test(next)) return
            setDisplayValue(next)
            onChange(next)
          }}
          onBlur={() => {
            setEditing(false)
            const next = displayValue.trim() ? parseMoneyValue(displayValue).toFixed(2) : ''
            setDisplayValue(next)
            onChange(next)
          }}
          placeholder={placeholder}
          aria-label={label}
          style={inputStyle}
        />
      </div>
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
        {children}
      </select>
    </label>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="info-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}

function IconButton({
  children,
  label,
  danger = false,
  onClick,
}: {
  children: ReactNode
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      style={danger ? dangerIconButtonStyle : iconButtonStyle}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  )
}

const spendingMixColors = ['#2f7d5a', '#f97316', '#2563eb', '#a855f7', '#dc2626', '#0f766e', '#ca8a04', '#64748b']

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function compactPeso(value: number) {
  if (Math.abs(value) >= 1_000_000) return `₱${(value / 1_000_000).toFixed(2)}M`
  if (Math.abs(value) >= 1_000) return `₱${(value / 1_000).toFixed(2)}k`
  return peso.format(value)
}

function getFinancialHealthSummary({
  totalCash,
  totalSavings,
  totalDebt,
  recurringTotal,
  totalBudget,
  totalBudgetSpent,
  overBudgetCount,
  creditCardInsights,
  netCashflow,
}: {
  totalCash: number
  totalSavings: number
  totalDebt: number
  recurringTotal: number
  totalBudget: number
  totalBudgetSpent: number
  overBudgetCount: number
  creditCardInsights: CreditCardInsight[]
  netCashflow: number
}): FinancialHealthSummary {
  const cashBufferScore =
    recurringTotal <= 0
      ? totalCash > 0
        ? 16
        : 0
      : clamp((totalCash / recurringTotal) * 8, 0, 20)

  const budgetProgress = totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0
  const budgetScore =
    totalBudget > 0
      ? clamp(20 - Math.max(0, budgetProgress - 70) * 0.5 - overBudgetCount * 6, 0, 20)
      : 12

  const debtLoad = totalCash + totalSavings > 0 ? totalDebt / (totalCash + totalSavings) : totalDebt > 0 ? 3 : 0
  const debtScore = clamp(20 - debtLoad * 10, 0, 20)

  const averageUtilization =
    creditCardInsights.length > 0
      ? creditCardInsights.reduce((total, insight) => total + insight.utilization, 0) / creditCardInsights.length
      : 0
  const creditScore = clamp(15 - Math.max(0, averageUtilization - 30) * 0.25, 0, 15)

  const cashflowScore = netCashflow >= 0 ? 25 : clamp(25 + netCashflow / 1500, 0, 25)

  let score = Math.round(cashBufferScore + budgetScore + debtScore + creditScore + cashflowScore)

  // Guardrails: a bad cashflow month should not still look "strong"
  // just because debt and budget indicators are currently clean.
  if (netCashflow < 0) score = Math.min(score, 72)
  if (netCashflow < -5000) score = Math.min(score, 62)
  if (netCashflow < -10000) score = Math.min(score, 54)
  if (totalCash <= 0) score = Math.min(score, 45)
  if (recurringTotal > 0 && totalCash < recurringTotal) score = Math.min(score, 58)

  if (score >= 80) {
    return {
      score,
      status: 'Strong position',
      message: 'Cash, debt, and budget signals look healthy. Keep using the plan before spending extra.',
      tone: 'good',
    }
  }

  if (score >= 60) {
    return {
      score,
      status: 'Watch cashflow',
      message: 'You are okay, but cashflow, bills, or budget usage need attention before the next payday.',
      tone: 'watch',
    }
  }

  if (netCashflow < -10000) {
    return {
      score,
      status: 'Needs action',
      message: 'Expenses are much higher than income this month. Pause non-essential spending and review transactions.',
      tone: 'risk',
    }
  }

  return {
    score,
    status: 'Needs action',
    message: 'Prioritize unpaid bills and minimum debt payments before adding new spending.',
    tone: 'risk',
  }
}

function getCashflowForecast({
  totalCash,
  recurringExpenses,
  creditCardInsights,
  debts,
}: {
  totalCash: number
  recurringExpenses: RecurringExpense[]
  creditCardInsights: CreditCardInsight[]
  debts: Debt[]
}): CashflowPoint[] {
  const today = startOfDay(new Date())
  const outflows = [
    ...recurringExpenses.map((expense) => ({
      dueDate: getUpcomingBillDueDate(expense),
      amount: getBillRemainingBalance(expense),
    })),
    ...creditCardInsights.map((insight) => ({
      dueDate: addDays(today, insight.daysToDue),
      amount: getCreditCardMinimumPayment(insight.card),
    })),
    ...debts.map((debt) => ({
      dueDate: parseRecurringDay(debt.due),
      amount: getStandaloneDebtMinimum(debt),
    })),
  ].filter((item): item is { dueDate: Date; amount: number } => Boolean(item.dueDate) && item.amount > 0)

  const checkpoints = [0, 5, 10, 15, 20, 25, 30]

  return checkpoints.map((dayOffset) => {
    const checkpointDate = addDays(today, dayOffset)
    const scheduledOutflow = outflows
      .filter((outflow) => outflow.dueDate <= checkpointDate)
      .reduce((total, outflow) => total + outflow.amount, 0)

    return {
      day: dayOffset === 0 ? 'Today' : formatChartDate(checkpointDate),
      balance: Math.max(0, totalCash - scheduledOutflow),
    }
  })
}

function getBudgetChartData(budgetMetrics: BudgetMetric[]) {
  return [...budgetMetrics]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 8)
    .map((metric) => ({
      category: metric.budget.category,
      spent: metric.spent,
      limit: metric.budget.limit,
    }))
}

function getSpendingMixData(transactions: Transaction[]): SpendingMixPoint[] {
  const totals = new Map<string, number>()

  transactions
    .filter(isCurrentMonthTransaction)
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const category = transaction.category ?? 'Other'
      totals.set(category, (totals.get(category) ?? 0) + transaction.amount)
    })

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

function getDebtPlanningItems(creditCardInsights: CreditCardInsight[], debts: Debt[]): DebtPlanningItem[] {
  const cardItems = creditCardInsights.map((insight) => ({
    id: `card-${insight.card.id}`,
    name: insight.card.name,
    balance: Math.max(0, insight.card.currentBalance),
    minimumPayment: getCreditCardMinimumPayment(insight.card),
    annualRate: insight.card.annualRate ?? 0.36,
    kind: 'Credit card' as const,
  }))

  const debtItems = debts.map((debt) => ({
    id: `debt-${debt.id}`,
    name: debt.name,
    balance: Math.max(0, debt.balance),
    minimumPayment: Math.max(1, debt.monthly),
    annualRate: debt.annualRate ?? 0.12,
    kind: 'Debt' as const,
  }))

  return [...cardItems, ...debtItems].filter((item) => item.balance > 0)
}

function getDebtPlanComparison(items: DebtPlanningItem[], extraPayment: number): DebtPlanComparison {
  const avalanche = simulateDebtPayoff(items, extraPayment, 'Avalanche')
  const snowball = simulateDebtPayoff(items, extraPayment, 'Snowball')
  const hybrid = simulateDebtPayoff(items, extraPayment, 'Hybrid')
  const minimumOnly = simulateDebtPayoff(items, 0, 'Avalanche')
  const recommended = [avalanche, snowball, hybrid].sort((a, b) => {
    if (a.months !== b.months) return a.months - b.months
    return a.totalInterest - b.totalInterest
  })[0]

  return {
    avalanche,
    snowball,
    hybrid,
    recommended,
    interestSaved: Math.max(0, minimumOnly.totalInterest - recommended.totalInterest),
  }
}

function simulateDebtPayoff(
  items: DebtPlanningItem[],
  extraPayment: number,
  method: DebtPayoffPlan['method'],
): DebtPayoffPlan {
  if (items.length === 0) {
    return {
      method,
      months: 0,
      totalInterest: 0,
      focusName: 'No active debt',
      reason: 'Add credit cards or debts to generate a payoff strategy.',
      schedule: [],
    }
  }

  const balances = items.map((item) => item.balance)
  let totalInterest = 0
  const schedule: { month: string; balance: number }[] = [
    { month: 'Now', balance: Math.round(sumNumbers(balances)) },
  ]
  let months = 0

  while (sumNumbers(balances) > 1 && months < 240) {
    months += 1

    balances.forEach((balance, index) => {
      if (balance <= 0) return
      const monthlyInterest = balance * (items[index].annualRate / 12)
      balances[index] += monthlyInterest
      totalInterest += monthlyInterest
    })

    balances.forEach((balance, index) => {
      if (balance <= 0) return
      // A zero minimum on the *current* SOA may mean already paid. Future
      // monthly minimums can resume; use an explicitly estimated amount for
      // the projection rather than assuming zero payments for 20 years.
      const projectedMinimum = items[index].kind === 'Credit card' && items[index].minimumPayment === 0
        ? Math.max(500, Math.round(balances[index] * 0.04))
        : items[index].minimumPayment
      const minimumPayment = Math.min(projectedMinimum, balances[index])
      balances[index] -= minimumPayment
    })

    let remainingExtra = extraPayment
    const orderedIndexes = getDebtPaymentOrder(items, balances, method)

    orderedIndexes.forEach((index) => {
      if (remainingExtra <= 0 || balances[index] <= 0) return
      const payment = Math.min(remainingExtra, balances[index])
      balances[index] -= payment
      remainingExtra -= payment
    })

    if (months <= 12 || months % 3 === 0 || sumNumbers(balances) <= 1) {
      schedule.push({ month: `M${months}`, balance: Math.round(Math.max(0, sumNumbers(balances))) })
    }
  }

  const focusIndex = getDebtPaymentOrder(items, items.map((item) => item.balance), method)[0]
  const focusName = typeof focusIndex === 'number' ? items[focusIndex].name : 'No active debt'

  return {
    method,
    months,
    totalInterest: Math.round(totalInterest),
    focusName,
    reason: getDebtMethodReason(method),
    schedule: schedule.slice(0, 14),
  }
}

function getDebtPaymentOrder(
  items: DebtPlanningItem[],
  balances: number[],
  method: DebtPayoffPlan['method'],
): number[] {
  return items
    .map((item, index) => ({ item, index, balance: balances[index] }))
    .filter((entry) => entry.balance > 1)
    .sort((a, b) => {
      if (method === 'Snowball') return a.balance - b.balance
      if (method === 'Avalanche') return b.item.annualRate - a.item.annualRate || b.balance - a.balance
      const aScore = a.item.annualRate * 100000 - a.balance * 0.08
      const bScore = b.item.annualRate * 100000 - b.balance * 0.08
      return bScore - aScore
    })
    .map((entry) => entry.index)
}

function getDebtMethodReason(method: DebtPayoffPlan['method']) {
  if (method === 'Avalanche') return 'Targets the highest-interest debt first to reduce interest cost.'
  if (method === 'Snowball') return 'Targets the smallest balance first to create quick wins.'
  return 'Balances interest savings and motivation by prioritizing costly debts with manageable balances.'
}

function getSmartInsightCards({
  totalCash,
  recurringTotal,
  netCashflow,
  budgetMetrics,
  creditCardInsights,
  debts,
  debtPlan,
}: {
  totalCash: number
  recurringTotal: number
  netCashflow: number
  budgetMetrics: BudgetMetric[]
  creditCardInsights: CreditCardInsight[]
  debts: Debt[]
  debtPlan: DebtPayoffPlan
}): SmartInsight[] {
  const cards: SmartInsight[] = []
  const overBudget = budgetMetrics.find((metric) => metric.overBudget)
  const riskyCard = creditCardInsights.find((insight) => insight.status === 'avoid')
  const recommendedCard = creditCardInsights.find((insight) => insight.status === 'recommended')
  const minimums = creditCardInsights.reduce((total, insight) => total + getCreditCardMinimumPayment(insight.card), 0)
    + debts.reduce((total, debt) => total + getStandaloneDebtMinimum(debt), 0)
  const requiredReserve = recurringTotal + minimums

  if (minimums > 0) {
    cards.push({
      label: 'Debt minimums first',
      title: `Reserve ${peso.format(minimums)} for debt minimums`,
      message: totalCash < requiredReserve
        ? `Bills plus debt minimums require ${peso.format(requiredReserve)}. You are ${peso.format(requiredReserve - totalCash)} short based on tracked cash.`
        : `Required bills and minimum debt payments total ${peso.format(requiredReserve)}. Only extra cash should go toward an avalanche payment.`,
      tone: totalCash < requiredReserve ? 'risk' : 'watch',
    })
  }

  if (recurringTotal > 0) {
    cards.push({
      label: 'Bills first',
      title: `Reserve ${peso.format(recurringTotal)}`,
      message: `Set aside bills before discretionary spending; together with debt minimums, reserve ${peso.format(requiredReserve)}.`,
      tone: totalCash >= recurringTotal ? 'watch' : 'risk',
    })
  }

  if (overBudget) {
    cards.push({
      label: 'Budget alert',
      title: `Reduce ${overBudget.budget.category}`,
      message: `${overBudget.budget.category} is ${peso.format(Math.abs(overBudget.remaining))} over budget this month.`,
      tone: 'risk',
    })
  }

  if (riskyCard) {
    cards.push({
      label: 'Card risk',
      title: `Avoid ${riskyCard.card.name}`,
      message: riskyCard.reason,
      tone: 'risk',
    })
  } else if (recommendedCard) {
    cards.push({
      label: 'Best card',
      title: `Use ${recommendedCard.card.name} if needed`,
      message: recommendedCard.reason,
      tone: 'good',
    })
  }

  if (debtPlan.months > 0) {
    cards.push({
      label: 'Debt action',
      title: `Focus on ${debtPlan.focusName}`,
      message: `${debtPlan.method} can clear your tracked debt in about ${monthsToText(debtPlan.months)} if you follow the payment plan.`,
      tone: 'watch',
    })
  }

  if (netCashflow < 0) {
    cards.push({
      label: 'Cashflow warning',
      title: 'Slow down spending',
      message: `Recorded expenses are higher than income by ${peso.format(Math.abs(netCashflow))}.`,
      tone: 'risk',
    })
  } else {
    cards.push({
      label: 'Payday move',
      title: 'Allocate extra cash intentionally',
      message: 'After bills and minimum payments, send extra money to your focus debt or emergency fund.',
      tone: 'good',
    })
  }

  return cards.slice(0, 5)
}

function getPaydayAllocationPlan({
  income,
  totalCash,
  recurringTotal,
  creditCardInsights,
  debts,
  debtPlan,
}: {
  income: number
  totalCash: number
  recurringTotal: number
  creditCardInsights: CreditCardInsight[]
  debts: Debt[]
  debtPlan: DebtPayoffPlan
}): PaydayAllocationPlan {
  const cleanIncome = Math.max(0, Number.isFinite(income) ? income : 0)
  const creditCardDebt = creditCardInsights.reduce((total, insight) => total + insight.card.currentBalance, 0)
  const loanBalance = debts.reduce((total, debt) => total + debt.balance, 0)
  const monthlyCardDue = creditCardInsights.reduce(
    (total, insight) => total + getCreditCardMinimumPayment(insight.card), 0,
  )
  const monthlyLoanDue = debts.reduce(
    (total, debt) => total + getStandaloneDebtMinimum(debt), 0,
  )
  const requiredReserve = recurringTotal + monthlyCardDue + monthlyLoanDue
  const riskyCard = creditCardInsights.find((insight) => insight.status === 'avoid')
  const focusName = debtPlan.focusName !== 'No active debt' ? debtPlan.focusName : (riskyCard?.card.name ?? 'Savings buffer')

  let remaining = cleanIncome
  const bills = Math.min(remaining, recurringTotal)
  remaining -= bills
  const cardMinimumAllocation = Math.min(remaining, monthlyCardDue)
  remaining -= cardMinimumAllocation
  const loanMinimumAllocation = Math.min(remaining, monthlyLoanDue)
  remaining -= loanMinimumAllocation

  const shortfall = Math.max(0, requiredReserve - cleanIncome)
  if (shortfall > 0 || cleanIncome <= 0) {
    return {
      income: cleanIncome,
      bills,
      creditCards: cardMinimumAllocation,
      loanDebts: loanMinimumAllocation,
      savings: 0,
      flexibleCash: 0,
      focusName: requiredReserve > 0 ? 'Cover required payments' : 'Enter an income amount',
      message: cleanIncome <= 0
        ? `Enter your expected income. Known unpaid bills and debt minimums require ${peso.format(requiredReserve)}.`
        : `This income alone is ${peso.format(shortfall)} short of bills and minimum payments. Do not allocate extras or savings until all required payments are funded.${totalCash >= shortfall ? ' Existing cash may help, but keep enough for essentials.' : ''}`,
      tone: 'risk',
    }
  }

  // Add surplus to credit card avalanche first; do not replace actual minimums
  // with an arbitrary percentage of payday income.
  const extraCard = creditCardDebt > monthlyCardDue ? Math.min(remaining * 0.7, creditCardDebt - monthlyCardDue) : 0
  remaining -= extraCard
  const extraLoan = loanBalance > monthlyLoanDue && extraCard <= 0
    ? Math.min(remaining * 0.4, loanBalance - monthlyLoanDue) : 0
  remaining -= extraLoan
  const savings = Math.min(remaining, remaining * (creditCardDebt + loanBalance > 0 ? 0.15 : 0.3))
  remaining -= savings
  const flexibleCash = Math.max(0, remaining)

  return {
    income: cleanIncome,
    bills,
    creditCards: cardMinimumAllocation + extraCard,
    loanDebts: loanMinimumAllocation + extraLoan,
    savings,
    flexibleCash,
    focusName,
    message: `Bills (${peso.format(recurringTotal)}) and remaining minimums (${peso.format(monthlyCardDue + monthlyLoanDue)}) are reserved first. Only then consider extra debt payments to ${focusName}. Treat this as a planning guide, not an automatic payment.`,
    tone: totalCash >= requiredReserve ? 'good' : 'watch',
  }
}

function getAffordabilityResult({
  amount,
  totalCash,
  recurringTotal,
  creditCardInsights,
  debts,
}: {
  amount: number
  totalCash: number
  recurringTotal: number
  creditCardInsights: CreditCardInsight[]
  debts: Debt[]
}): AffordabilityResult {
  const cleanAmount = Math.max(0, Math.round(amount))
  const remainingCash = totalCash - cleanAmount
  const minimums = creditCardInsights.reduce((total, insight) => total + getCreditCardMinimumPayment(insight.card), 0)
    + debts.reduce((total, debt) => total + getStandaloneDebtMinimum(debt), 0)
  const reserved = recurringTotal + minimums
  const safeBuffer = Math.max(3000, reserved * 1.25)
  const recommendedCard = creditCardInsights.find((insight) => insight.status === 'recommended')
  const riskyCard = creditCardInsights.find((insight) => insight.status === 'avoid')
  const availableRecommendedCredit = recommendedCard
    ? recommendedCard.card.creditLimit - recommendedCard.card.currentBalance
    : 0

  if (cleanAmount <= 0) {
    return {
      status: 'Ready',
      tone: 'watch',
      remainingCash: totalCash,
      message: 'Enter a purchase amount to check if it fits your current cash, bills, and card risk.',
      paymentAdvice: 'Check first',
    }
  }

  if (cleanAmount > totalCash) {
    const canUseRecommendedCard = Boolean(recommendedCard && availableRecommendedCredit >= cleanAmount && totalCash >= reserved)
    const recommendedCardName = recommendedCard?.card.name ?? 'the recommended card'
    return {
      status: 'Not enough cash',
      tone: 'risk',
      remainingCash,
      message: canUseRecommendedCard
        ? `Cash is not enough for this purchase. If it is necessary, ${recommendedCardName} is the safer card option, but avoid adding card debt for wants.`
        : 'Cash is not enough for this purchase and no safer card option is available right now.',
      paymentAdvice: canUseRecommendedCard ? recommendedCardName : 'Delay purchase',
    }
  }

  if (remainingCash < reserved) {
    return {
      status: 'Not recommended',
      tone: 'risk',
      remainingCash,
      message: `This purchase may leave you short for bills and minimum debt payments. Reserve ${peso.format(reserved)} (including ${peso.format(minimums)} in debt minimums) before optional spending.`,
      paymentAdvice: 'Do not buy now',
    }
  }

  if (remainingCash < safeBuffer) {
    return {
      status: 'Use caution',
      tone: 'watch',
      remainingCash,
      message: `You can pay for it, but your buffer will be thin. Try to keep at least ${peso.format(safeBuffer)} available after the purchase.`,
      paymentAdvice: riskyCard ? 'Use cash only' : 'Prefer cash',
    }
  }

  return {
    status: 'Looks safe',
    tone: 'good',
    remainingCash,
    message: 'This purchase appears affordable after known bills and minimum debt payments. Still avoid it if it is not a priority.',
    paymentAdvice: recommendedCard ? `Cash or ${recommendedCard.card.name}` : 'Cash is okay',
  }
}

function getLinkedCardInstallments(debts: Debt[], card: CreditCardAccount): Debt[] {
  return debts.filter((debt) =>
    debt.kind === 'credit-card-installment' && (
      debt.linkedCardId === card.id ||
      (debt.linkedCardId === undefined && debt.source === 'Imported credit card SOA' && debt.name.startsWith(`${card.name} - `))
    ),
  )
}

function getStandaloneDebtMinimum(debt: Debt) {
  // Installment amounts imported from the SOA can already be included in
  // the card's statement minimum. Keep future exposure separate from
  // this month's cash reservation to prevent counting it twice.
  if (debt.kind === 'credit-card-installment' && (debt.source === 'Imported credit card SOA' || debt.source === 'Credit card details' || debt.linkedCardId !== undefined)) return 0
  return Math.min(Math.max(debt.monthly, 0), Math.max(debt.balance, 0))
}

function getCreditCardMinimumPayment(card: CreditCardAccount) {
  if (typeof card.minimumDue === 'number' && Number.isFinite(card.minimumDue)) {
    return Math.min(card.currentBalance, Math.max(card.minimumDue, 0))
  }
  // No guessed minimum: missing figures must be entered from the bank statement.
  // Keep 0 out of required-payment totals and explicitly flag missing cards in Insights.
  return 0
}

function sumNumbers(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function monthsToText(months: number) {
  if (months <= 0) return 'No debt'
  if (months >= 240) return '20+ years'
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (years <= 0) return `${months} month${months === 1 ? '' : 's'}`
  if (remainingMonths === 0) return `${years} year${years === 1 ? '' : 's'}`
  return `${years}y ${remainingMonths}m`
}

function getDebtFreeDateLabel(months: number) {
  if (months <= 0) return 'Already debt-free'
  if (months >= 240) return 'More than 20 years'
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function formatChartDate(date: Date) {
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function getUpcomingBillDueDate(expense: RecurringExpense): Date | null {
  const today = startOfDay(new Date())
  const frequency = expense.frequency.toLowerCase()
  const label = expense.nextDue.trim()

  if (frequency.includes('month')) {
    // "June 30" and "Every 30th" both mean the 30th of each MONTH.
    // Recalculate on display; never rewrite the user's original bill record.
    const dayMatch = label.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/i)
    if (dayMatch) {
      const day = Math.max(1, Math.min(31, Number(dayMatch[1])))
      const makeDate = (year: number, month: number) => {
        const lastDay = new Date(year, month + 1, 0).getDate()
        return new Date(year, month, Math.min(day, lastDay))
      }
      let dueDate = makeDate(today.getFullYear(), today.getMonth())
      if (dueDate < today) dueDate = makeDate(today.getFullYear(), today.getMonth() + 1)
      return dueDate
    }
  }

  if (frequency.includes('year') || frequency.includes('annual')) {
    const annualDate = new Date(`${label} ${today.getFullYear()}`)
    if (!Number.isNaN(annualDate.getTime())) {
      annualDate.setHours(0, 0, 0, 0)
      if (annualDate < today) annualDate.setFullYear(annualDate.getFullYear() + 1)
      return annualDate
    }
  }

  return parseUpcomingMonthDay(label)
}

function parseUpcomingMonthDay(label: string) {
  const today = startOfDay(new Date())
  const candidate = new Date(`${label} ${today.getFullYear()}`)
  if (Number.isNaN(candidate.getTime())) return null
  candidate.setHours(0, 0, 0, 0)

  while (candidate < today) {
    candidate.setMonth(candidate.getMonth() + 1)
  }

  return candidate
}

function parseRecurringDay(label: string) {
  const match = label.match(/(\d{1,2})/)
  if (!match) return null

  const day = clamp(Number(match[1]), 1, 28)
  const today = startOfDay(new Date())
  const candidate = new Date(today.getFullYear(), today.getMonth(), day)
  candidate.setHours(0, 0, 0, 0)

  if (candidate < today) {
    candidate.setMonth(candidate.getMonth() + 1)
  }

  return candidate
}

function getBudgetMetrics(monthlyBudgets: MonthlyBudget[], transactions: Transaction[]): BudgetMetric[] {
  const currentMonthTransactions = transactions.filter(isCurrentMonthTransaction)

  return monthlyBudgets.map((budget) => {
    const spent = currentMonthTransactions
      .filter((transaction) => transaction.category === budget.category)
      .filter((transaction) => transaction.type !== 'income')
      .reduce((total, transaction) => total + transaction.amount, 0)

    const remaining = budget.limit - spent
    const progress = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0

    return {
      budget,
      spent,
      remaining,
      progress,
      overBudget: spent > budget.limit,
    }
  })
}

function getCreditCardInsights(creditCards: CreditCardAccount[]): CreditCardInsight[] {
  const today = new Date()

  const scoredCards = creditCards.map((card) => {
    const availableCredit = card.creditLimit - card.currentBalance
    const utilization = Math.round((card.currentBalance / card.creditLimit) * 100)
    const daysToCutOff = getDaysUntilDay(card.cutOffDay, today)
    const daysToDue = getDaysUntilDay(card.dueDay, today)

    let score =
      daysToCutOff * 2 +
      daysToDue * 0.35 +
      (100 - utilization) * 0.45 +
      (availableCredit / card.creditLimit) * 20

    if (daysToDue <= 5) score -= 100
    if (utilization >= 80) score -= 80
    if (availableCredit <= 0) score -= 200

    return { card, utilization, availableCredit, daysToCutOff, daysToDue, score }
  })

  const sortedCards = [...scoredCards].sort((a, b) => b.score - a.score)

  return sortedCards.map((item, index) => {
    const isDanger =
      item.daysToDue <= 5 ||
      item.utilization >= 80 ||
      item.availableCredit <= 0

    const status: CreditCardInsight['status'] =
      index === 0 && !isDanger ? 'recommended' : isDanger ? 'avoid' : 'watch'

    return {
      ...item,
      status,
      reason: getInsightReason(item, status),
    }
  })
}

function getInsightReason(
  item: {
    daysToCutOff: number
    daysToDue: number
    utilization: number
    availableCredit: number
  },
  status: CreditCardInsight['status'],
) {
  if (item.availableCredit <= 0) return 'No available credit remaining. Avoid using this card.'
  if (item.daysToDue <= 5) return `Due date is ${formatRelativeDays(item.daysToDue)}. Avoid adding more balance.`
  if (item.utilization >= 80) return `Utilization is high at ${item.utilization}%. Avoid if possible.`

  if (status === 'recommended') {
    return `${formatRelativeDays(item.daysToCutOff)} before cut-off, ${formatRelativeDays(item.daysToDue)} before due date, and ${item.utilization}% utilization.`
  }

  return `${formatRelativeDays(item.daysToCutOff)} before cut-off and ${item.utilization}% utilization.`
}

function getDailyRecommendation(insights: CreditCardInsight[]) {
  const recommendedCard = insights.find((insight) => insight.status === 'recommended')
  if (recommendedCard) {
    return {
      title: `Use ${recommendedCard.card.name}`,
      description: recommendedCard.reason,
    }
  }

  const watchCard = insights.find((insight) => insight.status === 'watch')
  if (watchCard) {
    return {
      title: `Use ${watchCard.card.name} carefully`,
      description: watchCard.reason,
    }
  }

  if (insights.length > 0) {
    return {
      title: 'Use cash today',
      description: 'Your available cards are near due date, highly utilized, or have limited available credit.',
    }
  }

  return {
    title: 'Add a credit card',
    description: 'Due₱oint needs at least one credit card to calculate the best card to use today.',
  }
}

function getDaysUntilDay(day: number, fromDate: Date) {
  const today = startOfDay(fromDate)
  let target = buildDateForDay(today.getFullYear(), today.getMonth(), day)

  if (target.getTime() < today.getTime()) {
    target = buildDateForDay(today.getFullYear(), today.getMonth() + 1, day)
  }

  return Math.round((target.getTime() - today.getTime()) / DAY_IN_MS)
}

function buildDateForDay(year: number, month: number, day: number) {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, lastDayOfMonth))
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatRelativeDays(days: number) {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

function isValidDayOfMonth(day: number) {
  return Number.isInteger(day) && day >= 1 && day <= 31
}

function isCurrentMonthTransaction(transaction: Transaction) {
  const date = new Date(transaction.createdAt)
  const today = new Date()
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()
}

function formatOrdinalDay(day: number) {
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th'

  return `Every ${day}${suffix}`
}

function getEventClass(type: string) {
  if (type === 'Due' || type === 'Debt') return 'due'
  if (type === 'Cut-off') return 'cutoff'
  return 'recurring'
}

function getTransactionAccent(type: QuickAction): AccountAccent {
  if (type === 'income') return 'green'
  if (type === 'expense') return 'blue'
  return 'teal'
}

function getPageTitle(activeTab: TabKey) {
  const titles: Record<TabKey, string> = {
    today: 'Today',
    wallet: 'Wallet',
    plan: 'Plan',
    insights: 'Insights',
  }

  return titles[activeTab]
}


function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Please check your internet connection and cloud setup.'
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createNumericId<T extends { id: number }>(items: T[]) {
  const highestId = items.reduce((highest, item) => Math.max(highest, item.id), 0)
  return highestId + 1
}

function getCurrentPeriodKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function getBillRemainingBalance(expense: RecurringExpense) {
  const remaining = typeof expense.remainingBalance === 'number' ? expense.remainingBalance : expense.amount

  if (!Number.isFinite(remaining)) return expense.amount

  return Math.max(Math.min(remaining, expense.amount), 0)
}

function isBudgetCategory(value: unknown): value is BudgetCategory {
  return typeof value === 'string' && value.trim().length > 0
}


function getStatementPasswordProfile(profileId: string) {
  return statementPasswordProfiles.find((profile) => profile.id === profileId)
}

function buildStatementPdfPassword(profileId: string, birthDate: string, manualPassword: string) {
  if (profileId === 'manual') return manualPassword.trim()

  const profile = getStatementPasswordProfile(profileId)
  if (!profile || !birthDate) return ''

  const [year, month, day] = birthDate.split('-')
  const monthIndex = Number(month) - 1

  if (!year || !month || !day || monthIndex < 0 || monthIndex > 11) return ''

  const dd = day.padStart(2, '0')
  const mm = month.padStart(2, '0')
  const yyyy = year
  const monthUpper = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][monthIndex]
  const monthTitle = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex]

  if (profile.format === 'dob-ddmmmyyyy-upper') return `${dd}${monthUpper}${yyyy}`
  if (profile.format === 'dob-mmddyyyy') return `${mm}${dd}${yyyy}`
  if (profile.format === 'dob-ddmmmyyyy-title') return `${dd}${monthTitle}${yyyy}`

  return manualPassword.trim()
}

function buildStatementPdfPasswordCandidates(birthDate: string) {
  if (!birthDate) return []

  return statementPasswordProfiles
    .map((profile) => ({
      id: profile.id,
      label: `${normalizeDetectedBankName(profile.label)} format`,
      bankName: normalizeDetectedBankName(profile.label),
      password: buildStatementPdfPassword(profile.id, birthDate, ''),
    }))
    .filter((candidate, index, candidates) =>
      candidate.password && candidates.findIndex((item) => item.password === candidate.password) === index,
    )
}

function getStatementPasswordCandidatePreview(birthDate: string) {
  const candidates = buildStatementPdfPasswordCandidates(birthDate)

  if (candidates.length === 0) {
    return 'Enter birthday to generate Security Bank, RCBC, and UnionBank SOA password formats.'
  }

  return `Due₱oint will try: ${candidates.map((candidate) => candidate.password).join(' · ')}`
}

async function extractPdfTextWithAutoPassword(file: File, birthDate: string) {
  const attempts: Array<{ label: string; password?: string; profileId?: string; bankName?: string }> = [
    { label: 'No password', password: undefined },
  ]
  const candidates = buildStatementPdfPasswordCandidates(birthDate)
  attempts.push(
    ...candidates.map((candidate) => ({
      label: candidate.label,
      password: candidate.password,
      profileId: candidate.id,
      bankName: candidate.bankName,
    })),
  )

  let lastError: unknown = null

  for (const attempt of attempts) {
    try {
      const rawText = await extractPdfText(file, attempt.password)
      return {
        rawText,
        passwordLabel: attempt.password ? `${attempt.bankName ?? attempt.label} format` : 'No password',
        passwordProfileId: attempt.profileId ?? '',
        passwordBankName: attempt.bankName ?? '',
      }
    } catch (error) {
      lastError = error
    }
  }

  if (!birthDate) {
    throw new Error('This SOA PDF may be password-protected. Enter your birthday, then upload the PDF again.')
  }

  throw new Error(
    lastError instanceof Error
      ? `Due₱oint could not open this PDF using the known birthday formats. ${lastError.message}`
      : 'Due₱oint could not open this PDF using the known birthday formats.',
  )
}

function resolveStatementCardId(creditCards: CreditCardAccount[], detectedCardName: string) {
  const detected = normalizeCardMatchText(detectedCardName)

  if (!detected) return 'new'

  const matched = creditCards.find((card) => {
    const cardName = normalizeCardMatchText(card.name)
    return cardName.includes(detected) || detected.includes(cardName) || haveSharedCardBank(cardName, detected)
  })

  return matched ? matched.id.toString() : 'new'
}

function normalizeCardMatchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function haveSharedCardBank(cardName: string, detectedName: string) {
  const banks = ['bpi', 'bdo', 'metrobank', 'unionbank', 'securitybank', 'rcbc', 'eastwest', 'pnb', 'chinabank', 'aub', 'maybank', 'hsbc', 'citibank']
  const networks = ['visa', 'mastercard', 'amex', 'americanexpress', 'jcb']
  const sharedBank = banks.some((bank) => cardName.includes(bank) && detectedName.includes(bank))
  const sharedNetwork = networks.some((network) => cardName.includes(network) && detectedName.includes(network))

  return sharedBank && (sharedNetwork || cardName.includes('creditcard') || detectedName.includes('creditcard'))
}

function buildStatementDebtComponents(draft: StatementImportDraft): StatementDebtComponentDraft[] {
  const statementBalance = Math.max(draft.outstandingBalance || draft.totalAmountDue || 0, 0)
  const minimumDue = Math.max(draft.minimumAmountDue || estimateCreditCardMinimumFromBalance(statementBalance), 0)
  const estimatedRevolvingBalance = statementBalance

  const components: StatementDebtComponentDraft[] = []

  if (estimatedRevolvingBalance > 0) {
    components.push({
      id: 'soa-revolving',
      type: 'revolving',
      name: `${draft.cardName || 'Credit Card'} revolving balance`,
      balance: estimatedRevolvingBalance,
      monthlyDue: minimumDue,
      annualRate: Number.isFinite(draft.annualRate) && draft.annualRate >= 0 ? draft.annualRate : 0.36,
      priority: (draft.annualRate || 0.36) >= 0.24 ? 'High' : 'Medium',
      note: 'Statement balance already includes any billed installments, interest and fees. Those amounts are not added again.',
    })
  }

  draft.installments.forEach((installment, index) => {
    const remainingBalance = (installment.remainingBalance > 0 ? installment.remainingBalance : installment.monthlyAmount * Math.max(installment.monthsRemaining, 1))

    components.push({
      id: `soa-installment-${installment.id || index}`,
      type: 'installment',
      name: installment.description || `Installment ${index + 1}`,
      balance: remainingBalance,
      monthlyDue: Math.max(installment.monthlyAmount, 0),
      annualRate: Math.max(installment.annualRate || 0, 0),
      priority: installment.annualRate > 0.18 ? 'Medium' : 'Low',
      note:
        installment.annualRate <= 0
          ? 'Usually paid on schedule. Extra avalanche money should normally go to higher-interest revolving debt first.'
          : 'Fixed installment. Pay required amortization, then compare rate before sending extra money here.',
    })
  })


  if (components.length === 0) {
    components.push({
      id: 'soa-empty',
      type: 'revolving',
      name: draft.cardName || 'Imported credit card',
      balance: 0,
      monthlyDue: 0,
      annualRate: draft.annualRate || 0.36,
      priority: 'Low',
      note: 'No clear debt component was detected. Review the SOA manually before saving.',
    })
  }

  return components
}

function getStatementAvalanchePreview(
  creditCards: CreditCardAccount[],
  debts: Debt[],
  draft: StatementImportDraft,
): StatementAvalanchePreview {
  const selectedCardId = resolveStatementCardId(creditCards, draft.cardName)
  const statementBalance = Math.max(draft.outstandingBalance || draft.totalAmountDue || 0, 0)
  const dueDay = parseDayFromStatementDate(draft.dueDate, 15)
  const cutOffDay = parseDayFromStatementDate(draft.statementDate, 1)
  const annualRate = Number.isFinite(draft.annualRate) && draft.annualRate >= 0 ? draft.annualRate : 0.36

  const projectedCard: CreditCardAccount = {
    id: selectedCardId === 'new' ? 999999 : Number(selectedCardId),
    name: draft.cardName || 'Imported Credit Card',
    currentBalance: statementBalance,
    minimumDue: draft.minimumAmountDue,
    creditLimit: Math.max(draft.creditLimit, statementBalance, 1),
    cutOffDay,
    dueDay,
    annualRate,
  }

  const projectedCards =
    selectedCardId === 'new'
      ? [...creditCards, projectedCard]
      : creditCards.map((card) =>
          card.id === Number(selectedCardId)
            ? {
                ...card,
                name: card.name || projectedCard.name,
                currentBalance: projectedCard.currentBalance,
                minimumDue: projectedCard.minimumDue,
                creditLimit: projectedCard.creditLimit,
                cutOffDay: projectedCard.cutOffDay,
                dueDay: projectedCard.dueDay,
                annualRate: projectedCard.annualRate,
              }
            : card,
        )

  const importedInstallmentDebts: Debt[] = draft.installments.map((installment, index) => ({
    id: 900000 + index,
    name: `${draft.cardName || 'Card'} - ${installment.description || `Installment ${index + 1}`}`,
    balance: (installment.remainingBalance > 0 ? installment.remainingBalance : installment.monthlyAmount * Math.max(installment.monthsRemaining, 1)),
    monthly: Math.max(installment.monthlyAmount, 1),
    due: draft.dueDate ? `Every ${formatOrdinalDay(dueDay)}` : 'Every month',
    annualRate: Math.max(installment.annualRate || 0, 0),
    source: 'SOA preview',
    kind: 'credit-card-installment',
  }))

  const projectedDebts = mergeImportedInstallmentDebts(debts, importedInstallmentDebts)
  const items = getDebtPlanningItems(getCreditCardInsights(projectedCards), projectedDebts)
  const orderedIndexes = getDebtPaymentOrder(
    items,
    items.map((item) => item.balance),
    'Avalanche',
  )
  const focusItem = typeof orderedIndexes[0] === 'number' ? items[orderedIndexes[0]] : undefined
  const statementComponents = buildStatementDebtComponents(draft)
  const minimumDue = Math.max(draft.minimumAmountDue || estimateCreditCardMinimumFromBalance(statementBalance), 0)
  const requiredThisMonth = minimumDue

  return {
    totalDebtExposure: items.reduce((total, item) => total + Math.max(item.balance, 0), 0),
    requiredThisMonth,
    focusName: focusItem?.name ?? 'No active debt',
    focusRate: focusItem?.annualRate ?? 0,
    focusNote: focusItem
      ? `After required payments, extra money should go here first because it has about ${Math.round((focusItem.annualRate || 0) * 100)}% APR.`
      : 'Add card balances or debts to generate an avalanche focus.',
    componentCount: statementComponents.filter((component) => component.balance > 0).length,
  }
}

function getStatementValidationWarnings(draft: StatementImportDraft) {
  const warnings: string[] = []
  const statementBalance = Math.max(draft.outstandingBalance || draft.totalAmountDue || 0, 0)
  const minimumDue = Math.max(draft.minimumAmountDue || 0, 0)

  if (statementBalance > 5000 && minimumDue > 0 && minimumDue < Math.max(100, statementBalance * 0.005)) {
    warnings.push('Minimum amount due looks unusually low compared with the statement balance. Please verify before saving.')
  }

  if (draft.totalAmountDue > 0 && draft.outstandingBalance > 0 && draft.totalAmountDue > draft.outstandingBalance * 1.25) {
    warnings.push('Total amount due is much higher than outstanding balance. Please verify the entered amounts.')
  }

  if (draft.creditLimit > 0 && statementBalance > draft.creditLimit) {
    warnings.push('Statement balance is higher than the credit limit. Check the amounts against your SOA.')
  }

  if (draft.statementDate && draft.dueDate && isDueDateBeforeStatementDate(draft.statementDate, draft.dueDate)) {
    warnings.push('Payment due date is before the statement date. Check both dates.')
  }

  if (!draft.dueDate) warnings.push('Payment due date has not been entered.')
  if (!draft.statementDate) warnings.push('Statement date has not been entered.')
  if (!draft.totalAmountDue && !draft.outstandingBalance) warnings.push('SOA statement balance has not been entered.')
  if (draft.installments.some((installment) => installment.confidence === 'Low')) {
    warnings.push('Some installment detections are low confidence. Review the installment names, amounts, and remaining months.')
  }
  if (draft.notes.some((note) => note.toLowerCase().includes('low confidence'))) {
    warnings.push('SOA bank/profile detection is low confidence. Confirm the detected card/bank before saving.')
  }

  return warnings
}

function estimateCreditCardMinimumFromBalance(balance: number) {
  if (!Number.isFinite(balance) || balance <= 0) return 0
  return Math.max(500, Math.round(balance * 0.03))
}

function isDueDateBeforeStatementDate(statementDate: string, dueDate: string) {
  const statement = new Date(statementDate)
  const due = new Date(dueDate)
  if (Number.isNaN(statement.getTime()) || Number.isNaN(due.getTime())) return false
  return due.getTime() < statement.getTime()
}

function mergeImportedInstallmentDebts(existingDebts: Debt[], importedDebts: Debt[]) {
  if (importedDebts.length === 0) return existingDebts

  const nextDebts = [...existingDebts]

  importedDebts.forEach((importedDebt) => {
    const importedKey = normalizeDebtMatchKey(importedDebt.name)
    const existingIndex = nextDebts.findIndex(
      (debt) => debt.kind === 'credit-card-installment' && normalizeDebtMatchKey(debt.name) === importedKey,
    )

    if (existingIndex >= 0) {
      nextDebts[existingIndex] = {
        ...nextDebts[existingIndex],
        ...importedDebt,
        id: nextDebts[existingIndex].id,
      }
    } else {
      nextDebts.push(importedDebt)
    }
  })

  return nextDebts
}

function normalizeDebtMatchKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(statement|soa|installment|instalment|payment|plan)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatStatementAmount(value: number) {
  return peso.format(Number.isFinite(value) ? value : 0)
}

function getPdfImportErrorMessage(error: unknown, hadPassword: boolean) {
  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : String(error)
  const lower = `${name} ${message}`.toLowerCase()

  if (lower.includes('password')) {
    return hadPassword
      ? 'The PDF password appears to be incorrect. Check the selected bank format, birthday, or manual password, then upload again.'
      : 'This SOA PDF is password-protected. Select the bank password format or enter the manual PDF password, then upload again.'
  }

  return message || 'Due₱oint could not read this PDF statement.'
}

async function extractPdfText(file: File, password?: string) {
  const buffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    password,
  })

  let pdf: any

  try {
    pdf = await loadingTask.promise
  } catch (error) {
    throw new Error(getPdfImportErrorMessage(error, Boolean(password)))
  }

  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const items = textContent.items as Array<{ str?: string }>
    const pageText = items.map((item) => item.str ?? '').join(' ')
    pages.push(pageText)
  }

  return pages.join('\n').replace(/\s+/g, ' ').trim()
}

function parseCreditCardStatement(rawText: string, fileName: string, preferredBankName = ''): StatementImportDraft {
  const text = normalizeStatementText(rawText)
  const profileMatch = detectSoaParserProfile(text, fileName, preferredBankName)
  const profile = profileMatch?.profile ?? null

  const totalAmountDue = findProfileMoney(text, profile, 'totalAmountDue', [
    'total amount due',
    'total amt due',
    'amount due',
    'total payment due',
    'payment amount due',
  ])
  const outstandingBalance = findProfileMoney(text, profile, 'outstandingBalance', [
    'outstanding balance',
    'statement balance',
    'new balance',
    'current balance',
    'total balance',
    'ending balance',
  ])
  const minimumAmountDue = findProfileMoney(text, profile, 'minimumAmountDue', [
    'minimum amount due',
    'minimum payment due',
    'minimum payment',
    'min amount due',
    'minimum due',
  ])
  const creditLimit = findProfileMoney(text, profile, 'creditLimit', [
    'credit limit',
    'total credit limit',
    'available credit limit',
  ])
  const financeCharge = findProfileMoney(text, profile, 'financeCharge', [
    'finance charge',
    'interest charge',
    'retail interest',
    'cash advance interest',
    'monthly interest',
  ])
  const statementDate = findProfileDate(text, profile, 'statementDate', [
    'statement date',
    'billing date',
    'statement as of',
    'as of',
  ])
  const dueDate = findProfileDate(text, profile, 'dueDate', [
    'payment due date',
    'due date',
    'please pay on or before',
    'pay by',
    'payment date',
  ])
  const annualRate = findAnnualRate(text) ?? profile?.defaultAnnualRate ?? 0.36
  const installments = detectStatementInstallmentsWithProfile(text, profile)
  const notes: string[] = []

  if (profileMatch) {
    notes.push(`SOA parser profile used: ${profileMatch.profile.bankName} (${profileMatch.confidence} confidence, score ${profileMatch.score}).`)
  } else {
    notes.push('No bank-specific parser profile matched. Due₱oint used the generic SOA parser.')
  }

  if (profileMatch?.confidence === 'Low') {
    notes.push('Bank/profile detection is low confidence. Review the detected card name, balance, due date, and minimum due.')
  }
  if (!totalAmountDue && !outstandingBalance) notes.push('No clear total/outstanding balance found. Please check the balance before saving.')
  if (!minimumAmountDue) notes.push('No clear minimum amount due found. Due₱oint will estimate the minimum if needed.')
  if (!dueDate) notes.push('No clear payment due date found. Please encode the due date manually.')
  if (installments.length > 0) notes.push('Installments were detected as possible matches. Review them before adding to Debt Tracker.')

  return {
    fileName,
    rawText,
    cardName: detectCardName(text, fileName, profile?.bankName ?? preferredBankName),
    statementDate,
    dueDate,
    totalAmountDue,
    minimumAmountDue,
    outstandingBalance: outstandingBalance || totalAmountDue,
    creditLimit,
    financeCharge,
    annualRate,
    installments,
    notes,
  }
}

function detectSoaParserProfile(text: string, fileName: string, preferredBankName = ''): SoaParserMatch | null {
  const normalizedText = text.toLowerCase()
  const normalizedFileName = fileName.toLowerCase()
  const preferredBank = normalizeDetectedBankName(preferredBankName).toLowerCase()

  const scored = soaParserProfiles
    .map((profile) => {
      let score = 0
      const normalizedBank = profile.bankName.toLowerCase()

      if (preferredBank && (preferredBank.includes(normalizedBank) || normalizedBank.includes(preferredBank))) score += 60
      if (normalizedFileName.includes(profile.id) || normalizedFileName.includes(normalizedBank.replace(/\s+/g, ''))) score += 25

      profile.keywords.forEach((keyword) => {
        if (normalizedText.includes(keyword.toLowerCase())) score += 8
      })

      Object.values(profile.fields).flat().forEach((label) => {
        if (normalizedText.includes(label.toLowerCase())) score += 2
      })

      return {
        profile,
        score,
        confidence: score >= 80 ? 'High' : score >= 40 ? 'Medium' : 'Low',
      } as SoaParserMatch
    })
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  return best && best.score > 0 ? best : null
}

function findProfileMoney(
  text: string,
  profile: SoaParserProfile | null,
  field: SoaParserFieldKey,
  genericLabels: string[],
) {
  const profileValue = profile ? findMoneyAfterLabels(text, uniqueLabels([...(profile.fields[field] ?? []), ...genericLabels]), 130) : 0
  if (profileValue > 0) return profileValue

  return findMoneyAfterLabels(text, genericLabels, 90)
}

function findProfileDate(
  text: string,
  profile: SoaParserProfile | null,
  field: SoaParserFieldKey,
  genericLabels: string[],
) {
  const profileValue = profile ? findDateAfterLabels(text, uniqueLabels([...(profile.fields[field] ?? []), ...genericLabels]), 130) : ''
  if (profileValue) return profileValue

  return findDateAfterLabels(text, genericLabels, 90)
}

function uniqueLabels(labels: string[]) {
  const seen = new Set<string>()

  return labels.filter((label) => {
    const normalized = label.toLowerCase().replace(/\s+/g, ' ').trim()
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

function detectStatementInstallmentsWithProfile(text: string, profile: SoaParserProfile | null) {
  const genericInstallments = detectStatementInstallments(text)
  if (!profile) return genericInstallments

  const profileInstallments = detectStatementInstallments(text, profile.fields.installments)
  const seen = new Set<string>()

  return [...profileInstallments, ...genericInstallments].filter((installment) => {
    const fingerprint = `${installment.description}-${Math.round(installment.monthlyAmount)}-${installment.monthsRemaining}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
    if (seen.has(fingerprint)) return false
    seen.add(fingerprint)
    return true
  })
}

function normalizeStatementText(value: string) {
  return value
    .replace(/[₱]/g, 'PHP ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectCardName(text: string, fileName: string, preferredBankName = '') {
  const preferredBank = normalizeDetectedBankName(preferredBankName)
  const cardType = detectCardNetwork(text)

  if (preferredBank) {
    return cardType ? `${preferredBank} ${cardType}` : `${preferredBank} Credit Card`
  }

  const banks = [
    'UnionBank',
    'Security Bank',
    'RCBC',
    'BPI',
    'BDO',
    'Metrobank',
    'EastWest',
    'PNB',
    'Chinabank',
    'AUB',
    'Maybank',
    'HSBC',
    'Citibank',
  ]

  const bank = banks.find((item) => new RegExp(`\\b${escapeRegExp(item)}\\b`, 'i').test(text))

  if (bank && cardType) return `${bank} ${cardType}`
  if (bank) return `${bank} Credit Card`

  const cleanFileName = fileName
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleanFileName || 'Imported Credit Card'
}

function detectCardNetwork(text: string) {
  const match = text.match(/\b(Visa|Mastercard|MasterCard|Amex|American Express|JCB)\b/i)?.[1]
  if (!match) return ''
  if (/mastercard/i.test(match)) return 'Mastercard'
  if (/american express|amex/i.test(match)) return 'American Express'
  if (/visa/i.test(match)) return 'Visa'
  if (/jcb/i.test(match)) return 'JCB'
  return match
}

function normalizeDetectedBankName(value: string) {
  const normalized = value.trim().toLowerCase()

  if (!normalized) return ''
  if (normalized.includes('unionbank') || normalized.includes('union bank')) return 'UnionBank'
  if (normalized.includes('security')) return 'Security Bank'
  if (normalized.includes('rcbc')) return 'RCBC'
  if (normalized.includes('bpi')) return 'BPI'
  if (normalized.includes('bdo')) return 'BDO'
  if (normalized.includes('metrobank')) return 'Metrobank'

  return value.trim()
}

function findMoneyAfterLabels(text: string, labels: string[], distance = 90) {
  for (const label of labels) {
    const labelPattern = escapeRegExp(label).replace(/\s+/g, '\\s+')
    const pattern = new RegExp(`${labelPattern}.{0,${distance}}?((?:PHP|P)?\\s*-?\\d[\\d,]*(?:\\.\\d{1,2})?)`, 'i')
    const match = text.match(pattern)
    if (match) {
      const parsed = parseMoneyValue(match[1])
      if (parsed > 0) return parsed
    }
  }

  return 0
}

function findDateAfterLabels(text: string, labels: string[], distance = 90) {
  const datePattern =
    '((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?\\s+\\d{1,2},?\\s+\\d{2,4}|\\d{1,2}[\\/.-]\\d{1,2}[\\/.-]\\d{2,4})'

  for (const label of labels) {
    const labelPattern = escapeRegExp(label).replace(/\s+/g, '\\s+')
    const pattern = new RegExp(`${labelPattern}.{0,${distance}}?${datePattern}`, 'i')
    const match = text.match(pattern)
    if (match) return match[1].replace(/\s+/g, ' ').trim()
  }

  return ''
}

function findAnnualRate(text: string) {
  const aprMatch = text.match(/(?:APR|annual percentage rate|annual interest rate).{0,40}?(\d{1,2}(?:\.\d+)?)\s*%/i)
  if (aprMatch) return Number(aprMatch[1]) / 100

  const monthlyMatch = text.match(/(?:monthly interest rate|monthly effective rate|finance charge rate).{0,40}?(\d{1,2}(?:\.\d+)?)\s*%/i)
  if (monthlyMatch) return (Number(monthlyMatch[1]) / 100) * 12

  return null
}

function detectStatementInstallments(text: string, extraLabels: string[] = []): StatementInstallmentDraft[] {
  const extraPattern = extraLabels
    .map((label) => escapeRegExp(label).replace(/\s+/g, '\\s*'))
    .filter(Boolean)
    .join('|')
  const basePattern = 'installment|instalment|monthly amortization|amortization|easy\\s*pay|easypay|balance conversion|sip|0%\\s*installment|buy now pay later|bnpl'
  const keywordPattern = new RegExp(extraPattern ? `(${basePattern}|${extraPattern})` : `(${basePattern})`, 'gi')
  const matches = Array.from(text.matchAll(keywordPattern))
  const seen = new Set<string>()

  return matches.slice(0, 8).flatMap((match, index) => {
    const start = Math.max(0, (match.index ?? 0) - 90)
    const end = Math.min(text.length, (match.index ?? 0) + 210)
    const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim()
    const fingerprint = snippet.slice(0, 90).toLowerCase()

    if (seen.has(fingerprint)) return []
    seen.add(fingerprint)

    const amounts = Array.from(snippet.matchAll(/(?:PHP|P)?\s*-?\d[\d,]*(?:\.\d{1,2})?/gi))
      .map((item) => parseMoneyValue(item[0]))
      .filter((amount) => amount > 0)
    const monthsMatch = snippet.match(/\b(\d{1,2})\s*(?:months|month|mos|mo)\b/i)
    const monthsRemaining = monthsMatch ? Number(monthsMatch[1]) : 1
    const isZeroPercent = /0\s*%/.test(snippet)
    const interestMatch = snippet.match(/(\d{1,2}(?:\.\d+)?)\s*%/)
    const annualRate = isZeroPercent ? 0 : interestMatch ? Number(interestMatch[1]) / 100 : 0.12
    const monthlyAmount = amounts[0] ?? 0
    const remainingBalance = amounts.length > 1 ? Math.max(...amounts) : monthlyAmount * Math.max(monthsRemaining, 1)
    const cleanDescription = snippet
      .replace(/\b(?:PHP|P)?\s*-?\d[\d,]*(?:\.\d{1,2})?\b/gi, '')
      .replace(/\s+/g, ' ')
      .slice(0, 76)
      .trim()

    return [
      {
        id: `installment-${index}-${Math.round(monthlyAmount)}`,
        description: cleanDescription || 'Statement Installment',
        monthlyAmount,
        remainingBalance,
        monthsRemaining,
        annualRate,
        confidence: monthlyAmount > 0 && monthsRemaining > 1 ? 'Medium' : 'Low',
      },
    ]
  })
}

function parseMoneyValue(value: string) {
  const cleaned = value.replace(/PHP|P|,/gi, '').replace(/[^\d.-]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0
}



function parseDayFromStatementDate(value: string, fallback: number) {
  if (!value.trim()) return fallback

  const monthNameMatch = value.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})/i)
  if (monthNameMatch) {
    const day = Number(monthNameMatch[1])
    return isValidDayOfMonth(day) ? day : fallback
  }

  const numericMatch = value.match(/\b(\d{1,2})[\\/.-](\d{1,2})[\\/.-](\d{2,4})\b/)
  if (numericMatch) {
    const first = Number(numericMatch[1])
    const second = Number(numericMatch[2])
    const day = first > 12 ? first : second
    return isValidDayOfMonth(day) ? day : fallback
  }

  return parseDayFromText(value, fallback)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeTransactions(rawTransactions: unknown): Transaction[] {
  if (!Array.isArray(rawTransactions)) return []

  return rawTransactions.map((rawTransaction, index) => {
    const transaction = rawTransaction as Partial<Transaction>

    const normalizedTransaction: Transaction = {
      id: String(transaction.id ?? `${Date.now()}-${index}`),
      type:
        transaction.type === 'income' ||
        transaction.type === 'expense' ||
        transaction.type === 'transfer'
          ? transaction.type
          : 'expense',
      amount: Number(transaction.amount ?? 0),
      label: String(transaction.label ?? 'Transaction'),
      accountLabel: String(transaction.accountLabel ?? 'Account'),
      createdAt: typeof transaction.createdAt === 'string' ? transaction.createdAt : new Date().toISOString(),
    }

    if (isBudgetCategory(transaction.category)) {
      normalizedTransaction.category = transaction.category
    }

    return normalizedTransaction
  })
}

function normalizeMonthlyBudgets(rawBudgets: unknown): MonthlyBudget[] {
  const source = Array.isArray(rawBudgets) ? rawBudgets : initialMonthlyBudgets
  const seenCategories = new Set<string>()

  return source
    .map((rawBudget, index) => {
      const budget = rawBudget as Partial<MonthlyBudget>
      const category = String(budget.category ?? '').trim()
      const savedLimit = Number(budget.limit ?? 0)
      const legacyDefaultLimit = legacyDefaultBudgetLimits[category]
      const cleanedLimit = savedLimit === legacyDefaultLimit ? 0 : savedLimit

      return {
        id: Number.isFinite(Number(budget.id)) ? Number(budget.id) : index + 1,
        category,
        limit: Number.isFinite(cleanedLimit) && cleanedLimit >= 0 ? cleanedLimit : 0,
      }
    })
    .filter((budget) => {
      if (!budget.category) return false
      const key = budget.category.toLowerCase()
      if (seenCategories.has(key)) return false
      seenCategories.add(key)
      return true
    })
}

function normalizeRecurringExpenses(rawRecurringExpenses: unknown): RecurringExpense[] {
  const currentPeriodKey = getCurrentPeriodKey()
  const source = Array.isArray(rawRecurringExpenses) ? rawRecurringExpenses : initialFinanceData.recurringExpenses

  return source.map((rawExpense, index) => {
    const expense = rawExpense as Partial<RecurringExpense>
    const amount = Number(expense.amount ?? 0)
    const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0
    const savedPeriodKey = typeof expense.periodKey === 'string' ? expense.periodKey : currentPeriodKey
    const shouldResetForNewMonth = savedPeriodKey !== currentPeriodKey
    const savedRemaining = typeof expense.remainingBalance === 'number' ? expense.remainingBalance : safeAmount

    const normalizedExpense: RecurringExpense = {
      id: Number(expense.id ?? index + 1),
      name: String(expense.name ?? `Bill ${index + 1}`),
      category: String(expense.category ?? 'Other'),
      amount: safeAmount,
      frequency: String(expense.frequency ?? 'Monthly'),
      nextDue: String(expense.nextDue ?? 'Every month'),
      remainingBalance: shouldResetForNewMonth
        ? safeAmount
        : Math.max(Math.min(savedRemaining, safeAmount), 0),
      periodKey: currentPeriodKey,
    }

    if (!shouldResetForNewMonth && typeof expense.lastPaidAt === 'string') {
      normalizedExpense.lastPaidAt = expense.lastPaidAt
    }

    return normalizedExpense
  })
}

function normalizeCreditCards(rawCreditCards: unknown): CreditCardAccount[] {
  if (!Array.isArray(rawCreditCards)) return initialFinanceData.creditCards

  return rawCreditCards.map((rawCard, index) => {
    const card = rawCard as Partial<CreditCardAccount & { cutOffDate: string; dueDate: string }>
    const creditLimit = Number(card.creditLimit ?? 1)
    const currentBalance = Number(card.currentBalance ?? 0)

    const normalizedCard: CreditCardAccount = {
      id: Number(card.id ?? index + 1),
      name: String(card.name ?? `Credit Card ${index + 1}`),
      currentBalance: Number.isFinite(currentBalance) ? currentBalance : 0,
      creditLimit: Number.isFinite(creditLimit) && creditLimit > 0 ? creditLimit : 1,
      cutOffDay: parseDayFromText(card.cutOffDay ?? card.cutOffDate, 1),
      dueDay: parseDayFromText(card.dueDay ?? card.dueDate, 15),
    }

    const annualRate = Number(card.annualRate ?? 0.36)
    if (Number.isFinite(annualRate) && annualRate >= 0) normalizedCard.annualRate = annualRate

    const minimumDue = Number(card.minimumDue)
    if (card.minimumDue !== undefined && Number.isFinite(minimumDue) && minimumDue >= 0) normalizedCard.minimumDue = minimumDue

    if (typeof card.statementDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(card.statementDate)) normalizedCard.statementDate = card.statementDate
    if (typeof card.paymentDueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(card.paymentDueDate)) normalizedCard.paymentDueDate = card.paymentDueDate
    if (typeof card.lastPaymentAt === 'string') normalizedCard.lastPaymentAt = card.lastPaymentAt

    return normalizedCard
  })
}

function parseDayFromText(value: unknown, fallback: number) {
  if (typeof value === 'number' && isValidDayOfMonth(value)) return value
  if (typeof value !== 'string') return fallback

  const match = value.match(/\b([1-9]|[12][0-9]|3[01])\b/)
  const parsedDay = match ? Number(match[1]) : fallback

  return isValidDayOfMonth(parsedDay) ? parsedDay : fallback
}

function normalizeAccounts(rawAccounts: unknown): Account[] {
  if (!Array.isArray(rawAccounts)) return initialFinanceData.accounts

  return rawAccounts.map((rawAccount, index) => {
    const account = rawAccount as Partial<Account>
    const balance = Number(account.balance ?? 0)
    const accent =
      account.accent === 'green' || account.accent === 'blue' || account.accent === 'teal'
        ? account.accent
        : 'blue'

    return {
      id: Number(account.id ?? index + 1),
      name: String(account.name ?? `Account ${index + 1}`),
      type: String(account.type ?? 'Bank Account'),
      balance: Number.isFinite(balance) ? balance : 0,
      accent,
    }
  })
}

function normalizeSavingsGoals(rawGoals: unknown): SavingsGoal[] {
  if (!Array.isArray(rawGoals)) return initialFinanceData.savingsGoals

  return rawGoals.map((rawGoal, index) => {
    const goal = rawGoal as Partial<SavingsGoal>
    const current = Number(goal.current ?? 0)
    const target = Number(goal.target ?? 1)

    return {
      id: Number(goal.id ?? index + 1),
      name: String(goal.name ?? `Savings Goal ${index + 1}`),
      current: Number.isFinite(current) && current >= 0 ? current : 0,
      target: Number.isFinite(target) && target > 0 ? target : 1,
      targetDate: String(goal.targetDate ?? 'No target date'),
    }
  })
}

function normalizeDebts(rawDebts: unknown): Debt[] {
  if (!Array.isArray(rawDebts)) return initialFinanceData.debts

  return rawDebts.map((rawDebt, index) => {
    const debt = rawDebt as Partial<Debt>
    const balance = Number(debt.balance ?? 0)
    const monthly = Number(debt.monthly ?? 0)

    const annualRate = Number(debt.annualRate ?? 0.12)
    const kind = debt.kind === 'credit-card-installment' || debt.kind === 'loan' || debt.kind === 'other' ? debt.kind : undefined

    return {
      id: Number(debt.id ?? index + 1),
      name: String(debt.name ?? `Debt ${index + 1}`),
      balance: Number.isFinite(balance) && balance >= 0 ? balance : 0,
      monthly: Number.isFinite(monthly) && monthly > 0 ? monthly : 1,
      due: String(debt.due ?? 'Every month'),
      annualRate: Number.isFinite(annualRate) && annualRate >= 0 ? annualRate : 0.12,
      source: typeof debt.source === 'string' ? debt.source : undefined,
      kind,
      linkedCardId: Number.isFinite(Number(debt.linkedCardId)) && debt.linkedCardId !== undefined ? Number(debt.linkedCardId) : undefined,
    }
  })
}

function normalizeFinanceData(data: Partial<FinanceData>): FinanceData {
  return {
    accounts: normalizeAccounts(data.accounts),
    creditCards: normalizeCreditCards(data.creditCards),
    savingsGoals: normalizeSavingsGoals(data.savingsGoals),
    debts: normalizeDebts(data.debts),
    recurringExpenses: normalizeRecurringExpenses(data.recurringExpenses),
    monthlyBudgets: normalizeMonthlyBudgets(data.monthlyBudgets),
    transactions: normalizeTransactions(data.transactions),
  }
}

function loadFinanceData(): FinanceData {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (!savedData) return normalizeFinanceData(initialFinanceData)

    const parsedData = JSON.parse(savedData) as Partial<FinanceData>
    return normalizeFinanceData(parsedData)
  } catch {
    return normalizeFinanceData(initialFinanceData)
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const softButtonStyle: CSSProperties = {
  width: '100%',
  minHeight: 45,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  border: 0,
  borderRadius: 17,
  color: '#171717',
  background: 'rgba(255, 255, 255, 0.78)',
  fontSize: '0.78rem',
  fontWeight: 800,
  boxShadow: 'inset 0 0 0 1px rgba(23, 23, 23, 0.05)',
}

const softButtonWithTopMarginStyle: CSSProperties = {
  ...softButtonStyle,
  marginTop: 14,
}

const compactButtonStyle: CSSProperties = {
  minHeight: 36,
  padding: '0 10px',
  border: 0,
  borderRadius: 13,
  color: '#171717',
  background: 'rgba(23, 23, 23, 0.07)',
  fontSize: '0.7rem',
  fontWeight: 850,
}

const compactDangerButtonStyle: CSSProperties = {
  ...compactButtonStyle,
  color: '#b64a46',
  background: '#f3dfdc',
}

const cardActionGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 7,
  marginTop: 15,
}

const budgetActionRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 7,
  marginTop: 15,
}

const inlineCardActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 6,
  flex: '0 0 auto',
}

const previewCardStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
  padding: '13px 14px',
  borderRadius: 18,
  background: 'rgba(255, 255, 255, 0.7)',
  boxShadow: 'inset 0 0 0 1px rgba(23, 23, 23, 0.05)',
}

const textLinkButtonStyle: CSSProperties = {
  width: 'fit-content',
  padding: 0,
  border: 0,
  color: '#171717',
  background: 'transparent',
  fontSize: '0.78rem',
  fontWeight: 850,
  textDecoration: 'underline',
}

const amountActionColumnStyle: CSSProperties = {
  display: 'grid',
  justifyItems: 'end',
  gap: 8,
  flex: '0 0 auto',
}

const miniActionRowStyle: CSSProperties = {
  display: 'flex',
  gap: 6,
}

const iconButtonStyle: CSSProperties = {
  width: 29,
  height: 29,
  display: 'grid',
  placeItems: 'center',
  border: 0,
  borderRadius: 10,
  color: '#245f4c',
  background: '#dcece5',
}

const dangerIconButtonStyle: CSSProperties = {
  ...iconButtonStyle,
  color: '#b64a46',
  background: '#f3dfdc',
}

const dangerTextStyle: CSSProperties = {
  color: '#b64a46',
}

const modalBackdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: '18px',
  background: 'rgba(23, 23, 23, 0.35)',
  backdropFilter: 'blur(8px)',
}

const modalPanelStyle: CSSProperties = {
  width: 'min(100%, 444px)',
  maxHeight: 'calc(100vh - 36px)',
  overflowY: 'auto',
  padding: 20,
  borderRadius: 30,
  background: '#faf8f3',
  boxShadow: '0 24px 60px rgba(20, 20, 20, 0.28)',
}

const modalHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 17,
}

const modalEyebrowStyle: CSSProperties = {
  margin: '0 0 4px',
  color: '#7c746a',
  fontSize: '0.72rem',
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const modalTitleStyle: CSSProperties = {
  margin: 0,
  color: '#171717',
  fontSize: '1.45rem',
  letterSpacing: '-0.04em',
}

const modalCloseButtonStyle: CSSProperties = {
  width: 42,
  height: 42,
  display: 'grid',
  placeItems: 'center',
  border: 0,
  borderRadius: '50%',
  color: '#171717',
  background: '#eee9df',
}

const modalFormStyle: CSSProperties = {
  display: 'grid',
  gap: 13,
}

const modalNoteStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '13px 14px',
  borderRadius: 16,
  color: '#171717',
  background: '#eee9df',
  fontSize: '0.82rem',
  fontWeight: 800,
}

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
}

const labelStyle: CSSProperties = {
  color: '#6f685f',
  fontSize: '0.76rem',
  fontWeight: 750,
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 48,
  padding: '0 14px',
  border: '1px solid rgba(23, 23, 23, 0.09)',
  borderRadius: 16,
  color: '#171717',
  background: '#ffffff',
  fontSize: '0.92rem',
  outline: 'none',
}

const submitButtonStyle: CSSProperties = {
  minHeight: 52,
  marginTop: 4,
  border: 0,
  borderRadius: 18,
  color: '#ffffff',
  background: '#171717',
  fontSize: '0.92rem',
  fontWeight: 800,
}

const messageBackdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 220,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 22,
  background: 'rgba(23, 23, 23, 0.36)',
  backdropFilter: 'blur(10px)',
}

const messagePanelStyle: CSSProperties = {
  width: 'min(100%, 338px)',
  display: 'grid',
  justifyItems: 'center',
  padding: '22px 18px 18px',
  borderRadius: 28,
  background: '#faf8f3',
  boxShadow: '0 28px 70px rgba(23, 23, 23, 0.28)',
  textAlign: 'center',
}

const messageGripStyle: CSSProperties = {
  width: 36,
  height: 4,
  borderRadius: 999,
  background: 'rgba(23, 23, 23, 0.12)',
  marginBottom: 18,
}

const messageTitleStyle: CSSProperties = {
  margin: '14px 0 7px',
  color: '#171717',
  fontSize: '1.08rem',
  lineHeight: 1.1,
  letterSpacing: '-0.035em',
}

const messageTextStyle: CSSProperties = {
  maxWidth: 270,
  margin: 0,
  color: '#70685f',
  fontSize: '0.84rem',
  lineHeight: 1.45,
  fontWeight: 650,
}

const messageActionRowStyle: CSSProperties = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 9,
  marginTop: 20,
}

const messageCancelButtonStyle: CSSProperties = {
  minHeight: 46,
  border: 0,
  borderRadius: 16,
  color: '#171717',
  background: '#eee9df',
  fontSize: '0.84rem',
  fontWeight: 850,
}

function messageIconWrapStyle(tone: DialogTone): CSSProperties {
  const isDanger = tone === 'danger'

  return {
    width: 54,
    height: 54,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    color: isDanger ? '#b64a46' : '#171717',
    background: isDanger ? '#f3dfdc' : '#eee9df',
  }
}

function messageConfirmButtonStyle(tone: DialogTone): CSSProperties {
  const isDanger = tone === 'danger'

  return {
    minHeight: 46,
    gridColumn: tone === 'default' ? '1 / -1' : undefined,
    border: 0,
    borderRadius: 16,
    color: '#ffffff',
    background: isDanger ? '#b64a46' : '#171717',
    fontSize: '0.84rem',
    fontWeight: 850,
  }
}

const historyBackdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 180,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: '18px',
  background: 'rgba(23, 23, 23, 0.32)',
  backdropFilter: 'blur(8px)',
}

const historyPanelStyle: CSSProperties = {
  width: 'min(100%, 444px)',
  height: 'min(88vh, 780px)',
  display: 'flex',
  flexDirection: 'column',
  padding: 20,
  borderRadius: 30,
  background: '#faf8f3',
  boxShadow: '0 24px 60px rgba(20, 20, 20, 0.28)',
}

const historyHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 16,
}

const historySummaryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 9,
  marginBottom: 13,
}

const historyMetricStyle: CSSProperties = {
  display: 'grid',
  gap: 5,
  padding: '12px 13px',
  borderRadius: 17,
  color: '#171717',
  background: '#ffffff',
  boxShadow: 'inset 0 0 0 1px rgba(23, 23, 23, 0.06)',
}

const historySearchWrapStyle: CSSProperties = {
  minHeight: 48,
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '0 13px',
  borderRadius: 17,
  color: '#6f685f',
  background: '#ffffff',
  boxShadow: 'inset 0 0 0 1px rgba(23, 23, 23, 0.07)',
  marginBottom: 11,
}

const historySearchInputStyle: CSSProperties = {
  width: '100%',
  border: 0,
  outline: 0,
  color: '#171717',
  background: 'transparent',
  fontSize: '0.84rem',
  fontWeight: 700,
}

const historyFilterGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 7,
  marginBottom: 13,
}

function historyFilterButtonStyle(active: boolean): CSSProperties {
  return {
    minHeight: 38,
    border: 0,
    borderRadius: 14,
    color: active ? '#ffffff' : '#171717',
    background: active ? '#171717' : '#eee9df',
    fontSize: '0.7rem',
    fontWeight: 850,
  }
}

const historyListStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  overflowY: 'auto',
  paddingBottom: 8,
}

export default App
