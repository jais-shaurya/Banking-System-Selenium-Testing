
import { useState, useEffect } from "react";
import "./Transactions.css";
import { api, getToken, type Transaction as BackendTransaction } from "./api";

type Transaction = {
  id: string | number;
  description: string;
  date: string;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  status: string;
};

const mapTransaction = (t: BackendTransaction): Transaction => {
  const isCredit = t.direction.toLowerCase() === "credit";
  const isoDate = t.createdAt ? t.createdAt.replace(" ", "T") : "";
  const parsedDate = isoDate ? new Date(isoDate) : null;
  const dateFormatted = parsedDate && !isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recent";

  let description = `${t.type} Transaction`;
  if (t.type === "TRANSFER") {
    description = isCredit
      ? `Received from Account #${t.from ?? ""}`
      : `Transfer to Account #${t.to ?? ""}`;
  } else if (t.type === "DEPOSIT") {
    description = `Deposit to Account #${t.to ?? ""}`;
  } else if (t.type === "WITHDRAWAL") {
    description = `Withdrawal from Account #${t.from ?? ""}`;
  }

  const statusCapitalized = t.status
    ? t.status.charAt(0).toUpperCase() + t.status.slice(1)
    : "Completed";

  return {
    id: t.id,
    description,
    date: dateFormatted,
    type: t.type,
    direction: isCredit ? "CREDIT" : "DEBIT",
    amount: Number(t.amount),
    status: statusCapitalized,
  };
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/";
      return;
    }

    api.transactions.list()
      .then((res) => {
        setTransactions((res.transactions || []).map(mapTransaction));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load transactions");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

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
            <button
              type="button"
              onClick={() => api.auth.logout()}
              style={{
                marginTop: "12px",
                background: "transparent",
                border: "1px solid #37313f",
                color: "#aaa3b7",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Sign out
            </button>
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

            {error && (
              <p
                className="transactions-error"
                data-testid="transaction-error"
                role="alert"
              >
                {error}
              </p>
            )}

            {isLoading && (
              <p className="transactions-loading">
                Loading transactions...
              </p>
            )}

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
