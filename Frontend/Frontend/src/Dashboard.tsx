
import { useState } from "react";
import "./Dashboard.css";

type Account = {
  id: string;
  number: string;
  type: string;
  balance: number;
  currency: string;
};

const initialAccounts: Account[] = [
  {
    id: "ACC001",
    number: "•••• •••• 4821",
    type: "Savings Account",
    balance: 24580.5,
    currency: "INR",
  },
  {
    id: "ACC002",
    number: "•••• •••• 9032",
    type: "Current Account",
    balance: 12840.0,
    currency: "INR",
  },
];

export default function Dashboard() {
  const [accounts] = useState<Account[]>(
  initialAccounts
);


  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totalBalance = accounts.reduce(
    (total, account) => total + account.balance,
    0
  );

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  function handleCreateAccount() {
    setMessage("");
    setError(
      "Account creation is not connected to the backend yet."
    );
  }

  return (
    <main className="dashboard-page">

      {/* NAVBAR */}
      <header className="dashboard-navbar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">c</div>
          <span>CitiBank</span>
        </div>

        <span className="dashboard-nav-label">
          DIGITAL BANKING
        </span>
      </header>

      {/* MAIN DASHBOARD */}
      <div className="dashboard-layout">

        {/* SIDEBAR */}
        <aside className="dashboard-sidebar">

          <div>
            <p className="dashboard-menu-label">
              WORKSPACE
            </p>

            <nav className="dashboard-menu">
              <a
                href="/dashboard"
                className="dashboard-menu-item active"
                aria-current="page"
              >
                <span>▦</span>
                Overview
              </a>

              <a
                href="/accounts"
                className="dashboard-menu-item"
              >
                <span>▤</span>
                Accounts
              </a>

              <a
                href="/transfers"
                className="dashboard-menu-item"
              >
                <span>⇄</span>
                Transfers
              </a>

              <a
                href="/transactions"
                className="dashboard-menu-item"
              >
                <span>◷</span>
                Transactions
              </a>
            </nav>
          </div>

          <div className="dashboard-sidebar-bottom">
            <p>CITIBANK DIGITAL</p>
            <span>Banking made simple.</span>
          </div>

        </aside>

        {/* DASHBOARD CONTENT */}
        <section className="dashboard-main">

          <div className="dashboard-welcome">
            <div>
              <p className="dashboard-eyebrow">
                YOUR FINANCIAL OVERVIEW
              </p>

              <h1>
                Welcome back,{" "}
                <span data-testid="user-name">
                  CitiBank User
                </span>
              </h1>

              <p className="dashboard-subtitle">
                Here's an overview of your banking activity.
              </p>
            </div>

            <span className="dashboard-demo-label">
              DEMO PREVIEW
            </span>
          </div>

          {/* BALANCE OVERVIEW */}
          <div className="dashboard-summary">

            <div className="dashboard-balance-card">
              <div className="dashboard-balance-top">
                <span>TOTAL BALANCE</span>
                <span>◈</span>
              </div>

              <h2>{formatMoney(totalBalance)}</h2>

              <p>
                Across {accounts.length} linked accounts
              </p>

              <div className="dashboard-balance-decoration" />
            </div>

            <div className="dashboard-stat-card">
              <span>YOUR ACCOUNTS</span>

              <h2>{accounts.length}</h2>

              <p>Accounts in your portfolio</p>

              <div className="dashboard-stat-divider" />

              <span>ACCOUNT STATUS</span>

              <strong>Demo preview</strong>
            </div>

          </div>

          {/* ACCOUNTS SECTION */}
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                YOUR BANKING
              </p>

              <h2>My Accounts</h2>

              <p>
                View and manage your bank accounts.
              </p>
            </div>

            <button
              type="button"
              className="dashboard-create-button"
              data-testid="create-account-button"
              onClick={handleCreateAccount}
            >
              <span>＋</span>
              Create Account
            </button>
          </div>

          {/* ACCOUNT MESSAGES */}
          {message && (
            <p
              className="dashboard-success"
              data-testid="account-create-success"
              role="status"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              className="dashboard-error"
              data-testid="account-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* ACCOUNT LIST */}
          <div
            className="dashboard-accounts-list"
            data-testid="accounts-list"
          >

            {accounts.length === 0 ? (
              <div
                className="dashboard-empty"
                data-testid="account-empty-state"
              >
                No accounts available.
              </div>
            ) : (
              accounts.map((account) => (
                <article
                  className="dashboard-account-item"
                  data-testid="account-item"
                  key={account.id}
                >

                  <div className="dashboard-account-icon">
                    ▤
                  </div>

                  <div className="dashboard-account-details">
                    <h3>{account.type}</h3>

                    <p
                      data-testid="account-number"
                    >
                      {account.number}
                    </p>

                    <span data-testid="account-id">
                      ID: {account.id}
                    </span>
                  </div>

                  <div className="dashboard-account-amount">
                    <span>AVAILABLE BALANCE</span>

                    <strong
                      data-testid="account-balance"
                    >
                      {formatMoney(account.balance)}
                    </strong>
                  </div>

                </article>
              ))
            )}

          </div>

          {/* QUICK ACTIONS */}
          <div className="dashboard-section-heading dashboard-quick-heading">
            <div>
              <p className="dashboard-eyebrow">
                EVERYDAY BANKING
              </p>

              <h2>Quick Actions</h2>

              <p>
                Access your banking services.
              </p>
            </div>
          </div>

          <div className="dashboard-actions">

            <a
              href="/transfers"
              className="dashboard-action-card"
            >
              <div className="dashboard-action-icon">
                ⇄
              </div>

              <div>
                <h3>Transfer Money</h3>
                <p>Send funds securely.</p>
              </div>

              <span className="dashboard-action-arrow">
                →
              </span>
            </a>

            <a
              href="/transactions"
              className="dashboard-action-card"
            >
              <div className="dashboard-action-icon">
                ◷
              </div>

              <div>
                <h3>Transactions</h3>
                <p>View your payment history.</p>
              </div>

              <span className="dashboard-action-arrow">
                →
              </span>
            </a>

          </div>

          <p className="dashboard-preview-note">
            This dashboard currently displays sample data.
            Live account information will be available after
            backend integration.
          </p>

        </section>
      </div>

      {/* PAGE FOOTER */}
      <footer className="dashboard-page-footer">
        <span>© 2026 CitiBank</span>
        <span>Secure digital banking</span>
      </footer>

    </main>
  );
}
