from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def navigate_to(driver, url):
    """Open a URL in the browser."""
    driver.get(url)


def wait_for_element(driver, locator, timeout=10):
    """Wait until an element is visible on the page."""
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located(locator)
    )


def wait_for_visible(driver, locator, timeout=10):
    """Wait until an element is visible on the page (alias for wait_for_element)."""
    return wait_for_element(driver, locator, timeout)


def wait_for_clickable(driver, locator, timeout=10):
    """Wait until an element can be clicked."""
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable(locator)
    )


def enter_text(driver, locator, text, timeout=10):
    """Clear a field and enter text."""
    element = wait_for_element(driver, locator, timeout)
    element.clear()
    element.send_keys(text)


def click_element(driver, locator, timeout=10):
    """Wait for an element and click it."""
    element = wait_for_clickable(driver, locator, timeout)
    element.click()
