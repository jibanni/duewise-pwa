import './index.css'

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

type BudgetCategory =
  | 'Food'
  | 'Transportation'
  | 'Bills'
  | 'Subscriptions'
  | 'Shopping'
  | 'Savings'
  | 'Debt Payment'
  | 'Other'

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

const initialMonthlyBudgets: MonthlyBudget[] = [
  { id: 1, category: 'Food', limit: 8000 },
  { id: 2, category: 'Transportation', limit: 4000 },
  { id: 3, category: 'Bills', limit: 7000 },
  { id: 4, category: 'Subscriptions', limit: 1500 },
  { id: 5, category: 'Shopping', limit: 5000 },
  { id: 6, category: 'Savings', limit: 10000 },
  { id: 7, category: 'Debt Payment', limit: 8500 },
  { id: 8, category: 'Other', limit: 3000 },
]

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

  const [accountEditor, setAccountEditor] = useState<Account | 'new' | null>(null)
  const [cardEditor, setCardEditor] = useState<CreditCardAccount | 'new' | null>(null)
  const [billEditor, setBillEditor] = useState<RecurringExpense | 'new' | null>(null)
  const [budgetEditor, setBudgetEditor] = useState<MonthlyBudget | null>(null)
  const [goalEditor, setGoalEditor] = useState<SavingsGoal | 'new' | null>(null)
  const [debtEditor, setDebtEditor] = useState<Debt | 'new' | null>(null)
  const [billPaymentTarget, setBillPaymentTarget] = useState<RecurringExpense | null>(null)
  const [cardPaymentTarget, setCardPaymentTarget] = useState<CreditCardAccount | null>(null)
  const [goalMoneyTarget, setGoalMoneyTarget] = useState<{ goal: SavingsGoal; mode: 'deposit' | 'withdraw' } | null>(null)
  const [debtPaymentTarget, setDebtPaymentTarget] = useState<Debt | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(financeData))
  }, [financeData])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
  }, [darkMode])

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

  function saveBudget(budgetId: number, limit: number) {
    if (!Number.isFinite(limit) || limit < 0) {
      showAlert('Invalid Budget', 'Please enter a valid monthly budget amount.')
      return
    }

    setFinanceData((current) => ({
      ...current,
      monthlyBudgets: current.monthlyBudgets.map((budget) =>
        budget.id === budgetId ? { ...budget, limit } : budget,
      ),
    }))
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

            <button className="profile-button" type="button" onClick={resetLocalData}>
              JD
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
              transactions={financeData.transactions}
              creditCardInsights={creditCardInsights}
              recurringExpenses={activeBills}
              onOpenPlan={() => setActiveTab('plan')}
              onOpenWallet={() => setActiveTab('wallet')}
              onOpenTransactions={() => setTransactionHistoryOpen(true)}
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
            budget={budgetEditor}
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

        {transactionHistoryOpen && (
          <TransactionHistoryModal
            transactions={financeData.transactions}
            onClose={() => setTransactionHistoryOpen(false)}
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
  transactions,
  creditCardInsights,
  recurringExpenses,
  onOpenPlan,
  onOpenWallet,
  onOpenTransactions,
}: {
  totalCash: number
  totalDebt: number
  transactions: Transaction[]
  creditCardInsights: CreditCardInsight[]
  recurringExpenses: RecurringExpense[]
  onOpenPlan: () => void
  onOpenWallet: () => void
  onOpenTransactions: () => void
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

      <SectionTitle title="Recent Activity" subtitle="Latest 3 quick transactions" />
      <TransactionList transactions={transactions} limit={3} />

      <button type="button" style={wideSoftButtonStyle} onClick={onOpenTransactions}>
        View All Transactions
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

          <section className="strategy-card">
            <p>Suggested Strategy</p>
            <h3>Snowball Method</h3>
            <span>
              Pay the smallest balance first while maintaining minimum payments
              on other debts.
            </span>
          </section>
        </>
      )}
    </>
  )
}

