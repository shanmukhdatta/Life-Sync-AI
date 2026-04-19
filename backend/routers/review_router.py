"""
LifeSync AI — Weekly Review Router
Module 10: AI-Powered Weekly Life Review & Planning
Endpoints: weekly review generation, next-week pre-load, goal progress, life score write.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
import logging

from utils.auth_dep import get_current_token_data
from services.fit_service import FitService, MockFitService
from services.calendar_service import CalendarService, MockCalendarService
from services.gmail_service import GmailService, MockGmailService
from services.gemini_service import GeminiService, MockGeminiService
from services.docs_service import DocsService, MockDocsService
from services.extended_services import SheetsService, MockSheetsService
from services.auth_service import build_credentials, refresh_credentials_if_needed
from config import settings

router = APIRouter(prefix="/api/review", tags=["Weekly Life Review"])
logger = logging.getLogger(__name__)

DEFAULT_SHEET_ID = "YOUR_LIFESYNC_SHEET_ID"


def _get_all_services(token_data: Dict):
    if not bool(settings.google_client_id and settings.gemini_api_key):
        return (
            MockFitService(), MockCalendarService(),
            MockGmailService(), MockGeminiService(),
            MockDocsService(), MockSheetsService(),
        )
    creds = refresh_credentials_if_needed(build_credentials(token_data))
    return (
        FitService(creds), CalendarService(creds),
        GmailService(creds), GeminiService(),
        DocsService(creds), SheetsService(creds),
    )


# ── Full weekly review ────────────────────────────────────────────────────────

class WeeklyReviewRequest(BaseModel):
    completed_tasks: List[str] = []
    missed_tasks: List[str] = []
    goals: List[Dict] = []              # [{"goal": "Run 5x/week", "progress": 60}]
    save_to_sheets: bool = True
    create_plan_doc: bool = True
    spreadsheet_id: str = DEFAULT_SHEET_ID


@router.post("/weekly")
async def generate_weekly_review(
    req: WeeklyReviewRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Automated Weekly Life Review (runs every Sunday).
    Combines: fitness data + calendar events + email patterns + Gemini analysis.
    Writes life score to Sheets, creates plan doc in Google Docs.
    """
    try:
        fit_svc, cal_svc, gmail_svc, gemini_svc, docs_svc, sheets_svc = _get_all_services(token_data)
        loop = asyncio.get_event_loop()

        # ── Parallel data fetch ──────────────────────────────────────────────
        fit_task = loop.run_in_executor(None, fit_svc.get_weekly_fitness_summary)
        calendar_task = loop.run_in_executor(None, lambda: cal_svc.get_upcoming_events(days_ahead=7))
        fitness_summary, next_week_events = await asyncio.gather(fit_task, calendar_task)

        # ── Gemini weekly review ─────────────────────────────────────────────
        habit_data = {
            "workout_sessions": fitness_summary.get("workout_sessions", 0),
            "avg_steps": fitness_summary.get("avg_daily_steps", 0),
            "avg_sleep": fitness_summary.get("sleep", {}).get("avg_hours", 0),
            "streak": fitness_summary.get("streak", {}).get("streak", 0),
        }
        goal_progress = {g.get("goal", f"Goal {i}"): g.get("progress", 0) for i, g in enumerate(req.goals)}

        review_task = loop.run_in_executor(
            None,
            lambda: gemini_svc.generate_weekly_review(
                completed_tasks=req.completed_tasks,
                missed_tasks=req.missed_tasks,
                habit_data=habit_data,
                goal_progress=goal_progress,
            )
        )
        review = await review_task

        # ── Next-week conflict analysis ───────────────────────────────────────
        conflicts = cal_svc.detect_conflicts(next_week_events)
        busy_days = {}
        for event in next_week_events:
            date = (event.get("start") or "")[:10]
            busy_days[date] = busy_days.get(date, 0) + 1
        heavy_days = [d for d, count in busy_days.items() if count >= 4]

        # ── Life score ────────────────────────────────────────────────────────
        life_score = {
            "productivity_score": review.get("productivity_score", 70),
            "health_score": review.get("health_score", 65),
            "habit_adherence": min(100, habit_data["workout_sessions"] * 20),
            "goal_progress": int(sum(g.get("progress", 0) for g in req.goals) / max(len(req.goals), 1)),
            "headline": review.get("headline", "Solid week overall."),
        }

        # ── Write to Sheets (async) ───────────────────────────────────────────
        sheets_result = None
        if req.save_to_sheets:
            sheets_result = await loop.run_in_executor(
                None,
                lambda: sheets_svc.write_weekly_score(req.spreadsheet_id, life_score),
            )

        # ── Create weekly plan doc ────────────────────────────────────────────
        plan_doc = None
        if req.create_plan_doc:
            from datetime import datetime, timedelta, timezone
            next_monday = (datetime.now(timezone.utc) + timedelta(days=(7 - datetime.now(timezone.utc).weekday()))).strftime("%Y-%m-%d")
            plan_doc = await loop.run_in_executor(
                None,
                lambda: docs_svc.create_weekly_plan(
                    week_start=next_monday,
                    top_priorities=review.get("next_week_recommendations", [])[:3],
                    must_dos=req.completed_tasks[:3] if not req.completed_tasks else [],
                    focus_areas=[review.get("focus_area", "Continue current momentum")],
                    goal_progress=req.goals,
                    review_summary=review.get("headline", ""),
                ),
            )

        return {
            "status": "ok",
            "review": review,
            "fitness_summary": {
                "avg_steps": habit_data["avg_steps"],
                "avg_sleep_hours": habit_data["avg_sleep"],
                "workout_sessions": habit_data["workout_sessions"],
                "streak": habit_data["streak"],
            },
            "next_week": {
                "events_count": len(next_week_events),
                "conflicts": conflicts,
                "heavy_days": heavy_days,
                "recommendation": (
                    f"⚠️ Heavy week ahead — {len(heavy_days)} busy day(s) with 4+ events."
                    if heavy_days else "✅ Next week looks manageable."
                ),
            },
            "life_score": life_score,
            "sheets_written": bool(sheets_result and sheets_result.get("status") == "written"),
            "plan_document": plan_doc,
        }
    except Exception as e:
        logger.error(f"Weekly review error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Goal progress ─────────────────────────────────────────────────────────────

class GoalProgressRequest(BaseModel):
    goals: List[Dict]   # [{"goal": "...", "progress": 60, "note": "..."}]


@router.post("/goal-progress")
async def update_goal_progress(
    req: GoalProgressRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Goal Progress Check: each active goal with % completion + recommended adjustments.
    """
    try:
        _, _, _, gemini_svc, _, _ = _get_all_services(token_data)
        loop = asyncio.get_event_loop()

        analysis = await loop.run_in_executor(
            None,
            lambda: gemini_svc.generate_decision_support(
                decision=f"Goal review: {[g['goal'] for g in req.goals]}",
                calendar_load=[],
                goals=[f"{g['goal']}: {g.get('progress', 0)}% complete" for g in req.goals],
            )
        )

        goals_with_status = []
        for goal in req.goals:
            progress = goal.get("progress", 0)
            goals_with_status.append({
                **goal,
                "status": "on_track" if progress >= 70 else "behind" if progress < 40 else "progressing",
                "badge": "🔥" if progress >= 80 else "✅" if progress >= 60 else "⚠️" if progress >= 30 else "❌",
            })

        return {
            "status": "ok",
            "goals": goals_with_status,
            "overall_progress": int(sum(g.get("progress", 0) for g in req.goals) / max(len(req.goals), 1)),
            "ai_recommendations": analysis.get("recommendation", "Keep steady progress on all goals."),
        }
    except Exception as e:
        logger.error(f"Goal progress error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Next-week pre-load ────────────────────────────────────────────────────────

@router.get("/next-week")
async def get_next_week_preview(token_data: Dict = Depends(get_current_token_data)):
    """
    Next-Week Pre-Load: identifies conflicts, heavy days, gaps; suggests rebalancing.
    """
    try:
        _, cal_svc, _, _, _, _ = _get_all_services(token_data)
        loop = asyncio.get_event_loop()
        events = await loop.run_in_executor(None, lambda: cal_svc.get_upcoming_events(days_ahead=7))

        conflicts = cal_svc.detect_conflicts(events)
        busy_days: Dict[str, int] = {}
        for event in events:
            date = (event.get("start") or "")[:10]
            if date:
                busy_days[date] = busy_days.get(date, 0) + 1

        light_days = [d for d, count in busy_days.items() if count <= 1]
        heavy_days = [d for d, count in busy_days.items() if count >= 4]
        free_days = []

        from datetime import datetime, timedelta, timezone
        today = datetime.now(timezone.utc)
        for i in range(1, 8):
            day = (today + timedelta(days=i)).strftime("%Y-%m-%d")
            if day not in busy_days:
                free_days.append(day)

        return {
            "status": "ok",
            "next_7_days": {
                "total_events": len(events),
                "conflicts": conflicts,
                "heavy_days": heavy_days,
                "light_days": light_days,
                "free_days": free_days,
                "events_by_day": busy_days,
            },
            "rebalancing_suggestions": [
                f"Move some tasks from {heavy_days[0]} to {free_days[0]}" if heavy_days and free_days else "Schedule looks balanced.",
                f"{len(conflicts)} scheduling conflicts detected — resolve before Monday." if conflicts else "No scheduling conflicts next week.",
                f"Block deep work on {free_days[0]} — currently free." if free_days else "Consider protecting at least one morning for deep work.",
            ],
        }
    except Exception as e:
        logger.error(f"Next week preview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
