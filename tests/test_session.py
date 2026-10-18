
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
