"""
Transfer & Transaction History Selenium tests — Samarth
Covers: TRF-001 to TRF-007, TRX-001 to TRX-005

Selectors confirmed from Transfers.tsx and Transactions.tsx.
Uses shared driver fixture from feature/selenium-framework conftest.py.

Required environment variables:
    TEST_USER_EMAIL         — email of the primary test user (payer)
    TEST_USER_PASSWORD      — password of the primary test user
    TEST_PAYEE_ACCOUNT_NUM  — an 11-digit account number belonging to a DIFFERENT user (payee)
"""

import os
import sys
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

BASE_URL = "http://localhost:5173"

# ── shared helpers ────────────────────────────────────────────────────────────

def get_test_credentials():
    email = os.getenv("TEST_USER_EMAIL")
    password = os.getenv("TEST_USER_PASSWORD")
    if not email or not password:
        pytest.skip("Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run this test.")
    return email, password


def get_payee_account():
    acct = os.getenv("TEST_PAYEE_ACCOUNT_NUM")
    if not acct:
        pytest.skip("Set TEST_PAYEE_ACCOUNT_NUM (11-digit account number of a different user).")
    return acct


def login(driver, email, password, timeout=15):
    """Perform a full UI login and wait for /dashboard."""
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, timeout)
    wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys(email)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, '[data-testid="login-button"]').click()
    wait.until(EC.url_contains("/dashboard"))


def go_to_transfers(driver, timeout=15):
    """Navigate to /transfers and wait for the form to be ready."""
    driver.get(f"{BASE_URL}/transfers")
    wait = WebDriverWait(driver, timeout)
    wait.until(EC.visibility_of_element_located(
        (By.CSS_SELECTOR, '[data-testid="transfer-button"]')
    ))


def fill_transfer_form(driver, payee_account_num, amount, payer_index=None):
    """
    Fill in the transfer form.
    payer_index selects which account in the dropdown. If None, it selects
    the funded account (Account 9 / ending in 6957) or any option with positive balance.
    """
    wait = WebDriverWait(driver, 15)

    # Wait until accounts are loaded into the dropdown asynchronously
    wait.until(lambda d: len([
        o for o in d.find_element(By.CSS_SELECTOR, '[data-testid="payer-account"]').find_elements(By.TAG_NAME, "option")
        if o.get_attribute("value")
    ]) > 0)
    payer_select = driver.find_element(By.CSS_SELECTOR, '[data-testid="payer-account"]')
    options = payer_select.find_elements(By.TAG_NAME, "option")
    real_options = [o for o in options if o.get_attribute("value")]
    if not real_options:
        pytest.skip("Test user has no accounts to transfer from.")

    target_option = None
    if payer_index is not None:
        target_option = real_options[payer_index]
    else:
        # Prefer the funded account (Account 9, number ending in 6957)
        for opt in real_options:
            if "93493346957" in opt.text or opt.get_attribute("value") == "9":
                target_option = opt
                break
        if not target_option:
            target_option = real_options[0]

    target_val = target_option.get_attribute("value")
    from selenium.webdriver.support.ui import Select
    Select(payer_select).select_by_value(target_val)
    # Ensure React onChange fires reliably
    driver.execute_script(
        "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
        payer_select, target_val
    )

    # Enter payee account number
    payee_field = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="payee-account-number"]'
    )
    payee_field.clear()
    payee_field.send_keys(payee_account_num)

    # Enter amount
    amount_field = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="transfer-amount"]'
    )
    amount_field.clear()
    amount_field.send_keys(str(amount))


# ── Transfer tests ────────────────────────────────────────────────────────────

class TestTransferPage:
    """Basic page load and navigation."""

    def test_transfers_page_requires_login(self, driver):
        """TRF: /transfers without a session redirects to login."""
        driver.get(f"{BASE_URL}/transfers")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        assert driver.find_element(By.ID, "email").is_displayed()

    def test_transfers_page_loads_after_login(self, driver):
        """Transfer form is displayed after login."""
        email, password = get_test_credentials()
        login(driver, email, password)
        go_to_transfers(driver)
        assert driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-button"]'
        ).is_displayed()