function BudgetSection({
  budgetMetrics,
  onEditBudget,
}: {
  budgetMetrics: BudgetMetric[]
  onEditBudget: (budget: MonthlyBudget) => void
}) {
  const totalBudget = budgetMetrics.reduce((total, metric) => total + metric.budget.limit, 0)
  const totalSpent = budgetMetrics.reduce((total, metric) => total + metric.spent, 0)
  const remaining = totalBudget - totalSpent
  const progress = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  return (
    <>
      <SectionTitle title="Monthly Budget" subtitle="Track spending by category for this month" />

      <section className="recurring-summary">
        <div>
          <p>Budget Used</p>
          <h2>{peso.format(totalSpent)}</h2>
          <span>
            {remaining >= 0
              ? `${peso.format(remaining)} remaining`
              : `${peso.format(Math.abs(remaining))} over budget`}
          </span>
        </div>
        <strong>{Math.min(progress, 999)}%</strong>
      </section>

      <div className="card-list" style={{ marginTop: 14 }}>
        {budgetMetrics.map((metric) => (
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
                Set Budget
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function InsightsPage({
  totalCash,
  totalSavings,
  totalDebt,
  recurringTotal,
  transactions,
  creditCardInsights,
  budgetMetrics,
  onOpenTransactions,
}: {
  totalCash: number
  totalSavings: number
  totalDebt: number
  recurringTotal: number
  transactions: Transaction[]
  creditCardInsights: CreditCardInsight[]
  budgetMetrics: BudgetMetric[]
  onOpenTransactions: () => void
}) {
  const netWorth = totalCash + totalSavings - totalDebt
  const monthlyIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const monthlyExpenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const netCashflow = monthlyIncome - monthlyExpenses
  const bestCard = creditCardInsights.find((insight) => insight.status === 'recommended')

  const totalBudget = budgetMetrics.reduce((total, metric) => total + metric.budget.limit, 0)
  const totalBudgetSpent = budgetMetrics.reduce((total, metric) => total + metric.spent, 0)
  const overBudgetCount = budgetMetrics.filter((metric) => metric.overBudget).length

  return (
    <>
      <section className="analysis-grid">
        <InfoCard label="Total Cash" value={peso.format(totalCash)} />
        <InfoCard label="Savings" value={peso.format(totalSavings)} />
        <InfoCard label="Total Debt" value={peso.format(totalDebt)} />
        <InfoCard label="Net Worth" value={peso.format(netWorth)} />
      </section>

      <section className="insight-card">
        <p>Cashflow Insight</p>
        <h3>
          {bestCard
            ? `Best card today: ${bestCard.card.name}`
            : netCashflow >= 0
              ? 'Your recorded cashflow is positive.'
              : 'Your recorded expenses are higher than income.'}
        </h3>
        <span>{bestCard ? bestCard.reason : 'This insight is based on your locally recorded quick transactions.'}</span>
      </section>

      <SectionTitle title="Monthly Overview" subtitle="Based on your local transactions and unpaid plan balance" />

      <div className="overview-list">
        <OverviewRow label="Recorded Income" value={peso.format(monthlyIncome)} type="positive" />
        <OverviewRow label="Recorded Expenses" value={peso.format(monthlyExpenses)} type="negative" />
        <OverviewRow label="Net Cashflow" value={peso.format(netCashflow)} type={netCashflow >= 0 ? 'positive' : 'negative'} />
        <OverviewRow label="Unpaid Bills" value={peso.format(recurringTotal)} type="neutral" />
        <OverviewRow label="Transactions" value={`${transactions.length}`} type="neutral" />
      </div>

      <SectionTitle title="Budget Summary" subtitle="Spending progress for this month" />

      <div className="overview-list">
        <OverviewRow label="Monthly Budget" value={peso.format(totalBudget)} type="neutral" />
        <OverviewRow label="Budget Used" value={peso.format(totalBudgetSpent)} type={totalBudgetSpent > totalBudget ? 'negative' : 'neutral'} />
        <OverviewRow label="Over Budget Categories" value={`${overBudgetCount}`} type={overBudgetCount > 0 ? 'negative' : 'positive'} />
      </div>

      <div className="card-list" style={{ marginTop: 14 }}>
        {budgetMetrics.slice(0, 3).map((metric) => (
          <article key={metric.budget.id} className="account-card">
            <div className={`account-icon ${metric.overBudget ? 'blue' : 'green'}`}>
              <BarChart3 size={20} />
            </div>

            <div className="card-main-content">
              <h3>{metric.budget.category}</h3>
              <p>{peso.format(metric.spent)} used of {peso.format(metric.budget.limit)}</p>
            </div>

            <strong>{metric.progress}%</strong>
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

function TransactionList({ transactions, limit = 5 }: { transactions: Transaction[]; limit?: number }) {
  if (transactions.length === 0) {
    return (
      <article className="account-card">
        <div className="card-main-content">
          <h3>No transactions yet</h3>
          <p>Tap the plus button to add income, expense, or transfer.</p>
        </div>
      </article>
    )
  }

  return (
    <div className="card-list">
      {transactions.slice(0, limit).map((transaction) => (
        <TransactionRow key={transaction.id} transaction={transaction} />
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
}: {
  transactions: Transaction[]
  onClose: () => void
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
      <section style={historyPanelStyle}>
        <header style={historyHeaderStyle}>
          <div>
            <p style={modalEyebrowStyle}>Transactions</p>
            <h2 style={modalTitleStyle}>History</h2>
          </div>

          <button type="button" style={modalCloseButtonStyle} onClick={onClose}>
            <X size={21} />
          </button>
        </header>

        <section style={historySummaryGridStyle}>
          <HistoryMetric label="Income" value={peso.format(incomeTotal)} />
          <HistoryMetric label="Expenses" value={peso.format(expenseTotal)} />
          <HistoryMetric label="Transfers" value={peso.format(transferTotal)} />
          <HistoryMetric label="Net" value={peso.format(netTotal)} />
        </section>

        <label style={historySearchWrapStyle}>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search note, account, bill, category..."
            style={historySearchInputStyle}
          />
        </label>

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
    <article style={historyMetricStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function QuickActionModal({
  action,
  accounts,
  creditCards,
  onClose,
  onAddIncome,
  onAddExpense,
  onTransfer,
  onNotify,
}: {
  action: QuickAction
  accounts: Account[]
  creditCards: CreditCardAccount[]
  onClose: () => void
  onAddIncome: (accountId: number, amount: number, note: string) => void
  onAddExpense: (paymentSource: string, amount: number, note: string, category: BudgetCategory) => void
  onTransfer: (sourceAccountId: number, destinationAccountId: number, amount: number, note: string) => void
  onNotify: (title: string, message: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<BudgetCategory>('Food')
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
              {budgetCategories.map((item) => (
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
  budget: MonthlyBudget
  onClose: () => void
  onSave: (budgetId: number, limit: number) => void
  onNotify: (title: string, message: string) => void
}) {
  const [limit, setLimit] = useState(budget.limit.toString())

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedLimit = Number(limit)

    if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
      onNotify('Invalid Budget', 'Please enter a valid monthly budget amount.')
      return
    }

    onSave(budget.id, parsedLimit)
  }

  return (
    <ModalShell eyebrow="Monthly Budget" title={budget.category} onClose={onClose}>
      <form onSubmit={submit} style={modalFormStyle}>
        <TextField label="Monthly budget limit" type="number" value={limit} onChange={setLimit} placeholder="0.00" autoFocus />
        <button type="submit" style={submitButtonStyle}>Save Budget</button>
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

function OverviewRow({
  label,
  value,
  type,
}: {
  label: string
  value: string
  type: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <article className="overview-row">
      <span>{label}</span>
      <strong className={type}>{value}</strong>
    </article>
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
  return typeof value === 'string' && budgetCategories.includes(value as BudgetCategory)
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
  const source = Array.isArray(rawBudgets) ? rawBudgets : []

  return budgetCategories.map((category, index) => {
    const savedBudget = source.find((rawBudget) => {
      const budget = rawBudget as Partial<MonthlyBudget>
      return budget.category === category
    }) as Partial<MonthlyBudget> | undefined

    const fallbackBudget = initialMonthlyBudgets.find((budget) => budget.category === category)
    const savedLimit = Number(savedBudget?.limit ?? fallbackBudget?.limit ?? 0)

    return {
      id: index + 1,
      category,
      limit: Number.isFinite(savedLimit) && savedLimit >= 0 ? savedLimit : 0,
    }
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
