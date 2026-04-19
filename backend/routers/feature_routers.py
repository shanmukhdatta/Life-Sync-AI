"""
LifeSync AI — Feature Routers
Email Intelligence, Calendar Co-Pilot, Task Engine, and AI Command routers.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import logging

from utils.auth_dep import get_current_token_data
from services.gmail_service import GmailService, MockGmailService
from services.calendar_service import CalendarService, MockCalendarService
from services.gemini_service import GeminiService, MockGeminiService
from services.extended_services import TasksService, MockTasksService
from services.auth_service import build_credentials, refresh_credentials_if_needed
from config import settings

logger = logging.getLogger(__name__)
def _use_mock():
    return not bool(settings.google_client_id and settings.gemini_api_key)

def _get_creds_and_gemini(token_data: Dict):
    if _use_mock():
        return None, MockGeminiService()
    creds = refresh_credentials_if_needed(build_credentials(token_data))
    return creds, GeminiService()


# ════════════════════════════════════════════════════════════════
# EMAIL INTELLIGENCE ROUTER
# ════════════════════════════════════════════════════════════════

email_router = APIRouter(prefix="/api/email", tags=["Email Intelligence"])


@email_router.get("/inbox")
async def get_classified_inbox(token_data: Dict = Depends(get_current_token_data)):
    """Get Inbox Zero classified emails: Act Now / Read Later / FYI Only / Delegate."""
    try:
        svc = MockGmailService() if _use_mock() else GmailService(
            refresh_credentials_if_needed(build_credentials(token_data))
        )
        emails = svc.list_messages(max_results=20)
        classified = svc.classify_inbox(emails)
        billing = svc.find_billing_emails()
        return {"status": "ok", "classified": classified, "billing_emails": billing, "total": len(emails)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ExtractActionItemsRequest(BaseModel):
    email_id: str
    email_body: str
    email_from: str
    email_subject: str


@email_router.post("/extract-actions")
async def extract_action_items(req: ExtractActionItemsRequest, token_data: Dict = Depends(get_current_token_data)):
    """Extract action items from an email using Gemini."""
    try:
        _, gemini = _get_creds_and_gemini(token_data)
        loop = asyncio.get_event_loop()
        items = await loop.run_in_executor(
            None,
            lambda: gemini.extract_action_items(req.email_body, req.email_from, req.email_subject)
        )
        return {"status": "ok", "action_items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DraftReplyRequest(BaseModel):
    email_id: str
    email_body: str
    email_from: str
    email_subject: str
    thread_id: Optional[str] = None
    tone: str = "professional"


@email_router.post("/draft-reply")
async def draft_smart_reply(req: DraftReplyRequest, token_data: Dict = Depends(get_current_token_data)):
    """Generate a context-aware smart reply draft."""
    try:
        creds, gemini = _get_creds_and_gemini(token_data)
        gmail_svc = MockGmailService() if _use_mock() else GmailService(creds)

        loop = asyncio.get_event_loop()

        thread_task = loop.run_in_executor(None, lambda: gmail_svc.get_thread_history(req.thread_id or req.email_id))
        tone_task = loop.run_in_executor(None, lambda: gemini.detect_email_tone(req.email_body))
        thread_history, detected_tone = await asyncio.gather(thread_task, tone_task)

        draft = await loop.run_in_executor(
            None,
            lambda: gemini.draft_smart_reply(
                req.email_body, req.email_from, req.email_subject,
                thread_history, req.tone or detected_tone
            )
        )

        return {"status": "ok", "draft": draft, "detected_tone": detected_tone, "thread_context": thread_history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════
# CALENDAR ROUTER
# ════════════════════════════════════════════════════════════════

calendar_router = APIRouter(prefix="/api/calendar", tags=["Calendar Co-Pilot"])


@calendar_router.get("/events")
async def get_events(days: int = 7, token_data: Dict = Depends(get_current_token_data)):
    """Get upcoming events with conflict detection."""
    try:
        svc = MockCalendarService() if _use_mock() else CalendarService(
            refresh_credentials_if_needed(build_credentials(token_data))
        )
        events = svc.get_upcoming_events(days_ahead=days)
        conflicts = svc.detect_conflicts(events)
        return {"status": "ok", "events": events, "conflicts": conflicts, "total": len(events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CreateEventRequest(BaseModel):
    title: str
    start_dt: str
    end_dt: str
    description: str = ""
    location: str = ""
    attendees: List[str] = []


@calendar_router.post("/events")
async def create_event(req: CreateEventRequest, token_data: Dict = Depends(get_current_token_data)):
    """Create a new calendar event."""
    try:
        svc = MockCalendarService() if _use_mock() else CalendarService(
            refresh_credentials_if_needed(build_credentials(token_data))
        )
        result = svc.create_event(
            title=req.title,
            start_dt=req.start_dt,
            end_dt=req.end_dt,
            description=req.description,
            location=req.location,
            attendees=req.attendees,
        )
        return {"status": "ok", **result}
    except Exception as e:
        logger.error(f"create_event error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class BlockFocusRequest(BaseModel):
    date: str  # YYYY-MM-DD
    duration_hours: int = 2
    title: str = "Deep Work — LifeSync"


@calendar_router.post("/focus-block")
async def block_focus_time(req: BlockFocusRequest, token_data: Dict = Depends(get_current_token_data)):
    """Block focus time in calendar."""
    try:
        svc = MockCalendarService() if _use_mock() else CalendarService(
            refresh_credentials_if_needed(build_credentials(token_data))
        )
        result = svc.block_focus_time(req.date, req.duration_hours, req.title)
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BackplanRequest(BaseModel):
    deadline: str  # ISO datetime
    task_title: str
    prep_hours: int = 2


@calendar_router.post("/backplan")
async def backplan_deadline(req: BackplanRequest, token_data: Dict = Depends(get_current_token_data)):
    """Create backplanned prep sessions for a deadline."""
    try:
        svc = MockCalendarService() if _use_mock() else CalendarService(
            refresh_credentials_if_needed(build_credentials(token_data))
        )
        blocks = svc.backplan_deadline(req.deadline, req.task_title, req.prep_hours)
        return {"status": "ok", "blocks_created": len(blocks), "blocks": blocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════
# AI COMMAND ROUTER (Conversational Task Engine)
# ════════════════════════════════════════════════════════════════

ai_router = APIRouter(prefix="/api/ai", tags=["AI Command Engine"])


class CommandRequest(BaseModel):
    command: str
    include_context: bool = True


@ai_router.post("/command")
async def process_command(req: CommandRequest, token_data: Dict = Depends(get_current_token_data)):
    """
    Process natural language commands.
    E.g., "prepare for investor meeting Thursday" → tasks + calendar blocks + relevant emails.
    """
    try:
        creds, gemini = _get_creds_and_gemini(token_data)
        context: Dict[str, Any] = {}

        if req.include_context:
            cal_svc = MockCalendarService() if _use_mock() else CalendarService(creds)
            gmail_svc = MockGmailService() if _use_mock() else GmailService(creds)

            loop = asyncio.get_event_loop()
            events_task = loop.run_in_executor(None, lambda: cal_svc.get_upcoming_events(days_ahead=7))
            emails_task = loop.run_in_executor(None, lambda: gmail_svc.list_messages(max_results=5))
            events, emails = await asyncio.gather(events_task, emails_task)
            context = {"events": events, "emails": emails}

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: gemini.parse_natural_language_command(req.command, context)
        )

        return {"status": "ok", "command": req.command, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DecisionRequest(BaseModel):
    decision: str
    goals: List[str] = []


@ai_router.post("/decision-support")
async def decision_support(req: DecisionRequest, token_data: Dict = Depends(get_current_token_data)):
    """AI-powered decision support with calendar load analysis."""
    try:
        creds, gemini = _get_creds_and_gemini(token_data)
        cal_svc = MockCalendarService() if _use_mock() else CalendarService(creds)

        loop = asyncio.get_event_loop()
        events = await loop.run_in_executor(None, lambda: cal_svc.get_upcoming_events(days_ahead=7))
        result = await loop.run_in_executor(
            None,
            lambda: gemini.generate_decision_support(req.decision, events, req.goals)
        )
        return {"status": "ok", "decision": req.decision, "analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ════════════════════════════════════════════════════════════════
# TASKS ROUTER
# ════════════════════════════════════════════════════════════════

tasks_router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@tasks_router.get("/")
async def list_tasks(token_data: Dict = Depends(get_current_token_data)):
    """List all pending tasks."""
    try:
        svc = MockTasksService() if _use_mock() else TasksService(
            refresh_credentials_if_needed(build_credentials(token_data))
        )
        tasks = svc.list_tasks()
        return {"status": "ok", "tasks": tasks, "total": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CreateTaskRequest(BaseModel):
    title: str
    due_date: Optional[str] = None
    notes: str = ""


@tasks_router.post("/")
async def create_task(req: CreateTaskRequest, token_data: Dict = Depends(get_current_token_data)):
    """Create a new task."""
    try:
        svc = MockTasksService() if _use_mock() else TasksService(
            refresh_credentials_if_needed(build_credentials(token_data))
        )
        result = svc.create_task(req.title, req.due_date, req.notes)
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@tasks_router.patch("/{task_id}/complete")
async def complete_task(task_id: str, token_data: Dict = Depends(get_current_token_data)):
    """Mark a task as completed."""
    try:
        svc = MockTasksService() if _use_mock() else TasksService(
            refresh_credentials_if_needed(build_credentials(token_data))
        )
        result = svc.complete_task(task_id)
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
