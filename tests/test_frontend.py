from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os


FRONTEND_URL = "http://localhost:5173"


def test_frontend_loads(driver):
    driver.get(FRONTEND_URL)

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )

    assert driver.title or driver.find_element(By.TAG_NAME, "body").text


def test_accounts_page_loads(driver):
    driver.get(f"{FRONTEND_URL}/accounts")

    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )

    print("Current URL:", driver.current_url)
    print("Page title:", driver.title)
    print("Page text:", driver.find_element(By.TAG_NAME, "body").text[:1000])

    assert driver.find_element(By.TAG_NAME, "body").text.strip()



def test_logout_redirects_to_login(driver):
    email = os.getenv("TEST_USER_EMAIL")
    password = os.getenv("TEST_USER_PASSWORD")

    if not email or not password:
        import pytest
        pytest.skip("Set TEST_USER_EMAIL and TEST_USER_PASSWORD.")

    driver.get(FRONTEND_URL)

    wait = WebDriverWait(driver, 15)
    wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys(email)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, '[data-testid="login-button"]').click()

    wait.until(EC.url_contains("/dashboard"))
    wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Sign out']"))
    ).click()

    wait.until(EC.url_to_be(f"{FRONTEND_URL}/"))

    # The login form should be displayed after logout.
    wait.until(EC.visibility_of_element_located((By.ID, "email")))

    # Opening a protected page without a token should redirect to login.
    driver.get(f"{FRONTEND_URL}/dashboard")
    wait.until(EC.url_to_be(f"{FRONTEND_URL}/"))
    wait.until(EC.visibility_of_element_located((By.ID, "email")))




