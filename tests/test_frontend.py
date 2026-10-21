from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


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




