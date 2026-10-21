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
- Requests for backend API tests

## 3. Environment Setup

Create and activate the project's virtual environment, then install dependencies:

```cmd
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

The backend API defaults to `http://localhost:3000`. The frontend smoke tests use `http://localhost:5173`.

The API tests use the `API_BASE_URL` environment variable to override the backend URL. Confirm the actual configuration in `config.py` and the relevant test modules before changing URLs.

Authentication tests require the following environment variables:

- `API_KEY`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

Set these in the terminal used to run Pytest. Use authorized test credentials and never commit secrets to Git.

Start the backend and frontend services required by the tests before executing application-dependent checks.

## 4. Running Tests

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

Run an individual module:

```cmd
python -m pytest tests/test_browser_smoke.py -v
python -m pytest tests/test_frontend.py -v
python -m pytest tests/test_helpers.py -v
python -m pytest tests/test_session.py -v
python -m pytest tests/test_setup.py -v
```

The `reports` directory must exist before generating a report. Authentication tests may be skipped if required environment variables are missing.

## 5. Shared WebDriver and Helpers

Tests must use the shared `driver` fixture from `tests/conftest.py`.

Reusable navigation, waiting, clicking, and text-entry operations should use functions in `tests/helpers.py` wherever applicable.

Avoid creating competing browser fixtures or introducing unnecessary fixed sleep calls.

## 6. Failure Screenshots

The shared Pytest hook captures a screenshot when a Selenium test fails, provided an active WebDriver instance is available.

Screenshots are stored under `artifacts/screenshots/`, according to the current framework configuration.

Inspect screenshots when investigating failures. Do not commit generated screenshots, reports, credentials, or other sensitive test artifacts.

## 7. Test Data and Database Isolation

The test-data strategy remains pending confirmation from the backend team.

Before implementing additional database-dependent tests, confirm:

- Whether a dedicated test database is available.
- Whether seeded test users and accounts are provided.
- Whether tests should create fresh data or reuse seed data.
- The approved database-reset and cleanup procedure.
- Whether tests can run repeatedly without conflicting with existing data.

Never run destructive reset operations against a production or shared database without explicit authorization.

## 8. Authentication and Authorization Regression

The current automated suite covers:

- Accessing a protected endpoint without a JWT.
- Rejecting a malformed JWT.
- Rejecting login requests with an invalid email format.
- Rejecting login attempts for a nonexistent email.
- Successful login and access to the protected endpoint using the returned JWT.
- Denying cross-customer access to another customer's account where supported.
- Frontend logout redirection to the login page.

The tests should continue to assert the documented API responses and actual application behavior. Frontend logout redirection verifies browser behavior; it does not, by itself, establish server-side token revocation.

## 9. Failure Investigation

When a test fails:

1. Read the Pytest failure message and traceback.
2. Inspect the associated screenshot, if available.
3. Check the application URL, browser state, selectors, and test data.
4. Determine whether the cause is an application defect, an automation defect, or an environment issue.
5. Rerun the relevant test after fixing the cause.

Do not weaken assertions simply to make a test pass.

## 10. Team Convention and Handoff

All contributors should use the same fixture names, helper APIs, configuration, dependency versions, and agreed test-data strategy.

Before integrating additional test modules, coordinate fixture usage, selectors, and test-data requirements with the other test authors.

Update this document when shared conventions or application behavior change.