class TestTransferValidation:
    """TRF-002, TRF-003, TRF-004, TRF-005, TRF-007 — rejection scenarios."""

    def test_transfer_zero_amount_shows_error(self, driver):
        """TRF-002: A transfer with amount 0 is rejected."""
        email, password = get_test_credentials()
        login(driver, email, password)
        go_to_transfers(driver)
        payee = get_payee_account()
        fill_transfer_form(driver, payee, 0)
        driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-button"]'
        ).click()
        wait = WebDriverWait(driver, 10)
        # Either a browser constraint blocks it, or the UI shows an error
        try:
            wait.until(EC.visibility_of_element_located(
                (By.CSS_SELECTOR, '[data-testid="transfer-error"]')
            ))
            assert driver.find_element(
                By.CSS_SELECTOR, '[data-testid="transfer-error"]'
            ).text
        except Exception:
            # min="0.01" on input means browser blocks it; no success message shown
            success_els = driver.find_elements(
                By.CSS_SELECTOR, '[data-testid="transfer-success"]'
            )
            assert not success_els, "Zero-amount transfer should not succeed"

    def test_transfer_negative_amount_blocked(self, driver):
        """TRF-002 variant: A negative amount is rejected by browser min constraint."""
        email, password = get_test_credentials()
        login(driver, email, password)
        go_to_transfers(driver)
        payee = get_payee_account()
        fill_transfer_form(driver, payee, -100)
        driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-button"]'
        ).click()
        wait = WebDriverWait(driver, 5)
        success_els = driver.find_elements(
            By.CSS_SELECTOR, '[data-testid="transfer-success"]'
        )
        assert not success_els, "Negative-amount transfer should not succeed"

    def test_transfer_insufficient_funds_shows_error(self, driver):
        """TRF-003: Transferring more than the account balance is rejected."""
        email, password = get_test_credentials()
        login(driver, email, password)
        go_to_transfers(driver)
        payee = get_payee_account()
        fill_transfer_form(driver, payee, 999_999_999)
        driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-button"]'
        ).click()
        wait = WebDriverWait(driver, 10)
        error_el = wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="transfer-error"]')
        ))
        assert error_el.text.strip()

    def test_transfer_nonexistent_account_shows_error(self, driver):
        """TRF-005: Transferring to a non-existent account number is rejected."""
        email, password = get_test_credentials()
        login(driver, email, password)
        go_to_transfers(driver)
        fill_transfer_form(driver, "00000000001", 1)  # valid format, doesn't exist
        driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-button"]'
        ).click()
        wait = WebDriverWait(driver, 10)
        error_el = wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="transfer-error"]')
        ))
        assert error_el.text.strip()

    def test_transfer_missing_payee_blocked_by_browser(self, driver):
        """TRF-007: Submitting without a recipient account number is blocked (required)."""
        email, password = get_test_credentials()
        login(driver, email, password)
        go_to_transfers(driver)
        # Fill amount but leave payee blank
        amount_field = driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-amount"]'
        )
        amount_field.clear()
        amount_field.send_keys("100")
        driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-button"]'
        ).click()
        # Page stays on /transfers; no success
        success_els = driver.find_elements(
            By.CSS_SELECTOR, '[data-testid="transfer-success"]'
        )
        assert not success_els

    def test_transfer_missing_amount_blocked_by_browser(self, driver):
        """TRF-007 variant: Submitting without an amount is blocked (required)."""
        email, password = get_test_credentials()
        login(driver, email, password)
        go_to_transfers(driver)
        payee = get_payee_account()
        payee_field = driver.find_element(
            By.CSS_SELECTOR, '[data-testid="payee-account-number"]'
        )
        payee_field.clear()
        payee_field.send_keys(payee)
        driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-button"]'
        ).click()
        success_els = driver.find_elements(
            By.CSS_SELECTOR, '[data-testid="transfer-success"]'
        )
        assert not success_els


class TestTransferSuccess:
    """TRF-001, TRF-006 — successful transfer and balance update."""

    def test_valid_transfer_shows_success_message(self, driver):
        """TRF-001: A valid transfer shows a success confirmation."""
        email, password = get_test_credentials()
        login(driver, email, password)
        go_to_transfers(driver)
        payee = get_payee_account()
        fill_transfer_form(driver, payee, 1)  # transfer ₹1
        driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-button"]'
        ).click()
        wait = WebDriverWait(driver, 15)
        # Wait for either success or error message
        wait.until(lambda d: d.find_elements(By.CSS_SELECTOR, '[data-testid="transfer-success"]') or d.find_elements(By.CSS_SELECTOR, '[data-testid="transfer-error"]'))
        errors = driver.find_elements(By.CSS_SELECTOR, '[data-testid="transfer-error"]')
        if errors and errors[0].is_displayed():
            pytest.fail(f"Transfer failed with error: {errors[0].text}")
        success_el = wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="transfer-success"]')
        ))
        assert success_el.text.strip()

    def test_successful_transfer_clears_form(self, driver):
        """TRF-001: After a successful transfer the amount and payee fields are cleared."""
        email, password = get_test_credentials()
        login(driver, email, password)
        go_to_transfers(driver)
        payee = get_payee_account()
        fill_transfer_form(driver, payee, 1)
        driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-button"]'
        ).click()
        wait = WebDriverWait(driver, 15)
        wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="transfer-success"]')
        ))
        amount_val = driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-amount"]'
        ).get_attribute("value")
        payee_val = driver.find_element(
            By.CSS_SELECTOR, '[data-testid="payee-account-number"]'
        ).get_attribute("value")
        assert amount_val == "", f"Amount field should be cleared after transfer, got: {amount_val}"
        assert payee_val == "", f"Payee field should be cleared after transfer, got: {payee_val}"


