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
type QuickAction = 'income' | 'expense' | 'transfer'
type TransactionFilter = 'all' | QuickAction
type AccountAccent = 'green' | 'blue' | 'teal'
type GoalMoneyMode = 'deposit' | 'withdraw'
type DialogTone = 'default' | 'danger' | 'success'

type MessageDialogState = {
  type: 'alert' | 'confirm'
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: DialogTone
  onConfirm?: () => void
}

type NotifyFunction = (title: string, message: string) => void

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

type Transaction = {
  id: string
  type: QuickAction
  amount: number
  label: string
  accountLabel: string
  createdAt: string
}

type FinanceData = {
  accounts: Account[]
  creditCards: CreditCardAccount[]
  savingsGoals: SavingsGoal[]
  debts: Debt[]
  recurringExpenses: RecurringExpense[]
  transactions: Transaction[]
}

type NavItem = {
  key: TabKey
  label: string
  icon: ElementType
}

type AccountFormValues = Omit<Account, 'id'>
type CreditCardFormValues = Omit<CreditCardAccount, 'id' | 'lastPaymentAt'>
type RecurringExpenseFormValues = Omit<
  RecurringExpense,
  'id' | 'remainingBalance' | 'periodKey' | 'lastPaidAt'
>
type SavingsGoalFormValues = Omit<SavingsGoal, 'id'>
type DebtFormValues = Omit<Debt, 'id'>

type AccountEditorState =
  | {
      mode: 'add'
      account?: undefined
    }
  | {
      mode: 'edit'
      account: Account
    }

type CreditCardEditorState =
  | {
      mode: 'add'
      creditCard?: undefined
    }
  | {
      mode: 'edit'
      creditCard: CreditCardAccount
    }

type RecurringExpenseEditorState =
  | {
      mode: 'add'
      recurringExpense?: undefined
    }
  | {
      mode: 'edit'
      recurringExpense: RecurringExpense
    }

type SavingsGoalEditorState =
  | {
      mode: 'add'
      savingsGoal?: undefined
    }
  | {
      mode: 'edit'
      savingsGoal: SavingsGoal
    }

type DebtEditorState =
  | {
      mode: 'add'
      debt?: undefined
    }
  | {
      mode: 'edit'
      debt: Debt
    }

type GoalMoneyState = {
  mode: GoalMoneyMode
  savingsGoal: SavingsGoal
}

const STORAGE_KEY = 'duewise-local-data-v1'
const THEME_KEY = 'duewise-theme'
const DAY_IN_MS = 1000 * 60 * 60 * 24

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

