"""
LifeSync AI — Fit Router
Module 4: Life Goals & Habit Tracker
Endpoints: activity data, habit streaks, burnout risk, adaptive rescheduling.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging

from utils.auth_dep import get_current_token_data
from services.fit_service import FitService, MockFitService
from services.calendar_service import CalendarService, MockCalendarService
from services.auth_service import build_credentials, refresh_credentials_if_needed
from config import settings

router = APIRouter(prefix="/api/fit", tags=["Life Goals & Habit Tracker"])
logger = logging.getLogger(__name__)

def _get_fit_svc(token_data: Dict):
    if not bool(settings.google_client_id):
        return MockFitService()
    creds = refresh_credentials_if_needed(build_credentials(token_data))
    return FitService(creds)


def _get_cal_svc(token_data: Dict):
    if not bool(settings.google_client_id):
        return MockCalendarService()
    creds = refresh_credentials_if_needed(build_credentials(token_data))
    return CalendarService(creds)


# ── Weekly fitness summary ────────────────────────────────────────────────────

@router.get("/summary")
async def get_fitness_summary(
    days: int = Query(7, ge=1, le=30),
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Full weekly fitness summary: steps, sleep, workouts, streak, burnout risk.
    Used in morning briefing and weekly life review.
    """
    try:
        svc = _get_fit_svc(token_data)
        summary = svc.get_weekly_fitness_summary()
        return {"status": "ok", "summary": summary}
    except Exception as e:
        logger.error(f"Fit summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Daily steps ───────────────────────────────────────────────────────────────

@router.get("/steps")
async def get_daily_steps(
    days: int = Query(7, ge=1, le=30),
    token_data: Dict = Depends(get_current_token_data),
):
    """Get daily step counts for trend analysis."""
    try:
        svc = _get_fit_svc(token_data)
        steps = svc.get_daily_steps(days_back=days)
        total = sum(s["steps"] for s in steps)
        avg = total // max(len(steps), 1)
        return {
            "status": "ok",
            "days": days,
            "steps": steps,
            "total": total,
            "average": avg,
            "goal_10k": {"met_count": sum(1 for s in steps if s["steps"] >= 10000), "of": len(steps)},
        }
    except Exception as e:
        logger.error(f"Fit steps error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Sleep data ────────────────────────────────────────────────────────────────

@router.get("/sleep")
async def get_sleep_data(
    days: int = Query(7, ge=1, le=30),
    token_data: Dict = Depends(get_current_token_data),
):
    """Get sleep consistency data for weekly life score."""
    try:
        svc = _get_fit_svc(token_data)
        sleep = svc.get_sleep_data(days_back=days)
        avg_hours = sum(s["duration_hours"] for s in sleep) / max(len(sleep), 1)
        good_nights = sum(1 for s in sleep if s["quality"] == "good")
        return {
            "status": "ok",
            "sleep": sleep,
            "avg_hours": round(avg_hours, 1),
            "good_nights": good_nights,
            "consistency_score": round((good_nights / max(len(sleep), 1)) * 100),
            "recommendation": "Aim for 7-9 hours consistently" if avg_hours < 7 else "Sleep consistency looks good!",
        }
    except Exception as e:
        logger.error(f"Fit sleep error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Habit streak ──────────────────────────────────────────────────────────────

@router.get("/streak")
async def get_habit_streak(
    habit: str = Query("workout", description="Habit name to track"),
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Context-aware streak tracking.
    A 6 AM flight doesn't break your run streak.
    """
    try:
        svc = _get_fit_svc(token_data)
        sessions = svc.get_activity_sessions(days_back=30)
        streak = svc.calculate_habit_streak(sessions, habit_name=habit)
        return {"status": "ok", "streak": streak}
    except Exception as e:
        logger.error(f"Fit streak error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Burnout risk ──────────────────────────────────────────────────────────────

@router.get("/burnout-risk")
async def get_burnout_risk(token_data: Dict = Depends(get_current_token_data)):
    """
    Detect burnout risk from activity + sleep patterns.
    Used in morning briefing as a health alert.
    """
    try:
        svc = _get_fit_svc(token_data)
        steps = svc.get_daily_steps(days_back=7)
        sleep = svc.get_sleep_data(days_back=7)
        sessions = svc.get_activity_sessions(days_back=7)
        risk = svc.calculate_burnout_risk(steps, sleep, sessions)
        return {
            "status": "ok",
            "burnout_risk": risk,
            "alert": risk["risk_level"] in ("medium", "high"),
        }
    except Exception as e:
        logger.error(f"Fit burnout-risk error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Adaptive habit rescheduling ───────────────────────────────────────────────

class RescheduleHabitRequest(BaseModel):
    habit_name: str
    preferred_duration_minutes: int = 45
    date: str  # YYYY-MM-DD


@router.post("/reschedule-habit")
async def reschedule_habit(
    req: RescheduleHabitRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Adaptive Habit Scheduling: instead of marking a workout as missed,
    LifeSync reschedules it to the nearest free 45-min window.
    """
    try:
        cal_svc = _get_cal_svc(token_data)
        events = cal_svc.get_upcoming_events(days_ahead=1)

        # Find free windows (simplified — full impl uses Google Freebusy API)
        busy_hours = set()
        for event in events:
            start = event.get("start", "")
            if start and "T" in start:
                try:
                    hour = int(start.split("T")[1][:2])
                    busy_hours.update(range(hour, hour + 2))
                except (ValueError, IndexError):
                    pass

        # Suggest free slots
        preferred_slots = [6, 7, 12, 17, 18, 19, 20]
        free_slots = [h for h in preferred_slots if h not in busy_hours]

        if not free_slots:
            return {
                "status": "ok",
                "rescheduled": False,
                "message": "No free windows found today. Streak preserved — rest day noted.",
                "streak_preserved": True,
            }

        best_slot = free_slots[0]
        start_dt = f"{req.date}T{best_slot:02d}:00:00Z"
        end_dt = f"{req.date}T{best_slot + (req.preferred_duration_minutes // 60):02d}:{req.preferred_duration_minutes % 60:02d}:00Z"

        result = cal_svc.create_event(
            title=f"🏃 {req.habit_name} — Rescheduled by LifeSync",
            start_dt=start_dt,
            end_dt=end_dt,
            description=f"LifeSync rescheduled your {req.habit_name} habit to protect your streak.",
        )

        return {
            "status": "ok",
            "rescheduled": True,
            "habit": req.habit_name,
            "new_time": f"{best_slot:02d}:00",
            "duration_minutes": req.preferred_duration_minutes,
            "calendar_event": result,
            "message": f"Rescheduled '{req.habit_name}' to {best_slot:02d}:00 to protect your streak!",
        }
    except Exception as e:
        logger.error(f"Fit reschedule-habit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Weekly life score ─────────────────────────────────────────────────────────

@router.get("/life-score")
async def get_weekly_life_score(token_data: Dict = Depends(get_current_token_data)):
    """
    Weekly Life Score: productivity, health adherence, sleep consistency, goal progress.
    Output goes into Google Sheets via SheetsService.
    """
    try:
        svc = _get_fit_svc(token_data)
        summary = svc.get_weekly_fitness_summary()

        # Score calculation
        steps = summary.get("daily_steps", [])
        avg_steps = summary.get("avg_daily_steps", 0)
        sleep = summary.get("sleep", {})
        avg_sleep = sleep.get("avg_hours", 0)
        workouts = summary.get("workout_sessions", 0)
        streak = summary.get("streak", {}).get("streak", 0)

        health_score = min(100, int(
            (min(avg_steps / 10000, 1) * 40) +
            (min(avg_sleep / 8, 1) * 35) +
            (min(workouts / 5, 1) * 25)
        ))

        sleep_consistency = min(100, int((avg_sleep / 8) * 100))

        return {
            "status": "ok",
            "week": "current",
            "scores": {
                "health_adherence": health_score,
                "sleep_consistency": sleep_consistency,
                "workout_streak": streak,
                "burnout_risk": summary.get("burnout_risk", {}).get("risk_level", "unknown"),
            },
            "raw": {
                "avg_daily_steps": avg_steps,
                "avg_sleep_hours": avg_sleep,
                "workout_sessions": workouts,
            },
            "badge": (
                "🔥 Crushing It" if health_score >= 80
                else "✅ On Track" if health_score >= 60
                else "⚠️ Needs Attention"
            ),
        }
    except Exception as e:
        logger.error(f"Fit life-score error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