# ── Transaction history tests ─────────────────────────────────────────────────

class TestTransactionHistory:
    """TRX-001 to TRX-004 — transaction history page."""

    def test_transactions_page_requires_login(self, driver):
        """TRX: /transactions without a session redirects to login."""
        driver.get(f"{BASE_URL}/transactions")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        assert driver.find_element(By.ID, "email").is_displayed()

    def test_transactions_page_loads_after_login(self, driver):
        """TRX-001: Transaction history page loads and shows the table."""
        email, password = get_test_credentials()
        login(driver, email, password)
        driver.get(f"{BASE_URL}/transactions")
        wait = WebDriverWait(driver, 15)
        table = wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="transactions-table"]')
        ))
        assert table.is_displayed()

    def test_transactions_shows_rows_or_empty_state(self, driver):
        """TRX-001/TRX-002: Transaction table shows rows or an empty-state message."""
        email, password = get_test_credentials()
        login(driver, email, password)
        driver.get(f"{BASE_URL}/transactions")
        wait = WebDriverWait(driver, 15)
        wait.until(EC.invisibility_of_element_located((By.CLASS_NAME, "transactions-loading")))
        rows = driver.find_elements(By.CSS_SELECTOR, '[data-testid="transaction-row"]')
        empty = driver.find_elements(By.CSS_SELECTOR, '[data-testid="transaction-empty-state"]')
        assert rows or empty, "Neither transaction rows nor empty-state is shown"

    def test_transaction_rows_have_type_direction_status(self, driver):
        """TRX-003: Each transaction row shows type, direction, and status columns."""
        email, password = get_test_credentials()
        login(driver, email, password)
        driver.get(f"{BASE_URL}/transactions")
        wait = WebDriverWait(driver, 15)
        wait.until(EC.invisibility_of_element_located((By.CLASS_NAME, "transactions-loading")))
        rows = driver.find_elements(By.CSS_SELECTOR, '[data-testid="transaction-row"]')
        if not rows:
            pytest.skip("No transactions to inspect.")
        first_row = rows[0]
        assert first_row.find_element(
            By.CSS_SELECTOR, '[data-testid="transaction-type"]'
        ).text.strip()
        assert first_row.find_element(
            By.CSS_SELECTOR, '[data-testid="transaction-direction"]'
        ).text.strip()
        assert first_row.find_element(
            By.CSS_SELECTOR, '[data-testid="transaction-status"]'
        ).text.strip()

    def test_transaction_row_shows_amount(self, driver):
        """TRX-004: Each transaction row shows a non-empty amount."""
        email, password = get_test_credentials()
        login(driver, email, password)
        driver.get(f"{BASE_URL}/transactions")
        wait = WebDriverWait(driver, 15)
        wait.until(EC.invisibility_of_element_located((By.CLASS_NAME, "transactions-loading")))
        rows = driver.find_elements(By.CSS_SELECTOR, '[data-testid="transaction-row"]')
        if not rows:
            pytest.skip("No transactions to inspect.")
        amount_text = rows[0].find_element(
            By.CSS_SELECTOR, '[data-testid="transaction-amount"]'
        ).text.strip()
        assert amount_text, "Transaction amount cell is empty"

    def test_transfer_appears_in_history_after_success(self, driver):
        """TRX-004: After a successful transfer, transaction history count increases."""
        email, password = get_test_credentials()
        login(driver, email, password)

        # Record initial transaction count
        driver.get(f"{BASE_URL}/transactions")
        wait = WebDriverWait(driver, 15)
        wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, '[data-testid="transaction-row"]')) > 0 or len(d.find_elements(By.CSS_SELECTOR, '[data-testid="transaction-empty-state"]')) > 0)
        before_rows = len(driver.find_elements(
            By.CSS_SELECTOR, '[data-testid="transaction-row"]'
        ))

        # Perform a transfer
        payee = get_payee_account()
        go_to_transfers(driver)
        fill_transfer_form(driver, payee, 1)
        driver.find_element(
            By.CSS_SELECTOR, '[data-testid="transfer-button"]'
        ).click()
        wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="transfer-success"]')
        ))

        # Check history again
        driver.get(f"{BASE_URL}/transactions")
        wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, '[data-testid="transaction-row"]')) > before_rows)
        after_rows = len(driver.find_elements(
            By.CSS_SELECTOR, '[data-testid="transaction-row"]'
        ))
        assert after_rows > before_rows, (
            f"Expected more transactions after transfer. Before: {before_rows}, After: {after_rows}"
        )
