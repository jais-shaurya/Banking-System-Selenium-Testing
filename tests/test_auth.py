"""
Authentication Selenium tests — Shaurya
Covers: AUTH-011 to AUTH-017 (login/logout/session protection)
         AUTH-001 to AUTH-010 (registration)

Selectors confirmed from App.tsx and Register.tsx.
Uses shared driver fixture and helpers from feature/selenium-framework.
Requires environment variables:
    TEST_USER_EMAIL, TEST_USER_PASSWORD  — a known seeded test account
"""

import sys
import os
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Allow importing helpers from the selenium-framework folder when running
# tests locally across branches. Adjust this path if needed.
FRAMEWORK_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "..", "..",
    "Banking-System-Selenium-Testing-feature-selenium-framework",
    "tests"
)
if FRAMEWORK_PATH not in sys.path:
    sys.path.insert(0, FRAMEWORK_PATH)

from helpers import navigate_to, wait_for_element, enter_text, click_element

BASE_URL = "http://localhost:5173"

# ── helpers ──────────────────────────────────────────────────────────────────

def do_login(driver, email, password, timeout=15):
    """Navigate to the login page and submit credentials."""
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, timeout)
    wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys(email)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, '[data-testid="login-button"]').click()


def get_test_credentials():
    """Return (email, password) from env or skip the test."""
    email = os.getenv("TEST_USER_EMAIL")
    password = os.getenv("TEST_USER_PASSWORD")
    if not email or not password:
        pytest.skip("Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run this test.")
    return email, password


# ── Registration tests ────────────────────────────────────────────────────────

class TestRegistration:
    """AUTH-001 to AUTH-010 — Registration page behaviour."""

    def test_register_page_loads(self, driver):
        """Registration page is reachable and shows the form."""
        driver.get(f"{BASE_URL}/register")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.visibility_of_element_located((By.ID, "name")))
        assert driver.find_element(By.ID, "email").is_displayed()
        assert driver.find_element(By.ID, "phNumber").is_displayed()
        assert driver.find_element(By.ID, "password").is_displayed()

    def test_register_link_from_login_page(self, driver):
        """AUTH-001 precondition: 'Create an account' link navigates to /register."""
        driver.get(BASE_URL)
        wait = WebDriverWait(driver, 10)
        link = wait.until(EC.element_to_be_clickable((By.ID, "register-link")))
        link.click()
        wait.until(EC.url_contains("/register"))
        assert "/register" in driver.current_url

    def test_register_missing_name_blocked_by_browser(self, driver):
        """AUTH-002: Submitting without a name is blocked (required field)."""
        driver.get(f"{BASE_URL}/register")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys("test@example.com")
        driver.find_element(By.ID, "phNumber").send_keys("9876543210")
        driver.find_element(By.ID, "password").send_keys("Password1!")
        driver.find_element(By.CSS_SELECTOR, '[data-testid="register-button"]').click()
        # Browser enforces required — page stays on /register
        assert "/register" in driver.current_url

    def test_register_missing_email_blocked_by_browser(self, driver):
        """AUTH-002: Submitting without an email is blocked (required field)."""
        driver.get(f"{BASE_URL}/register")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.visibility_of_element_located((By.ID, "name"))).send_keys("Test User")
        driver.find_element(By.ID, "phNumber").send_keys("9876543210")
        driver.find_element(By.ID, "password").send_keys("Password1!")
        driver.find_element(By.CSS_SELECTOR, '[data-testid="register-button"]').click()
        assert "/register" in driver.current_url

    def test_register_malformed_email_blocked_by_browser(self, driver):
        """AUTH-003: A malformed email is rejected by the browser's type=email validation."""
        driver.get(f"{BASE_URL}/register")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.visibility_of_element_located((By.ID, "name"))).send_keys("Test User")
        driver.find_element(By.ID, "email").send_keys("not-an-email")
        driver.find_element(By.ID, "phNumber").send_keys("9876543210")
        driver.find_element(By.ID, "password").send_keys("Password1!")
        driver.find_element(By.CSS_SELECTOR, '[data-testid="register-button"]').click()
        assert "/register" in driver.current_url

    def test_register_duplicate_email_shows_error(self, driver):
        """AUTH-004: Registering with an already-used email shows an error message."""
        email, password = get_test_credentials()
        driver.get(f"{BASE_URL}/register")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.visibility_of_element_located((By.ID, "name"))).send_keys("Duplicate User")
        driver.find_element(By.ID, "email").send_keys(email)
        driver.find_element(By.ID, "phNumber").send_keys("9000000001")
        driver.find_element(By.ID, "password").send_keys(password)
        driver.find_element(By.CSS_SELECTOR, '[data-testid="register-button"]').click()
        wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="registration-error"]')
        ))
        error_text = driver.find_element(
            By.CSS_SELECTOR, '[data-testid="registration-error"]'
        ).text
        assert error_text  # an error message is displayed

    def test_register_sign_in_link_navigates_to_login(self, driver):
        """Register page has a 'Sign in' link that goes back to the login page."""
        driver.get(f"{BASE_URL}/register")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, '[data-testid="login-link"]')
        )).click()
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        wait.until(EC.visibility_of_element_located((By.ID, "email")))


