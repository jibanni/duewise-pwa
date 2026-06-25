import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ElementType,
  type FormEvent,
} from 'react'
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CreditCard,
  Landmark,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat2,
  WalletCards,
  X,
} from 'lucide-react'

type TabKey =
  | 'calendar'
  | 'accounts'
  | 'savings'
  | 'debts'
  | 'recurring'
  | 'analysis'

type QuickAction = 'income' | 'expense' | 'transfer'

type Account = {
  id: number
  name: string
  type: string
  balance: number
  accent: 'green' | 'blue' | 'teal'
}

type CreditCardAccount = {
  id: number
  name: string
  currentBalance: number
  creditLimit: number
  cutOffDate: string
  dueDate: string
  recommendation: string
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

const STORAGE_KEY = 'duewise-local-data-v1'

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
      cutOffDate: 'July 12',
      dueDate: 'August 2',
      recommendation: 'Best card to use today',
    },
    {
      id: 2,
      name: 'Metrobank Mastercard',
      currentBalance: 18400,
      creditLimit: 60000,
      cutOffDate: 'June 28',
      dueDate: 'July 18',
      recommendation: 'Avoid using for now',
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
  { key: 'accounts', label: 'Accounts', icon: WalletCards },
  { key: 'savings', label: 'Savings', icon: PiggyBank },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'debts', label: 'Debts', icon: ReceiptText },
  { key: 'recurring', label: 'Recurring', icon: Repeat2 },
  { key: 'analysis', label: 'Analysis', icon: BarChart3 },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('calendar')
  const [fabOpen, setFabOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null)
  const [financeData, setFinanceData] = useState<FinanceData>(loadFinanceData)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(financeData))
  }, [financeData])

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

  function changeTab(tab: TabKey) {
    setActiveTab(tab)
    setFabOpen(false)
  }

  function openQuickAction(action: QuickAction) {
    setActiveAction(action)
    setFabOpen(false)
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
    }
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
    <main className="app-shell">
      <section className="mobile-app">
        <header className="app-header">
          <div>
            <p className="brand-name">DueWise</p>
            <h1>{getPageTitle(activeTab)}</h1>
          </div>

          <button
            className="profile-button"
            type="button"
            aria-label="Reset local data"
            onClick={resetLocalData}
          >
            JD
          </button>
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
          {activeTab === 'calendar' && (
            <CalendarPage
              totalCash={totalCash}
              totalDebt={totalDebt}
              transactions={financeData.transactions}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsPage
              accounts={financeData.accounts}
              creditCards={financeData.creditCards}
            />
          )}

          {activeTab === 'savings' && (
            <SavingsPage savingsGoals={financeData.savingsGoals} />
          )}

          {activeTab === 'debts' && <DebtsPage debts={financeData.debts} />}

          {activeTab === 'recurring' && (
            <RecurringPage recurringExpenses={financeData.recurringExpenses} />
          )}

          {activeTab === 'analysis' && (
            <AnalysisPage
              totalCash={totalCash}
              totalSavings={totalSavings}
              totalDebt={totalDebt}
              transactions={financeData.transactions}
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
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
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
      </section>
    </main>
  )
}

function CalendarPage({
  totalCash,
  totalDebt,
  transactions,
}: {
  totalCash: number
  totalDebt: number
  transactions: Transaction[]
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

  const calendarItems = [
    {
      id: 1,
      title: 'Internet Bill',
      date: 'Today',
      amount: 1699,
      type: 'Recurring',
    },
    {
      id: 2,
      title: 'BPI Visa Cut-off',
      date: 'July 12',
      amount: 0,
      type: 'Cut-off',
    },
    {
      id: 3,
      title: 'Metrobank Due Date',
      date: 'July 18',
      amount: 18400,
      type: 'Due',
    },
  ]

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
          <h2>Use BPI Visa</h2>
          <span>
            Its next cut-off date is still far away, giving you a longer
            favorable payment window.
          </span>
        </div>
      </section>

      <section className="mini-grid">
        <InfoCard label="Available Cash" value={peso.format(totalCash)} />
        <InfoCard label="Total Debt" value={peso.format(totalDebt)} />
      </section>

      <SectionTitle
        title="Upcoming Money Events"
        subtitle="Bills, cut-off dates, and payment schedules"
      />

      <div className="card-list">
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

      <SectionTitle
        title="Recent Activity"
        subtitle="Transactions added through the quick action button"
      />

      <TransactionList transactions={transactions} />
    </>
  )
}

