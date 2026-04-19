"""
LifeSync AI — Authentication Router
Handles Google OAuth 2.0 flow: initiate, callback, session management.
"""
from fastapi import APIRouter, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Optional
import logging

from config import settings
from services.auth_service import (
    get_authorization_url,
    exchange_code_for_tokens,
    get_user_info,
    build_credentials,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


@router.get("/login")
async def login():
    """Initiate Google OAuth 2.0 flow."""
    try:
        auth_url, state = get_authorization_url()
        return {"auth_url": auth_url, "state": state}
    except Exception as e:
        logger.error(f"Auth login error: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate OAuth flow")


@router.get("/callback")
async def oauth_callback(code: str, state: Optional[str] = None, error: Optional[str] = None):
    """Handle Google OAuth callback and issue app JWT."""
    if error:
        return RedirectResponse(url=f"{settings.frontend_url}/login?error=auth_failed")
    if not code:
        return RedirectResponse(url=f"{settings.frontend_url}/login?error=auth_failed")

    try:
        token_data = exchange_code_for_tokens(code)
        credentials = build_credentials(token_data)
        user_info = get_user_info(credentials)

        # Create app JWT containing token data (stored in JWT, not server)
        access_token = create_access_token(
            data={
                "sub": user_info["email"],
                "name": user_info.get("name"),
                "picture": user_info.get("picture"),
                "token_data": token_data,
            }
        )

        # Redirect to frontend with token
        redirect_url = f"{settings.frontend_url}/dashboard?token={access_token}"
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        return RedirectResponse(url=f"{settings.frontend_url}/login?error=auth_failed")


@router.get("/me")
async def get_current_user(request: Request):
    """Get current user info from JWT."""
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return {
            "email": payload.get("sub"),
            "name": payload.get("name"),
            "picture": payload.get("picture"),
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/logout")
async def logout():
    """Logout endpoint (client should discard JWT)."""
    return {"message": "Logged out successfully. Please discard your token."}


def _extract_token(request: Request) -> Optional[str]:
    """Extract Bearer token from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None
