# Selenium Regression Testing Strategy

## 1. Purpose

This document defines the shared approach for running and maintaining Selenium browser tests for the Banking System project.

All test authors should use the shared WebDriver fixture, reusable helpers, configuration, and Pytest conventions.

## 2. Technology Stack

- Python
- Selenium WebDriver
- Pytest
- pytest-html
- Google Chrome

## 3. Environment Setup

Activate the project's virtual environment and install the dependencies:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Configure the application base URL using the project's `config.py` settings or the `BASE_URL` environment variable.

The default URL is `http://localhost:3000`. Confirm the actual frontend URL before running application-dependent tests.

## 4. Running Tests

Run the complete test suite:

```bash
python -m pytest -v
```

Run an individual test module:

```bash
python -m pytest tests/test_browser_smoke.py -v
```

Run the helper tests:

```bash
python -m pytest tests/test_helpers.py -v
```

Run the setup tests:

```bash
python -m pytest tests/test_setup.py -v
```

Run tests with an HTML report:

```bash
python -m pytest -v --html=reports/report.html --self-contained-html
```

Create the `reports` directory before generating the HTML report if it does not exist.

## 5. Shared WebDriver and Helpers

Tests must request the shared `driver` fixture from `tests/conftest.py`.

Reusable navigation, waiting, clicking, and text-entry operations should use the functions in `tests/helpers.py` wherever applicable.

Avoid creating competing browser fixtures or introducing unnecessary fixed sleep calls.

## 6. Failure Screenshots

The shared Pytest hook captures a screenshot when a browser test fails, provided the test has an active WebDriver instance.

Screenshots are stored under `artifacts/screenshots/`.

Inspect screenshots when investigating failures. Do not commit generated screenshots, reports, credentials, or other sensitive test artifacts.

## 7. Test Data and Database Isolation

The test-data strategy is pending confirmation from the backend team.

Before implementing database-dependent tests, confirm:

- Whether a dedicated test database is available.
- Whether seeded test users and accounts are provided.
- Whether tests should create fresh data or reuse seed data.
- The approved database-reset and cleanup procedure.

Never run destructive reset operations against a production or shared database without explicit authorization.

## 8. Authentication and Authorization Regression

The backend uses JWT Bearer authentication.

Planned scenarios include:

- Accessing a protected endpoint without a token.
- Accessing a protected endpoint with a valid token.
- Rejecting invalid or malformed tokens.
- Verifying customer-to-customer access restrictions where supported.
- Verifying the documented logout behavior.

Final assertions must match the actual API routes and agreed application behavior.

## 9. Failure Investigation

When a test fails:

1. Read the Pytest failure message and traceback.
2. Inspect the associated screenshot, if available.
3. Check the application URL, browser state, selectors, and test data.
4. Determine whether the cause is an application defect, an automation defect, or an environment issue.
5. Rerun the relevant test after fixing the cause.

Do not weaken assertions simply to make a test pass.

## 10. Team Convention

All contributors should use the same fixture names, helper APIs, configuration, dependency versions, and agreed test-data strategy.

Update this document when shared conventions change.


