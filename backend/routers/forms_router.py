"""
LifeSync AI — Forms Router
Module 7: Form Integrations
Endpoints: create expense form, habit checkin form
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
import logging

from utils.auth_dep import get_current_token_data
from services.extended_services import FormsService, MockFormsService
from services.auth_service import build_credentials, refresh_credentials_if_needed
from config import settings

router = APIRouter(prefix="/api/forms", tags=["Forms"])
logger = logging.getLogger(__name__)


def _get_forms_svc(token_data: Dict):
    if not bool(settings.google_client_id):
        return MockFormsService()
    creds = refresh_credentials_if_needed(build_credentials(token_data))
    return FormsService(creds)


@router.post("/expense-entry")
async def create_expense_form(token_data: Dict = Depends(get_current_token_data)):
    """Create a pre-filled Google Form for expense logging."""
    try:
        svc = _get_forms_svc(token_data)
        result = svc.create_expense_form()
        return {"status": "ok", "form": result}
    except Exception as e:
        logger.error(f"Forms expense-entry error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/habit-checkin")
async def get_habit_checkin_form(token_data: Dict = Depends(get_current_token_data)):
    """Return a habit check-in form URL."""
    try:
        svc = _get_forms_svc(token_data)
        result = svc.get_habit_checkin()
        return {"status": "ok", "form": result}
    except Exception as e:
        logger.error(f"Forms habit-checkin error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
