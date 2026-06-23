import os
import sys
import pytest
from datetime import timedelta

# Ensure local imports work in tests
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    init_user_db,
    register_user,
    get_user_by_email
)

@pytest.fixture(autouse=True)
def setup_db():
    """Initializes the database before running tests."""
    init_user_db()
    yield

def test_password_hashing():
    """Asserts that password hashing and verification are mathematically correct."""
    password = "SuperSecurePassword123"
    hashed = hash_password(password)
    
    assert hashed != password
    assert len(hashed) > 20
    assert verify_password(password, hashed) is True
    assert verify_password("IncorrectPassword", hashed) is False

def test_access_token_lifecycle():
    """Asserts JWT signing and decoding preserves payloads."""
    payload = {"sub": "usr_999", "email": "tester@samagama.in", "role": "student"}
    token = create_access_token(data=payload, expires_delta=timedelta(minutes=10))
    
    assert token is not None
    decoded = decode_access_token(token)
    
    assert decoded is not None
    assert decoded["sub"] == "usr_999"
    assert decoded["email"] == "tester@samagama.in"
    assert decoded["role"] == "student"

def test_invalid_token_decoding():
    """Asserts that decoding fails for invalid or tampered tokens."""
    invalid_token = "invalid.token.signature"
    assert decode_access_token(invalid_token) is None

def test_user_registration_and_retrieval():
    """Asserts that users can be registered in SQLite database and retrieved correctly."""
    email = "new_student@samagama.in"
    name = "New Student"
    password = "password123"
    
    # Register user
    user = register_user(name=name, email=email, password_raw=password, role="student")
    assert user["name"] == name
    assert user["email"] == email
    assert user["role"] == "student"
    
    # Retrieve user
    retrieved = get_user_by_email(email)
    assert retrieved is not None
    assert retrieved["name"] == name
    assert verify_password(password, retrieved["password_hash"]) is True
    
    # Attempting duplicate registration must fail
    with pytest.raises(Exception):
        register_user(name=name, email=email, password_raw="another_pwd", role="student")
