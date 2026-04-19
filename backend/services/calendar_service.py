"""
LifeSync AI — Google Calendar API Service Module
Powers: conflict detection, smart meeting prep, focus time blocking,
        deadline backplanning, energy-based scheduling.
"""
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)


class CalendarService:
    """Service-oriented Calendar module — independently testable."""

    def __init__(self, credentials: Credentials):
        self.service = build("calendar", "v3", credentials=credentials)
        self.calendar_id = "primary"

    # ── Event fetching ────────────────────────────────────────────────────────

    def get_upcoming_events(self, days_ahead: int = 7, max_results: int = 30) -> List[Dict]:
        """Fetch upcoming events for conflict detection and planning."""
        try:
            now = datetime.now(timezone.utc).isoformat()
            end = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).isoformat()

            result = self.service.events().list(
                calendarId=self.calendar_id,
                timeMin=now,
                timeMax=end,
                maxResults=max_results,
                singleEvents=True,
                orderBy="startTime",
            ).execute()

            return [self._parse_event(e) for e in result.get("items", [])]
        except Exception as e:
            logger.error(f"CalendarService.get_upcoming_events error: {e}")
            return []

    def _parse_event(self, event: Dict) -> Dict[str, Any]:
        """Parse a Google Calendar event into a clean dict."""
        start = event.get("start", {})
        end = event.get("end", {})
        return {
            "id": event.get("id"),
            "title": event.get("summary", "Untitled Event"),
            "start": start.get("dateTime") or start.get("date"),
            "end": end.get("dateTime") or end.get("date"),
            "location": event.get("location"),
            "description": event.get("description", ""),
            "attendees": [a.get("email") for a in event.get("attendees", [])],
            "status": event.get("status"),
            "is_all_day": "date" in start and "dateTime" not in start,
        }

    # ── Conflict detection ────────────────────────────────────────────────────

    def detect_conflicts(self, events: List[Dict]) -> List[Dict]:
        """Detect overlapping events and return conflict pairs."""
        conflicts = []
        for i, ev1 in enumerate(events):
            for ev2 in events[i + 1:]:
                if self._events_overlap(ev1, ev2):
                    conflicts.append({
                        "event_1": ev1["title"],
                        "event_2": ev2["title"],
                        "overlap_start": ev1["start"],
                        "suggestion": f"Consider rescheduling '{ev2['title']}' to avoid overlap with '{ev1['title']}'",
                    })
        return conflicts

    def _events_overlap(self, ev1: Dict, ev2: Dict) -> bool:
        """Check if two events have overlapping times."""
        try:
            def parse_dt(s):
                if not s:
                    return None
                for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
                    try:
                        return datetime.strptime(s[:19], fmt[:len(s[:19])])
                    except ValueError:
                        continue
                return None

            s1, e1 = parse_dt(ev1.get("start")), parse_dt(ev1.get("end"))
            s2, e2 = parse_dt(ev2.get("start")), parse_dt(ev2.get("end"))
            if not all([s1, e1, s2, e2]):
                return False
            return s1 < e2 and s2 < e1
        except Exception:
            return False

    # ── Event creation ────────────────────────────────────────────────────────

    def create_event(
        self,
        title: str,
        start_dt: str,
        end_dt: str,
        description: str = "",
        location: str = "",
        attendees: Optional[List[str]] = None,
    ) -> Dict:
        """Create a new calendar event."""
        try:
            event_body = {
                "summary": title,
                "description": description,
                "location": location,
                "start": {"dateTime": start_dt, "timeZone": "UTC"},
                "end": {"dateTime": end_dt, "timeZone": "UTC"},
            }
            if attendees:
                event_body["attendees"] = [{"email": a} for a in attendees]

            created = self.service.events().insert(
                calendarId=self.calendar_id,
                body=event_body,
            ).execute()
            return {"event_id": created["id"], "html_link": created.get("htmlLink"), "status": "created"}
        except Exception as e:
            logger.error(f"CalendarService.create_event error: {e}")
            return {"error": str(e)}

    # ── Focus time blocking ───────────────────────────────────────────────────

    def block_focus_time(self, date_str: str, duration_hours: int = 2, title: str = "🎯 Deep Work — LifeSync") -> Dict:
        """Block focus time during peak productivity hours (9–11 AM default)."""
        start_iso = f"{date_str}T09:00:00Z"
        end_iso = f"{date_str}T{9 + duration_hours:02d}:00:00Z"
        return self.create_event(
            title=title,
            start_dt=start_iso,
            end_dt=end_iso,
            description="Focus time blocked by LifeSync AI based on your productivity patterns.",
        )

    # ── Deadline backplanning ─────────────────────────────────────────────────

    def backplan_deadline(self, deadline_str: str, task_title: str, prep_hours: int = 2) -> List[Dict]:
        """Create prep time blocks working backwards from a deadline."""
        try:
            deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
            blocks = []
            for i in range(1, 4):  # 3 prep sessions
                block_end = deadline - timedelta(days=i)
                block_start = block_end - timedelta(hours=prep_hours)
                result = self.create_event(
                    title=f"📋 Prep: {task_title} (Session {4 - i})",
                    start_dt=block_start.isoformat(),
                    end_dt=block_end.isoformat(),
                    description=f"Preparation session {4 - i} of 3 for deadline: {task_title}",
                )
                blocks.append(result)
            return blocks
        except Exception as e:
            logger.error(f"CalendarService.backplan_deadline error: {e}")
            return []

    # ── Today's summary ───────────────────────────────────────────────────────

    def get_today_summary(self) -> Dict:
        """Get today's schedule summary for morning briefing."""
        events = self.get_upcoming_events(days_ahead=1, max_results=10)
        now = datetime.now(timezone.utc)
        first_meeting = next(
            (e for e in events if e.get("start") and not e.get("is_all_day")),
            None
        )
        return {
            "total_events": len(events),
            "events": events,
            "first_meeting": first_meeting,
            "conflicts": self.detect_conflicts(events),
        }


