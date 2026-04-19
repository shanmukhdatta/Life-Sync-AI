"""
LifeSync AI — Google Tasks, Sheets, and Maps Service Modules
Tasks: task creation from emails/voice, priority scoring, deadline tracking.
Sheets: weekly life score, financial tracking, expense categorization.
Maps: real-time traffic buffers, errand batching, location-triggered reminders.
"""
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════
# GOOGLE TASKS SERVICE
# ════════════════════════════════════════════════════════════════

class TasksService:
    def __init__(self, credentials: Credentials):
        self.service = build("tasks", "v1", credentials=credentials)
        self.tasklist_id = "@default"

    def list_tasks(self, show_completed: bool = False, max_results: int = 20) -> List[Dict]:
        try:
            result = self.service.tasks().list(
                tasklist=self.tasklist_id,
                showCompleted=show_completed,
                maxResults=max_results,
            ).execute()
            return [self._parse_task(t) for t in result.get("items", [])]
        except Exception as e:
            logger.error(f"TasksService.list_tasks error: {e}")
            return []

    def _parse_task(self, task: Dict) -> Dict[str, Any]:
        return {
            "id": task.get("id"),
            "title": task.get("title", ""),
            "due": task.get("due"),
            "status": task.get("status"),
            "notes": task.get("notes", ""),
        }

    def create_task(self, title: str, due_date: Optional[str] = None, notes: str = "") -> Dict:
        try:
            task_body: Dict[str, Any] = {"title": title, "notes": notes, "status": "needsAction"}
            if due_date:
                task_body["due"] = due_date
            created = self.service.tasks().insert(tasklist=self.tasklist_id, body=task_body).execute()
            return {"task_id": created["id"], "status": "created"}
        except Exception as e:
            logger.error(f"TasksService.create_task error: {e}")
            return {"error": str(e)}

    def complete_task(self, task_id: str) -> Dict:
        try:
            self.service.tasks().patch(
                tasklist=self.tasklist_id,
                task=task_id,
                body={"status": "completed"},
            ).execute()
            return {"status": "completed"}
        except Exception as e:
            return {"error": str(e)}


class MockTasksService:
    MOCK_TASKS = [
        {"id": "task_001", "title": "Submit assignment 3", "due": "2025-06-06T23:59:00Z", "status": "needsAction", "notes": ""},
        {"id": "task_002", "title": "Follow up with client", "due": "2025-06-04T17:00:00Z", "status": "needsAction", "notes": "Re: proposal"},
    ]

    def list_tasks(self, show_completed=False, max_results=20) -> List[Dict]:
        return self.MOCK_TASKS

    def create_task(self, title, due_date=None, notes="") -> Dict:
        return {"task_id": "mock_task_new", "status": "created"}

    def complete_task(self, task_id) -> Dict:
        return {"status": "completed"}


# ════════════════════════════════════════════════════════════════
# GOOGLE SHEETS SERVICE
# ════════════════════════════════════════════════════════════════

class SheetsService:
    def __init__(self, credentials: Credentials):
        self.service = build("sheets", "v4", credentials=credentials)

    def log_expense(self, spreadsheet_id: str, amount: float, category: str, description: str) -> Dict:
        """Log expense to Google Sheets (Financial Pulse Tracker)."""
        try:
            now = datetime.now(timezone.utc).isoformat()
            values = [[now, amount, category, description]]
            result = self.service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range="Expenses!A:D",
                valueInputOption="USER_ENTERED",
                body={"values": values},
            ).execute()
            return {"rows_added": result.get("updates", {}).get("updatedRows", 0), "status": "logged"}
        except Exception as e:
            logger.error(f"SheetsService.log_expense error: {e}")
            return {"error": str(e)}

    def write_weekly_score(self, spreadsheet_id: str, score_data: Dict) -> Dict:
        """Write weekly life score report to Google Sheets."""
        try:
            now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            row = [
                now,
                score_data.get("productivity_score", 0),
                score_data.get("health_score", 0),
                score_data.get("habit_adherence", 0),
                score_data.get("goal_progress", 0),
                score_data.get("headline", ""),
            ]
            self.service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range="WeeklyScores!A:F",
                valueInputOption="USER_ENTERED",
                body={"values": [row]},
            ).execute()
            return {"status": "written"}
        except Exception as e:
            logger.error(f"SheetsService.write_weekly_score error: {e}")
            return {"error": str(e)}

    def get_expense_summary(self, spreadsheet_id: str) -> Dict:
        """Get expense summary for monthly insight report."""
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range="Expenses!A:D",
            ).execute()
            rows = result.get("values", [])
            total = sum(float(r[1]) for r in rows[1:] if len(r) > 1 and r[1])
            return {"total_expenses": total, "row_count": len(rows) - 1, "status": "ok"}
        except Exception as e:
            return {"error": str(e)}