# ── Login tests ───────────────────────────────────────────────────────────────

class TestLogin:
    """AUTH-011 to AUTH-015 — Login page behaviour."""

    def test_login_page_loads(self, driver):
        """Login page displays email, password fields and submit button."""
        driver.get(BASE_URL)
        wait = WebDriverWait(driver, 10)
        wait.until(EC.visibility_of_element_located((By.ID, "email")))
        assert driver.find_element(By.ID, "password").is_displayed()
        assert driver.find_element(By.CSS_SELECTOR, '[data-testid="login-button"]').is_displayed()

    def test_valid_login_redirects_to_dashboard(self, driver):
        """AUTH-011: Valid credentials redirect to /dashboard."""
        email, password = get_test_credentials()
        do_login(driver, email, password)
        WebDriverWait(driver, 15).until(EC.url_contains("/dashboard"))
        assert "/dashboard" in driver.current_url

    def test_invalid_password_shows_error(self, driver):
        """AUTH-012: A correct email but wrong password shows an error message."""
        email, _ = get_test_credentials()
        do_login(driver, email, "WrongPassword999!")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="login-error"]')
        ))
        error_text = driver.find_element(
            By.CSS_SELECTOR, '[data-testid="login-error"]'
        ).text
        assert error_text

    def test_unregistered_email_shows_error(self, driver):
        """AUTH-013: An email that was never registered shows an error."""
        do_login(driver, "nobody-selenium@citibank.invalid", "Password1!")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="login-error"]')
        ))
        assert driver.find_element(
            By.CSS_SELECTOR, '[data-testid="login-error"]'
        ).text

    def test_blank_fields_blocked_by_browser(self, driver):
        """AUTH-014: Submitting login with both fields empty is blocked by the browser."""
        driver.get(BASE_URL)
        wait = WebDriverWait(driver, 10)
        wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, '[data-testid="login-button"]')
        )).click()
        # Browser required validation keeps us on the login page
        assert driver.current_url == f"{BASE_URL}/" or driver.find_element(
            By.ID, "email"
        ).is_displayed()

    def test_blank_password_blocked_by_browser(self, driver):
        """AUTH-014 variant: Email filled but password blank — blocked by browser."""
        email, _ = get_test_credentials()
        driver.get(BASE_URL)
        wait = WebDriverWait(driver, 10)
        wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys(email)
        driver.find_element(By.CSS_SELECTOR, '[data-testid="login-button"]').click()
        assert driver.find_element(By.ID, "password").is_displayed()


# ── Session / protection tests ────────────────────────────────────────────────

class TestSessionProtection:
    """AUTH-016, AUTH-017 — Protected page access without/after login."""

    def test_dashboard_without_login_redirects_to_login(self, driver):
        """AUTH-016: Accessing /dashboard without being logged in redirects to /."""
        driver.get(f"{BASE_URL}/dashboard")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        assert wait.until(EC.visibility_of_element_located((By.ID, "email"))).is_displayed()

    def test_protected_pages_without_login_redirect(self, driver):
        """AUTH-016 variant: /accounts, /transfers, /transactions all redirect to login."""
        wait = WebDriverWait(driver, 10)
        for path in ["/accounts", "/transfers", "/transactions"]:
            driver.get(f"{BASE_URL}{path}")
            wait.until(EC.url_to_be(f"{BASE_URL}/"))
            email_field = wait.until(EC.visibility_of_element_located((By.ID, "email")))
            assert email_field.is_displayed(), f"{path} did not redirect to login"

    def test_logout_returns_to_login_page(self, driver):
        """AUTH-017: After logout the user lands on the login page."""
        email, password = get_test_credentials()
        do_login(driver, email, password)
        wait = WebDriverWait(driver, 15)
        wait.until(EC.url_contains("/dashboard"))
        wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Sign out']"))
        ).click()
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        wait.until(EC.visibility_of_element_located((By.ID, "email")))

    def test_after_logout_dashboard_not_accessible(self, driver):
        """AUTH-017: After logout, re-navigating to /dashboard redirects back to login."""
        email, password = get_test_credentials()
        do_login(driver, email, password)
        wait = WebDriverWait(driver, 15)
        wait.until(EC.url_contains("/dashboard"))
        wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Sign out']"))
        ).click()
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        driver.get(f"{BASE_URL}/dashboard")
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        assert driver.find_element(By.ID, "email").is_displayed()
