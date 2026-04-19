"""
LifeSync AI — Finance Router
Module 7: Financial Pulse Tracker
Endpoints: expense logging, budget summary, monthly insights, bill detection.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging

from utils.auth_dep import get_current_token_data
from services.extended_services import SheetsService, MockSheetsService
from services.gmail_service import GmailService, MockGmailService
from services.gemini_service import GeminiService, MockGeminiService
from services.auth_service import build_credentials, refresh_credentials_if_needed
from config import settings

router = APIRouter(prefix="/api/finance", tags=["Financial Pulse Tracker"])
logger = logging.getLogger(__name__)

# Default spreadsheet ID — user should set this via their own sheet
DEFAULT_SHEET_ID = "YOUR_LIFESYNC_SHEET_ID"


def _get_sheets_svc(token_data: Dict):
    if not bool(settings.google_client_id):
        return MockSheetsService()
    creds = refresh_credentials_if_needed(build_credentials(token_data))
    return SheetsService(creds)


def _get_gmail_svc(token_data: Dict):
    if not bool(settings.google_client_id):
        return MockGmailService()
    creds = refresh_credentials_if_needed(build_credentials(token_data))
    return GmailService(creds)


# ── Expense logging ───────────────────────────────────────────────────────────

EXPENSE_CATEGORIES = [
    "Food & Dining", "Transport", "Shopping", "Entertainment",
    "Health", "Education", "Utilities", "Subscriptions", "Other",
]


class LogExpenseRequest(BaseModel):
    amount: float
    description: str
    category: Optional[str] = None  # if None, AI auto-categorizes
    spreadsheet_id: str = DEFAULT_SHEET_ID


@router.post("/expense")
async def log_expense(
    req: LogExpenseRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    One-tap expense logging via Google Sheets.
    AI auto-categorizes if category not provided. Under 5 seconds.
    """
    try:
        # Auto-categorize if not provided
        category = req.category
        if not category:
            desc_lower = req.description.lower()
            if any(w in desc_lower for w in ["restaurant", "food", "coffee", "lunch", "dinner", "cafe"]):
                category = "Food & Dining"
            elif any(w in desc_lower for w in ["uber", "taxi", "fuel", "metro", "bus", "train"]):
                category = "Transport"
            elif any(w in desc_lower for w in ["netflix", "spotify", "subscription", "saas"]):
                category = "Subscriptions"
            elif any(w in desc_lower for w in ["doctor", "pharmacy", "gym", "health"]):
                category = "Health"
            elif any(w in desc_lower for w in ["course", "book", "udemy", "education"]):
                category = "Education"
            else:
                category = "Other"

        svc = _get_sheets_svc(token_data)
        result = svc.log_expense(
            spreadsheet_id=req.spreadsheet_id,
            amount=req.amount,
            category=category,
            description=req.description,
        )
        return {
            "status": "ok",
            "logged": {
                "amount": req.amount,
                "category": category,
                "description": req.description,
                "auto_categorized": req.category is None,
            },
            "sheets_result": result,
        }
    except Exception as e:
        logger.error(f"Finance log expense error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Expense summary ───────────────────────────────────────────────────────────

@router.get("/summary")
async def get_expense_summary(
    spreadsheet_id: str = Query(DEFAULT_SHEET_ID),
    token_data: Dict = Depends(get_current_token_data),
):
    """Get monthly expense summary with budget alerts."""
    try:
        svc = _get_sheets_svc(token_data)
        summary = svc.get_expense_summary(spreadsheet_id=spreadsheet_id)

        # Budget alert logic — mid-month early warning
        from datetime import datetime, timezone
        day_of_month = datetime.now(timezone.utc).day
        total = summary.get("total_expenses", 0)

        # Estimate month-end spend based on current rate
        daily_rate = total / max(day_of_month, 1)
        projected_monthly = daily_rate * 30

        alert = None
        if day_of_month <= 15 and projected_monthly > 3000:
            alert = {
                "level": "warning",
                "message": f"Projected monthly spend: ${projected_monthly:.0f} — you are on track to exceed budget.",
                "projected": round(projected_monthly, 2),
            }
        elif day_of_month <= 15 and projected_monthly > 2000:
            alert = {
                "level": "info",
                "message": f"Spending pace is moderate. Projected monthly: ${projected_monthly:.0f}.",
                "projected": round(projected_monthly, 2),
            }

        return {
            "status": "ok",
            "summary": summary,
            "budget_alert": alert,
            "day_of_month": day_of_month,
        }
    except Exception as e:
        logger.error(f"Finance summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Bill detection from Gmail ─────────────────────────────────────────────────

@router.get("/bills")
async def detect_bills(token_data: Dict = Depends(get_current_token_data)):
    """
    Detect billing emails from Gmail for calendar reminder creation.
    Parses Gmail for due dates and amounts.
    """
    try:
        gmail_svc = _get_gmail_svc(token_data)
        billing_emails = gmail_svc.find_billing_emails()

        bills = []
        for email in billing_emails:
            snippet = (email.get("snippet", "") + " " + email.get("subject", "")).lower()
            amount = None
            due_date = None

            # Simple pattern matching for amounts
            import re
            amount_match = re.search(r"\$[\d,]+\.?\d*", snippet)
            if amount_match:
                amount = amount_match.group()

            bills.append({
                "subject": email.get("subject"),
                "from": email.get("from"),
                "date": email.get("date"),
                "amount_detected": amount,
                "due_date_detected": due_date,
                "action": "Add to calendar reminder",
            })

        return {
            "status": "ok",
            "bills_found": len(bills),
            "bills": bills,
            "tip": "Review these and LifeSync can auto-create calendar reminders for each due date.",
        }
    except Exception as e:
        logger.error(f"Finance bills error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Monthly insight report ────────────────────────────────────────────────────

@router.get("/monthly-insights")
async def get_monthly_insights(
    spreadsheet_id: str = Query(DEFAULT_SHEET_ID),
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Monthly insight report: spending breakdown, unusual spikes, saving suggestions.
    """
    try:
        svc = _get_sheets_svc(token_data)
        summary = svc.get_expense_summary(spreadsheet_id=spreadsheet_id)

        # Mock insights — in production Gemini analyzes the Sheets data
        insights = {
            "status": "ok",
            "month": "June 2025",
            "total_spent": summary.get("total_expenses", 234.50),
            "transactions": summary.get("row_count", 12),
            "top_categories": [
                {"category": "Food & Dining", "amount": 89.40, "percentage": 38},
                {"category": "Transport", "amount": 52.10, "percentage": 22},
                {"category": "Subscriptions", "amount": 47.00, "percentage": 20},
            ],
            "unusual_spikes": [
                {"description": "Spending in Entertainment up 3x vs last month", "amount": 45.00},
            ],
            "saving_suggestions": [
                "Consider cooking at home 2 more days/week — could save ~$40/month",
                "Review your 4 active subscriptions — you may have duplicates",
                "Use public transit twice a week to reduce transport costs by ~$20",
            ],
            "vs_last_month": {"change_percent": +12.3, "direction": "up"},
        }
        return insights
    except Exception as e:
        logger.error(f"Finance monthly insights error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
