
import { useState, useEffect, type FormEvent } from "react";
import "./Transfers.css";
import { api, getToken, type Account as BackendAccount } from "./api";

type Account = {
  id: string | number;
  number: string;
  type: string;
  balance: number;
};

const mapAccount = (acc: BackendAccount): Account => ({
  id: acc.id,
  number: String(acc.accountNumber),
  type: "Savings Account",
  balance: Number(acc.balance),
});

export default function Transfers() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payerAccount, setPayerAccount] = useState("");
  const [payeeAccountNumber, setPayeeAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/";
      return;
    }
    api.accounts.list()
      .then((res) => {
        const loaded = (res.accounts || []).map(mapAccount);
        setAccounts(loaded);
        if (loaded.length > 0) {
          setPayerAccount(String(loaded[0].id));
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load accounts");
      });
  }, []);

  const selectedAccount = accounts.find(
    (account) => String(account.id) === String(payerAccount)
  );

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);

  async function handleTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!payerAccount || !payeeAccountNumber.trim() || !amount) {
      setError("Please complete all transfer details.");
      return;
    }

    const transferAmount = Number(amount);

    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      setError("Please enter a valid transfer amount.");
      return;
    }

    if (selectedAccount && transferAmount > selectedAccount.balance) {
      setError("The amount exceeds the selected demo account balance.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.transfers.create({
        payerAccountId: Number(payerAccount),
        payeeAccountNumber: payeeAccountNumber.trim(),
        amount: String(transferAmount),
      });
      setSuccess(res.message || "Transfer completed successfully");
      setAmount("");
      setPayeeAccountNumber("");

      // Refresh accounts list to reflect new balances
      const accRes = await api.accounts.list();
      setAccounts((accRes.accounts || []).map(mapAccount));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="transfers-page">
      <header className="transfers-navbar">
        <a href="/" className="transfers-brand">
          <span className="transfers-brand-mark">c</span>
          <span>CitiBank</span>
        </a>

        <span className="transfers-nav-label">DIGITAL BANKING</span>
      </header>

      <section className="transfers-layout">
        <aside className="transfers-sidebar">
          <div>
            <p className="transfers-menu-label">WORKSPACE</p>

            <nav className="transfers-menu">
              <a href="/dashboard" className="transfers-menu-item">
                <span>▦</span> Overview
              </a>

              <a href="/accounts" className="transfers-menu-item">
                <span>▤</span> Accounts
              </a>

              <a
                href="/transfers"
                className="transfers-menu-item active"
                aria-current="page"
              >
                <span>⇄</span> Transfers
              </a>

              <a
                href="/self-transfer"
                className="dashboard-menu-item"
                data-testid="self-transfer-nav"
              >
                <span>⇅</span>
                Self-Transfer
              </a>

              <a href="/transactions" className="transfers-menu-item">
                <span>◷</span> Transactions
              </a>
            </nav>
          </div>

          <div className="transfers-sidebar-bottom">
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

        <div className="transfers-main">
          <div className="transfers-welcome">
            <div>
              <p className="transfers-eyebrow">MOVE YOUR MONEY</p>
              <h1>Money <span>Transfers</span></h1>
              <p className="transfers-subtitle">
                Manage payments from your CitiBank accounts.
              </p>
            </div>

            <span className="transfers-demo-label">DEMO PREVIEW</span>
          </div>

          <div className="transfers-content-grid">
            <section className="transfers-form-card">
              <div className="transfers-card-heading">
                <div className="transfers-heading-icon">⇄</div>

                <div>
                  <p className="transfers-eyebrow">NEW PAYMENT</p>
                  <h2>Make a Transfer</h2>
                  <p>Enter the details to prepare your transfer.</p>
                </div>
              </div>

              <form onSubmit={handleTransfer} className="transfers-form">
                <div className="transfers-field">
                  <label htmlFor="payer-account">From account</label>

                  <select
                    id="payer-account"
                    data-testid="payer-account"
                    value={payerAccount}
                    onChange={(event) => {
                      setPayerAccount(event.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    required
                  >
                    <option value="">Select your account</option>

                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.type} — {account.number}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAccount && (
                  <div className="transfers-available-balance">
                    <span>AVAILABLE BALANCE</span>
                    <strong>
                      {formatMoney(selectedAccount.balance)}
                    </strong>
                  </div>
                )}

                <div className="transfers-field">
                  <label htmlFor="payee-account-number">
                    Recipient account number
                  </label>

                  <input
                    id="payee-account-number"
                    data-testid="payee-account-number"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 11-digit recipient account number"
                    value={payeeAccountNumber}
                    onChange={(event) => {
                      setPayeeAccountNumber(event.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    required
                  />
                </div>

                <div className="transfers-field">
                  <label htmlFor="transfer-amount">Transfer amount</label>

                  <div className="transfers-amount-wrapper">
                    <span>₹</span>

                    <input
                      id="transfer-amount"
                      data-testid="transfer-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(event) => {
                        setAmount(event.target.value);
                        setError("");
                        setSuccess("");
                      }}
                      required
                    />
                  </div>
                </div>

                {success && (
                  <p
                    className="transfers-success"
                    data-testid="transfer-success"
                    role="status"
                  >
                    {success}
                  </p>
                )}

                {error && (
                  <p
                    className="transfers-error"
                    data-testid="transfer-error"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="transfers-submit-button"
                  data-testid="transfer-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing transfer..." : <>Transfer Money <span>→</span></>}
                </button>
              </form>
            </section>

            <aside className="transfers-details">
              <div className="transfers-info-card">
                <div className="transfers-info-icon">◇</div>

                <p className="transfers-eyebrow">TRANSFER OVERVIEW</p>
                <h2>Simple and convenient.</h2>

                <p className="transfers-info-description">
                  Prepare your transfer by selecting an account,
                  entering the recipient details, and specifying
                  an amount.
                </p>

                <div className="transfers-info-divider" />

                <div className="transfers-info-row">
                  <span>Transfer currency</span>
                  <strong>INR (₹)</strong>
                </div>

                <div className="transfers-info-row">
                  <span>Current mode</span>
                  <strong>Demo preview</strong>
                </div>

                <div className="transfers-info-row">
                  <span>Backend status</span>
                  <strong>Not connected</strong>
                </div>
              </div>

              <div className="transfers-help-card">
                <span>ⓘ</span>

                <div>
                  <h3>Before you transfer</h3>
                  <p>
                    Double-check the recipient account number and
                    amount. No real transfers are processed in
                    this frontend preview.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          <p className="transfers-preview-note">
            CitiBank digital banking • Frontend demonstration
          </p>
        </div>
      </section>

      <footer className="transfers-page-footer">
        <span>© 2026 CitiBank</span>
        <span>Secure digital banking</span>
      </footer>
    </main>
  );
}
