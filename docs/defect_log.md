# MiniBank — Defect Log

## Overview
This document tracks all defects, synchronization issues, and edge cases discovered and resolved during the automated Selenium test suite implementation and execution.

---

### Defect: DEF-001
- **Associated Test Case:** ACC-001 (`test_accounts_list_shows_only_own_accounts`)
- **Module:** Accounts / Dashboard
- **Severity:** Medium
- **Status:** Closed / Resolved
- **Description:**
  When loading the dashboard, the test asserted immediately upon finding the outer `accounts-list` container. Because the accounts were fetched asynchronously from the cloud database, `find_elements` returned empty lists (`assert ([] or [])`), failing the assertion before React mounted the account items.
- **Root Cause:**
  Premature assertion on the static parent element prior to the completion of the asynchronous React `useEffect` network request.
- **Resolution:**
  Updated the explicit wait condition to wait for `visibility_of_element_located('[data-testid="account-item"]')`, guaranteeing that the network request had resolved and cards were mounted before inspection.

---

### Defect: DEF-002
- **Associated Test Case:** ACC-002 (`test_new_account_appears_in_list`)
- **Module:** Account Creation
- **Severity:** High
- **Status:** Closed / Resolved
- **Description:**
  Creating a new account timed out waiting for `len(accounts) == before + 1`. The test recorded `before = 0` during the initial mount phase instead of counting the user's real pre-existing accounts.
- **Root Cause:**
  Race condition between initial page mount and asynchronous data fetching. The initial `before` count was captured while the state was still initialized to empty.
- **Resolution:**
  Enforced an explicit wait on the initial `account-item` rendering before recording `before`, ensuring the counter increment verification (`after == before + 1`) is strictly deterministic.

---

### Defect: DEF-003
- **Associated Test Case:** TRF-001 (`test_valid_transfer_shows_success_message`)
- **Module:** Fund Transfers
- **Severity:** Critical
- **Status:** Closed / Resolved
- **Description:**
  Valid transfer submissions were failing with client-side balance errors ("The amount exceeds the selected demo account balance") even though the user possessed an account with sufficient balance.
- **Root Cause:**
  The transfer form defaulted to index 0 of the account dropdown. Newly created accounts start with a ₹0.00 balance, which caused transfer validation to reject any positive transfer amount. Furthermore, selecting an `<option>` directly via ChromeDriver `.click()` did not reliably trigger React's synthetic `onChange` handler.
- **Resolution:**
  Implemented WebDriver's standard `Select(payer_select).select_by_value()` to target the funded account (Account ID 9) and programmatically dispatched the DOM `change` event, guaranteeing the funded account was active for transfers.

---

### Defect: DEF-004
- **Associated Test Case:** AUTH-016 (`test_protected_pages_without_login_redirect`)
- **Module:** Authentication & Session Protection
- **Severity:** Medium
- **Status:** Closed / Resolved
- **Description:**
  When navigating across multiple protected routes in a loop (`/accounts`, `/transfers`, `/transactions`), `NoSuchElementException: [id="email"]` occurred intermittently on page reload.
- **Root Cause:**
  `window.location.href = "/"` initiates a full document refresh. The test attempted to locate the login email field before the newly redirected page finished DOM construction.
- **Resolution:**
  Replaced direct `driver.find_element` calls with `WebDriverWait.until(EC.visibility_of_element_located((By.ID, "email")))` to ensure each redirect completes before element verification.

---

### Defect: DEF-005
- **Associated Test Case:** Global Framework Configuration
- **Module:** Framework / Configuration
- **Severity:** Critical
- **Status:** Closed / Resolved
- **Description:**
  `config.py` defaulted `BASE_URL` to `http://localhost:3000` (the Node/Express REST API backend) instead of `http://localhost:5173` (the Vite/React frontend UI).
- **Root Cause:**
  Initial framework template configured for a single monolithic Flask application rather than a decoupled React SPA + Express API architecture.
- **Resolution:**
  Corrected default `BASE_URL` in `config.py` to `http://localhost:5173`.