const initialFinanceData: FinanceData = {
  accounts: [
    {
      id: 1,
      name: 'Cash Wallet',
      type: 'Cash',
      balance: 4200,
      accent: 'green',
    },
    {
      id: 2,
      name: 'BPI Savings',
      type: 'Bank Account',
      balance: 28500,
      accent: 'blue',
    },
    {
      id: 3,
      name: 'GCash',
      type: 'E-Wallet',
      balance: 3150,
      accent: 'teal',
    },
  ],
  creditCards: [
    {
      id: 1,
      name: 'BPI Visa',
      currentBalance: 8200,
      creditLimit: 50000,
      cutOffDay: 12,
      dueDay: 2,
    },
    {
      id: 2,
      name: 'Metrobank Mastercard',
      currentBalance: 18400,
      creditLimit: 60000,
      cutOffDay: 28,
      dueDay: 18,
    },
  ],
  savingsGoals: [
    {
      id: 1,
      name: 'Emergency Fund',
      current: 25000,
      target: 100000,
      targetDate: 'December 2027',
    },
    {
      id: 2,
      name: 'Travel Fund',
      current: 8500,
      target: 30000,
      targetDate: 'May 2027',
    },
  ],
  debts: [
    {
      id: 1,
      name: 'Phone Installment',
      balance: 24500,
      monthly: 3500,
      due: 'Every 20th',
    },
    {
      id: 2,
      name: 'Personal Loan',
      balance: 45000,
      monthly: 5000,
      due: 'Every 15th',
    },
  ],
  recurringExpenses: [
    {
      id: 1,
      name: 'Internet',
      category: 'Utilities',
      amount: 1699,
      frequency: 'Monthly',
      nextDue: 'June 30',
    },
    {
      id: 2,
      name: 'Netflix',
      category: 'Subscription',
      amount: 549,
      frequency: 'Monthly',
      nextDue: 'July 5',
    },
    {
      id: 3,
      name: 'Electricity',
      category: 'Utilities',
      amount: 3200,
      frequency: 'Monthly',
      nextDue: 'July 10',
    },
  ],
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
  const [accountEditor, setAccountEditor] =
    useState<AccountEditorState | null>(null)
  const [creditCardEditor, setCreditCardEditor] =
    useState<CreditCardEditorState | null>(null)
  const [recurringExpenseEditor, setRecurringExpenseEditor] =
    useState<RecurringExpenseEditorState | null>(null)
  const [savingsGoalEditor, setSavingsGoalEditor] =
    useState<SavingsGoalEditorState | null>(null)
  const [debtEditor, setDebtEditor] = useState<DebtEditorState | null>(null)
  const [goalMoneyAction, setGoalMoneyAction] = useState<GoalMoneyState | null>(
    null,
  )
  const [debtPaymentTarget, setDebtPaymentTarget] = useState<Debt | null>(null)
  const [billPaymentTarget, setBillPaymentTarget] =
    useState<RecurringExpense | null>(null)
  const [creditCardPaymentTarget, setCreditCardPaymentTarget] =
    useState<CreditCardAccount | null>(null)
  const [transactionHistoryOpen, setTransactionHistoryOpen] = useState(false)
  const [messageDialog, setMessageDialog] =
    useState<MessageDialogState | null>(null)
  const [financeData, setFinanceData] = useState<FinanceData>(loadFinanceData)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem(THEME_KEY) === 'dark'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(financeData))
  }, [financeData])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
  }, [darkMode])

  const activeRecurringExpenses = useMemo(
    () =>
      financeData.recurringExpenses.filter(
        (expense) => getBillRemainingBalance(expense) > 0,
      ),
    [financeData.recurringExpenses],
  )

  const totalCash = useMemo(
    () =>
      financeData.accounts.reduce(
        (total, account) => total + account.balance,
        0,
      ),
    [financeData.accounts],
  )

  const totalCreditCardDebt = useMemo(
    () =>
      financeData.creditCards.reduce(
        (total, creditCard) => total + creditCard.currentBalance,
        0,
      ),
    [financeData.creditCards],
  )

  const totalSavings = useMemo(
    () =>
      financeData.savingsGoals.reduce(
        (total, goal) => total + goal.current,
        0,
      ),
    [financeData.savingsGoals],
  )

  const totalDebt = useMemo(
    () =>
      financeData.debts.reduce((total, debt) => total + debt.balance, 0) +
      totalCreditCardDebt,
    [financeData.debts, totalCreditCardDebt],
  )

  const recurringTotal = useMemo(
    () =>
      activeRecurringExpenses.reduce(
        (total, expense) => total + getBillRemainingBalance(expense),
        0,
      ),
    [activeRecurringExpenses],
  )

  const creditCardInsights = useMemo(
    () => getCreditCardInsights(financeData.creditCards),
    [financeData.creditCards],
  )

  function showAlert(title: string, message: string) {
    setMessageDialog({
      type: 'alert',
      title,
      message,
      confirmLabel: 'Okay',
      tone: 'default',
    })
  }

  function showConfirm({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'danger',
    onConfirm,
  }: Omit<MessageDialogState, 'type'>) {
    setMessageDialog({
      type: 'confirm',
      title,
      message,
      confirmLabel,
      cancelLabel,
      tone,
      onConfirm,
    })
  }

  function closeMessageDialog() {
    setMessageDialog(null)
  }

  function confirmMessageDialog() {
    const action = messageDialog?.onConfirm
    setMessageDialog(null)
    action?.()
  }

  function changeTab(tab: TabKey) {
    setActiveTab(tab)
    setFabOpen(false)
  }

  function openQuickAction(action: QuickAction) {
    setActiveAction(action)
    setFabOpen(false)
  }

  function handleSaveAccount(values: AccountFormValues) {
    if (accountEditor?.mode === 'edit') {
      const accountId = accountEditor.account.id

      setFinanceData((current) => ({
        ...current,
        accounts: current.accounts.map((account) =>
          account.id === accountId ? { ...account, ...values } : account,
        ),
      }))
    } else {
      setFinanceData((current) => ({
        ...current,
        accounts: [
          ...current.accounts,
          {
            id: createNumericId(current.accounts),
            ...values,
          },
        ],
      }))
    }

    setAccountEditor(null)
  }

  function handleDeleteAccount(accountId: number) {
    if (financeData.accounts.length <= 1) {
      showAlert('Account Required', 'At least one cash account is required.')
      return
    }

    const account = financeData.accounts.find((item) => item.id === accountId)

    showConfirm({
      title: 'Delete Account?',
      message: `This will remove ${
        account?.name ?? 'this account'
      } from your wallet.`,
      confirmLabel: 'Delete',
      tone: 'danger',
      onConfirm: () => {
        setFinanceData((current) => ({
          ...current,
          accounts: current.accounts.filter((item) => item.id !== accountId),
        }))
      },
    })
  }

  function handleSaveCreditCard(values: CreditCardFormValues) {
    if (creditCardEditor?.mode === 'edit') {
      const creditCardId = creditCardEditor.creditCard.id

      setFinanceData((current) => ({
        ...current,
        creditCards: current.creditCards.map((creditCard) =>
          creditCard.id === creditCardId
            ? { ...creditCard, ...values }
            : creditCard,
        ),
      }))
    } else {
      setFinanceData((current) => ({
        ...current,
        creditCards: [
          ...current.creditCards,
          {
            id: createNumericId(current.creditCards),
            ...values,
          },
        ],
      }))
    }

    setCreditCardEditor(null)
  }

  function handleDeleteCreditCard(creditCardId: number) {
    const creditCard = financeData.creditCards.find(
      (item) => item.id === creditCardId,
    )

    showConfirm({
      title: 'Delete Credit Card?',
      message: `This will remove ${
        creditCard?.name ?? 'this card'
      } from your wallet.`,
      confirmLabel: 'Delete',
      tone: 'danger',
      onConfirm: () => {
        setFinanceData((current) => ({
          ...current,
          creditCards: current.creditCards.filter(
            (item) => item.id !== creditCardId,
          ),
        }))
      },
    })
  }

  function handlePayCreditCard(
    creditCardId: number,
    accountId: number,
    amount: number,
  ) {
    const creditCard = financeData.creditCards.find(
      (item) => item.id === creditCardId,
    )
    const account = financeData.accounts.find((item) => item.id === accountId)

    if (!creditCard || !account) {
      showAlert('Invalid Payment', 'Please select valid payment details.')
      return
    }

    if (amount > account.balance) {
      showAlert(
        'Insufficient Balance',
        'Your selected account has insufficient balance.',
      )
      return
    }

    if (amount > creditCard.currentBalance) {
      showAlert(
        'Invalid Amount',
        'Payment is higher than the current credit card balance.',
      )
      return
    }

    const paidAt = new Date().toISOString()

    const transaction: Transaction = {
      id: createId(),
      type: 'transfer',
      amount,
      label: `Credit card payment - ${creditCard.name}`,
      accountLabel: `${account.name} → ${creditCard.name}`,
      createdAt: paidAt,
    }

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) =>
        item.id === accountId
          ? { ...item, balance: item.balance - amount }
          : item,
      ),
      creditCards: current.creditCards.map((item) =>
        item.id === creditCardId
          ? {
              ...item,
              currentBalance: Math.max(item.currentBalance - amount, 0),
              lastPaymentAt: paidAt,
            }
          : item,
      ),
      transactions: [transaction, ...current.transactions].slice(0, 50),
    }))

    setCreditCardPaymentTarget(null)
  }

  function handleSaveRecurringExpense(values: RecurringExpenseFormValues) {
    const currentPeriodKey = getCurrentPeriodKey()

    if (recurringExpenseEditor?.mode === 'edit') {
      const recurringExpenseId = recurringExpenseEditor.recurringExpense.id
      const oldExpense = recurringExpenseEditor.recurringExpense
      const oldRemainingBalance = getBillRemainingBalance(oldExpense)
      const alreadyPaid = Math.max(oldExpense.amount - oldRemainingBalance, 0)
      const newRemainingBalance = Math.max(values.amount - alreadyPaid, 0)

      setFinanceData((current) => ({
        ...current,
        recurringExpenses: current.recurringExpenses.map((expense) =>
          expense.id === recurringExpenseId
            ? {
                ...expense,
                ...values,
                remainingBalance: newRemainingBalance,
                periodKey: currentPeriodKey,
              }
            : expense,
        ),
      }))
    } else {
      setFinanceData((current) => ({
        ...current,
        recurringExpenses: [
          ...current.recurringExpenses,
          {
            id: createNumericId(current.recurringExpenses),
            ...values,
            remainingBalance: values.amount,
            periodKey: currentPeriodKey,
          },
        ],
      }))
    }

    setRecurringExpenseEditor(null)
  }

  function handleDeleteRecurringExpense(recurringExpenseId: number) {
    const recurringExpense = financeData.recurringExpenses.find(
      (item) => item.id === recurringExpenseId,
    )

    showConfirm({
      title: 'Delete Bill?',
      message: `This will remove ${
        recurringExpense?.name ?? 'this bill'
      } from your monthly plan.`,
      confirmLabel: 'Delete',
      tone: 'danger',
      onConfirm: () => {
        setFinanceData((current) => ({
          ...current,
          recurringExpenses: current.recurringExpenses.filter(
            (item) => item.id !== recurringExpenseId,
          ),
        }))
      },
    })
  }

  function handlePayBill(
    recurringExpenseId: number,
    accountId: number,
    amount: number,
  ) {
    const recurringExpense = financeData.recurringExpenses.find(
      (item) => item.id === recurringExpenseId,
    )
    const account = financeData.accounts.find((item) => item.id === accountId)

    if (!recurringExpense || !account) {
      showAlert('Invalid Payment', 'Please select valid payment details.')
      return
    }

    const currentBalanceDue = getBillRemainingBalance(recurringExpense)

    if (amount > account.balance) {
      showAlert(
        'Insufficient Balance',
        'Your selected account has insufficient balance.',
      )
      return
    }

    if (amount > currentBalanceDue) {
      showAlert(
        'Invalid Amount',
        'Payment is higher than the remaining bill balance.',
      )
      return
    }

    const paidAt = new Date().toISOString()
    const newBalanceDue = Math.max(currentBalanceDue - amount, 0)

    const transaction: Transaction = {
      id: createId(),
      type: 'expense',
      amount,
      label: `Bill payment - ${recurringExpense.name}`,
      accountLabel: account.name,
      createdAt: paidAt,
    }

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) =>
        item.id === accountId
          ? { ...item, balance: item.balance - amount }
          : item,
      ),
      recurringExpenses: current.recurringExpenses.map((item) =>
        item.id === recurringExpenseId
          ? {
              ...item,
              remainingBalance: newBalanceDue,
              periodKey: getCurrentPeriodKey(),
              lastPaidAt: paidAt,
            }
          : item,
      ),
      transactions: [transaction, ...current.transactions].slice(0, 50),
    }))

    setBillPaymentTarget(null)
  }

  function handleSaveSavingsGoal(values: SavingsGoalFormValues) {
    if (savingsGoalEditor?.mode === 'edit') {
      const savingsGoalId = savingsGoalEditor.savingsGoal.id

      setFinanceData((current) => ({
        ...current,
        savingsGoals: current.savingsGoals.map((goal) =>
          goal.id === savingsGoalId ? { ...goal, ...values } : goal,
        ),
      }))
    } else {
      setFinanceData((current) => ({
        ...current,
        savingsGoals: [
          ...current.savingsGoals,
          {
            id: createNumericId(current.savingsGoals),
            ...values,
          },
        ],
      }))
    }

    setSavingsGoalEditor(null)
  }

  function handleDeleteSavingsGoal(savingsGoalId: number) {
    const goal = financeData.savingsGoals.find(
      (item) => item.id === savingsGoalId,
    )

    showConfirm({
      title: 'Delete Savings Goal?',
      message: `This will remove ${
        goal?.name ?? 'this savings goal'
      } from your plan.`,
      confirmLabel: 'Delete',
      tone: 'danger',
      onConfirm: () => {
        setFinanceData((current) => ({
          ...current,
          savingsGoals: current.savingsGoals.filter(
            (item) => item.id !== savingsGoalId,
          ),
        }))
      },
    })
  }

  function handleMoveGoalMoney(
    goalId: number,
    accountId: number,
    amount: number,
    mode: GoalMoneyMode,
  ) {
    const goal = financeData.savingsGoals.find((item) => item.id === goalId)
    const account = financeData.accounts.find((item) => item.id === accountId)

    if (!goal || !account) {
      showAlert('Invalid Details', 'Please select valid details.')
      return
    }

    if (mode === 'deposit' && amount > account.balance) {
      showAlert(
        'Insufficient Balance',
        'Your selected account has insufficient balance.',
      )
      return
    }

    if (mode === 'deposit' && amount > goal.target - goal.current) {
      showAlert(
        'Target Exceeded',
        'Deposit is higher than the remaining target amount.',
      )
      return
    }

    if (mode === 'withdraw' && amount > goal.current) {
      showAlert(
        'Invalid Withdrawal',
        'Withdrawal is higher than the current saved amount.',
      )
      return
    }

    const transaction: Transaction = {
      id: createId(),
      type: 'transfer',
      amount,
      label:
        mode === 'deposit'
          ? `Add to savings - ${goal.name}`
          : `Withdraw from savings - ${goal.name}`,
      accountLabel:
        mode === 'deposit'
          ? `${account.name} → ${goal.name}`
          : `${goal.name} → ${account.name}`,
      createdAt: new Date().toISOString(),
    }

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) =>
        item.id === accountId
          ? {
              ...item,
              balance:
                mode === 'deposit'
                  ? item.balance - amount
                  : item.balance + amount,
            }
          : item,
      ),
      savingsGoals: current.savingsGoals.map((item) =>
        item.id === goalId
          ? {
              ...item,
              current:
                mode === 'deposit'
                  ? item.current + amount
                  : Math.max(item.current - amount, 0),
            }
          : item,
      ),
      transactions: [transaction, ...current.transactions].slice(0, 50),
    }))

    setGoalMoneyAction(null)
  }

  function handleSaveDebt(values: DebtFormValues) {
    if (debtEditor?.mode === 'edit') {
      const debtId = debtEditor.debt.id

      setFinanceData((current) => ({
        ...current,
        debts: current.debts.map((debt) =>
          debt.id === debtId ? { ...debt, ...values } : debt,
        ),
      }))
    } else {
      setFinanceData((current) => ({
        ...current,
        debts: [
          ...current.debts,
          {
            id: createNumericId(current.debts),
            ...values,
          },
        ],
      }))
    }

    setDebtEditor(null)
  }

  function handleDeleteDebt(debtId: number) {
    const debt = financeData.debts.find((item) => item.id === debtId)

    showConfirm({
      title: 'Delete Debt?',
      message: `This will remove ${debt?.name ?? 'this debt'} from your tracker.`,
      confirmLabel: 'Delete',
      tone: 'danger',
      onConfirm: () => {
        setFinanceData((current) => ({
          ...current,
          debts: current.debts.filter((item) => item.id !== debtId),
        }))
      },
    })
  }

  function handleRecordDebtPayment(
    debtId: number,
    accountId: number,
    amount: number,
  ) {
    const debt = financeData.debts.find((item) => item.id === debtId)
    const account = financeData.accounts.find((item) => item.id === accountId)

    if (!debt || !account) {
      showAlert('Invalid Payment', 'Please select valid details.')
      return
    }

    if (amount > account.balance) {
      showAlert(
        'Insufficient Balance',
        'Your selected account has insufficient balance.',
      )
      return
    }

    if (amount > debt.balance) {
      showAlert(
        'Invalid Amount',
        'Payment is higher than the remaining debt balance.',
      )
      return
    }

    const transaction: Transaction = {
      id: createId(),
      type: 'expense',
      amount,
      label: `Debt payment - ${debt.name}`,
      accountLabel: account.name,
      createdAt: new Date().toISOString(),
    }

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) =>
        item.id === accountId
          ? { ...item, balance: item.balance - amount }
          : item,
      ),
      debts: current.debts.map((item) =>
        item.id === debtId
          ? { ...item, balance: Math.max(item.balance - amount, 0) }
          : item,
      ),
      transactions: [transaction, ...current.transactions].slice(0, 50),
    }))

    setDebtPaymentTarget(null)
  }

  function handleAddIncome(accountId: number, amount: number, note: string) {
    const account = financeData.accounts.find((item) => item.id === accountId)

    if (!account) {
      showAlert('Invalid Account', 'Please select a valid account.')
      return
    }

    const newTransaction: Transaction = {
      id: createId(),
      type: 'income',
      amount,
      label: note || 'Income',
      accountLabel: account.name,
      createdAt: new Date().toISOString(),
    }

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) =>
        item.id === accountId
          ? { ...item, balance: item.balance + amount }
          : item,
      ),
      transactions: [newTransaction, ...current.transactions].slice(0, 50),
    }))

    setActiveAction(null)
  }

  function handleAddExpense(paymentSource: string, amount: number, note: string) {
    const [sourceType, sourceIdValue] = paymentSource.split(':')
    const sourceId = Number(sourceIdValue)

    if (sourceType === 'account') {
      const account = financeData.accounts.find((item) => item.id === sourceId)

      if (!account) {
        showAlert('Invalid Account', 'Please select a valid account.')
        return
      }

      if (amount > account.balance) {
        showAlert(
          'Insufficient Balance',
          'Your selected account has insufficient balance.',
        )
        return
      }

      const newTransaction: Transaction = {
        id: createId(),
        type: 'expense',
        amount,
        label: note || 'Expense',
        accountLabel: account.name,
        createdAt: new Date().toISOString(),
      }

      setFinanceData((current) => ({
        ...current,
        accounts: current.accounts.map((item) =>
          item.id === sourceId
            ? { ...item, balance: item.balance - amount }
            : item,
        ),
        transactions: [newTransaction, ...current.transactions].slice(0, 50),
      }))

      setActiveAction(null)
      return
    }

    if (sourceType === 'card') {
      const card = financeData.creditCards.find((item) => item.id === sourceId)

      if (!card) {
        showAlert('Invalid Card', 'Please select a valid credit card.')
        return
      }

      const availableCredit = card.creditLimit - card.currentBalance

      if (amount > availableCredit) {
        showAlert(
          'Insufficient Credit',
          'Your selected credit card has insufficient available credit.',
        )
        return
      }

      const newTransaction: Transaction = {
        id: createId(),
        type: 'expense',
        amount,
        label: note || 'Credit Card Expense',
        accountLabel: card.name,
        createdAt: new Date().toISOString(),
      }

      setFinanceData((current) => ({
        ...current,
        creditCards: current.creditCards.map((item) =>
          item.id === sourceId
            ? { ...item, currentBalance: item.currentBalance + amount }
            : item,
        ),
        transactions: [newTransaction, ...current.transactions].slice(0, 50),
      }))

      setActiveAction(null)
      return
    }

    showAlert('Payment Method Required', 'Please select a payment method.')
  }

  function handleTransfer(
    sourceAccountId: number,
    destinationAccountId: number,
    amount: number,
    note: string,
  ) {
    if (sourceAccountId === destinationAccountId) {
      showAlert(
        'Invalid Transfer',
        'Source and destination accounts must be different.',
      )
      return
    }

    const sourceAccount = financeData.accounts.find(
      (item) => item.id === sourceAccountId,
    )

    const destinationAccount = financeData.accounts.find(
      (item) => item.id === destinationAccountId,
    )

    if (!sourceAccount || !destinationAccount) {
      showAlert('Invalid Accounts', 'Please select valid accounts.')
      return
    }

    if (amount > sourceAccount.balance) {
      showAlert(
        'Insufficient Balance',
        'Your source account has insufficient balance.',
      )
      return
    }

    const newTransaction: Transaction = {
      id: createId(),
      type: 'transfer',
      amount,
      label: note || 'Transfer',
      accountLabel: `${sourceAccount.name} → ${destinationAccount.name}`,
      createdAt: new Date().toISOString(),
    }

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.map((item) => {
        if (item.id === sourceAccountId) {
          return { ...item, balance: item.balance - amount }
        }

        if (item.id === destinationAccountId) {
          return { ...item, balance: item.balance + amount }
        }

        return item
      }),
      transactions: [newTransaction, ...current.transactions].slice(0, 50),
    }))

    setActiveAction(null)
  }

  function resetLocalData() {
    showConfirm({
      title: 'Reset DueWise?',
      message: 'This will clear your local changes and restore the sample data.',
      confirmLabel: 'Reset',
      tone: 'danger',
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

            <button
              className="profile-button"
              type="button"
              aria-label="Reset local data"
              onClick={resetLocalData}
            >
              JD
            </button>
          </div>
        </header>

        <section className="balance-hero">
          <div>
            <p className="hero-label">Available Cash</p>
            <h2>{peso.format(totalCash)}</h2>
            <p className="hero-description">
              Estimated spendable balance across your cash accounts
            </p>
          </div>
        </section>

        <section className="page-content">
          {activeTab === 'today' && (
            <TodayPage
              totalCash={totalCash}
              totalDebt={totalDebt}
              transactions={financeData.transactions}
              creditCardInsights={creditCardInsights}
              recurringExpenses={activeRecurringExpenses}
              onOpenPlan={() => changeTab('plan')}
              onOpenWallet={() => changeTab('wallet')}
              onOpenTransactions={() => setTransactionHistoryOpen(true)}
            />
          )}

          {activeTab === 'wallet' && (
            <AccountsPage
              accounts={financeData.accounts}
              creditCards={financeData.creditCards}
              creditCardInsights={creditCardInsights}
              onAddAccount={() => setAccountEditor({ mode: 'add' })}
              onEditAccount={(account) =>
                setAccountEditor({ mode: 'edit', account })
              }
              onDeleteAccount={handleDeleteAccount}
              onAddCreditCard={() => setCreditCardEditor({ mode: 'add' })}
              onEditCreditCard={(creditCard) =>
                setCreditCardEditor({ mode: 'edit', creditCard })
              }
              onDeleteCreditCard={handleDeleteCreditCard}
              onPayCreditCard={setCreditCardPaymentTarget}
            />
          )}

          {activeTab === 'plan' && (
            <PlanPage
              recurringExpenses={activeRecurringExpenses}
              recurringTotal={recurringTotal}
              savingsGoals={financeData.savingsGoals}
              debts={financeData.debts}
              onAddRecurringExpense={() =>
                setRecurringExpenseEditor({ mode: 'add' })
              }
              onEditRecurringExpense={(recurringExpense) =>
                setRecurringExpenseEditor({
                  mode: 'edit',
                  recurringExpense,
                })
              }
              onDeleteRecurringExpense={handleDeleteRecurringExpense}
              onPayRecurringExpense={setBillPaymentTarget}
              onAddSavingsGoal={() => setSavingsGoalEditor({ mode: 'add' })}
              onEditSavingsGoal={(savingsGoal) =>
                setSavingsGoalEditor({ mode: 'edit', savingsGoal })
              }
              onDeleteSavingsGoal={handleDeleteSavingsGoal}
              onOpenGoalMoneyAction={(mode, savingsGoal) =>
                setGoalMoneyAction({ mode, savingsGoal })
              }
              onAddDebt={() => setDebtEditor({ mode: 'add' })}
              onEditDebt={(debt) => setDebtEditor({ mode: 'edit', debt })}
              onDeleteDebt={handleDeleteDebt}
              onRecordDebtPayment={setDebtPaymentTarget}
            />
          )}

          {activeTab === 'insights' && (
            <AnalysisPage
              totalCash={totalCash}
              totalSavings={totalSavings}
              totalDebt={totalDebt}
              recurringTotal={recurringTotal}
              transactions={financeData.transactions}
              creditCardInsights={creditCardInsights}
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
          <button
            type="button"
            className="fab-action income"
            onClick={() => openQuickAction('income')}
          >
            <ArrowDownLeft size={19} />
            <span>Income</span>
          </button>

          <button
            type="button"
            className="fab-action expense"
            onClick={() => openQuickAction('expense')}
          >
            <ArrowUpRight size={19} />
            <span>Expense</span>
          </button>

          <button
            type="button"
            className="fab-action transfer"
            onClick={() => openQuickAction('transfer')}
          >
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
                onClick={() => changeTab(item.key)}
              >
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.8} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {activeAction && (
          <QuickActionModal
            key={activeAction}
            action={activeAction}
            accounts={financeData.accounts}
            creditCards={financeData.creditCards}
            onClose={() => setActiveAction(null)}
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
            onTransfer={handleTransfer}
            onNotify={showAlert}
          />
        )}

        {accountEditor && (
          <AccountEditorModal
            editor={accountEditor}
            onClose={() => setAccountEditor(null)}
            onSave={handleSaveAccount}
            onNotify={showAlert}
          />
        )}

        {creditCardEditor && (
          <CreditCardEditorModal
            editor={creditCardEditor}
            onClose={() => setCreditCardEditor(null)}
            onSave={handleSaveCreditCard}
            onNotify={showAlert}
          />
        )}

        {recurringExpenseEditor && (
          <RecurringExpenseEditorModal
            editor={recurringExpenseEditor}
            onClose={() => setRecurringExpenseEditor(null)}
            onSave={handleSaveRecurringExpense}
            onNotify={showAlert}
          />
        )}

        {savingsGoalEditor && (
          <SavingsGoalEditorModal
            editor={savingsGoalEditor}
            onClose={() => setSavingsGoalEditor(null)}
            onSave={handleSaveSavingsGoal}
            onNotify={showAlert}
          />
        )}

        {debtEditor && (
          <DebtEditorModal
            editor={debtEditor}
            onClose={() => setDebtEditor(null)}
            onSave={handleSaveDebt}
            onNotify={showAlert}
          />
        )}

        {goalMoneyAction && (
          <GoalMoneyModal
            action={goalMoneyAction}
            accounts={financeData.accounts}
            onClose={() => setGoalMoneyAction(null)}
            onSave={handleMoveGoalMoney}
            onNotify={showAlert}
          />
        )}

        {debtPaymentTarget && (
          <DebtPaymentModal
            debt={debtPaymentTarget}
            accounts={financeData.accounts}
            onClose={() => setDebtPaymentTarget(null)}
            onSave={handleRecordDebtPayment}
            onNotify={showAlert}
          />
        )}

        {billPaymentTarget && (
          <BillPaymentModal
            expense={billPaymentTarget}
            accounts={financeData.accounts}
            onClose={() => setBillPaymentTarget(null)}
            onSave={handlePayBill}
            onNotify={showAlert}
          />
        )}

        {creditCardPaymentTarget && (
          <CreditCardPaymentModal
            creditCard={creditCardPaymentTarget}
            accounts={financeData.accounts}
            onClose={() => setCreditCardPaymentTarget(null)}
            onSave={handlePayCreditCard}
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
            onClose={closeMessageDialog}
            onConfirm={confirmMessageDialog}
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

  const recurringCalendarItems = recurringExpenses
    .slice(0, 3)
    .map((expense) => ({
      id: Number(`9${expense.id}`),
      title: expense.name,
      date: expense.nextDue,
      amount: getBillRemainingBalance(expense),
      type: 'Recurring',
    }))

  const creditCardCalendarItems = creditCardInsights
    .slice(0, 1)
    .flatMap((insight) => [
      {
        id: Number(`${insight.card.id}1`),
        title: `${insight.card.name} Cut-off`,
        date: formatRelativeDays(insight.daysToCutOff),
        amount: 0,
        type: 'Cut-off',
      },
      {
        id: Number(`${insight.card.id}2`),
        title: `${insight.card.name} Due Date`,
        date: formatRelativeDays(insight.daysToDue),
        amount: insight.card.currentBalance,
        type: 'Due',
      },
    ])

  const calendarItems = [...recurringCalendarItems, ...creditCardCalendarItems]
  const previewNote =
    recurringExpenses.length > 3
      ? `${recurringExpenses.length - 3} more unpaid planned item${
          recurringExpenses.length - 3 === 1 ? '' : 's'
        } hidden from this preview.`
      : 'Showing your nearest unpaid bills and top card events.'

  return (
    <>
      <section className="date-strip" aria-label="Calendar dates">
        {days.map((item, index) => (
          <button
            key={`${item.day}-${item.date}`}
            type="button"
            className={index === 3 ? 'selected' : ''}
          >
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

      <SectionTitle
        title="Next Money Events"
        subtitle="Paid bills are hidden until the next month"
      />

      <div className="card-list">
        {calendarItems.length === 0 && (
          <article className="account-card">
            <div className="card-main-content">
              <h3>No unpaid events yet</h3>
              <p>Add planned bills or credit cards to generate events.</p>
            </div>
          </article>
        )}

        {calendarItems.map((item) => (
          <article key={item.id} className="event-card">
            <div className={`event-indicator ${getEventClass(item.type)}`} />

            <div className="card-main-content">
              <h3>{item.title}</h3>
              <p>{item.date}</p>
            </div>

            <strong>
              {item.amount > 0 ? peso.format(item.amount) : item.type}
            </strong>
          </article>
        ))}
      </div>

      <section style={previewCardStyle}>
        <p>{previewNote}</p>

        <button type="button" style={textLinkButtonStyle} onClick={onOpenPlan}>
          View full plan
        </button>
      </section>

      <SectionTitle
        title="Best Cards"
        subtitle="Top 2 cards based on cut-off, due date, credit, and utilization"
      />

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

          <strong>
            {insight.status === 'recommended' ? 'Best' : insight.status}
          </strong>
        </article>
      ))}
    </div>
  )
}

function AccountsPage({
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
  onDeleteAccount: (accountId: number) => void
  onAddCreditCard: () => void
  onEditCreditCard: (creditCard: CreditCardAccount) => void
  onDeleteCreditCard: (creditCardId: number) => void
  onPayCreditCard: (creditCard: CreditCardAccount) => void
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
                <button
                  type="button"
                  style={iconButtonStyle}
                  onClick={() => onEditAccount(account)}
                  aria-label={`Edit ${account.name}`}
                >
                  <Pencil size={14} />
                </button>

                <button
                  type="button"
                  style={dangerIconButtonStyle}
                  onClick={() => onDeleteAccount(account.id)}
                  aria-label={`Delete ${account.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <SectionTitle
        title="Credit Cards"
        subtitle="Balances, due dates, cut-off dates, and utilization"
      />

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
          const insight = creditCardInsights.find(
            (item) => item.card.id === card.id,
          )

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
                    <button
                      type="button"
                      style={iconButtonStyle}
                      onClick={() => onPayCreditCard(card)}
                      aria-label={`Pay ${card.name}`}
                    >
                      <ArrowDownLeft size={14} />
                    </button>

                    <button
                      type="button"
                      style={iconButtonStyle}
                      onClick={() => onEditCreditCard(card)}
                      aria-label={`Edit ${card.name}`}
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      style={dangerIconButtonStyle}
                      onClick={() => onDeleteCreditCard(card.id)}
                      aria-label={`Delete ${card.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="progress-track">
                <div
                  className={`progress-fill ${
                    utilization >= 50 ? 'warning' : ''
                  }`}
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
                  <strong>
                    {peso.format(card.creditLimit - card.currentBalance)}
                  </strong>
                </span>
              </div>

              <div className="credit-dates">
                <span>Cut-off: {formatOrdinalDay(card.cutOffDay)}</span>
                <span>Due: {formatOrdinalDay(card.dueDay)}</span>
              </div>

              {card.lastPaymentAt && (
                <p style={smallMutedLineStyle}>
                  Last payment: {formatShortDate(card.lastPaymentAt)}
                </p>
              )}
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
  onAddRecurringExpense,
  onEditRecurringExpense,
  onDeleteRecurringExpense,
  onPayRecurringExpense,
  onAddSavingsGoal,
  onEditSavingsGoal,
  onDeleteSavingsGoal,
  onOpenGoalMoneyAction,
  onAddDebt,
  onEditDebt,
  onDeleteDebt,
  onRecordDebtPayment,
}: {
  recurringExpenses: RecurringExpense[]
  recurringTotal: number
  savingsGoals: SavingsGoal[]
  debts: Debt[]
  onAddRecurringExpense: () => void
  onEditRecurringExpense: (recurringExpense: RecurringExpense) => void
  onDeleteRecurringExpense: (recurringExpenseId: number) => void
  onPayRecurringExpense: (recurringExpense: RecurringExpense) => void
  onAddSavingsGoal: () => void
  onEditSavingsGoal: (savingsGoal: SavingsGoal) => void
  onDeleteSavingsGoal: (savingsGoalId: number) => void
  onOpenGoalMoneyAction: (mode: GoalMoneyMode, savingsGoal: SavingsGoal) => void
  onAddDebt: () => void
  onEditDebt: (debt: Debt) => void
  onDeleteDebt: (debtId: number) => void
  onRecordDebtPayment: (debt: Debt) => void
}) {
  return (
    <>
      <RecurringPage
        recurringExpenses={recurringExpenses}
        recurringTotal={recurringTotal}
        onAddRecurringExpense={onAddRecurringExpense}
        onEditRecurringExpense={onEditRecurringExpense}
        onDeleteRecurringExpense={onDeleteRecurringExpense}
        onPayRecurringExpense={onPayRecurringExpense}
      />

      <SavingsPage
        savingsGoals={savingsGoals}
        onAddSavingsGoal={onAddSavingsGoal}
        onEditSavingsGoal={onEditSavingsGoal}
        onDeleteSavingsGoal={onDeleteSavingsGoal}
        onOpenGoalMoneyAction={onOpenGoalMoneyAction}
      />

      <DebtsPage
        debts={debts}
        onAddDebt={onAddDebt}
        onEditDebt={onEditDebt}
        onDeleteDebt={onDeleteDebt}
        onRecordDebtPayment={onRecordDebtPayment}
      />
    </>
  )
}

function SavingsPage({
  savingsGoals,
  onAddSavingsGoal,
  onEditSavingsGoal,
  onDeleteSavingsGoal,
  onOpenGoalMoneyAction,
}: {
  savingsGoals: SavingsGoal[]
  onAddSavingsGoal: () => void
  onEditSavingsGoal: (savingsGoal: SavingsGoal) => void
  onDeleteSavingsGoal: (savingsGoalId: number) => void
  onOpenGoalMoneyAction: (mode: GoalMoneyMode, savingsGoal: SavingsGoal) => void
}) {
  return (
    <>
      <SectionTitle
        title="Savings Goals"
        subtitle="Track progress toward your financial targets"
      />

      <button type="button" style={softButtonStyle} onClick={onAddSavingsGoal}>
        <Plus size={16} />
        Add Savings Goal
      </button>

      <div className="card-list" style={{ marginTop: 12 }}>
        {savingsGoals.length === 0 && (
          <article className="account-card">
            <div className="card-main-content">
              <h3>No savings goals yet</h3>
              <p>Add your first goal to start tracking progress.</p>
            </div>
          </article>
        )}

        {savingsGoals.map((goal) => {
          const progress = Math.round((goal.current / goal.target) * 100)
          const remaining = Math.max(goal.target - goal.current, 0)

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
                  <strong>{peso.format(remaining)}</strong>
                </span>
              </div>

              <div style={cardActionGridStyle}>
                <button
                  type="button"
                  style={compactButtonStyle}
                  onClick={() => onOpenGoalMoneyAction('deposit', goal)}
                >
                  Add Money
                </button>

                <button
                  type="button"
                  style={compactButtonStyle}
                  onClick={() => onOpenGoalMoneyAction('withdraw', goal)}
                >
                  Withdraw
                </button>

                <button
                  type="button"
                  style={compactButtonStyle}
                  onClick={() => onEditSavingsGoal(goal)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  style={compactDangerButtonStyle}
                  onClick={() => onDeleteSavingsGoal(goal.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

function DebtsPage({
  debts,
  onAddDebt,
  onEditDebt,
  onDeleteDebt,
  onRecordDebtPayment,
}: {
  debts: Debt[]
  onAddDebt: () => void
  onEditDebt: (debt: Debt) => void
  onDeleteDebt: (debtId: number) => void
  onRecordDebtPayment: (debt: Debt) => void
}) {
  const totalDebtBalance = debts.reduce(
    (total, debt) => total + debt.balance,
    0,
  )

  return (
    <>
      <section className="debt-summary">
        <p>Tracked Loan Balance</p>
        <h2>{peso.format(totalDebtBalance)}</h2>
        <span>Excludes your separate credit card balances</span>
      </section>

      <button type="button" style={softButtonWithTopMarginStyle} onClick={onAddDebt}>
        <Plus size={16} />
        Add Debt
      </button>

      <SectionTitle title="Debt Tracker" subtitle="Monitor balances and monthly payments" />

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
              <button
                type="button"
                style={iconButtonStyle}
                onClick={() => onRecordDebtPayment(debt)}
                aria-label={`Pay ${debt.name}`}
              >
                <ArrowDownLeft size={14} />
              </button>

              <button
                type="button"
                style={iconButtonStyle}
                onClick={() => onEditDebt(debt)}
                aria-label={`Edit ${debt.name}`}
              >
                <Pencil size={14} />
              </button>

              <button
                type="button"
                style={dangerIconButtonStyle}
                onClick={() => onDeleteDebt(debt.id)}
                aria-label={`Delete ${debt.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>

      <section className="strategy-card">
        <p>Suggested Strategy</p>
        <h3>Snowball Method</h3>
        <span>
          Pay the smallest balance first while maintaining minimum payments on
          other debts.
        </span>
      </section>
    </>
  )
}

function RecurringPage({
  recurringExpenses,
  recurringTotal,
  onAddRecurringExpense,
  onEditRecurringExpense,
  onDeleteRecurringExpense,
  onPayRecurringExpense,
}: {
  recurringExpenses: RecurringExpense[]
  recurringTotal: number
  onAddRecurringExpense: () => void
  onEditRecurringExpense: (recurringExpense: RecurringExpense) => void
  onDeleteRecurringExpense: (recurringExpenseId: number) => void
  onPayRecurringExpense: (recurringExpense: RecurringExpense) => void
}) {
  return (
    <>
      <section className="recurring-summary">
        <div>
          <p>Unpaid Bills Balance</p>
          <h2>{peso.format(recurringTotal)}</h2>
        </div>

        <Repeat2 size={30} />
      </section>

      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          style={softButtonStyle}
          onClick={onAddRecurringExpense}
        >
          <Plus size={16} />
          Add Bill
        </button>
      </div>

      <SectionTitle
        title="Bills"
        subtitle="Fully paid bills are hidden until the next month"
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
                {expense.lastPaidAt && (
                  <span>Last paid: {formatShortDate(expense.lastPaidAt)}</span>
                )}
              </div>

              <div style={amountActionColumnStyle}>
                <strong>{peso.format(balanceDue)}</strong>

                <div style={miniActionRowStyle}>
                  <button
                    type="button"
                    style={iconButtonStyle}
                    onClick={() => onPayRecurringExpense(expense)}
                    aria-label={`Pay ${expense.name}`}
                  >
                    <ArrowDownLeft size={14} />
                  </button>

                  <button
                    type="button"
                    style={iconButtonStyle}
                    onClick={() => onEditRecurringExpense(expense)}
                    aria-label={`Edit ${expense.name}`}
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    type="button"
                    style={dangerIconButtonStyle}
                    onClick={() => onDeleteRecurringExpense(expense.id)}
                    aria-label={`Delete ${expense.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

function AnalysisPage({
  totalCash,
  totalSavings,
  totalDebt,
  recurringTotal,
  transactions,
  creditCardInsights,
  onOpenTransactions,
}: {
  totalCash: number
  totalSavings: number
  totalDebt: number
  recurringTotal: number
  transactions: Transaction[]
  creditCardInsights: CreditCardInsight[]
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
  const bestCard = creditCardInsights.find(
    (insight) => insight.status === 'recommended',
  )

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
        <span>
          {bestCard
            ? bestCard.reason
            : 'This insight is based on the transactions added through the quick action button.'}
        </span>
      </section>

      <SectionTitle
        title="Monthly Overview"
        subtitle="Based on your locally recorded transactions and unpaid plan balance"
      />

      <div className="overview-list">
        <OverviewRow
          label="Recorded Income"
          value={peso.format(monthlyIncome)}
          type="positive"
        />

        <OverviewRow
          label="Recorded Expenses"
          value={peso.format(monthlyExpenses)}
          type="negative"
        />

        <OverviewRow
          label="Net Cashflow"
          value={peso.format(netCashflow)}
          type={netCashflow >= 0 ? 'positive' : 'negative'}
        />

        <OverviewRow
          label="Unpaid Bills"
          value={peso.format(recurringTotal)}
          type="neutral"
        />

        <OverviewRow
          label="Transactions"
          value={`${transactions.length}`}
          type="neutral"
        />
      </div>

      <section style={previewCardStyle}>
        <p>Review income, expenses, transfers, savings movements, and payments.</p>

        <button
          type="button"
          style={textLinkButtonStyle}
          onClick={onOpenTransactions}
        >
          Open transaction history
        </button>
      </section>
    </>
  )
}

function TransactionList({
  transactions,
  limit = 5,
}: {
  transactions: Transaction[]
  limit?: number
}) {
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
          {transaction.accountLabel} · {formatShortDate(transaction.createdAt)}
        </p>
      </div>

      <strong>
        {transaction.type === 'expense'
          ? '-'
          : transaction.type === 'income'
            ? '+'
            : ''}
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
        transaction.type.toLowerCase().includes(normalizedQuery)

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
            placeholder="Search note, account, bill, card..."
            style={historySearchInputStyle}
          />
        </label>

        <div style={historyFilterGridStyle}>
          <button
            type="button"
            style={historyFilterButtonStyle(filter === 'all')}
            onClick={() => setFilter('all')}
          >
            All
          </button>

          <button
            type="button"
            style={historyFilterButtonStyle(filter === 'income')}
            onClick={() => setFilter('income')}
          >
            Income
          </button>

          <button
            type="button"
            style={historyFilterButtonStyle(filter === 'expense')}
            onClick={() => setFilter('expense')}
          >
            Expense
          </button>

          <button
            type="button"
            style={historyFilterButtonStyle(filter === 'transfer')}
            onClick={() => setFilter('transfer')}
          >
            Transfer
          </button>
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

function BillPaymentModal({
  expense,
  accounts,
  onClose,
  onSave,
  onNotify,
}: {
  expense: RecurringExpense
  accounts: Account[]
  onClose: () => void
  onSave: (expenseId: number, accountId: number, amount: number) => void
  onNotify: NotifyFunction
}) {
  const balanceDue = getBillRemainingBalance(expense)
  const [amount, setAmount] = useState(balanceDue.toString())
  const [accountId, setAccountId] = useState(accounts[0]?.id.toString() ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      onNotify('Invalid Amount', 'Please enter a valid payment amount.')
      return
    }

    if (parsedAmount > balanceDue) {
      onNotify(
        'Invalid Amount',
        'Payment is higher than the remaining bill balance.',
      )
      return
    }

    onSave(expense.id, Number(accountId), parsedAmount)
  }

  return (
    <ModalShell eyebrow="Bill Payment" title={`Pay ${expense.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={modalFormStyle}>
        <section style={modalNoteStyle}>
          <span>Remaining balance</span>
          <strong>{peso.format(balanceDue)}</strong>
        </section>

        <label style={fieldStyle}>
          <span style={labelStyle}>Pay from</span>
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            style={inputStyle}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {peso.format(account.balance)}
              </option>
            ))}
          </select>
        </label>

        <TextField
          label="Payment amount"
          type="number"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
          autoFocus
        />

        <button type="submit" style={submitButtonStyle}>
          Record Payment
        </button>
      </form>
    </ModalShell>
  )
}

function CreditCardPaymentModal({
  creditCard,
  accounts,
  onClose,
  onSave,
  onNotify,
}: {
  creditCard: CreditCardAccount
  accounts: Account[]
  onClose: () => void
  onSave: (creditCardId: number, accountId: number, amount: number) => void
  onNotify: NotifyFunction
}) {
  const [amount, setAmount] = useState(creditCard.currentBalance.toString())
  const [accountId, setAccountId] = useState(accounts[0]?.id.toString() ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      onNotify('Invalid Amount', 'Please enter a valid payment amount.')
      return
    }

    if (parsedAmount > creditCard.currentBalance) {
      onNotify(
        'Invalid Amount',
        'Payment is higher than the current credit card balance.',
      )
      return
    }

    onSave(creditCard.id, Number(accountId), parsedAmount)
  }

  return (
    <ModalShell
      eyebrow="Credit Card Payment"
      title={`Pay ${creditCard.name}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} style={modalFormStyle}>
        <label style={fieldStyle}>
          <span style={labelStyle}>Pay from</span>
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            style={inputStyle}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {peso.format(account.balance)}
              </option>
            ))}
          </select>
        </label>

        <TextField
          label="Payment amount"
          type="number"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
          autoFocus
        />

        <button type="submit" style={submitButtonStyle}>
          Record Payment
        </button>
      </form>
    </ModalShell>
  )
}

function SavingsGoalEditorModal({
  editor,
  onClose,
  onSave,
  onNotify,
}: {
  editor: SavingsGoalEditorState
  onClose: () => void
  onSave: (values: SavingsGoalFormValues) => void
  onNotify: NotifyFunction
}) {
  const [name, setName] = useState(editor.savingsGoal?.name ?? '')
  const [current, setCurrent] = useState(
    editor.savingsGoal?.current.toString() ?? '',
  )
  const [target, setTarget] = useState(
    editor.savingsGoal?.target.toString() ?? '',
  )
  const [targetDate, setTargetDate] = useState(
    editor.savingsGoal?.targetDate ?? '',
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedCurrent = Number(current)
    const parsedTarget = Number(target)

    if (!name.trim()) {
      onNotify('Goal Name Required', 'Please enter a savings goal name.')
      return
    }

    if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
      onNotify('Invalid Amount', 'Please enter a valid saved amount.')
      return
    }

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      onNotify('Invalid Target', 'Please enter a valid target amount.')
      return
    }

    if (parsedCurrent > parsedTarget) {
      onNotify('Invalid Goal', 'Saved amount cannot be higher than the target.')
      return
    }

    if (!targetDate.trim()) {
      onNotify('Target Date Required', 'Please enter a target date.')
      return
    }

    onSave({
      name: name.trim(),
      current: parsedCurrent,
      target: parsedTarget,
      targetDate: targetDate.trim(),
    })
  }

  return (
    <ModalShell
      eyebrow="Savings Goal"
      title={editor.mode === 'add' ? 'Add Savings Goal' : 'Edit Savings Goal'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} style={modalFormStyle}>
        <TextField
          label="Goal name"
          value={name}
          onChange={setName}
          placeholder="Example: Emergency Fund"
          autoFocus
        />

        <TextField
          label="Current saved amount"
          type="number"
          value={current}
          onChange={setCurrent}
          placeholder="0.00"
        />

        <TextField
          label="Target amount"
          type="number"
          value={target}
          onChange={setTarget}
          placeholder="100000"
        />

        <TextField
          label="Target date"
          value={targetDate}
          onChange={setTargetDate}
          placeholder="Example: December 2027"
        />

        <button type="submit" style={submitButtonStyle}>
          Save Goal
        </button>
      </form>
    </ModalShell>
  )
}

function DebtEditorModal({
  editor,
  onClose,
  onSave,
  onNotify,
}: {
  editor: DebtEditorState
  onClose: () => void
  onSave: (values: DebtFormValues) => void
  onNotify: NotifyFunction
}) {
  const [name, setName] = useState(editor.debt?.name ?? '')
  const [balance, setBalance] = useState(editor.debt?.balance.toString() ?? '')
  const [monthly, setMonthly] = useState(editor.debt?.monthly.toString() ?? '')
  const [due, setDue] = useState(editor.debt?.due ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedBalance = Number(balance)
    const parsedMonthly = Number(monthly)

    if (!name.trim()) {
      onNotify('Debt Name Required', 'Please enter a debt name.')
      return
    }

    if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
      onNotify('Invalid Balance', 'Please enter a valid debt balance.')
      return
    }

    if (!Number.isFinite(parsedMonthly) || parsedMonthly <= 0) {
      onNotify('Invalid Payment', 'Please enter a valid monthly payment.')
      return
    }

    if (!due.trim()) {
      onNotify('Due Schedule Required', 'Please enter a due schedule.')
      return
    }

    onSave({
      name: name.trim(),
      balance: parsedBalance,
      monthly: parsedMonthly,
      due: due.trim(),
    })
  }

  return (
    <ModalShell
      eyebrow="Debt"
      title={editor.mode === 'add' ? 'Add Debt' : 'Edit Debt'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} style={modalFormStyle}>
        <TextField
          label="Debt name"
          value={name}
          onChange={setName}
          placeholder="Example: Personal Loan"
          autoFocus
        />

        <TextField
          label="Remaining balance"
          type="number"
          value={balance}
          onChange={setBalance}
          placeholder="0.00"
        />

        <TextField
          label="Monthly payment"
          type="number"
          value={monthly}
          onChange={setMonthly}
          placeholder="5000"
        />

        <TextField
          label="Due schedule"
          value={due}
          onChange={setDue}
          placeholder="Example: Every 15th"
        />

        <button type="submit" style={submitButtonStyle}>
          Save Debt
        </button>
      </form>
    </ModalShell>
  )
}

function GoalMoneyModal({
  action,
  accounts,
  onClose,
  onSave,
  onNotify,
}: {
  action: GoalMoneyState
  accounts: Account[]
  onClose: () => void
  onSave: (
    goalId: number,
    accountId: number,
    amount: number,
    mode: GoalMoneyMode,
  ) => void
  onNotify: NotifyFunction
}) {
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id.toString() ?? '')

  const isDeposit = action.mode === 'deposit'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      onNotify('Invalid Amount', 'Please enter a valid amount.')
      return
    }

    onSave(
      action.savingsGoal.id,
      Number(accountId),
      parsedAmount,
      action.mode,
    )
  }

  return (
    <ModalShell
      eyebrow="Savings"
      title={`${isDeposit ? 'Add Money to' : 'Withdraw from'} ${
        action.savingsGoal.name
      }`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} style={modalFormStyle}>
        <label style={fieldStyle}>
          <span style={labelStyle}>
            {isDeposit ? 'From account' : 'To account'}
          </span>
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            style={inputStyle}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {peso.format(account.balance)}
              </option>
            ))}
          </select>
        </label>

        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
          autoFocus
        />

        <button type="submit" style={submitButtonStyle}>
          {isDeposit ? 'Add Money' : 'Withdraw'}
        </button>
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
  onNotify: NotifyFunction
}) {
  const [amount, setAmount] = useState(
    Math.min(debt.monthly, debt.balance).toString(),
  )
  const [accountId, setAccountId] = useState(accounts[0]?.id.toString() ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedAmount = Number(amount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      onNotify('Invalid Amount', 'Please enter a valid payment amount.')
      return
    }

    onSave(debt.id, Number(accountId), parsedAmount)
  }

  return (
    <ModalShell eyebrow="Debt Payment" title={`Pay ${debt.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={modalFormStyle}>
        <label style={fieldStyle}>
          <span style={labelStyle}>Pay from</span>
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            style={inputStyle}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {peso.format(account.balance)}
              </option>
            ))}
          </select>
        </label>

        <TextField
          label="Payment amount"
          type="number"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
          autoFocus
        />

        <button type="submit" style={submitButtonStyle}>
          Record Payment
        </button>
      </form>
    </ModalShell>
  )
}

function AccountEditorModal({
  editor,
  onClose,
  onSave,
  onNotify,
}: {
  editor: AccountEditorState
  onClose: () => void
  onSave: (values: AccountFormValues) => void
  onNotify: NotifyFunction
}) {
  const [name, setName] = useState(editor.account?.name ?? '')
  const [type, setType] = useState(editor.account?.type ?? 'Bank Account')
  const [balance, setBalance] = useState(
    editor.account?.balance.toString() ?? '',
  )
  const [accent, setAccent] = useState<AccountAccent>(
    editor.account?.accent ?? 'blue',
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedBalance = Number(balance)

    if (!name.trim()) {
      onNotify('Account Name Required', 'Please enter an account name.')
      return
    }

    if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
      onNotify('Invalid Balance', 'Please enter a valid balance.')
      return
    }

    onSave({
      name: name.trim(),
      type,
      balance: parsedBalance,
      accent,
    })
  }

  return (
    <ModalShell
      eyebrow="Account"
      title={editor.mode === 'add' ? 'Add Account' : 'Edit Account'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} style={modalFormStyle}>
        <TextField
          label="Account name"
          value={name}
          onChange={setName}
          placeholder="Example: BDO Savings"
          autoFocus
        />

        <label style={fieldStyle}>
          <span style={labelStyle}>Type</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            style={inputStyle}
          >
            <option>Cash</option>
            <option>Bank Account</option>
            <option>E-Wallet</option>
            <option>Savings Account</option>
            <option>Loan Account</option>
          </select>
        </label>

        <TextField
          label="Current balance"
          type="number"
          value={balance}
          onChange={setBalance}
          placeholder="0.00"
        />

        <label style={fieldStyle}>
          <span style={labelStyle}>Color</span>
          <select
            value={accent}
            onChange={(event) => setAccent(event.target.value as AccountAccent)}
            style={inputStyle}
          >
            <option value="green">Green</option>
            <option value="blue">Blue</option>
            <option value="teal">Teal</option>
          </select>
        </label>

        <button type="submit" style={submitButtonStyle}>
          Save Account
        </button>
      </form>
    </ModalShell>
  )
}

function CreditCardEditorModal({
  editor,
  onClose,
  onSave,
  onNotify,
}: {
  editor: CreditCardEditorState
  onClose: () => void
  onSave: (values: CreditCardFormValues) => void
  onNotify: NotifyFunction
}) {
  const [name, setName] = useState(editor.creditCard?.name ?? '')
  const [currentBalance, setCurrentBalance] = useState(
    editor.creditCard?.currentBalance.toString() ?? '',
  )
  const [creditLimit, setCreditLimit] = useState(
    editor.creditCard?.creditLimit.toString() ?? '',
  )
  const [cutOffDay, setCutOffDay] = useState(
    editor.creditCard?.cutOffDay.toString() ?? '',
  )
  const [dueDay, setDueDay] = useState(
    editor.creditCard?.dueDay.toString() ?? '',
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedCurrentBalance = Number(currentBalance)
    const parsedCreditLimit = Number(creditLimit)
    const parsedCutOffDay = Number(cutOffDay)
    const parsedDueDay = Number(dueDay)

    if (!name.trim()) {
      onNotify('Card Name Required', 'Please enter a credit card name.')
      return
    }

    if (!Number.isFinite(parsedCreditLimit) || parsedCreditLimit <= 0) {
      onNotify('Invalid Credit Limit', 'Please enter a valid credit limit.')
      return
    }

    if (
      !Number.isFinite(parsedCurrentBalance) ||
      parsedCurrentBalance < 0 ||
      parsedCurrentBalance > parsedCreditLimit
    ) {
      onNotify('Invalid Balance', 'Please enter a valid current balance.')
      return
    }

    if (!isValidDayOfMonth(parsedCutOffDay)) {
      onNotify(
        'Invalid Cut-off Day',
        'Please enter a valid cut-off day from 1 to 31.',
      )
      return
    }

    if (!isValidDayOfMonth(parsedDueDay)) {
      onNotify('Invalid Due Day', 'Please enter a valid due day from 1 to 31.')
      return
    }

    onSave({
      name: name.trim(),
      currentBalance: parsedCurrentBalance,
      creditLimit: parsedCreditLimit,
      cutOffDay: parsedCutOffDay,
      dueDay: parsedDueDay,
    })
  }

  return (
    <ModalShell
      eyebrow="Credit Card"
      title={editor.mode === 'add' ? 'Add Credit Card' : 'Edit Credit Card'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} style={modalFormStyle}>
        <TextField
          label="Card name"
          value={name}
          onChange={setName}
          placeholder="Example: BPI Visa"
          autoFocus
        />

        <TextField
          label="Current balance"
          type="number"
          value={currentBalance}
          onChange={setCurrentBalance}
          placeholder="0.00"
        />

        <TextField
          label="Credit limit"
          type="number"
          value={creditLimit}
          onChange={setCreditLimit}
          placeholder="50000"
        />

        <TextField
          label="Cut-off day"
          type="number"
          value={cutOffDay}
          onChange={setCutOffDay}
          placeholder="Example: 12"
        />

        <TextField
          label="Due day"
          type="number"
          value={dueDay}
          onChange={setDueDay}
          placeholder="Example: 2"
        />

        <button type="submit" style={submitButtonStyle}>
          Save Credit Card
        </button>
      </form>
    </ModalShell>
  )
}

function RecurringExpenseEditorModal({
  editor,
  onClose,
  onSave,
  onNotify,
}: {
  editor: RecurringExpenseEditorState
  onClose: () => void
  onSave: (values: RecurringExpenseFormValues) => void
  onNotify: NotifyFunction
}) {
  const [name, setName] = useState(editor.recurringExpense?.name ?? '')
  const [category, setCategory] = useState(
    editor.recurringExpense?.category ?? 'Utilities',
  )
  const [amount, setAmount] = useState(
    editor.recurringExpense?.amount.toString() ?? '',
  )
  const [frequency, setFrequency] = useState(
    editor.recurringExpense?.frequency ?? 'Monthly',
  )
  const [nextDue, setNextDue] = useState(
    editor.recurringExpense?.nextDue ?? '',
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedAmount = Number(amount)

    if (!name.trim()) {
      onNotify('Bill Name Required', 'Please enter a bill name.')
      return
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      onNotify('Invalid Amount', 'Please enter a valid amount.')
      return
    }

    if (!nextDue.trim()) {
      onNotify('Due Date Required', 'Please enter the next due date.')
      return
    }

    onSave({
      name: name.trim(),
      category,
      amount: parsedAmount,
      frequency,
      nextDue: nextDue.trim(),
    })
  }

  return (
    <ModalShell
      eyebrow="Plan"
      title={editor.mode === 'add' ? 'Add Bill' : 'Edit Bill'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} style={modalFormStyle}>
        <TextField
          label="Bill name"
          value={name}
          onChange={setName}
          placeholder="Example: Internet, Rent, Netflix"
          autoFocus
        />

        <label style={fieldStyle}>
          <span style={labelStyle}>Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={inputStyle}
          >
            <option>Utilities</option>
            <option>Subscription</option>
            <option>Rent</option>
            <option>Insurance</option>
            <option>Loan Payment</option>
            <option>Food</option>
            <option>Transportation</option>
            <option>Education</option>
            <option>Other</option>
          </select>
        </label>

        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
        />

        <label style={fieldStyle}>
          <span style={labelStyle}>Frequency</span>
          <select
            value={frequency}
            onChange={(event) => setFrequency(event.target.value)}
            style={inputStyle}
          >
            <option>Daily</option>
            <option>Weekly</option>
            <option>Biweekly</option>
            <option>Monthly</option>
            <option>Quarterly</option>
            <option>Yearly</option>
          </select>
        </label>

        <TextField
          label="Next due date"
          value={nextDue}
          onChange={setNextDue}
          placeholder="Example: July 10 or Every 10th"
        />

        <button type="submit" style={submitButtonStyle}>
          Save Bill
        </button>
      </form>
    </ModalShell>
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
  onAddExpense: (paymentSource: string, amount: number, note: string) => void
  onTransfer: (
    sourceAccountId: number,
    destinationAccountId: number,
    amount: number,
    note: string,
  ) => void
  onNotify: NotifyFunction
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [incomeAccountId, setIncomeAccountId] = useState(
    accounts[0]?.id.toString() ?? '',
  )
  const [paymentSource, setPaymentSource] = useState(
    accounts[0] ? `account:${accounts[0].id}` : '',
  )
  const [sourceAccountId, setSourceAccountId] = useState(
    accounts[0]?.id.toString() ?? '',
  )
  const [destinationAccountId, setDestinationAccountId] = useState(
    accounts[1]?.id.toString() ?? accounts[0]?.id.toString() ?? '',
  )

  const actionTitle = {
    income: 'Add Income',
    expense: 'Add Expense',
    transfer: 'Transfer Money',
  }[action]

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
      onAddExpense(paymentSource, parsedAmount, note.trim())
      return
    }

    onTransfer(
      Number(sourceAccountId),
      Number(destinationAccountId),
      parsedAmount,
      note.trim(),
    )
  }

  return (
    <ModalShell eyebrow="Quick Action" title={actionTitle} onClose={onClose}>
      <form onSubmit={handleSubmit} style={modalFormStyle}>
        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
          autoFocus
        />

        {action === 'income' && (
          <label style={fieldStyle}>
            <span style={labelStyle}>Deposit to</span>
            <select
              value={incomeAccountId}
              onChange={(event) => setIncomeAccountId(event.target.value)}
              style={inputStyle}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {peso.format(account.balance)}
                </option>
              ))}
            </select>
          </label>
        )}

        {action === 'expense' && (
          <label style={fieldStyle}>
            <span style={labelStyle}>Payment method</span>
            <select
              value={paymentSource}
              onChange={(event) => setPaymentSource(event.target.value)}
              style={inputStyle}
            >
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
                    {card.name} · Available{' '}
                    {peso.format(card.creditLimit - card.currentBalance)}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        )}

        {action === 'transfer' && (
          <>
            <label style={fieldStyle}>
              <span style={labelStyle}>From</span>
              <select
                value={sourceAccountId}
                onChange={(event) => setSourceAccountId(event.target.value)}
                style={inputStyle}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · {peso.format(account.balance)}
                  </option>
                ))}
              </select>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>To</span>
              <select
                value={destinationAccountId}
                onChange={(event) =>
                  setDestinationAccountId(event.target.value)
                }
                style={inputStyle}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <TextField
          label="Note"
          value={note}
          onChange={setNote}
          placeholder={
            action === 'income'
              ? 'Salary, allowance, refund...'
              : action === 'expense'
                ? 'Food, fuel, bills...'
                : 'Move funds...'
          }
        />

        <button type="submit" style={submitButtonStyle}>
          Save
        </button>
      </form>
    </ModalShell>
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
            <button
              type="button"
              style={messageCancelButtonStyle}
              onClick={onClose}
            >
              {dialog.cancelLabel ?? 'Cancel'}
            </button>
          )}

          <button
            type="button"
            style={messageConfirmButtonStyle(dialog.tone ?? 'default')}
            onClick={isConfirm ? onConfirm : onClose}
          >
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="info-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
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

function getCreditCardInsights(
  creditCards: CreditCardAccount[],
): CreditCardInsight[] {
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

    return {
      card,
      utilization,
      availableCredit,
      daysToCutOff,
      daysToDue,
      score,
    }
  })

  const sortedCards = [...scoredCards].sort((a, b) => b.score - a.score)

  return sortedCards.map((item, index) => {
    const isDanger =
      item.daysToDue <= 5 || item.utilization >= 80 || item.availableCredit <= 0

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
  if (item.availableCredit <= 0) {
    return 'No available credit remaining. Avoid using this card.'
  }

  if (item.daysToDue <= 5) {
    return `Due date is ${formatRelativeDays(item.daysToDue)}. Avoid adding more balance.`
  }

  if (item.utilization >= 80) {
    return `Utilization is high at ${item.utilization}%. Avoid if possible.`
  }

  if (status === 'recommended') {
    return `${formatRelativeDays(item.daysToCutOff)} before cut-off, ${formatRelativeDays(
      item.daysToDue,
    )} before due date, and ${item.utilization}% utilization.`
  }

  return `${formatRelativeDays(item.daysToCutOff)} before cut-off and ${item.utilization}% utilization.`
}

function getDailyRecommendation(insights: CreditCardInsight[]) {
  const recommendedCard = insights.find(
    (insight) => insight.status === 'recommended',
  )

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
      description:
        'Your available cards are near due date, highly utilized, or have limited available credit.',
    }
  }

  return {
    title: 'Add a credit card',
    description:
      'DueWise needs at least one credit card to calculate the best card to use today.',
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
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0',
  )}`
}

function getBillRemainingBalance(expense: RecurringExpense) {
  const remaining =
    typeof expense.remainingBalance === 'number'
      ? expense.remainingBalance
      : expense.amount

  if (!Number.isFinite(remaining)) return expense.amount

  return Math.max(Math.min(remaining, expense.amount), 0)
}

function normalizeRecurringExpenses(
  rawRecurringExpenses: unknown,
): RecurringExpense[] {
  const currentPeriodKey = getCurrentPeriodKey()
  const source = Array.isArray(rawRecurringExpenses)
    ? rawRecurringExpenses
    : initialFinanceData.recurringExpenses

  return source.map((rawExpense, index) => {
    const expense = rawExpense as Partial<RecurringExpense>

    const amount = Number(expense.amount ?? 0)
    const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0
    const savedPeriodKey =
      typeof expense.periodKey === 'string' ? expense.periodKey : currentPeriodKey

    const shouldResetForNewMonth = savedPeriodKey !== currentPeriodKey

    const savedRemaining =
      typeof expense.remainingBalance === 'number'
        ? expense.remainingBalance
        : safeAmount

    const normalizedRemaining = shouldResetForNewMonth
      ? safeAmount
      : Math.max(Math.min(savedRemaining, safeAmount), 0)

    const normalizedExpense: RecurringExpense = {
      id: Number(expense.id ?? index + 1),
      name: String(expense.name ?? `Bill ${index + 1}`),
      category: String(expense.category ?? 'Other'),
      amount: safeAmount,
      frequency: String(expense.frequency ?? 'Monthly'),
      nextDue: String(expense.nextDue ?? 'Every month'),
      remainingBalance: normalizedRemaining,
      periodKey: currentPeriodKey,
    }

    if (!shouldResetForNewMonth && typeof expense.lastPaidAt === 'string') {
      normalizedExpense.lastPaidAt = expense.lastPaidAt
    }

    return normalizedExpense
  })
}

function parseDayFromText(value: unknown, fallback: number) {
  if (typeof value === 'number' && isValidDayOfMonth(value)) return value

  if (typeof value !== 'string') return fallback

  const match = value.match(/\b([1-9]|[12][0-9]|3[01])\b/)
  const parsedDay = match ? Number(match[1]) : fallback

  return isValidDayOfMonth(parsedDay) ? parsedDay : fallback
}

function normalizeCreditCards(rawCreditCards: unknown): CreditCardAccount[] {
  if (!Array.isArray(rawCreditCards)) return initialFinanceData.creditCards

  return rawCreditCards.map((rawCard, index) => {
    const card = rawCard as Partial<
      CreditCardAccount & {
        cutOffDate: string
        dueDate: string
        recommendation: string
      }
    >

    const creditLimit = Number(card.creditLimit ?? 1)
    const currentBalance = Number(card.currentBalance ?? 0)

    const normalizedCard: CreditCardAccount = {
      id: Number(card.id ?? index + 1),
      name: String(card.name ?? `Credit Card ${index + 1}`),
      currentBalance: Number.isFinite(currentBalance) ? currentBalance : 0,
      creditLimit:
        Number.isFinite(creditLimit) && creditLimit > 0 ? creditLimit : 1,
      cutOffDay: parseDayFromText(card.cutOffDay ?? card.cutOffDate, 1),
      dueDay: parseDayFromText(card.dueDay ?? card.dueDate, 15),
    }

    if (typeof card.lastPaymentAt === 'string') {
      normalizedCard.lastPaymentAt = card.lastPaymentAt
    }

    return normalizedCard
  })
}

function normalizeFinanceData(data: Partial<FinanceData>): FinanceData {
  return {
    accounts: data.accounts ?? initialFinanceData.accounts,
    creditCards: normalizeCreditCards(data.creditCards),
    savingsGoals: data.savingsGoals ?? initialFinanceData.savingsGoals,
    debts: data.debts ?? initialFinanceData.debts,
    recurringExpenses: normalizeRecurringExpenses(data.recurringExpenses),
    transactions: data.transactions ?? initialFinanceData.transactions,
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

const smallMutedLineStyle: CSSProperties = {
  margin: '10px 0 0',
  color: '#81786d',
  fontSize: '0.72rem',
  fontWeight: 700,
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
  const isSuccess = tone === 'success'

  return {
    width: 54,
    height: 54,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    color: isDanger ? '#b64a46' : isSuccess ? '#245f4c' : '#171717',
    background: isDanger ? '#f3dfdc' : isSuccess ? '#dcece5' : '#eee9df',
  }
}

function messageConfirmButtonStyle(tone: DialogTone): CSSProperties {
  const isDanger = tone === 'danger'
  const isSuccess = tone === 'success'

  return {
    minHeight: 46,
    gridColumn: tone === 'default' ? '1 / -1' : undefined,
    border: 0,
    borderRadius: 16,
    color: '#ffffff',
    background: isDanger ? '#b64a46' : isSuccess ? '#245f4c' : '#171717',
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
