import logging
import requests
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

logger = logging.getLogger("lifecraft.auth")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_email_for_username(username_or_email: str) -> str:
    """Format username as a valid domain email for Supabase GoTrue Auth."""
    clean = username_or_email.strip()
    if "@" in clean:
        return clean.lower()
    return f"{clean.lower()}@lifecraft.io"


def hash_password(password: str) -> str:
    """Hash a password securely using bcrypt."""
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a stored bcrypt hash."""
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token for local session fallback."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# --- SUPABASE AUTH GOTRUE INTEGRATION ---

def supabase_create_user(username: str, password: str, email: Optional[str] = None) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Register and auto-confirm user in Supabase Auth via Admin API.
    Bypasses email send rate limits and instantly marks user verified.
    """
    user_email = email.strip().lower() if (email and "@" in email) else get_email_for_username(username)
    supabase_url = settings.SUPABASE_URL or (f"https://{settings.SUPABASE_PROJECT_REF}.supabase.co" if settings.SUPABASE_PROJECT_REF else None)
    secret_key = settings.SUPABASE_SECRET_KEY

    if not supabase_url or not secret_key:
        return False, None, "Supabase project credentials not configured"

    endpoint = f"{supabase_url}/auth/v1/admin/users"
    headers = {
        "apikey": secret_key,
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "email": user_email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {
            "username": username.strip(),
            "email_verified": True
        }
    }

    try:
        resp = requests.post(endpoint, headers=headers, json=payload, timeout=8)
        data = resp.json()
        if resp.status_code in [200, 201]:
            logger.info(f"User '{username}' created in Supabase Auth ({user_email})")
            return True, data, None
        
        # If user already registered in Supabase
        msg = data.get("msg") or data.get("message") or data.get("error_description") or "Supabase Auth registration notice"
        logger.info(f"Supabase user creation notice: {msg}")
        return False, data, msg
    except Exception as e:
        logger.warning(f"Supabase Auth registration connection failed: {e}")
        return False, None, str(e)


def supabase_authenticate_user(username_or_email: str, password: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Authenticate against Supabase GoTrue Auth endpoint via password grant.
    Returns Supabase access_token and user metadata on success.
    """
    user_email = get_email_for_username(username_or_email)
    supabase_url = settings.SUPABASE_URL or (f"https://{settings.SUPABASE_PROJECT_REF}.supabase.co" if settings.SUPABASE_PROJECT_REF else None)
    pub_key = settings.SUPABASE_PUBLISHABLE_KEY

    if not supabase_url or not pub_key:
        return False, None, "Supabase project credentials not configured"

    endpoint = f"{supabase_url}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": pub_key,
        "Content-Type": "application/json"
    }
    payload = {
        "email": user_email,
        "password": password
    }

    try:
        resp = requests.post(endpoint, headers=headers, json=payload, timeout=8)
        data = resp.json()
        if resp.status_code == 200 and "access_token" in data:
            logger.info(f"User '{username_or_email}' authenticated via Supabase Auth")
            return True, data, None
        
        msg = data.get("error_description") or data.get("msg") or data.get("message") or "Invalid credentials in Supabase Auth"
        return False, data, msg
    except Exception as e:
        logger.warning(f"Supabase Auth sign-in connection failed: {e}")
        return False, None, str(e)


def supabase_verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify token directly with Supabase GoTrue /auth/v1/user.
    """
    supabase_url = settings.SUPABASE_URL or (f"https://{settings.SUPABASE_PROJECT_REF}.supabase.co" if settings.SUPABASE_PROJECT_REF else None)
    pub_key = settings.SUPABASE_PUBLISHABLE_KEY

    if not supabase_url or not pub_key:
        return None

    try:
        endpoint = f"{supabase_url}/auth/v1/user"
        headers = {
            "apikey": pub_key,
            "Authorization": f"Bearer {token}"
        }
        resp = requests.get(endpoint, headers=headers, timeout=5)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.debug(f"Supabase token verification error: {e}")
    return None


# --- DEPENDENCIES ---

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that resolves the authenticated user.
    Validates against Supabase Auth first, then falls back to local JWT.
    Automatically onboards and provisions RPG character data if user exists in Supabase.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials with Supabase Auth",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    username = None

    # 1. Verify via Supabase Auth
    sb_user = supabase_verify_token(token)
    if sb_user:
        user_meta = sb_user.get("user_metadata", {})
        username = user_meta.get("username")
        if not username and "email" in sb_user:
            username = sb_user["email"].split("@")[0].capitalize()

    # 2. Fallback to local JWT decoding
    if not username:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            username = payload.get("sub")
        except JWTError:
            pass

    if not username:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        # Provision RPG player profile for authenticated Supabase user
        from app.defaults import DEFAULT_QUESTS, DEFAULT_REWARDS
        from app.models import Attributes, Quest, CustomReward

        user = User(
            username=username,
            hashed_password=hash_password("supabase_authenticated"),
            level=1,
            xp=0.0,
            coins=20,
            hearts=10.0,
            streak=1,
            last_active_date=str(datetime.now(timezone.utc).date())
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        attrs = Attributes(user_id=user.id, strength=10, intelligence=15, discipline=12)
        db.add(attrs)

        for q_data in DEFAULT_QUESTS:
            db.add(Quest(user_id=user.id, is_completed=False, **q_data))
        for r_data in DEFAULT_REWARDS:
            db.add(CustomReward(user_id=user.id, **r_data))

        db.commit()
        db.refresh(user)

    return user


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Dependency that resolves user if token is valid without raising 401."""
    if not token:
        return None
    try:
        return get_current_user(token=token, db=db)
    except Exception:
        return None
