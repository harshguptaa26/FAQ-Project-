import os
import sqlite3
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

if os.getenv("VERCEL") == "1":
    DB_FILE = "/tmp/users.db"
else:
    DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")
JWT_SECRET = os.getenv("JWT_SECRET", "samagama-security-jwt-secret-key-9988")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

# Security schemas
security = HTTPBearer()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_user_db():
    """Initializes the SQLite users table and seeds a default administrator account."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()

    # Seed default administrator if not present
    c.execute("SELECT id FROM users WHERE role = 'admin'")
    admin = c.fetchone()
    if not admin:
        admin_id = "admin_001"
        admin_name = "Administrator"
        admin_email = "admin123@gmail.com"
        # Seed the exact password they mocked
        admin_password_raw = "1234567890"
        hashed = hash_password(admin_password_raw)
        
        c.execute(
            "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (admin_id, admin_name, admin_email, hashed, "admin", datetime.utcnow().isoformat())
        )
        conn.commit()
        print("Default administrator seeded into database.")

    conn.close()

def hash_password(password: str) -> str:
    """Hashes a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(password: str, hashed_password: str) -> bool:
    """Verifies a password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def register_user(name: str, email: str, password_raw: str, role: str = "student") -> dict:
    """Registers a new user in the database."""
    conn = get_db_connection()
    c = conn.cursor()
    
    # Check if email exists
    c.execute("SELECT id FROM users WHERE email = ?", (email,))
    if c.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered."
        )
        
    user_id = f"usr_{int(datetime.utcnow().timestamp() * 1000)}"
    hashed_pwd = hash_password(password_raw)
    created_at = datetime.utcnow().isoformat()
    
    c.execute(
        "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, name, email, hashed_pwd, role, created_at)
    )
    conn.commit()
    conn.close()
    
    return {
        "id": user_id,
        "name": name,
        "email": email,
        "role": role,
        "createdAt": created_at
    }

def get_user_by_email(email: str) -> Optional[dict]:
    """Retrieves a user profile by email."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = c.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to extract and verify the bearer token, returning the current user payload."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing credentials.",
        )
        
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in system.",
        )
        
    # Remove password hash for safety
    user_data = user.copy()
    user_data.pop("password_hash", None)
    return user_data

def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency to assert the currently logged-in user is an administrator."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator permissions are required for this action."
        )
    return current_user
