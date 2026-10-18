# Banking-System-Selenium-Testing
A fictional banking web application tested using Selenium WebDriver, Python, Flask and Pytest.


## Selenium Testing Framework

### Prerequisites
- Python 3.12+
- Google Chrome
- Git

### Setup

Create and activate a virtual environment:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

### Configuration

The application base URL is configured in `config.py`.

By default, it is `http://localhost:3000`. Override it using
the `BASE_URL` environment variable when needed.

PowerShell example:

```powershell
$env:BASE_URL = "http://localhost:3000"
```

### Run tests

Run the complete test suite:

```bash
python -m pytest -v
```

Run an individual test module:

```bash
python -m pytest tests/test_browser_smoke.py -v
```

Generate an HTML report:

```bash
python -m pytest --html=report.html
```

### Shared framework API

- `driver`: pytest fixture that creates and closes a Chrome WebDriver.
- `navigate_to(driver, url)`: navigates to a URL.
- `wait_for_element(driver, locator)`: waits for an element to become visible.
- `wait_for_clickable(driver, locator)`: waits for an element to become clickable.
- `enter_text(driver, locator, text)`: clears a field and enters text.
- `click_element(driver, locator)`: waits for an element and clicks it.

Import helper functions from `tests.helpers` when writing tests.