function AccountsPage({
  accounts,
  creditCards,
}: {
  accounts: Account[]
  creditCards: CreditCardAccount[]
}) {
  return (
    <>
      <SectionTitle
        title="Cash Accounts"
        subtitle="Cash, banks, and e-wallets"
      />

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

            <strong>{peso.format(account.balance)}</strong>
          </article>
        ))}
      </div>

      <SectionTitle
        title="Credit Cards"
        subtitle="Balances, due dates, and utilization"
      />

      <div className="card-list">
        {creditCards.map((card) => {
          const utilization = Math.round(
            (card.currentBalance / card.creditLimit) * 100,
          )

          return (
            <article key={card.id} className="credit-card">
              <div className="credit-card-header">
                <div>
                  <h3>{card.name}</h3>
                  <p>{card.recommendation}</p>
                </div>

                <strong>{utilization}%</strong>
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
                <span>Cut-off: {card.cutOffDate}</span>
                <span>Due: {card.dueDate}</span>
              </div>
            </article>
          )
        })}
      </div>
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

      <SectionTitle
        title="Debt Tracker"
        subtitle="Monitor balances and monthly payments"
      />

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
}: {
  recurringExpenses: RecurringExpense[]
}) {
  const recurringTotal = recurringExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  )

  return (
    <>
      <section className="recurring-summary">
        <div>
          <p>Monthly Recurring Total</p>
          <h2>{peso.format(recurringTotal)}</h2>
        </div>

        <Repeat2 size={30} />
      </section>

      <SectionTitle
        title="Recurring Expenses"
        subtitle="Regular bills and scheduled payments"
      />

      <div className="card-list">
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

            <strong>{peso.format(expense.amount)}</strong>
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
  transactions,
}: {
  totalCash: number
  totalSavings: number
  totalDebt: number
  transactions: Transaction[]
}) {
  const netWorth = totalCash + totalSavings - totalDebt

  const monthlyIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const monthlyExpenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const netCashflow = monthlyIncome - monthlyExpenses

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
          {netCashflow >= 0
            ? 'Your recorded cashflow is positive.'
            : 'Your recorded expenses are higher than income.'}
        </h3>
        <span>
          This insight is based on the transactions added through the quick
          action button.
        </span>
      </section>

      <SectionTitle
        title="Monthly Overview"
        subtitle="Based on your locally recorded transactions"
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
          label="Transactions"
          value={`${transactions.length}`}
          type="neutral"
        />
      </div>
    </>
  )
}

function TransactionList({ transactions }: { transactions: Transaction[] }) {
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
      {transactions.slice(0, 5).map((transaction) => (
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
    <div style={modalBackdropStyle}>
      <section style={modalPanelStyle}>
        <div style={modalHeaderStyle}>
          <div>
            <p style={modalEyebrowStyle}>Quick Action</p>
            <h2 style={modalTitleStyle}>{actionTitle}</h2>
          </div>

          <button type="button" style={modalCloseButtonStyle} onClick={onClose}>
            <X size={21} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={modalFormStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Amount</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              style={inputStyle}
              autoFocus
            />
          </label>

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

          <label style={fieldStyle}>
            <span style={labelStyle}>Note</span>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                action === 'income'
                  ? 'Salary, allowance, refund...'
                  : action === 'expense'
                    ? 'Food, fuel, bills...'
                    : 'Move funds...'
              }
              style={inputStyle}
            />
          </label>

          <button type="submit" style={submitButtonStyle}>
            Save
          </button>
        </form>
      </section>
    </div>
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

function getEventClass(type: string) {
  if (type === 'Due') return 'due'
  if (type === 'Cut-off') return 'cutoff'
  return 'recurring'
}

function getTransactionAccent(type: QuickAction): 'green' | 'blue' | 'teal' {
  if (type === 'income') return 'green'
  if (type === 'expense') return 'blue'
  return 'teal'
}

function getPageTitle(activeTab: TabKey) {
  const titles: Record<TabKey, string> = {
    calendar: 'Calendar',
    accounts: 'Accounts',
    savings: 'Savings',
    debts: 'Debts',
    recurring: 'Recurring',
    analysis: 'Analysis',
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

function loadFinanceData(): FinanceData {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)

    if (!savedData) return initialFinanceData

    const parsedData = JSON.parse(savedData) as Partial<FinanceData>

    return {
      accounts: parsedData.accounts ?? initialFinanceData.accounts,
      creditCards: parsedData.creditCards ?? initialFinanceData.creditCards,
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