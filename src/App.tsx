import './index.css'

import { createClient, type Session } from '@supabase/supabase-js'

import {
  useEffect,
  useMemo,
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
  BarChart3,
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

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
  maximumFractionDigits: 0,
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

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('today')
  const [fabOpen, setFabOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null)
  const [financeData, setFinanceData] = useState<FinanceData>(loadFinanceData)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark')
  const [messageDialog, setMessageDialog] = useState<MessageDialogState | null>(null)
  const [transactionHistoryOpen, setTransactionHistoryOpen] = useState(false)
  const [cloudSyncOpen, setCloudSyncOpen] = useState(false)
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
    if (!supabase || !session) throw new Error('Sign in to DueWise Cloud first.')

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
      if (!options.silent) showAlert('Sign In Required', 'Sign in to DueWise Cloud before syncing.')
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
      if (!options.silent) showAlert('Sign In Required', 'Sign in to DueWise Cloud before restoring.')
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
        if (!options.silent) showAlert('No Cloud Backup', 'No saved DueWise backup was found for this account.')
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
      message: 'This will replace the local DueWise data on this browser with your saved cloud backup.',
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
    showAlert('Account Created', 'Check your email if confirmation is required. After signing in, DueWise will sync your data.')
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

  function saveCreditCard(card: Omit<CreditCardAccount, 'id' | 'lastPaymentAt'>, id?: number) {
    setFinanceData((current) => ({
      ...current,
      creditCards:
        typeof id === 'number'
          ? current.creditCards.map((item) => (item.id === id ? { ...item, ...card } : item))
          : [...current.creditCards, { ...card, id: createNumericId(current.creditCards) }],
    }))
    setCardEditor(null)
  }

  function deleteCreditCard(id: number) {
    showConfirm({
      title: 'Delete Credit Card?',
      message: 'This will remove the selected credit card.',
      confirmLabel: 'Delete',
      onConfirm: () =>
        setFinanceData((current) => ({
          ...current,
          creditCards: current.creditCards.filter((item) => item.id !== id),
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
          ? { ...item, currentBalance: Math.max(item.currentBalance - amount, 0), lastPaymentAt: paidAt }
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
      title: 'Reset DueWise?',
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
      <section className="mobile-app">
        <header className="app-header">
          <div>
            <p className="brand-name">DueWise</p>
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

            <button className="profile-button" type="button" onClick={() => setCloudSyncOpen(true)}>
              {session ? getUserInitials(session.user.email) : '☁'}
            </button>
          </div>
        </header>

        <section className="balance-hero">
          <div>
            <p className="hero-label">Available Cash</p>
            <h2>{peso.format(totalCash)}</h2>
            <p className="hero-description">Estimated spendable balance across your cash accounts</p>
          </div>
        </section>

        <section className="page-content">
          {activeTab === 'today' && (
            <TodayPage
              totalCash={totalCash}
              totalDebt={totalDebt}
              creditCardInsights={creditCardInsights}
              recurringExpenses={activeBills}
              onOpenPlan={() => setActiveTab('plan')}
              onOpenWallet={() => setActiveTab('wallet')}
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

        {activeTab === 'plan' && !fabOpen && (
          <div className="plan-fab-actions" aria-label="Plan quick add actions">
            <button
              type="button"
              className="plan-mini-fab budget"
              aria-label="Add budget"
              title="Add budget"
              onClick={() => setBudgetEditor('new')}
            >
              <ClipboardList size={22} />
              <span>Budget</span>
            </button>
            <button
              type="button"
              className="plan-mini-fab savings"
              aria-label="Add savings goal"
              title="Add savings goal"
              onClick={() => setGoalEditor('new')}
            >
              <WalletCards size={22} />
              <span>Savings</span>
            </button>
            <button
              type="button"
              className="plan-mini-fab debt"
              aria-label="Add debt"
              title="Add debt"
              onClick={() => setDebtEditor('new')}
            >
              <Landmark size={22} />
              <span>Debt</span>
            </button>
          </div>
        )}

        <button
          className={`main-fab ${fabOpen ? 'open' : ''}`}
          type="button"
          aria-label={fabOpen ? 'Close quick actions' : 'Open quick actions'}
          onClick={() => setFabOpen((current) => !current)}
        >
          {fabOpen ? <X size={25} /> : <Plus size={27} />}
        </button>

        <nav className="bottom-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key

            return (
              <button
                key={item.key}
                type="button"
                className={isActive ? 'active' : ''}
                onClick={() => {
                  setActiveTab(item.key)
                  setFabOpen(false)
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.8} />
                <span>{item.label}</span>
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
            onClose={() => setCardEditor(null)}
            onSave={saveCreditCard}
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

function TodayPage({
  totalCash,
  totalDebt,
  creditCardInsights,
  recurringExpenses,
  onOpenPlan,
  onOpenWallet,
}: {
  totalCash: number
  totalDebt: number
  creditCardInsights: CreditCardInsight[]
  recurringExpenses: RecurringExpense[]
  onOpenPlan: () => void
  onOpenWallet: () => void
}) {
  const days = [
    { day: 'Mon', date: 22 },
    { day: 'Tue', date: 23 },
    { day: 'Wed', date: 24 },
    { day: 'Thu', date: 25 },
    { day: 'Fri', date: 26 },
    { day: 'Sat', date: 27 },
    { day: 'Sun', date: 28 },
  ]

  const dailyRecommendation = getDailyRecommendation(creditCardInsights)

  const billEvents = recurringExpenses.slice(0, 3).map((bill) => ({
    id: `bill-${bill.id}`,
    title: bill.name,
    date: bill.nextDue,
    amount: getBillRemainingBalance(bill),
    type: 'Recurring',
  }))

  const cardEvents = creditCardInsights.slice(0, 1).flatMap((insight) => [
    {
      id: `cutoff-${insight.card.id}`,
      title: `${insight.card.name} Cut-off`,
      date: formatRelativeDays(insight.daysToCutOff),
      amount: 0,
      type: 'Cut-off',
    },
    {
      id: `due-${insight.card.id}`,
      title: `${insight.card.name} Due Date`,
      date: formatRelativeDays(insight.daysToDue),
      amount: insight.card.currentBalance,
      type: 'Due',
    },
  ])

  const events = [...billEvents, ...cardEvents]

  return (
    <>
      <section className="date-strip" aria-label="Calendar dates">
        {days.map((item, index) => (
          <button key={`${item.day}-${item.date}`} type="button" className={index === 3 ? 'selected' : ''}>
            <span>{item.day}</span>
            <strong>{item.date}</strong>
          </button>
        ))}
      </section>

      <section className="recommendation-card">
        <div className="recommendation-icon">
          <CreditCard size={25} />
        </div>

        <div>
          <p>Today’s Recommendation</p>
          <h2>{dailyRecommendation.title}</h2>
          <span>{dailyRecommendation.description}</span>
        </div>
      </section>

      <section className="mini-grid">
        <InfoCard label="Available Cash" value={peso.format(totalCash)} />
        <InfoCard label="Total Debt" value={peso.format(totalDebt)} />
      </section>

      <SectionTitle title="Next Money Events" subtitle="Paid bills are hidden until the next month" />

      <div className="card-list">
        {events.length === 0 && (
          <article className="account-card">
            <div className="card-main-content">
              <h3>No unpaid events yet</h3>
              <p>Add bills or credit cards to generate events.</p>
            </div>
          </article>
        )}

        {events.map((item) => (
          <article key={item.id} className="event-card">
            <div className={`event-indicator ${getEventClass(item.type)}`} />
            <div className="card-main-content">
              <h3>{item.title}</h3>
              <p>{item.date}</p>
            </div>
            <strong>{item.amount > 0 ? peso.format(item.amount) : item.type}</strong>
          </article>
        ))}
      </div>

      <section style={previewCardStyle}>
        <p>Showing your nearest unpaid bills and top card events.</p>
        <button type="button" style={textLinkButtonStyle} onClick={onOpenPlan}>
          View full plan
        </button>
      </section>

      <SectionTitle title="Best Cards" subtitle="Based on cut-off, due date, credit, and utilization" />
      <CreditCardRanking insights={creditCardInsights.slice(0, 2)} />

      <button type="button" style={wideSoftButtonStyle} onClick={onOpenWallet}>
        View wallet
      </button>

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
  return (
    <>
      <div style={accountActionRowStyle}>
        <button type="button" style={softButtonStyle} onClick={onAddAccount}>
          <Plus size={16} />
          Add Account
        </button>
        <button type="button" style={softButtonStyle} onClick={onAddCreditCard}>
          <Plus size={16} />
          Add Card
        </button>
      </div>

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

      <SectionTitle title="Credit Cards" subtitle="Balances, due dates, cut-off dates, and utilization" />

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
            <article key={card.id} className="credit-card">
              <div className="credit-card-header">
                <div>
                  <h3>{card.name}</h3>
                  <p>{insight?.reason ?? 'Available for recommendation'}</p>
                </div>

                <div style={amountActionColumnStyle}>
                  <strong>{utilization}%</strong>
                  <div style={miniActionRowStyle}>
                    <IconButton label={`Pay ${card.name}`} onClick={() => onPayCreditCard(card)}>
                      <ArrowDownLeft size={14} />
                    </IconButton>
                    <IconButton label={`Edit ${card.name}`} onClick={() => onEditCreditCard(card)}>
                      <Pencil size={14} />
                    </IconButton>
                    <IconButton danger label={`Delete ${card.name}`} onClick={() => onDeleteCreditCard(card.id)}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </div>
              </div>

              <div className="progress-track">
                <div
                  className={`progress-fill ${utilization >= 50 ? 'warning' : ''}`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>

              <div className="credit-details">
                <span>
                  Balance
                  <strong>{peso.format(card.currentBalance)}</strong>
                </span>
                <span>
                  Available
                  <strong>{peso.format(card.creditLimit - card.currentBalance)}</strong>
                </span>
              </div>

              <div className="credit-dates">
                <span>Cut-off: {formatOrdinalDay(card.cutOffDay)}</span>
                <span>Due: {formatOrdinalDay(card.dueDay)}</span>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

function PlanPage({
  recurringExpenses,
  recurringTotal,
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

  const totalBudgetSpent = budgetMetrics.reduce(
    (total, metric) => total + metric.spent,
    0,
  )
  const totalSaved = savingsGoals.reduce(
    (total, goal) => total + goal.current,
    0,
  )
  const totalTarget = savingsGoals.reduce(
    (total, goal) => total + goal.target,
    0,
  )
  const totalLoanBalance = debts.reduce((total, debt) => total + debt.balance, 0)

  const sectionCards: Array<{
    key: PlanSectionKey
    label: string
    value: string
    helper: string
  }> = [
    {
      key: 'bills',
      label: 'Bills',
      value: peso.format(recurringTotal),
      helper: `${recurringExpenses.length} unpaid`,
    },
    {
      key: 'budget',
      label: 'Budget',
      value: peso.format(totalBudgetSpent),
      helper: `${budgetMetrics.filter((metric) => metric.overBudget).length} over`,
    },
    {
      key: 'savings',
      label: 'Savings',
      value: peso.format(totalSaved),
      helper: `${savingsGoals.length} goals`,
    },
    {
      key: 'debts',
      label: 'Debts',
      value: peso.format(totalLoanBalance),
      helper: `${debts.length} tracked`,
    },
  ]

  return (
    <>
      <SectionTitle
        title="Plan Center"
        subtitle="Use the cards below to switch sections"
      />

      <section style={planSummaryGridStyle}>
        {sectionCards.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`plan-summary-card ${activePlanSection === item.key ? 'active' : ''}`}
            style={planSummaryButtonStyle(activePlanSection === item.key)}
            onClick={() => setActivePlanSection(item.key)}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.helper}</small>
          </button>
        ))}
      </section>

      {activePlanSection === 'bills' && (
        <>
          <section className="recurring-summary">
            <div>
              <p>Unpaid Bills Balance</p>
              <h2>{peso.format(recurringTotal)}</h2>
              <span>Fully paid bills are hidden until the next month</span>
            </div>
            <Repeat2 size={30} />
          </section>

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
                    <span>Next due: {expense.nextDue}</span>
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

  const healthSummary = useMemo(
    () =>
      getFinancialHealthSummary({
        totalCash,
        totalSavings,
        totalDebt,
        recurringTotal,
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
      recurringTotal,
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
        debtPlan: debtComparison.recommended,
      }),
    [
      totalCash,
      recurringTotal,
      netCashflow,
      budgetMetrics,
      creditCardInsights,
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
      }),
    [parsedAffordAmount, totalCash, recurringTotal, creditCardInsights],
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
          <SectionTitle title="Debt Freedom Coach" subtitle="Compare payoff strategies without crowding the whole page" />

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
                Estimated debt-free date: {getDebtFreeDateLabel(debtComparison.recommended.months)} · Interest saved: {peso.format(debtComparison.interestSaved)}
              </p>
            </div>
          </section>

          <ChartCard title="Debt-free projection" subtitle="Projected total debt balance using the recommended strategy.">
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
        <span>DueWise check</span>
        <p>{result.message}</p>
      </div>
    </section>
  )
}

function CreditCardRanking({ insights }: { insights: CreditCardInsight[] }) {
  if (insights.length === 0) {
    return (
      <article className="account-card">
        <div className="card-main-content">
          <h3>No credit cards yet</h3>
          <p>Add a credit card to enable DueWise recommendations.</p>
        </div>
      </article>
    )
  }

  return (
    <div className="card-list">
      {insights.map((insight) => (
        <article key={insight.card.id} className="account-card">
          <div className={`account-icon ${getInsightAccent(insight.status)}`}>
            <CreditCard size={21} />
          </div>

          <div className="card-main-content">
            <h3>{insight.card.name}</h3>
            <p>{insight.reason}</p>
          </div>

          <strong>{insight.status === 'recommended' ? 'Best' : insight.status}</strong>
        </article>
      ))}
    </div>
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

function CreditCardEditorModal({
  card,
  onClose,
  onSave,
  onNotify,
}: {
  card?: CreditCardAccount
  onClose: () => void
  onSave: (card: Omit<CreditCardAccount, 'id' | 'lastPaymentAt'>, id?: number) => void
  onNotify: (title: string, message: string) => void
}) {
  const [name, setName] = useState(card?.name ?? '')
  const [currentBalance, setCurrentBalance] = useState(card?.currentBalance.toString() ?? '')
  const [creditLimit, setCreditLimit] = useState(card?.creditLimit.toString() ?? '')
  const [cutOffDay, setCutOffDay] = useState(card?.cutOffDay.toString() ?? '')
  const [dueDay, setDueDay] = useState(card?.dueDay.toString() ?? '')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedBalance = Number(currentBalance)
    const parsedLimit = Number(creditLimit)
    const parsedCutOff = Number(cutOffDay)
    const parsedDue = Number(dueDay)

    if (!name.trim()) return onNotify('Card Name Required', 'Please enter a credit card name.')
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) return onNotify('Invalid Credit Limit', 'Please enter a valid credit limit.')
    if (!Number.isFinite(parsedBalance) || parsedBalance < 0 || parsedBalance > parsedLimit) return onNotify('Invalid Balance', 'Please enter a valid current balance.')
    if (!isValidDayOfMonth(parsedCutOff)) return onNotify('Invalid Cut-off Day', 'Please enter a valid cut-off day from 1 to 31.')
    if (!isValidDayOfMonth(parsedDue)) return onNotify('Invalid Due Day', 'Please enter a valid due day from 1 to 31.')

    onSave(
      {
        name: name.trim(),
        currentBalance: parsedBalance,
        creditLimit: parsedLimit,
        cutOffDay: parsedCutOff,
        dueDay: parsedDue,
      },
      card?.id,
    )
  }

  return (
    <ModalShell eyebrow="Credit Card" title={card ? 'Edit Credit Card' : 'Add Credit Card'} onClose={onClose}>
      <form onSubmit={submit} style={modalFormStyle}>
        <TextField label="Card name" value={name} onChange={setName} placeholder="Example: BPI Visa" autoFocus />
        <TextField label="Current balance" type="number" value={currentBalance} onChange={setCurrentBalance} placeholder="0.00" />
        <TextField label="Credit limit" type="number" value={creditLimit} onChange={setCreditLimit} placeholder="50000" />
        <TextField label="Cut-off day" type="number" value={cutOffDay} onChange={setCutOffDay} placeholder="Example: 12" />
        <TextField label="Due day" type="number" value={dueDay} onChange={setDueDay} placeholder="Example: 2" />
        <button type="submit" style={submitButtonStyle}>Save Credit Card</button>
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
  const [amount, setAmount] = useState(card.currentBalance.toString())
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
    <ModalShell eyebrow="DueWise Cloud" title={sessionEmail ? 'Cloud Sync' : 'Sign in to sync'} onClose={onClose}>
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
            Sign in so DueWise can restore your data after clearing browser storage.
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
            {mode === 'sign-in' ? 'Create new DueWise Cloud account' : 'I already have an account'}
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
  type?: 'text' | 'number'
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
  if (Math.abs(value) >= 1_000_000) return `₱${Math.round(value / 1_000_000)}M`
  if (Math.abs(value) >= 1_000) return `₱${Math.round(value / 1_000)}k`
  return `₱${Math.round(value)}`
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
      dueDate: parseUpcomingMonthDay(expense.nextDue),
      amount: getBillRemainingBalance(expense),
    })),
    ...creditCardInsights.map((insight) => ({
      dueDate: addDays(today, insight.daysToDue),
      amount: getCreditCardMinimumPayment(insight.card),
    })),
    ...debts.map((debt) => ({
      dueDate: parseRecurringDay(debt.due),
      amount: Math.min(debt.monthly, debt.balance),
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
    annualRate: 0.36,
    kind: 'Credit card' as const,
  }))

  const debtItems = debts.map((debt) => ({
    id: `debt-${debt.id}`,
    name: debt.name,
    balance: Math.max(0, debt.balance),
    minimumPayment: Math.max(1, debt.monthly),
    annualRate: 0.12,
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
      const minimumPayment = Math.min(items[index].minimumPayment, balances[index])
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
  debtPlan,
}: {
  totalCash: number
  recurringTotal: number
  netCashflow: number
  budgetMetrics: BudgetMetric[]
  creditCardInsights: CreditCardInsight[]
  debtPlan: DebtPayoffPlan
}): SmartInsight[] {
  const cards: SmartInsight[] = []
  const overBudget = budgetMetrics.find((metric) => metric.overBudget)
  const riskyCard = creditCardInsights.find((insight) => insight.status === 'avoid')
  const recommendedCard = creditCardInsights.find((insight) => insight.status === 'recommended')

  if (recurringTotal > 0) {
    cards.push({
      label: 'Bills first',
      title: `Reserve ${peso.format(recurringTotal)}`,
      message: `Keep this amount untouched for unpaid bills. Current cash after reservation: ${peso.format(totalCash - recurringTotal)}.`,
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
  const cleanIncome = Math.max(0, Math.round(income))
  const creditCardDebt = creditCardInsights.reduce((total, insight) => total + insight.card.currentBalance, 0)
  const loanBalance = debts.reduce((total, debt) => total + debt.balance, 0)
  const monthlyLoanDue = debts.reduce((total, debt) => total + Math.min(debt.monthly, debt.balance), 0)
  const riskyCard = creditCardInsights.find((insight) => insight.status === 'avoid')
  const watchCard = creditCardInsights.find((insight) => insight.status === 'watch')

  let remaining = cleanIncome
  const bills = Math.min(remaining, recurringTotal)
  remaining -= bills

  const creditCardTarget = creditCardDebt > 0 ? Math.min(remaining, Math.round(cleanIncome * 0.28), creditCardDebt) : 0
  remaining -= creditCardTarget

  const loanTarget = loanBalance > 0 ? Math.min(remaining, monthlyLoanDue || Math.round(cleanIncome * 0.18), loanBalance) : 0
  remaining -= loanTarget

  const savingsTarget = Math.min(remaining, Math.round(cleanIncome * (creditCardDebt + loanBalance > 0 ? 0.10 : 0.25)))
  remaining -= savingsTarget

  const flexibleCash = Math.max(0, remaining)
  const focusName =
    riskyCard?.card.name ??
    watchCard?.card.name ??
    (debtPlan.focusName !== 'No active debt' ? debtPlan.focusName : recurringTotal > 0 ? 'Unpaid bills' : 'Savings buffer')

  if (cleanIncome <= 0) {
    return {
      income: cleanIncome,
      bills: 0,
      creditCards: 0,
      loanDebts: 0,
      savings: 0,
      flexibleCash: 0,
      focusName: 'Enter an income amount',
      message: 'Add your expected payday amount to generate an allocation plan.',
      tone: 'watch',
    }
  }

  if (cleanIncome < recurringTotal) {
    return {
      income: cleanIncome,
      bills,
      creditCards: 0,
      loanDebts: 0,
      savings: 0,
      flexibleCash,
      focusName: 'Unpaid bills',
      message: `This income is not enough to fully cover unpaid bills. Add ${peso.format(recurringTotal - cleanIncome)} more or delay non-essential spending.`,
      tone: 'risk',
    }
  }

  const projectedCash = totalCash + cleanIncome - bills - creditCardTarget - loanTarget - savingsTarget
  const tone: PaydayAllocationPlan['tone'] = projectedCash >= recurringTotal * 1.5 ? 'good' : 'watch'
  const message =
    creditCardDebt + loanBalance > 0
      ? `Reserve bills first, then send extra money to ${focusName}. Keep flexible cash for food, transport, and small emergencies.`
      : 'Bills are covered. Build your savings buffer and keep flexible cash for the rest of the pay period.'

  return {
    income: cleanIncome,
    bills,
    creditCards: creditCardTarget,
    loanDebts: loanTarget,
    savings: savingsTarget,
    flexibleCash,
    focusName,
    message,
    tone,
  }
}

function getAffordabilityResult({
  amount,
  totalCash,
  recurringTotal,
  creditCardInsights,
}: {
  amount: number
  totalCash: number
  recurringTotal: number
  creditCardInsights: CreditCardInsight[]
}): AffordabilityResult {
  const cleanAmount = Math.max(0, Math.round(amount))
  const remainingCash = totalCash - cleanAmount
  const safeBuffer = Math.max(3000, recurringTotal * 1.25)
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
    const canUseRecommendedCard = Boolean(recommendedCard && availableRecommendedCredit >= cleanAmount)
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

  if (remainingCash < recurringTotal) {
    return {
      status: 'Not recommended',
      tone: 'risk',
      remainingCash,
      message: `This purchase may leave you short for unpaid bills. Keep at least ${peso.format(recurringTotal)} reserved before spending on wants.`,
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
    message: 'This purchase appears affordable based on your current cash and known unpaid bills. Still avoid it if it is not a priority.',
    paymentAdvice: recommendedCard ? `Cash or ${recommendedCard.card.name}` : 'Cash is okay',
  }
}

function getCreditCardMinimumPayment(card: CreditCardAccount) {
  return Math.min(card.currentBalance, Math.max(500, Math.round(card.currentBalance * 0.04)))
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
    description: 'DueWise needs at least one credit card to calculate the best card to use today.',
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
  if (type === 'Due') return 'due'
  if (type === 'Cut-off') return 'cutoff'
  return 'recurring'
}

function getTransactionAccent(type: QuickAction): AccountAccent {
  if (type === 'income') return 'green'
  if (type === 'expense') return 'blue'
  return 'teal'
}

function getInsightAccent(status: CreditCardInsight['status']): AccountAccent {
  if (status === 'recommended') return 'green'
  if (status === 'avoid') return 'blue'
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


function getUserInitials(email?: string) {
  if (!email) return '☁'
  const name = email.split('@')[0].replace(/[^a-zA-Z0-9]+/g, ' ').trim()
  if (!name) return 'DW'

  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
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

    return {
      id: Number(debt.id ?? index + 1),
      name: String(debt.name ?? `Debt ${index + 1}`),
      balance: Number.isFinite(balance) && balance >= 0 ? balance : 0,
      monthly: Number.isFinite(monthly) && monthly > 0 ? monthly : 1,
      due: String(debt.due ?? 'Every month'),
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

const planSummaryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 16,
}

function planSummaryButtonStyle(active: boolean): CSSProperties {
  return {
    minHeight: 94,
    display: 'grid',
    alignContent: 'center',
    gap: 5,
    padding: '14px 13px',
    border: active
      ? '1.5px solid rgba(126, 224, 169, 0.82)'
      : '1px solid rgba(255, 255, 255, 0.1)',
    outline: active ? '2px solid rgba(126, 224, 169, 0.18)' : 'none',
    outlineOffset: 2,
    borderRadius: 22,
    color: active ? '#ffffff' : '#171717',
    background: active ? 'rgba(126, 224, 169, 0.12)' : 'rgba(255, 255, 255, 0.78)',
    boxShadow: active
      ? '0 0 0 1px rgba(126, 224, 169, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 16px 34px rgba(23, 23, 23, 0.22)'
      : 'inset 0 0 0 1px rgba(23, 23, 23, 0.06)',
    transform: active ? 'translateY(-1px)' : 'none',
    textAlign: 'left',
  }
}

const accountActionRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 4,
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

const wideSoftButtonStyle: CSSProperties = {
  ...softButtonStyle,
  marginTop: 10,
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