class MockSheetsService:
    def log_expense(self, spreadsheet_id, amount, category, description) -> Dict:
        return {"rows_added": 1, "status": "logged"}

    def write_weekly_score(self, spreadsheet_id, score_data) -> Dict:
        return {"status": "written"}

    def get_expense_summary(self, spreadsheet_id) -> Dict:
        return {"total_expenses": 234.50, "row_count": 12, "status": "ok"}


# ════════════════════════════════════════════════════════════════
# GOOGLE MAPS SERVICE (via HTTP — Maps API uses REST)
# ════════════════════════════════════════════════════════════════

import httpx


class MapsService:
    BASE_URL = "https://maps.googleapis.com/maps/api"

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def get_travel_time(self, origin: str, destination: str, mode: str = "driving") -> Dict:
        """Get real-time travel time for smart departure reminders."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.BASE_URL}/distancematrix/json",
                    params={
                        "origins": origin,
                        "destinations": destination,
                        "mode": mode,
                        "departure_time": "now",
                        "key": self.api_key,
                    },
                    timeout=10.0,
                )
                data = resp.json()
                element = data.get("rows", [{}])[0].get("elements", [{}])[0]
                return {
                    "duration_minutes": element.get("duration_in_traffic", element.get("duration", {})).get("value", 0) // 60,
                    "distance_km": element.get("distance", {}).get("value", 0) / 1000,
                    "status": element.get("status", "UNKNOWN"),
                }
        except Exception as e:
            logger.error(f"MapsService.get_travel_time error: {e}")
            return {"duration_minutes": 30, "distance_km": 0, "status": "ERROR"}

    async def suggest_venue(self, attendee_locations: List[str]) -> Dict:
        """Suggest equidistant meeting venue for all attendees."""
        return {
            "suggestion": "Consider a central location accessible to all attendees.",
            "note": "Full venue suggestion requires Geocoding API integration.",
        }


class MockMapsService:
    async def get_travel_time(self, origin, destination, mode="driving") -> Dict:
        return {"duration_minutes": 25, "distance_km": 12.5, "status": "OK"}

    async def suggest_venue(self, attendee_locations) -> Dict:
        return {"suggestion": "Central Coffee Hub, 123 Main St", "note": "Equidistant for all attendees"}


# ════════════════════════════════════════════════════════════════
# GOOGLE FORMS SERVICE
# ════════════════════════════════════════════════════════════════

class FormsService:
    def __init__(self, credentials):
        self.service = build("forms", "v1", credentials=credentials)
    
    def get_form(self, form_id: str) -> Dict:
        return self.service.forms().get(formId=form_id).execute()
    
    def create_expense_form(self) -> Dict:
        try:
            form_body = {
                "info": {"title": "LifeSync AI — Quick Expense Log"},
            }
            result = self.service.forms().create(body=form_body).execute()
            return {"form_id": result["formId"], "url": result["responderUri"]}
        except Exception as e:
            logger.error(f"FormsService.create_expense_form error: {e}")
            return {"error": str(e)}

    def get_habit_checkin(self) -> Dict:
        return {"form_id": "habit_123", "url": "https://docs.google.com/forms/d/e/mock_habit/viewform"}


class MockFormsService:
    def get_form(self, form_id: str) -> Dict:
        return {"formId": form_id, "info": {"title": "Mock Form"}}

    def create_expense_form(self) -> Dict:
        return {"form_id": "mock_form_123", "url": "https://docs.google.com/forms/d/e/mock/viewform"}

    def get_habit_checkin(self) -> Dict:
        return {"form_id": "habit_123", "url": "https://docs.google.com/forms/d/e/mock_habit/viewform"}
