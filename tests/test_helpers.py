
from selenium.webdriver.common.by import By

from helpers import navigate_to, wait_for_element


def test_navigation_and_visibility_helper(driver):
    navigate_to(driver, "https://example.com")

    body = wait_for_element(
        driver,
        (By.TAG_NAME, "body"),
        timeout=5,
    )

    assert body.is_displayed()
    assert "Example Domain" in driver.title

