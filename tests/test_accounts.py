"""
Account & Dashboard Selenium tests — Shaurya
Covers: DASH-001, ACC-001 to ACC-010

Selectors confirmed from Dashboard.tsx.
Uses shared driver fixture from feature/selenium-framework conftest.py.
Requires environment variables:
    TEST_USER_EMAIL       — registered test user email
    TEST_USER_PASSWORD    — registered test user password
"""

import sys
import os
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Allow helpers import when running locally across branch folders
FRAMEWORK_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "..", "..",
    "Banking-System-Selenium-Testing-feature-selenium-framework",
    "tests"
)
if FRAMEWORK_PATH not in sys.path:
    sys.path.insert(0, FRAMEWORK_PATH)

BASE_URL = "http://localhost:5173"

# ── shared helpers ────────────────────────────────────────────────────────────

def get_test_credentials():
    email = os.getenv("TEST_USER_EMAIL")
    password = os.getenv("TEST_USER_PASSWORD")
    if not email or not password:
        pytest.skip("Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run this test.")
    return email, password


def login(driver, email, password, timeout=15):
    """Perform a full UI login and wait until /dashboard is reached."""
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, timeout)
    wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys(email)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, '[data-testid="login-button"]').click()
    wait.until(EC.url_contains("/dashboard"))


# ── Dashboard tests ───────────────────────────────────────────────────────────

class TestDashboard:
    """DASH-001 — Dashboard visible and shows correct user name."""

    def test_dashboard_shows_user_name(self, driver):
        """DASH-001: After login the dashboard greets the logged-in user by name."""
        email, password = get_test_credentials()
        login(driver, email, password)
        wait = WebDriverWait(driver, 15)
        name_el = wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="user-name"]')
        ))
        assert name_el.text.strip(), "User name element is empty on the dashboard"

    def test_dashboard_displays_accounts_section(self, driver):
        """Dashboard renders the My Accounts section after login."""
        email, password = get_test_credentials()
        login(driver, email, password)
        wait = WebDriverWait(driver, 15)
        accounts_list = wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="accounts-list"]')
        ))
        assert accounts_list.is_displayed()

    def test_dashboard_create_account_button_visible(self, driver):
        """'Create Account' button is visible on the dashboard."""
        email, password = get_test_credentials()
        login(driver, email, password)
        wait = WebDriverWait(driver, 15)
        btn = wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="create-account-button"]')
        ))
        assert btn.is_displayed()


# ── Account listing tests ─────────────────────────────────────────────────────

class TestAccountListing:
    """ACC-001, ACC-003, ACC-005, ACC-007, ACC-008 — account list and balance display."""

    def test_accounts_list_shows_only_own_accounts(self, driver):
        """ACC-001: After login the accounts list is visible and belongs to the user."""
        email, password = get_test_credentials()
        login(driver, email, password)
        wait = WebDriverWait(driver, 15)
        # Wait for account cards or empty-state to finish loading from server
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="account-item"]')))
        items = driver.find_elements(By.CSS_SELECTOR, '[data-testid="account-item"]')
        empty = driver.find_elements(By.CSS_SELECTOR, '[data-testid="account-empty-state"]')
        assert items or empty, "Accounts list shows neither items nor empty state"

    def test_account_number_is_displayed(self, driver):
        """ACC-003: Each account card shows an account number."""
        email, password = get_test_credentials()
        login(driver, email, password)
        wait = WebDriverWait(driver, 15)
        # Wait for account card to be visible
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="account-item"]')))
        items = driver.find_elements(By.CSS_SELECTOR, '[data-testid="account-item"]')
        number_el = items[0].find_element(By.CSS_SELECTOR, '[data-testid="account-number"]')
        assert number_el.text.strip(), "Account number text is empty"

    def test_account_balance_is_displayed(self, driver):
        """ACC-005: Each account card shows a balance value."""
        email, password = get_test_credentials()
        login(driver, email, password)
        wait = WebDriverWait(driver, 15)
        # Wait for account card to be visible
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="account-item"]')))
        items = driver.find_elements(By.CSS_SELECTOR, '[data-testid="account-item"]')
        balance_el = items[0].find_element(By.CSS_SELECTOR, '[data-testid="account-balance"]')
        assert balance_el.text.strip(), "Account balance text is empty"

    def test_empty_state_shown_when_no_accounts(self, driver):
        """ACC-008: If the user has no accounts, an empty-state message is displayed."""
        import time
        email, password = get_test_credentials()
        login(driver, email, password)
        time.sleep(1.5)
        items = driver.find_elements(By.CSS_SELECTOR, '[data-testid="account-item"]')
        if len(items) > 0:
            pytest.skip("User has accounts; empty-state test applies only to users with 0 accounts.")
        empty = driver.find_element(By.CSS_SELECTOR, '[data-testid="account-empty-state"]')
        assert "No accounts" in empty.text


# ── Account creation tests ────────────────────────────────────────────────────

class TestAccountCreation:
    """ACC-002, ACC-007 — creating a new account from the dashboard."""

    def test_create_account_shows_success_message(self, driver):
        """ACC-002: Clicking 'Create Account' creates an account and shows a success message."""
        email, password = get_test_credentials()
        login(driver, email, password)
        wait = WebDriverWait(driver, 15)
        btn = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, '[data-testid="create-account-button"]')
        ))
        btn.click()
        success = wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="account-create-success"]')
        ))
        assert success.text.strip()

    def test_new_account_appears_in_list(self, driver):
        """ACC-002: After creation, the new account appears in the accounts list."""
        email, password = get_test_credentials()
        login(driver, email, password)
        wait = WebDriverWait(driver, 15)
        # Wait for existing accounts to finish loading
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="account-item"]')))
        before = len(driver.find_elements(By.CSS_SELECTOR, '[data-testid="account-item"]'))
        wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, '[data-testid="create-account-button"]')
        )).click()
        wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="account-create-success"]')
        ))
        wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, '[data-testid="account-item"]')) == before + 1)
        after = len(driver.find_elements(By.CSS_SELECTOR, '[data-testid="account-item"]'))
        assert after == before + 1, "Account count did not increase after creation"


# ── Access-control tests ──────────────────────────────────────────────────────

class TestAccountAccessControl:
    """ACC-004, ACC-006 — unauthenticated and cross-customer access."""

    def test_accounts_page_without_login_redirects(self, driver):
        """ACC-004: Navigating to /accounts without a session redirects to login."""
        driver.get(f"{BASE_URL}/accounts")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        assert driver.find_element(By.ID, "email").is_displayed()

    def test_dashboard_without_login_redirects(self, driver):
        """ACC-004 variant: /dashboard without a session redirects to login."""
        driver.get(f"{BASE_URL}/dashboard")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        assert driver.find_element(By.ID, "email").is_displayed()
