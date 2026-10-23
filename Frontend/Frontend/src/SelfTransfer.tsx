import { useEffect, useRef, useState, type FormEvent } from "react";
import "./SelfTransfer.css";
import {
  api,
  getToken,
  type Account as BackendAccount,
} from "./api";

type Action = "deposit" | "withdraw";
type Account = { id: number; number: string; type: string; balance: number };

const mapAccount = (account: BackendAccount): Account => ({
  id: Number(account.id),
  number: String(account.accountNumber),
  type: "Savings Account",
  balance: Number(account.balance),
});

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

export default function SelfTransfer() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [action, setAction] = useState<Action>("deposit");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!getToken()) {
      window.location.href = "/";
      return;
    }

    api.accounts.list()
      .then((response) => {
        const loaded = (response.accounts || []).map(mapAccount);
        setAccounts(loaded);
        if (loaded.length) setAccountId(String(loaded[0].id));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load accounts");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectedAccount = accounts.find((account) => String(account.id) === accountId);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    const parsedAmount = Number(amount);
    if (!selectedAccount) {
      setError("Select an account to continue.");
      return;
    }
    if (!/^\d{1,17}(\.\d{1,2})?$/.test(amount) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount greater than ₹0 with up to two decimal places.");
      return;
    }
    if (action === "withdraw" && parsedAmount > selectedAccount.balance) {
      setError("The withdrawal amount exceeds the available balance.");
      return;
    }
    if (action === "withdraw" && (!password || password.length > 72)) {
      setError("Enter your login password to confirm this withdrawal.");
      return;
    }
    setReviewing(true);
  }

  async function handleConfirm() {
    if (submittingRef.current || !selectedAccount) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    clearMessages();
    try {
      const result = action === "deposit"
        ? await api.accounts.deposit(selectedAccount.id, amount)
        : await api.accounts.withdraw(selectedAccount.id, amount, password);
      const updatedBalance = Number(result.balance);
      setAccounts((current) => current.map((account) =>
        account.id === selectedAccount.id ? { ...account, balance: updatedBalance } : account
      ));
      setSuccess(result.message || `${action === "deposit" ? "Deposit" : "Withdrawal"} completed successfully.`);
      setAmount("");
      setPassword("");
      setReviewing(false);

      api.accounts.list()
        .then((accountResponse) => setAccounts((accountResponse.accounts || []).map(mapAccount)))
        .catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} failed. Please try again.`);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="self-transfer-page">
      <header className="self-transfer-navbar">
        <a href="/" className="self-transfer-brand">
          <span className="self-transfer-brand-mark">c</span>
          <span>CitiBank</span>
        </a>

        <span className="self-transfer-nav-label">
          DIGITAL BANKING
        </span>
      </header>

      <section className="self-transfer-layout">
        <aside className="self-transfer-sidebar">
          <div>
            <p className="self-transfer-menu-label">WORKSPACE</p>

            <nav className="self-transfer-menu">
              <a href="/dashboard" className="self-transfer-menu-item">
                <span>▦</span> Overview
              </a>

              <a href="/accounts" className="self-transfer-menu-item">
                <span>▤</span> Accounts
              </a>

              <a href="/transfers" className="self-transfer-menu-item">
                <span>⇄</span> Transfers
              </a>

              <a
                href="/self-transfer"
                className="self-transfer-menu-item active"
                data-testid="self-transfer-nav"
                aria-current="page"
              >
                <span>⇅</span>
                Self-Transfer
              </a>

              <a
                href="/transactions"
                className="self-transfer-menu-item"
                aria-current="page"
              >
                <span>◷</span> Transactions
              </a>
            </nav>
          </div>

          <div className="self-transfer-sidebar-bottom">
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

        <div className="self-transfer-main">
          <div className="self-transfer-welcome">
            <div>
              <p className="self-transfer-eyebrow">
                YOUR BANKING ACTIVITY
              </p>

              <h1>
                Self  <span>Transfer</span>
              </h1>

              <p className="self-transfer-subtitle">
                Review your account activity in one place.
              </p>
            </div>

            <span className="self-transfer-demo-label">
              DEMO PREVIEW
            </span>
          </div>
          
          {success && <p className="self-transfer-success" data-testid="self-transfer-success" role="status">{success}</p>}
          {error && <p className="self-transfer-error" data-testid="self-transfer-error" role="alert">{error}</p>}

          <section className="self-transfer-form-card">
              <div className="self-transfer-card-heading">
                <div className="self-transfer-heading-icon">⇅</div>
                <div><p className="self-transfer-eyebrow">ACCOUNT SERVICES</p><h2>{reviewing ? "Review transaction" : "Deposit or withdraw"}</h2><p>Choose an action and review details before confirming.</p></div>
              </div>

              {!reviewing ? (
                <form className="self-transfer-form" onSubmit={handleReview}>
                  <div className="self-transfer-action-tabs" role="tablist" aria-label="Transaction type">
                    <button type="button" role="tab" aria-selected={action === "deposit"} className={action === "deposit" ? "active" : ""} data-testid="self-transfer-deposit-tab" onClick={() => { setAction("deposit"); setPassword(""); clearMessages(); }}>Deposit</button>
                    <button type="button" role="tab" aria-selected={action === "withdraw"} className={action === "withdraw" ? "active" : ""} data-testid="self-transfer-withdraw-tab" onClick={() => { setAction("withdraw"); clearMessages(); }}>Withdraw</button>
                  </div>

                  <div className="self-transfer-field">
                    <label htmlFor="self-account">Select account</label>
                    <select id="self-account" data-testid="self-account" value={accountId} onChange={(event) => { setAccountId(event.target.value); clearMessages(); }} required>
                      <option value="">{isLoading ? "Loading accounts…" : "Select your account"}</option>
                      {accounts.map((account) => <option key={account.id} value={account.id}>{account.type} — {account.number}</option>)}
                    </select>
                  </div>

                  {selectedAccount && <div className="self-transfer-balance" data-testid="self-transfer-balance"><span>AVAILABLE BALANCE</span><strong>{formatMoney(selectedAccount.balance)}</strong></div>}

                  <div className="self-transfer-field">
                    <label htmlFor="self-amount">Amount</label>
                    <div className="self-transfer-amount"><span>₹</span><input id="self-amount" data-testid="self-amount" type="text" inputMode="decimal" autoComplete="off" placeholder="0.00" value={amount} onChange={(event) => { setAmount(event.target.value); clearMessages(); }} required /></div>
                  </div>

                  {action === "withdraw" && <div className="self-transfer-field"><label htmlFor="self-password">Login password</label><input id="self-password" data-testid="self-password" type="password" autoComplete="current-password" maxLength={72} value={password} onChange={(event) => { setPassword(event.target.value); clearMessages(); }} required /></div>}

                  <button className="self-transfer-primary" data-testid="self-transfer-review" type="submit" disabled={isLoading || isSubmitting || accounts.length === 0}>Review {action === "deposit" ? "deposit" : "withdrawal"}<span>→</span></button>
                  {accounts.length === 0 && !isLoading && <p className="self-transfer-hint" data-testid="self-transfer-no-accounts">No active accounts are available. Create an account before continuing.</p>}
                </form>
              ) : (
                <div className="self-transfer-review" data-testid="self-transfer-confirmation">
                  <p>Confirm this {action} before it is submitted.</p>
                  <dl>
                    <div><dt>Action</dt><dd>{action === "deposit" ? "Deposit" : "Withdrawal"}</dd></div>
                    <div><dt>Account</dt><dd>•••• {selectedAccount?.number.slice(-4)}</dd></div>
                    <div><dt>Amount</dt><dd>{formatMoney(Number(amount))}</dd></div>
                    <div><dt>Available balance</dt><dd>{formatMoney(selectedAccount?.balance || 0)}</dd></div>
                    <div><dt>Balance after {action}</dt><dd>{formatMoney((selectedAccount?.balance || 0) + (action === "deposit" ? 1 : -1) * Number(amount))}</dd></div>
                  </dl>
                  <div className="self-transfer-review-actions">
                    <button type="button" className="self-transfer-secondary" data-testid="self-transfer-edit" disabled={isSubmitting} onClick={() => setReviewing(false)}>Edit details</button>
                    <button type="button" className="self-transfer-primary" data-testid="self-transfer-confirm" disabled={isSubmitting} onClick={handleConfirm}>{isSubmitting ? "Processing…" : "Confirm and submit"}</button>
                  </div>
                </div>
              )}
          </section>

          <div className="self-transfer-info">
            <span>ⓘ</span>

            <div>
              <h3>Transaction information</h3>

              <p>
                Open Transactions to view the records stored for your accounts.
              </p>
            </div>
          </div>

          <p className="self-transfer-preview-note">
            CitiBank digital banking • Frontend demonstration
          </p>
        </div>
      </section>

      <footer className="self-transfer-footer">
        <span>© 2026 CitiBank</span>
        <span>Secure digital banking</span>
      </footer>
    </main>
  );
}
