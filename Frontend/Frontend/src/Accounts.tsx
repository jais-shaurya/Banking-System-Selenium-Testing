
import { useState, useEffect } from "react";
import "./Accounts.css";
import { api, getToken, type Account as BackendAccount } from "./api";

type Account = {
  id: string | number;
  number: string;
  type: string;
  balance: number;
  currency: string;
};

const mapAccount = (acc: BackendAccount): Account => ({
  id: acc.id,
  number: String(acc.accountNumber),
  type: "Savings Account",
  balance: Number(acc.balance),
  currency: "INR",
});

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/";
      return;
    }
    api.accounts.list()
      .then((res) => {
        setAccounts((res.accounts || []).map(mapAccount));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load accounts");
      });
  }, []);

  const totalBalance = accounts.reduce(
    (total, account) => total + account.balance,
    0
  );

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  async function handleCreateAccount() {
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const res = await api.accounts.create();
      setMessage(res.message || "Account created successfully");
      setAccounts((prev) => [...prev, mapAccount(res.account)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="accounts-page">
      <header className="accounts-navbar">
        <a href="/" className="accounts-brand">
          <span className="accounts-brand-mark">c</span>
          <span>CitiBank</span>
        </a>

        <span className="accounts-nav-label">DIGITAL BANKING</span>
      </header>

      <section className="accounts-layout">
        <aside className="accounts-sidebar">
          <div>
            <p className="accounts-menu-label">WORKSPACE</p>

            <nav className="accounts-menu">
              <a href="/dashboard" className="accounts-menu-item">
                <span>▦</span> Overview
              </a>

              <a
                href="/accounts"
                className="accounts-menu-item active"
                aria-current="page"
              >
                <span>▤</span> Accounts
              </a>

              <a href="/transfers" className="accounts-menu-item">
                <span>⇄</span> Transfers
              </a>

              <a href="/transactions" className="accounts-menu-item">
                <span>◷</span> Transactions
              </a>
            </nav>
          </div>

          <div className="accounts-sidebar-bottom">
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

        <div className="accounts-main">
          <div className="accounts-welcome">
            <div>
              <p className="accounts-eyebrow">YOUR BANKING</p>
              <h1>My <span>Accounts</span></h1>
              <p className="accounts-subtitle">
                View and manage your bank accounts in one place.
              </p>
            </div>

            <span className="accounts-demo-label">DEMO PREVIEW</span>
          </div>

          <div className="accounts-summary">
            <div className="accounts-balance-card">
              <div className="accounts-balance-top">
                <span>TOTAL AVAILABLE BALANCE</span>
                <span>◇</span>
              </div>

              <h2>{formatMoney(totalBalance)}</h2>
              <p>Across {accounts.length} linked accounts</p>
              <div className="accounts-balance-decoration" />
            </div>

            <div className="accounts-stat-card">
              <span>YOUR ACCOUNTS</span>
              <h2>{accounts.length}</h2>
              <p>Accounts in your portfolio</p>

              <div className="accounts-stat-divider" />

              <span>ACCOUNT STATUS</span>
              <strong>Demo preview</strong>
            </div>
          </div>

          <div className="accounts-section-heading">
            <div>
              <p className="accounts-eyebrow">ACCOUNT MANAGEMENT</p>
              <h2>All Accounts</h2>
              <p>Review your account details and balances.</p>
            </div>

            <button
              type="button"
              className="accounts-create-button"
              data-testid="create-account-button"
              onClick={handleCreateAccount}
              disabled={isLoading}
            >
              <span>+</span> {isLoading ? "Creating..." : "Create Account"}
            </button>
          </div>

          {message && (
            <p
              className="accounts-success"
              data-testid="account-create-success"
              role="status"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              className="accounts-error"
              data-testid="account-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <div
            className="accounts-list"
            data-testid="accounts-list"
          >
            {accounts.length === 0 ? (
              <div
                className="accounts-empty"
                data-testid="account-empty-state"
              >
                No accounts available.
              </div>
            ) : (
              accounts.map((account) => (
                <article
                  className="accounts-account-item"
                  data-testid="account-item"
                  key={account.id}
                >
                  <div className="accounts-account-icon">▤</div>

                  <div className="accounts-account-details">
                    <h3>{account.type}</h3>

                    <p data-testid="account-number">
                      {account.number}
                    </p>

                    <span data-testid="account-id">
                      Account ID: {account.id}
                    </span>
                  </div>

                  <div className="accounts-account-amount">
                    <span>AVAILABLE BALANCE</span>

                    <strong data-testid="account-balance">
                      {formatMoney(account.balance)}
                    </strong>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="accounts-info">
            <div className="accounts-info-icon">ⓘ</div>

            <div>
              <h3>Account information</h3>
              <p>
                This page currently displays sample account data.
                Your actual accounts will appear here once the
                backend is connected.
              </p>
            </div>
          </div>

          <p className="accounts-preview-note">
            CitiBank digital banking • Frontend demonstration
          </p>
        </div>
      </section>

      <footer className="accounts-page-footer">
        <span>© 2026 CitiBank</span>
        <span>Secure digital banking</span>
      </footer>
    </main>
  );
}
