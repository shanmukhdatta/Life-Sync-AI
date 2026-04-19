"""
LifeSync AI — Google OAuth 2.0 Service
Handles all Google authentication flows with minimal scopes.
"""
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from typing import Optional, Dict, Any
import json
import logging

from config import settings

logger = logging.getLogger(__name__)

# OAuth flow configuration
FLOW_CONFIG = {
    "web": {
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [settings.google_redirect_uri],
    }
}


def create_oauth_flow() -> Flow:
    """Create a Google OAuth 2.0 flow with minimal scopes."""
    flow = Flow.from_client_config(
        FLOW_CONFIG,
        scopes=settings.scopes_list,
        redirect_uri=settings.google_redirect_uri,
    )
    return flow


def get_authorization_url() -> tuple[str, str]:
    """Generate the authorization URL and state token."""
    flow = create_oauth_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return auth_url, state


def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
    """Exchange authorization code for access and refresh tokens."""
    flow = create_oauth_flow()
    flow.fetch_token(code=code)
    credentials = flow.credentials
    return {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes or []),
    }


def build_credentials(token_data: Dict[str, Any]) -> Credentials:
    """Build Google Credentials object from stored token data."""
    return Credentials(
        token=token_data.get("token"),
        refresh_token=token_data.get("refresh_token"),
        token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=token_data.get("client_id", settings.google_client_id),
        client_secret=token_data.get("client_secret", settings.google_client_secret),
        scopes=token_data.get("scopes", settings.scopes_list),
    )


def refresh_credentials_if_needed(credentials: Credentials) -> Credentials:
    """Refresh credentials if expired. Server-side only."""
    if credentials.expired and credentials.refresh_token:
        try:
            credentials.refresh(Request())
            logger.info("Google credentials refreshed successfully")
        except Exception as e:
            logger.error(f"Failed to refresh credentials: {e}")
            raise
    return credentials


def get_user_info(credentials: Credentials) -> Dict[str, Any]:
    """Fetch basic user profile from Google."""
    service = build("oauth2", "v2", credentials=credentials)
    user_info = service.userinfo().get().execute()
    return {
        "id": user_info.get("id"),
        "email": user_info.get("email"),
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
    }
