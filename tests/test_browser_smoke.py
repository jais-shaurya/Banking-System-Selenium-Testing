def test_chrome_opens(driver):
    driver.get("https://example.com")

    assert "Example Domain" in driver.title

