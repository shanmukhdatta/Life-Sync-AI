"""
LifeSync AI — Dashboard Router
Unified Smart Dashboard: morning briefing, priority scores, context alerts.
Async parallel API calls for performance.
"""
from fastapi import APIRouter, Depends, HTTPException
import asyncio
import logging
from typing import Dict, Any

from utils.auth_dep import get_current_token_data
from services.gmail_service import GmailService, MockGmailService
from services.calendar_service import CalendarService, MockCalendarService
from services.gemini_service import GeminiService, MockGeminiService
from services.auth_service import build_credentials, refresh_credentials_if_needed
from config import settings

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)

def _get_services(token_data: Dict):
    """Build service instances — real or mock based on config."""
    use_mock = not bool(settings.google_client_id and settings.gemini_api_key)
    if use_mock:
        return MockGmailService(), MockCalendarService(), MockGeminiService()

    creds = build_credentials(token_data)
    creds = refresh_credentials_if_needed(creds)
    return GmailService(creds), CalendarService(creds), GeminiService()


@router.get("/briefing")
async def morning_briefing(token_data: Dict = Depends(get_current_token_data)):
    """
    Unified morning briefing with async parallel API calls.
    Fetches emails + calendar simultaneously, then runs Gemini analysis.
    """
    try:
        gmail_svc, calendar_svc, gemini_svc = _get_services(token_data)

        # ── Parallel fetch: Gmail + Calendar (async) ──────────────────────────
        loop = asyncio.get_event_loop()

        email_task = loop.run_in_executor(None, lambda: gmail_svc.list_messages(max_results=10))
        calendar_task = loop.run_in_executor(None, lambda: calendar_svc.get_today_summary())

        emails, calendar_summary = await asyncio.gather(email_task, calendar_task)

        # ── Gemini synthesis ───────────────────────────────────────────────────
        briefing_task = loop.run_in_executor(
            None,
            lambda: gemini_svc.generate_morning_briefing(
                emails=emails,
                calendar_events=calendar_summary.get("events", []),
                user_name=token_data.get("name", "there").split()[0],
            )
        )
        briefing = await briefing_task

        # ── Inbox classification (parallel) ───────────────────────────────────
        classified = gmail_svc.classify_inbox(emails)

        return {
            "status": "ok",
            "briefing": briefing,
            "calendar": {
                "today_events": calendar_summary.get("total_events", 0),
                "first_meeting": calendar_summary.get("first_meeting"),
                "conflicts": calendar_summary.get("conflicts", []),
                "events": calendar_summary.get("events", [])[:5],
            },
            "inbox": {
                "unread_count": sum(1 for e in emails if e.get("is_unread")),
                "classified": {k: len(v) for k, v in classified.items()},
                "urgent_emails": classified.get("act_now", [])[:3],
            },
            "using_mock": not bool(settings.google_client_id and settings.gemini_api_key),
        }

    except Exception as e:
        logger.error(f"Dashboard briefing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/priority-score")
async def get_priority_scores(token_data: Dict = Depends(get_current_token_data)):
    """Generate AI priority scores for tasks and events."""
    try:
        gmail_svc, calendar_svc, gemini_svc = _get_services(token_data)

        loop = asyncio.get_event_loop()
        tasks_coro = loop.run_in_executor(None, lambda: calendar_svc.get_upcoming_events(days_ahead=3))
        emails_coro = loop.run_in_executor(None, lambda: gmail_svc.list_messages(max_results=5))
        events, emails = await asyncio.gather(tasks_coro, emails_coro)

        # Simple priority scoring algorithm
        scored_items = []
        for event in events:
            scored_items.append({
                "type": "event",
                "title": event.get("title"),
                "time": event.get("start"),
                "priority_score": 85,
                "tags": ["Calendar"],
            })
        for email in emails[:3]:
            if email.get("is_unread"):
                scored_items.append({
                    "type": "email",
                    "title": email.get("subject"),
                    "from": email.get("from"),
                    "priority_score": 72,
                    "tags": ["Needs Reply"],
                })

        scored_items.sort(key=lambda x: x["priority_score"], reverse=True)
        return {"status": "ok", "scored_items": scored_items}

    except Exception as e:
        logger.error(f"Priority score error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
