"""
LifeSync AI — Authentication Dependency
Extracts and validates JWT, returns token_data for service instantiation.
"""
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Dict, Optional

from config import settings

security = HTTPBearer(auto_error=False)


async def get_current_token_data(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict:
    """
    Extract JWT and return token_data dict.
    In development/mock mode, returns a mock user if no token provided.
    """
    USE_MOCK = not bool(settings.google_client_id and settings.gemini_api_key)

    # Mock mode: return fake token data for development
    if USE_MOCK:
        return {
            "sub": "demo@lifesync.ai",
            "name": "Demo User",
            "picture": None,
            "token_data": {},
        }

    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization required")

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        token_data = payload.get("token_data", {})
        token_data["sub"] = payload.get("sub")
        token_data["name"] = payload.get("name", "User")
        token_data["picture"] = payload.get("picture")
        return token_data
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
