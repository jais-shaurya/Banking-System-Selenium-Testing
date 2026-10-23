from pathlib import Path

import pytest
from selenium import webdriver

SCREENSHOT_DIR = Path("artifacts/screenshots")

@pytest.fixture
def driver():
    """Create a browser for a test and close it afterward."""
    browser = webdriver.Chrome()
    browser.set_window_size(1280, 900)

    try:
        yield browser
    finally:
        browser.quit()


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Capture screenshots when a browser test fails."""
    outcome = yield
    report = outcome.get_result()

    if report.when != "call" or not report.failed:
        return

    browser = item.funcargs.get("driver")

    if browser is None:
        return

    try:
        SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

        filename = f"{item.name}.png"
        screenshot_path = SCREENSHOT_DIR / filename

        if browser.save_screenshot(str(screenshot_path)):
            print(f"\nFailure screenshot saved: {screenshot_path}")
        else:
            print("\nSelenium could not save the failure screenshot.")

    except Exception as exc:
        print(f"\nCould not capture failure screenshot: {exc}")

