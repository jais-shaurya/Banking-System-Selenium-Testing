
import { useState, type FormEvent } from "react";
import "./Register.css";
import { api } from "./api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phNumber, setPhNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      await api.auth.register({ name, email, phNumber, password });
      setMessage("Registration successful! You can now sign in.");
      setName("");
      setEmail("");
      setPhNumber("");
      setPassword("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="register-page">

      {/* NAVBAR */}
      <header className="register-navbar">
        <div className="register-brand">
          <div className="register-brand-mark">c</div>
          <span>CitiBank</span>
        </div>

        <span className="register-nav-label">
          DIGITAL BANKING
        </span>
      </header>

      {/* MAIN CONTAINER */}
      <div className="register-layout">

        {/* LEFT VISUAL PANEL */}
        <section className="register-visual-panel">

          <div className="register-visual-heading">
            <p className="register-eyebrow">
              YOUR MONEY. YOUR WAY
            </p>

            <h1>
              Banking made
              <br />
              <span>simple.</span>
            </h1>
          </div>

          <div className="register-card-stage">
            <div className="register-bank-card">

              <div className="register-card-top">
                <div className="register-card-chip">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <span className="register-contactless">≋</span>
              </div>

              <p className="register-card-number">
                •••• &nbsp; •••• &nbsp; •••• &nbsp; 2048
              </p>

              <div className="register-card-bottom">
                <div>
                  <span className="register-card-caption">
                    CARD HOLDER
                  </span>

                  <span className="register-card-holder">
                    YOUR NAME
                  </span>
                </div>

                <span className="register-card-network">
                  VISA
                </span>
              </div>

            </div>
          </div>

          <p className="register-visual-footer">
            Your everyday account, all in one place.
          </p>

        </section>

        {/* RIGHT REGISTRATION PANEL */}
        <section className="register-form-panel">

          <div className="register-content">

            <p className="register-eyebrow">
              GET STARTED
            </p>

            <h2>Create your account</h2>

            <p className="register-subtitle">
              Set up your banking profile in a few simple steps.
            </p>

            <form
              className="register-form"
              onSubmit={handleRegister}
            >

              {/* FULL NAME */}
              <div className="register-form-group">
                <label htmlFor="name">Full name</label>

                <input
                  id="name"
                  name="name"
                  data-testid="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* EMAIL */}
              <div className="register-form-group">
                <label htmlFor="email">Email address</label>

                <input
                  id="email"
                  name="email"
                  data-testid="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* PHONE NUMBER */}
              <div className="register-form-group">
                <label htmlFor="phNumber">Phone number</label>

                <input
                  id="phNumber"
                  name="phNumber"
                  data-testid="phNumber"
                  type="tel"
                  value={phNumber}
                  onChange={(e) => setPhNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              {/* PASSWORD */}
              <div className="register-form-group">
                <label htmlFor="password">Password</label>

                <input
                  id="password"
                  name="password"
                  data-testid="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="register-submit"
                data-testid="register-button"
                disabled={isLoading}
              >
                <span>{isLoading ? "Creating account..." : "Create account"}</span>
                <span aria-hidden="true">→</span>
              </button>

              {/* REGISTRATION STATUS */}
              {message && (
                <p
                  className="register-status"
                  data-testid={
                    message.startsWith("Registration successful")
                      ? "registration-success"
                      : "registration-error"
                  }
                  role="status"
                >
                  {message}
                </p>
              )}

            </form>

            {/* SIGN IN LINK */}
            <p className="register-footer">
              Already have an account?{" "}
              <a href="/" data-testid="login-link">
                Sign in
              </a>
            </p>

          </div>
        </section>

      </div>

      {/* PAGE FOOTER */}
      <footer className="register-page-footer">
        <span>© 2026 CitiBank</span>
        <span>Secure digital banking</span>
      </footer>

    </main>
  );
}
