# Banking-System-Selenium-Testing

A shared browser-testing framework for the Banking System project, built with Selenium WebDriver, Python, and Pytest. The suite includes browser smoke tests, frontend checks, authentication/session tests, and account-access security tests.

## Prerequisites

- Python 3.12+
- Google Chrome
- Git
- Banking System backend and frontend running for browser tests
- A valid backend API key and registered test-user credentials for authentication tests

## Setup

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows Command Prompt:

```cmd
.venv\Scripts\activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

## Configuration

The API base URL defaults to `http://localhost:3000` and can be overridden using `API_BASE_URL`.

The frontend smoke tests use `http://localhost:5173`.

Authentication tests require the following environment variables:

- `API_KEY`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

Set them in Windows Command Prompt before running the relevant tests:

```cmd
set API_KEY=your_api_key
set TEST_USER_EMAIL=your_registered_email
set TEST_USER_PASSWORD=your_test_password
```

Replace the example values with your own authorized local test configuration. Never commit API keys, passwords, JWTs, or other secrets to Git.

These variables are temporary and apply only to the current terminal session.

## Running Tests

Run the complete suite:

```cmd
python -m pytest -v
```

Generate a self-contained HTML report:

```cmd
python -m pytest --html=reports/report.html --self-contained-html -v
```

Open the report on Windows:

```cmd
start reports\report.html
```

Run a specific test module:

```cmd
python -m pytest tests/test_browser_smoke.py -v
python -m pytest tests/test_frontend.py -v
python -m pytest tests/test_session.py -v
```

Some authentication tests are skipped if the required environment variables are missing. The frontend tests require the frontend to be available, and API tests require the backend to be available with the correct API key.

## Shared Framework API

The shared pytest `driver` fixture creates and closes a Chrome WebDriver.

Reusable helpers are available in `tests/helpers.py`:

- `navigate_to(driver, url)` — navigate to a URL.
- `wait_for_element(driver, locator)` — wait for an element to become visible.
- `wait_for_clickable(driver, locator)` — wait for an element to become clickable.
- `enter_text(driver, locator, text)` — clear a field and enter text.
- `click_element(driver, locator)` — wait for an element and click it.

Import these helpers from `tests.helpers` when writing tests.

## Current Test Coverage

The suite currently includes:

- Chrome browser startup smoke testing.
- Frontend loading and accounts-page checks.
- Logout redirection to the login page.
- Protected endpoint access without a JWT.
- Rejection of malformed JWTs.
- Login validation for invalid email formats and nonexistent users.
- Successful login and JWT-protected endpoint access.
- Cross-customer account-access denial.

## Failure Screenshots and Troubleshooting

The shared browser fixture captures a screenshot when a Selenium test fails. Check the screenshot output configured in `tests/conftest.py` when investigating a failure.

Before running tests, confirm that the backend and frontend are running, the environment variables are configured in the current terminal, and Chrome is installed.

Do not commit generated reports, screenshots containing sensitive data, or credentials.

## Regression Workflow

1. Pull the latest changes from the shared testing branch.
2. Activate the virtual environment and install dependencies.
3. Configure the required environment variables.
4. Start the application services required by the tests.
5. Run the complete Pytest suite.
6. Review failed tests and the generated HTML report.
7. Coordinate fixture names, selectors, and test-data requirements with the other test authors before integrating additional test modules.


