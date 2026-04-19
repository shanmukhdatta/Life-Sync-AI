"""
LifeSync AI — Docs Router
Module 8: Smart Communication Composer
Endpoints: meeting notes, weekly plan, communication drafts, follow-up sequencer.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging

from utils.auth_dep import get_current_token_data
from services.docs_service import DocsService, MockDocsService
from services.gemini_service import GeminiService, MockGeminiService
from services.auth_service import build_credentials, refresh_credentials_if_needed
from config import settings

router = APIRouter(prefix="/api/docs", tags=["Smart Communication Composer"])
logger = logging.getLogger(__name__)

def _get_docs_svc(token_data: Dict):
    if not bool(settings.google_client_id):
        return MockDocsService()
    creds = refresh_credentials_if_needed(build_credentials(token_data))
    return DocsService(creds)


def _get_gemini_svc():
    return MockGeminiService() if not bool(settings.gemini_api_key) else GeminiService()


# ── Meeting notes ─────────────────────────────────────────────────────────────

class MeetingNotesRequest(BaseModel):
    meeting_title: str
    attendees: List[str] = []
    brain_dump: str                     # Voice/text brain dump after the meeting
    action_items: List[str] = []
    date: Optional[str] = None          # defaults to today


@router.post("/meeting-notes")
async def create_meeting_notes(
    req: MeetingNotesRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Meeting Notes Auto-Draft.
    After calendar event ends: voice/text brain dump → structured Google Doc.
    """
    try:
        docs_svc = _get_docs_svc(token_data)
        result = docs_svc.create_meeting_notes(
            meeting_title=req.meeting_title,
            attendees=req.attendees,
            brain_dump=req.brain_dump,
            action_items=req.action_items,
            date=req.date,
        )
        return {
            "status": "ok",
            "message": f"Meeting notes created for '{req.meeting_title}'",
            "document": result,
        }
    except Exception as e:
        logger.error(f"Docs meeting-notes error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Weekly plan ───────────────────────────────────────────────────────────────

class WeeklyPlanRequest(BaseModel):
    week_start: str                     # YYYY-MM-DD (Monday)
    top_priorities: List[str]
    must_dos: List[str] = []
    focus_areas: List[str] = []
    goal_progress: List[Dict] = []
    review_summary: str = ""


@router.post("/weekly-plan")
async def create_weekly_plan(
    req: WeeklyPlanRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Weekly Plan Document.
    One-page structured Google Doc: top priorities, must-dos, focus areas.
    """
    try:
        docs_svc = _get_docs_svc(token_data)
        result = docs_svc.create_weekly_plan(
            week_start=req.week_start,
            top_priorities=req.top_priorities,
            must_dos=req.must_dos,
            focus_areas=req.focus_areas,
            goal_progress=req.goal_progress,
            review_summary=req.review_summary,
        )
        return {
            "status": "ok",
            "message": f"Weekly plan created for week of {req.week_start}",
            "document": result,
        }
    except Exception as e:
        logger.error(f"Docs weekly-plan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Communication draft ───────────────────────────────────────────────────────

VALID_DOC_TYPES = ["proposal", "status_update", "follow_up", "apology", "request", "introduction"]
VALID_TONES = ["formal", "friendly", "urgent", "apologetic", "assertive", "professional"]


class CommunicationDraftRequest(BaseModel):
    doc_type: str                       # proposal | status_update | follow_up | etc.
    recipient: str
    subject: str
    context: str                        # What the communication is about
    tone: Optional[str] = None          # Auto-detected if not provided
    save_to_docs: bool = True


@router.post("/draft")
async def create_communication_draft(
    req: CommunicationDraftRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Tone-Aware Communication Drafting.
    Formal/friendly/urgent/apologetic based on recipient relationship + email history.
    Saves to Google Docs for editing.
    """
    try:
        if req.doc_type not in VALID_DOC_TYPES:
            raise HTTPException(status_code=400, detail=f"doc_type must be one of: {VALID_DOC_TYPES}")

        gemini_svc = _get_gemini_svc()
        docs_svc = _get_docs_svc(token_data)

        # Detect tone if not provided
        detected_tone = req.tone or gemini_svc.detect_email_tone(req.context)

        # Use Gemini to draft the communication
        draft_content = gemini_svc.draft_smart_reply(
            email_body=req.context,
            email_from="",
            email_subject=req.subject,
            thread_history=[],
            tone=detected_tone,
        )

        result = {"content": draft_content, "tone": detected_tone, "doc_type": req.doc_type}

        if req.save_to_docs:
            doc_result = docs_svc.create_communication_draft(
                doc_type=req.doc_type,
                recipient=req.recipient,
                subject=req.subject,
                content=draft_content,
                tone=detected_tone,
            )
            result["document"] = doc_result

        return {
            "status": "ok",
            "draft": result,
            "message": f"{req.doc_type.replace('_', ' ').title()} draft created for {req.recipient}",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Docs draft error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Follow-up sequencer ───────────────────────────────────────────────────────

class FollowUpRequest(BaseModel):
    original_email_subject: str
    recipient_email: str
    original_date: str              # ISO date of original email
    follow_up_days: List[int] = [3, 7, 14]  # Days after original to follow up
    context: str = ""


@router.post("/follow-up-sequence")
async def create_follow_up_sequence(
    req: FollowUpRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Follow-Up Sequencer.
    Drafts + schedules follow-ups if no reply within user-defined window.
    Creates separate Google Docs for each follow-up draft.
    """
    try:
        from datetime import datetime, timedelta
        gemini_svc = _get_gemini_svc()
        docs_svc = _get_docs_svc(token_data)

        original_dt = datetime.fromisoformat(req.original_date)
        sequence = []

        for i, days in enumerate(req.follow_up_days[:3], 1):
            follow_up_date = original_dt + timedelta(days=days)
            tone = "friendly" if i == 1 else "assertive" if i == 2 else "urgent"

            context = f"Follow-up #{i} (Day {days}) regarding: {req.original_email_subject}. {req.context}"
            draft_content = gemini_svc.draft_smart_reply(
                email_body=context,
                email_from=req.recipient_email,
                email_subject=f"Re: {req.original_email_subject}",
                thread_history=[],
                tone=tone,
            )

            doc_result = docs_svc.create_communication_draft(
                doc_type="follow_up",
                recipient=req.recipient_email,
                subject=f"Follow-up #{i} — {req.original_email_subject}",
                content=draft_content,
                tone=tone,
            )

            sequence.append({
                "sequence_number": i,
                "send_date": follow_up_date.strftime("%Y-%m-%d"),
                "days_after_original": days,
                "tone": tone,
                "draft_preview": draft_content[:200] + "..." if len(draft_content) > 200 else draft_content,
                "document": doc_result,
            })

        return {
            "status": "ok",
            "original_subject": req.original_email_subject,
            "recipient": req.recipient_email,
            "sequence_count": len(sequence),
            "sequence": sequence,
            "message": f"Created {len(sequence)} follow-up drafts for '{req.original_email_subject}'",
        }
    except Exception as e:
        logger.error(f"Docs follow-up sequence error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Recent docs listing ───────────────────────────────────────────────────────

@router.get("/recent")
async def list_recent_docs(
    max_results: int = Query(10, ge=1, le=20),
    token_data: Dict = Depends(get_current_token_data),
):
    """List recently created LifeSync Docs (meeting notes, plans, drafts)."""
    try:
        docs_svc = _get_docs_svc(token_data)
        docs = docs_svc.list_recent_docs(max_results=max_results)
        return {"status": "ok", "docs": docs, "count": len(docs)}
    except Exception as e:
        logger.error(f"Docs recent error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