# ── Mock implementation for testing ──────────────────────────────────────────

class MockCalendarService:
    """Complete mock for unit testing without live API calls."""

    MOCK_EVENTS = [
        {
            "id": "mock_cal_001",
            "title": "Team Standup",
            "start": "2025-06-03T09:00:00Z",
            "end": "2025-06-03T09:30:00Z",
            "location": "Google Meet",
            "description": "Daily standup with engineering team",
            "attendees": ["alice@company.com", "bob@company.com"],
            "status": "confirmed",
            "is_all_day": False,
        },
        {
            "id": "mock_cal_002",
            "title": "Investor Pitch Prep",
            "start": "2025-06-03T14:00:00Z",
            "end": "2025-06-03T15:30:00Z",
            "location": None,
            "description": "Prepare for Thursday investor meeting",
            "attendees": [],
            "status": "confirmed",
            "is_all_day": False,
        },
    ]

    def get_upcoming_events(self, days_ahead=7, max_results=30) -> List[Dict]:
        return self.MOCK_EVENTS

    def detect_conflicts(self, events) -> List[Dict]:
        return []

    def create_event(self, title, start_dt, end_dt, **kwargs) -> Dict:
        return {"event_id": "mock_event_001", "html_link": "https://calendar.google.com/mock", "status": "created"}

    def block_focus_time(self, date_str, duration_hours=2, title="Deep Work") -> Dict:
        return {"event_id": "mock_focus_001", "status": "created"}

    def backplan_deadline(self, deadline_str, task_title, prep_hours=2) -> List[Dict]:
        return [{"event_id": f"mock_prep_00{i}", "status": "created"} for i in range(1, 4)]

    def get_today_summary(self) -> Dict:
        return {
            "total_events": len(self.MOCK_EVENTS),
            "events": self.MOCK_EVENTS,
            "first_meeting": self.MOCK_EVENTS[0],
            "conflicts": [],
        }
