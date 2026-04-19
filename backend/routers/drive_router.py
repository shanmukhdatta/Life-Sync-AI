"""
LifeSync AI — Drive Router
Module 6: Document Intelligence Hub
Endpoints: search, meeting doc surfacing, recent files, NL cross-doc search.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging

from utils.auth_dep import get_current_token_data
from services.drive_service import DriveService, MockDriveService
from services.auth_service import build_credentials, refresh_credentials_if_needed
from config import settings

router = APIRouter(prefix="/api/drive", tags=["Document Intelligence Hub"])
logger = logging.getLogger(__name__)

def _get_drive_svc(token_data: Dict):
    use_mock = not bool(settings.google_client_id)
    if use_mock:
        return MockDriveService()
    creds = refresh_credentials_if_needed(build_credentials(token_data))
    return DriveService(creds)


@router.get("/search")
async def search_documents(
    query: str = Query(..., description="Natural language search query"),
    max_results: int = Query(10, ge=1, le=20),
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Cross-document natural language search.
    E.g., 'find the Q1 report where we discussed marketing budget'.
    """
    try:
        svc = _get_drive_svc(token_data)
        files = svc.search_files(query=query, max_results=max_results)
        return {
            "status": "ok",
            "query": query,
            "results": files,
            "count": len(files),
        }
    except Exception as e:
        logger.error(f"Drive search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class MeetingDocRequest(BaseModel):
    meeting_title: str
    attendees: List[str] = []


@router.post("/meeting-docs")
async def surface_meeting_docs(
    req: MeetingDocRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Pre-meeting doc surfacing.
    Auto-surfaces Drive docs 30 min before a meeting based on title + attendees.
    """
    try:
        svc = _get_drive_svc(token_data)
        docs = svc.surface_meeting_docs(
            meeting_title=req.meeting_title,
            attendees=req.attendees,
        )
        return {
            "status": "ok",
            "meeting": req.meeting_title,
            "surfaced_docs": docs,
            "count": len(docs),
            "message": f"Found {len(docs)} relevant document(s) for '{req.meeting_title}'",
        }
    except Exception as e:
        logger.error(f"Drive meeting-docs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent")
async def get_recent_files(
    max_results: int = Query(10, ge=1, le=20),
    token_data: Dict = Depends(get_current_token_data),
):
    """Get recently modified Drive files for quick access."""
    try:
        svc = _get_drive_svc(token_data)
        files = svc.get_recent_files(max_results=max_results)
        return {"status": "ok", "files": files, "count": len(files)}
    except Exception as e:
        logger.error(f"Drive recent files error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summarize/{file_id}")
async def summarize_document(
    file_id: str,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Smart Document Summarizer — 3-bullet summary on demand.
    Note: Full summarization requires Gemini + Drive content read scope.
    """
    try:
        # In real implementation: read file content, pass to Gemini for summarization
        # Mock returns a structured placeholder
        return {
            "status": "ok",
            "file_id": file_id,
            "summary": {
                "bullets": [
                    "Document covers Q2 performance metrics and goal tracking",
                    "Key decisions include budget reallocation and team expansion",
                    "Action items assigned to 3 team members with June deadlines",
                ],
                "one_liner": "Q2 review with budget and staffing decisions requiring immediate follow-up.",
                "word_count_estimate": 1200,
            },
        }
    except Exception as e:
        logger.error(f"Drive summarize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
