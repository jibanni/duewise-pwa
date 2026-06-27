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
  Sun,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react'

type TabKey = 'today' | 'wallet' | 'plan' | 'insights'

type QuickAction = 'income' | 'expense' | 'transfer'

type AccountAccent = 'green' | 'blue' | 'teal'

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
type CreditCardFormValues = Omit<CreditCardAccount, 'id'>
type RecurringExpenseFormValues = Omit<RecurringExpense, 'id'>

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
      financeData.recurringExpenses.reduce(
        (total, expense) => total + expense.amount,
        0,
      ),
    [financeData.recurringExpenses],
  )

  const creditCardInsights = useMemo(
    () => getCreditCardInsights(financeData.creditCards),
    [financeData.creditCards],
  )

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
      alert('At least one cash account is required.')
      return
    }

    const account = financeData.accounts.find((item) => item.id === accountId)
    const confirmed = confirm(`Delete ${account?.name ?? 'this account'}?`)

    if (!confirmed) return

    setFinanceData((current) => ({
      ...current,
      accounts: current.accounts.filter((item) => item.id !== accountId),
    }))
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
    const confirmed = confirm(`Delete ${creditCard?.name ?? 'this card'}?`)

    if (!confirmed) return

    setFinanceData((current) => ({
      ...current,
      creditCards: current.creditCards.filter(
        (item) => item.id !== creditCardId,
      ),
    }))
  }

  function handleSaveRecurringExpense(values: RecurringExpenseFormValues) {
    if (recurringExpenseEditor?.mode === 'edit') {
      const recurringExpenseId = recurringExpenseEditor.recurringExpense.id

      setFinanceData((current) => ({
        ...current,
        recurringExpenses: current.recurringExpenses.map((expense) =>
          expense.id === recurringExpenseId
            ? { ...expense, ...values }
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
    const confirmed = confirm(
      `Delete ${recurringExpense?.name ?? 'this recurring expense'}?`,
    )

    if (!confirmed) return

    setFinanceData((current) => ({
      ...current,
      recurringExpenses: current.recurringExpenses.filter(
        (item) => item.id !== recurringExpenseId,
      ),
    }))
  }

  function handleAddIncome(accountId: number, amount: number, note: string) {
    const account = financeData.accounts.find((item) => item.id === accountId)

    if (!account) {
      alert('Please select a valid account.')
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
        alert('Please select a valid account.')
        return
      }

      if (amount > account.balance) {
        alert('Insufficient balance for this expense.')
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
        alert('Please select a valid credit card.')
        return
      }

      const availableCredit = card.creditLimit - card.currentBalance

      if (amount > availableCredit) {
        alert('Insufficient available credit for this expense.')
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

    alert('Please select a payment method.')
  }

  function handleTransfer(
    sourceAccountId: number,
    destinationAccountId: number,
    amount: number,
    note: string,
  ) {
    if (sourceAccountId === destinationAccountId) {
      alert('Source and destination accounts must be different.')
      return
    }

    const sourceAccount = financeData.accounts.find(
      (item) => item.id === sourceAccountId,
    )

    const destinationAccount = financeData.accounts.find(
      (item) => item.id === destinationAccountId,
    )

    if (!sourceAccount || !destinationAccount) {
      alert('Please select valid accounts.')
      return
    }

    if (amount > sourceAccount.balance) {
      alert('Insufficient balance for this transfer.')
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
    const confirmed = confirm(
      'Reset all DueWise sample data? This will clear your local changes.',
    )

    if (!confirmed) return

    localStorage.removeItem(STORAGE_KEY)
    setFinanceData(initialFinanceData)
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
              recurringExpenses={financeData.recurringExpenses}
              onOpenPlan={() => changeTab('plan')}
              onOpenWallet={() => changeTab('wallet')}
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
            />
          )}

          {activeTab === 'plan' && (
            <PlanPage
              recurringExpenses={financeData.recurringExpenses}
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
          />
        )}

        {accountEditor && (
          <AccountEditorModal
            editor={accountEditor}
            onClose={() => setAccountEditor(null)}
            onSave={handleSaveAccount}
          />
        )}

        {creditCardEditor && (
          <CreditCardEditorModal
            editor={creditCardEditor}
            onClose={() => setCreditCardEditor(null)}
            onSave={handleSaveCreditCard}
          />
        )}

        {recurringExpenseEditor && (
          <RecurringExpenseEditorModal
            editor={recurringExpenseEditor}
            onClose={() => setRecurringExpenseEditor(null)}
            onSave={handleSaveRecurringExpense}
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
}: {
  totalCash: number
  totalDebt: number
  transactions: Transaction[]
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

  const recurringCalendarItems = recurringExpenses
    .slice(0, 3)
    .map((expense) => ({
      id: Number(`9${expense.id}`),
      title: expense.name,
      date: expense.nextDue,
      amount: expense.amount,
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
      ? `${recurringExpenses.length - 3} more planned item${
          recurringExpenses.length - 3 === 1 ? '' : 's'
        } hidden from this preview.`
      : 'Showing your nearest planned items and top card events.'

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
        subtitle="Short preview only to keep Today clean"
      />

      <div className="card-list">
        {calendarItems.length === 0 && (
          <article className="account-card">
            <div className="card-main-content">
              <h3>No events yet</h3>
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
}: {
  recurringExpenses: RecurringExpense[]
  recurringTotal: number
  savingsGoals: SavingsGoal[]
  debts: Debt[]
  onAddRecurringExpense: () => void
  onEditRecurringExpense: (recurringExpense: RecurringExpense) => void
  onDeleteRecurringExpense: (recurringExpenseId: number) => void
}) {
  return (
    <>
      <RecurringPage
        recurringExpenses={recurringExpenses}
        recurringTotal={recurringTotal}
        onAddRecurringExpense={onAddRecurringExpense}
        onEditRecurringExpense={onEditRecurringExpense}
        onDeleteRecurringExpense={onDeleteRecurringExpense}
      />

      <SavingsPage savingsGoals={savingsGoals} />

      <DebtsPage debts={debts} />
    </>
  )
}

function SavingsPage({ savingsGoals }: { savingsGoals: SavingsGoal[] }) {
  return (
    <>
      <SectionTitle
        title="Savings Goals"
        subtitle="Track progress toward your financial targets"
      />

      <div className="card-list">
        {savingsGoals.map((goal) => {
          const progress = Math.round((goal.current / goal.target) * 100)
          const remaining = goal.target - goal.current

          return (
            <article key={goal.id} className="goal-card">
              <div className="goal-header">
                <div>
                  <h3>{goal.name}</h3>
                  <p>Target: {goal.targetDate}</p>
                </div>

                <strong>{progress}%</strong>
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
            </article>
          )
        })}
      </div>
    </>
  )
}

function DebtsPage({ debts }: { debts: Debt[] }) {
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

      <SectionTitle title="Debt Tracker" subtitle="Monitor balances and monthly payments" />

      <div className="card-list">
        {debts.map((debt) => (
          <article key={debt.id} className="debt-card">
            <div className="card-main-content">
              <h3>{debt.name}</h3>
              <p>
                {peso.format(debt.monthly)} monthly · {debt.due}
              </p>
            </div>

            <strong>{peso.format(debt.balance)}</strong>
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
}: {
  recurringExpenses: RecurringExpense[]
  recurringTotal: number
  onAddRecurringExpense: () => void
  onEditRecurringExpense: (recurringExpense: RecurringExpense) => void
  onDeleteRecurringExpense: (recurringExpenseId: number) => void
}) {
  return (
    <>
      <section className="recurring-summary">
        <div>
          <p>Monthly Plan Total</p>
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
        subtitle="Regular bills, subscriptions, and scheduled payments"
      />

      <div className="card-list">
        {recurringExpenses.length === 0 && (
          <article className="account-card">
            <div className="card-main-content">
              <h3>No bills yet</h3>
              <p>Add rent, utilities, subscriptions, or scheduled bills.</p>
            </div>
          </article>
        )}

        {recurringExpenses.map((expense) => (
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
            </div>

            <div style={amountActionColumnStyle}>
              <strong>{peso.format(expense.amount)}</strong>

              <div style={miniActionRowStyle}>
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
        ))}
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
}: {
  totalCash: number
  totalSavings: number
  totalDebt: number
  recurringTotal: number
  transactions: Transaction[]
  creditCardInsights: CreditCardInsight[]
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
        subtitle="Based on your locally recorded transactions and plan"
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
          label="Planned Bills"
          value={peso.format(recurringTotal)}
          type="neutral"
        />

        <OverviewRow
          label="Transactions"
          value={`${transactions.length}`}
          type="neutral"
        />
      </div>
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
        <article key={transaction.id} className="account-card">
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
      ))}
    </div>
  )
}

function AccountEditorModal({
  editor,
  onClose,
  onSave,
}: {
  editor: AccountEditorState
  onClose: () => void
  onSave: (values: AccountFormValues) => void
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
      alert('Please enter an account name.')
      return
    }

    if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
      alert('Please enter a valid balance.')
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
}: {
  editor: CreditCardEditorState
  onClose: () => void
  onSave: (values: CreditCardFormValues) => void
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
      alert('Please enter a credit card name.')
      return
    }

    if (!Number.isFinite(parsedCreditLimit) || parsedCreditLimit <= 0) {
      alert('Please enter a valid credit limit.')
      return
    }

    if (
      !Number.isFinite(parsedCurrentBalance) ||
      parsedCurrentBalance < 0 ||
      parsedCurrentBalance > parsedCreditLimit
    ) {
      alert('Please enter a valid current balance.')
      return
    }

    if (!isValidDayOfMonth(parsedCutOffDay)) {
      alert('Please enter a valid cut-off day from 1 to 31.')
      return
    }

    if (!isValidDayOfMonth(parsedDueDay)) {
      alert('Please enter a valid due day from 1 to 31.')
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
}: {
  editor: RecurringExpenseEditorState
  onClose: () => void
  onSave: (values: RecurringExpenseFormValues) => void
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
      alert('Please enter a bill name.')
      return
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount.')
      return
    }

    if (!nextDue.trim()) {
      alert('Please enter the next due date.')
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
      alert('Please enter a valid amount.')
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

    return {
      id: Number(card.id ?? index + 1),
      name: String(card.name ?? `Credit Card ${index + 1}`),
      currentBalance: Number.isFinite(currentBalance) ? currentBalance : 0,
      creditLimit:
        Number.isFinite(creditLimit) && creditLimit > 0 ? creditLimit : 1,
      cutOffDay: parseDayFromText(card.cutOffDay ?? card.cutOffDate, 1),
      dueDay: parseDayFromText(card.dueDay ?? card.dueDate, 15),
    }
  })
}

function loadFinanceData(): FinanceData {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)

    if (!savedData) return initialFinanceData

    const parsedData = JSON.parse(savedData) as Partial<FinanceData>

    return {
      accounts: parsedData.accounts ?? initialFinanceData.accounts,
      creditCards: normalizeCreditCards(parsedData.creditCards),
      savingsGoals: parsedData.savingsGoals ?? initialFinanceData.savingsGoals,
      debts: parsedData.debts ?? initialFinanceData.debts,
      recurringExpenses:
        parsedData.recurringExpenses ?? initialFinanceData.recurringExpenses,
      transactions: parsedData.transactions ?? initialFinanceData.transactions,
    }
  } catch {
    return initialFinanceData
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

export default App