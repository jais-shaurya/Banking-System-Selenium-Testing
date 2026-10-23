from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def wait_for_visible(driver, locator, timeout=10):
    """Wait until an element is visible on the page."""
    wait = WebDriverWait(driver, timeout)
    return wait.until(EC.visibility_of_element_located(locator))


def wait_for_clickable(driver, locator, timeout=10):
    """Wait until an element is ready to be clicked."""
    wait = WebDriverWait(driver, timeout)
    return wait.until(EC.element_to_be_clickable(locator))


def enter_text(driver, locator, text, timeout=10):
    """Wait for an input field, clear it, and type text into it."""
    field = wait_for_clickable(driver, locator, timeout)
    field.clear()
    field.send_keys(text)


def click_element(driver, locator, timeout=10):
    """Wait for an element and click it."""
    element = wait_for_clickable(driver, locator, timeout)
    element.click()
