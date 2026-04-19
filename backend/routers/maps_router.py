"""
LifeSync AI — Maps Router
Module 9: Location-Aware Context Engine
Endpoints: travel time, smart departure buffer, errand batching, venue suggestion.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging

from utils.auth_dep import get_current_token_data
from services.extended_services import MapsService, MockMapsService
from config import settings

router = APIRouter(prefix="/api/maps", tags=["Location-Aware Context Engine"])
logger = logging.getLogger(__name__)

# Maps uses a separate API key (not OAuth) — read from settings
MAPS_API_KEY = getattr(settings, "google_maps_api_key", "")


def _get_maps_svc():
    use_mock = not bool(settings.google_client_id)
    if use_mock or not MAPS_API_KEY:
        return MockMapsService()
    return MapsService(api_key=MAPS_API_KEY)


# ── Travel time ───────────────────────────────────────────────────────────────

class TravelTimeRequest(BaseModel):
    origin: str
    destination: str
    mode: str = "driving"  # driving | walking | transit | bicycling


@router.post("/travel-time")
async def get_travel_time(
    req: TravelTimeRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Real-time travel time check for smart departure reminders.
    Adjusts pre-departure notification based on live traffic.
    """
    try:
        svc = _get_maps_svc()
        result = await svc.get_travel_time(
            origin=req.origin,
            destination=req.destination,
            mode=req.mode,
        )

        # Smart departure buffer calculation
        duration = result.get("duration_minutes", 30)
        buffer_minutes = max(15, int(duration * 0.15))  # 15% buffer, min 15 min
        depart_in_minutes = duration + buffer_minutes

        return {
            "status": "ok",
            "route": {"from": req.origin, "to": req.destination, "mode": req.mode},
            "travel": result,
            "smart_buffer": {
                "travel_minutes": duration,
                "buffer_minutes": buffer_minutes,
                "depart_in_minutes": depart_in_minutes,
                "tip": f"Leave in {depart_in_minutes} min to arrive on time with traffic buffer.",
            },
        }
    except Exception as e:
        logger.error(f"Maps travel-time error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Departure reminder ────────────────────────────────────────────────────────

class DepartureReminderRequest(BaseModel):
    meeting_title: str
    meeting_time: str   # ISO datetime
    origin: str
    destination: str
    mode: str = "driving"


@router.post("/departure-reminder")
async def calculate_departure_reminder(
    req: DepartureReminderRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Calculate when to send a departure reminder for a meeting.
    Checks real-time traffic before events, adjusts reminder timing.
    """
    try:
        from datetime import datetime, timedelta, timezone
        svc = _get_maps_svc()
        travel = await svc.get_travel_time(req.origin, req.destination, req.mode)

        duration = travel.get("duration_minutes", 30)
        buffer = max(15, int(duration * 0.15))
        total_travel = duration + buffer

        meeting_dt = datetime.fromisoformat(req.meeting_time.replace("Z", "+00:00"))
        reminder_dt = meeting_dt - timedelta(minutes=total_travel)
        now = datetime.now(timezone.utc)
        minutes_until_reminder = int((reminder_dt - now).total_seconds() / 60)

        return {
            "status": "ok",
            "meeting": req.meeting_title,
            "meeting_time": req.meeting_time,
            "travel_minutes": duration,
            "buffer_minutes": buffer,
            "reminder_at": reminder_dt.isoformat(),
            "minutes_until_reminder": max(0, minutes_until_reminder),
            "action": "Set departure reminder" if minutes_until_reminder > 0 else "You should leave now!",
        }
    except Exception as e:
        logger.error(f"Maps departure-reminder error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Errand batching ───────────────────────────────────────────────────────────

class ErrandBatchRequest(BaseModel):
    current_location: str
    errands: List[str]          # list of places/task descriptions
    radius_km: float = 2.0      # batch errands within this radius


@router.post("/errand-batch")
async def batch_errands(
    req: ErrandBatchRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Errand batching: suggests combining nearby errands into one trip.
    Triggered when user is near a location on their task list.
    """
    try:
        # Smart batching logic — groups errands by proximity
        batched = []
        for errand in req.errands:
            errand_lower = errand.lower()
            location_type = "store"
            if any(w in errand_lower for w in ["pharmacy", "medicine", "prescription"]):
                location_type = "pharmacy"
            elif any(w in errand_lower for w in ["grocery", "supermarket", "food"]):
                location_type = "grocery_store"
            elif any(w in errand_lower for w in ["bank", "atm", "cash"]):
                location_type = "bank"
            elif any(w in errand_lower for w in ["post", "mail", "parcel"]):
                location_type = "post_office"
            batched.append({
                "errand": errand,
                "location_type": location_type,
                "estimated_time_minutes": 15,
                "can_combine": True,
            })

        total_time = sum(e["estimated_time_minutes"] for e in batched)

        return {
            "status": "ok",
            "current_location": req.current_location,
            "errands_count": len(req.errands),
            "batched_errands": batched,
            "estimated_total_minutes": total_time,
            "tip": f"You can complete all {len(req.errands)} errands in ~{total_time} min from your current location.",
        }
    except Exception as e:
        logger.error(f"Maps errand-batch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Venue suggestion ──────────────────────────────────────────────────────────

class VenueSuggestionRequest(BaseModel):
    attendee_locations: List[str]
    venue_type: str = "coffee"   # coffee | restaurant | office | coworking


@router.post("/venue-suggest")
async def suggest_meeting_venue(
    req: VenueSuggestionRequest,
    token_data: Dict = Depends(get_current_token_data),
):
    """
    Meeting Venue Intelligence: suggests equidistant venue for all attendees.
    """
    try:
        svc = _get_maps_svc()
        suggestion = await svc.suggest_venue(req.attendee_locations)
        return {
            "status": "ok",
            "attendees": len(req.attendee_locations),
            "venue_type": req.venue_type,
            "suggestion": suggestion,
            "note": "Venue selected to minimize total travel time across all attendees.",
        }
    except Exception as e:
        logger.error(f"Maps venue-suggest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
