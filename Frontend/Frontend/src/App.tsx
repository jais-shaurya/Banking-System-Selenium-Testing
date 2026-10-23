
import { useState, type FormEvent } from 'react'
import './App.css'
import Register from "./Register";
import Dashboard from "./Dashboard";
import Accounts from "./Accounts";
import Transfers from "./Transfers";
import Transactions from "./Transactions";
import SelfTransfer from "./SelfTransfer";

import { api } from './api';

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      await api.auth.login({ email, password });
      window.location.href = "/dashboard";
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  if (window.location.pathname === "/register") {
    return <Register />;
  }

  if (window.location.pathname === "/dashboard") {
    return <Dashboard />;
  }

  if (window.location.pathname === "/accounts") {
    return <Accounts />;
  }

  if (window.location.pathname === "/transfers") {
    return <Transfers />;
  }

  if (window.location.pathname === "/transactions") {
    return <Transactions />;
  }

  if (window.location.pathname === "/self-transfer") {
    return <SelfTransfer />;
  }




  return (
    <main className="page">
      <header className="navbar">
        <a className="brand" href="/" aria-label="CitiBank home">
          <span className="brand-mark">c</span>
          <span>CitiBank</span>
        </a>
        <span className="nav-label">DIGITAL BANKING</span>
      </header>

      <section className="login-layout">
        <aside className="visual-panel">
          <div className="visual-heading">
            <p className="eyebrow">YOUR MONEY, YOUR WAY</p>
            <h1>Banking made<br /><span>simple.</span></h1>
          </div>

          <div className="card-stage">
            <div className="bank-card">
              <div className="card-top">
                <div className="card-chip">
                  <span /><span /><span /><span />
                </div>
                <span className="contactless">)))</span>
              </div>

              <div className="card-number">
                •••• &nbsp; •••• &nbsp; •••• &nbsp; 2048
              </div>

              <div className="card-bottom">
                <div>
                  <span className="card-caption">CARD HOLDER</span>
                  <span className="card-holder">YOUR NAME</span>
                </div>
                <span className="card-network">VISA</span>
              </div>
            </div>
            <div className="card-shadow" />
          </div>

          <p className="visual-footer">Your everyday account, all in one place.</p>
        </aside>

        <section className="form-panel">
          <div className="form-content">
            <p className="eyebrow">WELCOME BACK</p>
            <h2>Sign in</h2>
            <p className="form-subtitle">Access your account.</p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <div className="field-label">
                  <label htmlFor="email">Email address</label>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  <a href="#forgot-password" className="forgot-link">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {loginError && (
                <p data-testid="login-error" role="alert" className="login-error">
                  {loginError}
                </p>
              )}

              <button
                id="login-button"
                data-testid="login-button"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : <>Sign in <span>→</span></>}
              </button>

              <p className="register-prompt">
                New here? <a
  id="register-link"
  data-testid="register-link"
  href="/register"
>
  Create an account
</a>
              </p>
            </form>
          </div>
        </section>
      </section>

      <footer className="page-footer">
        <span>© 2026 CitiBank</span>
        <span>Secure digital banking</span>
      </footer>
    </main>
  )
}

export default App
