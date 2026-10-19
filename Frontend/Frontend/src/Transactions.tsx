
import "./Transactions.css";

type Transaction = {
  id: string;
  description: string;
  date: string;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  status: string;
};

const demoTransactions: Transaction[] = [
  {
    id: "TXN001",
    description: "Salary Deposit",
    date: "18 Oct 2026",
    type: "Deposit",
    direction: "CREDIT",
    amount: 35000,
    status: "Completed",
  },
  {
    id: "TXN002",
    description: "Online Payment",
    date: "16 Oct 2026",
    type: "Transfer",
    direction: "DEBIT",
    amount: 2450,
    status: "Completed",
  },
  {
    id: "TXN003",
    description: "Account Transfer",
    date: "14 Oct 2026",
    type: "Transfer",
    direction: "CREDIT",
    amount: 5000,
    status: "Completed",
  },
  {
    id: "TXN004",
    description: "Utility Payment",
    date: "12 Oct 2026",
    type: "Payment",
    direction: "DEBIT",
    amount: 1299,
    status: "Completed",
  },
];

export default function Transactions() {
  const transactions = demoTransactions;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  return (
    <main className="transactions-page">
      <header className="transactions-navbar">
        <a href="/" className="transactions-brand">
          <span className="transactions-brand-mark">c</span>
          <span>CitiBank</span>
        </a>

        <span className="transactions-nav-label">
          DIGITAL BANKING
        </span>
      </header>

      <section className="transactions-layout">
        <aside className="transactions-sidebar">
          <div>
            <p className="transactions-menu-label">WORKSPACE</p>

            <nav className="transactions-menu">
              <a href="/dashboard" className="transactions-menu-item">
                <span>▦</span> Overview
              </a>

              <a href="/accounts" className="transactions-menu-item">
                <span>▤</span> Accounts
              </a>

              <a href="/transfers" className="transactions-menu-item">
                <span>⇄</span> Transfers
              </a>

              <a
                href="/transactions"
                className="transactions-menu-item active"
                aria-current="page"
              >
                <span>◷</span> Transactions
              </a>
            </nav>
          </div>

          <div className="transactions-sidebar-bottom">
            <p>CITIBANK DIGITAL</p>
            <span>Banking made simple.</span>
          </div>
        </aside>

        <div className="transactions-main">
          <div className="transactions-welcome">
            <div>
              <p className="transactions-eyebrow">
                YOUR BANKING ACTIVITY
              </p>

              <h1>
                Transaction <span>History</span>
              </h1>

              <p className="transactions-subtitle">
                Review your account activity in one place.
              </p>
            </div>

            <span className="transactions-demo-label">
              DEMO PREVIEW
            </span>
          </div>

          <div className="transactions-summary">
            <div className="transactions-summary-card">
              <span>TOTAL TRANSACTIONS</span>
              <h2>{transactions.length}</h2>
              <p>Sample transaction records</p>
            </div>

            <div className="transactions-summary-card">
              <span>INCOMING</span>

              <h2 className="transactions-credit">
                {transactions.filter(
                  (transaction) =>
                    transaction.direction === "CREDIT"
                ).length}
              </h2>

              <p>Credit transactions</p>
            </div>

            <div className="transactions-summary-card">
              <span>OUTGOING</span>

              <h2 className="transactions-debit">
                {transactions.filter(
                  (transaction) =>
                    transaction.direction === "DEBIT"
                ).length}
              </h2>

              <p>Debit transactions</p>
            </div>
          </div>

          <section className="transactions-history">
            <div className="transactions-section-heading">
              <div>
                <p className="transactions-eyebrow">
                  ACCOUNT ACTIVITY
                </p>

                <h2>Recent Transactions</h2>

                <p>
                  Your latest banking activity will appear here.
                </p>
              </div>

              <span className="transactions-count">
                {transactions.length} RECORDS
              </span>
            </div>

            <div className="transactions-table-wrapper">
              <table
                className="transactions-table"
                data-testid="transactions-table"
              >
                <thead>
                  <tr>
                    <th>TRANSACTION</th>
                    <th>TYPE</th>
                    <th>DIRECTION</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      data-testid="transaction-row"
                    >
                      <td>
                        <div className="transactions-description">
                          <span className="transactions-row-icon">
                            {transaction.direction === "CREDIT"
                              ? "↙"
                              : "↗"}
                          </span>

                          <div>
                            <strong>
                              {transaction.description}
                            </strong>

                            <span>
                              {transaction.date} · {transaction.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td data-testid="transaction-type">
                        {transaction.type}
                      </td>

                      <td data-testid="transaction-direction">
                        <span
                          className={
                            transaction.direction === "CREDIT"
                              ? "transactions-direction credit"
                              : "transactions-direction debit"
                          }
                        >
                          {transaction.direction}
                        </span>
                      </td>

                      <td
                        className="transactions-amount"
                        data-testid="transaction-amount"
                      >
                        {transaction.direction === "CREDIT"
                          ? "+"
                          : "-"}
                        {formatMoney(transaction.amount)}
                      </td>

                      <td data-testid="transaction-status">
                        <span className="transactions-status">
                          <span className="transactions-status-dot" />
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length === 0 && (
              <div
                className="transactions-empty"
                data-testid="transaction-empty-state"
              >
                <span>◷</span>
                <h3>No transactions yet</h3>
                <p>
                  Your transaction history will appear here
                  once activity is available.
                </p>
              </div>
            )}
          </section>

          <div className="transactions-info">
            <span>ⓘ</span>

            <div>
              <h3>Transaction information</h3>

              <p>
                These are sample records for the frontend
                demonstration. Actual transaction history
                will be retrieved when the backend is connected.
              </p>
            </div>
          </div>

          <p className="transactions-preview-note">
            CitiBank digital banking • Frontend demonstration
          </p>
        </div>
      </section>

      <footer className="transactions-page-footer">
        <span>© 2026 CitiBank</span>
        <span>Secure digital banking</span>
      </footer>
    </main>
  );
}
