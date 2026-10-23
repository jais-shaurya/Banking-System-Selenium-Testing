
import os

import pytest
import requests

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")
API_KEY = os.getenv("API_KEY")


@pytest.fixture
def api_headers():
    """Provide the API key required by the backend."""
    if not API_KEY:
        pytest.skip("Set API_KEY to run authentication tests.")

    return {"x-api-key": API_KEY}


def test_protected_endpoint_without_jwt(api_headers):
    """A valid API key without a JWT should be rejected."""
    response = requests.get(
        f"{BASE_URL}/protected",
        headers=api_headers,
        timeout=5,
    )

    assert response.status_code == 401
    assert response.json()["error"] == "Authorization header missing"


def test_protected_endpoint_with_malformed_jwt(api_headers):
    """A malformed JWT should be rejected."""
    headers = {
        **api_headers,
        "Authorization": "Bearer invalid-token",
    }

    response = requests.get(
        f"{BASE_URL}/protected",
        headers=headers,
        timeout=5,
    )

    assert response.status_code == 403
    assert response.json()["error"] == "Invalid token"


def test_login_with_invalid_email_format(api_headers):
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        headers=api_headers,
        json={
            "email": "not-an-email",
            "password": "SomeInvalidPassword123!"
        },
        timeout=5,
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid request data"


def test_login_with_nonexistent_email(api_headers):
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        headers=api_headers,
        json={
            "email": "selenium-user-does-not-exist@example.com",
            "password": "SomeInvalidPassword123!"
        },
        timeout=5,
    )

    assert response.status_code == 401
    assert response.json()["error"] == "Invalid email or password"

def test_successful_login(api_headers):
    """A valid account should receive a JWT after login."""
    email = os.getenv("TEST_USER_EMAIL")
    password = os.getenv("TEST_USER_PASSWORD")

    if not email or not password:
        pytest.skip("Set TEST_USER_EMAIL and TEST_USER_PASSWORD.")

    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        headers=api_headers,
        json={"email": email, "password": password},
        timeout=5,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Login successful"
    assert data["token"]

    protected_response = requests.get(
        f"{BASE_URL}/protected",
        headers={
            **api_headers,
            "Authorization": f"Bearer {data['token']}",
        },
        timeout=5,
    )

    assert protected_response.status_code == 200
    assert protected_response.json()["message"] == "protected route is healthy"



def test_customer_cannot_access_another_customers_account(api_headers):
    """A customer must not access an account owned by another customer."""
    email_a = os.getenv("TEST_USER_EMAIL")
    password_a = os.getenv("TEST_USER_PASSWORD")
    email_b = os.getenv("TEST_OTHER_USER_EMAIL")
    password_b = os.getenv("TEST_OTHER_USER_PASSWORD")
    account_id = os.getenv("TEST_OTHER_ACCOUNT_ID")

    if not all([email_a, password_a, email_b, password_b, account_id]):
        pytest.skip(
            "Set both customers' credentials and TEST_OTHER_ACCOUNT_ID."
        )

    def login(email, password):
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            headers=api_headers,
            json={"email": email, "password": password},
            timeout=5,
        )
        assert response.status_code == 200, "Test customer login failed"
        return response.json()["token"]

    token_a = login(email_a, password_a)
    token_b = login(email_b, password_b)

    # Confirm the target account belongs to customer B.
    account_response = requests.get(
        f"{BASE_URL}/api/v1/accounts/{account_id}",
        headers={
            **api_headers,
            "Authorization": f"Bearer {token_b}",
        },
        timeout=5,
    )
    assert account_response.status_code == 200, (
        "The target account must belong to customer B and be accessible."
    )

    # Customer A must not be able to access customer B's account.
    response = requests.get(
        f"{BASE_URL}/api/v1/accounts/{account_id}",
        headers={
            **api_headers,
            "Authorization": f"Bearer {token_a}",
        },
        timeout=5,
    )

    assert response.status_code == 404
    assert response.json()["error"] == "Account not found"









