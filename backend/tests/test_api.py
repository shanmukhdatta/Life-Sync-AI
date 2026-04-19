"""
LifeSync AI — Unit Tests
All tests use mock service implementations — zero live API calls required.
"""
import pytest
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from services.gmail_service import MockGmailService
from services.calendar_service import MockCalendarService
from services.gemini_service import MockGeminiService
from services.extended_services import MockTasksService, MockSheetsService

client = TestClient(app)


# ── Health check ──────────────────────────────────────────────────────────────

def test_health_check():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "mock_mode" in data


def test_root():
    resp = client.get("/")
    assert resp.status_code == 200
    assert "LifeSync AI" in resp.json()["message"]


# ── Dashboard ─────────────────────────────────────────────────────────────────

def test_morning_briefing():
    resp = client.get("/api/dashboard/briefing")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "briefing" in data
    assert "calendar" in data
    assert "inbox" in data


def test_priority_scores():
    resp = client.get("/api/dashboard/priority-score")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "scored_items" in data


# ── Email Intelligence ────────────────────────────────────────────────────────

def test_get_classified_inbox():
    resp = client.get("/api/email/inbox")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "classified" in data
    assert "act_now" in data["classified"]


def test_extract_action_items():
    resp = client.post("/api/email/extract-actions", json={
        "email_id": "test_001",
        "email_body": "Please submit the report by Friday. It's urgent.",
        "email_from": "boss@company.com",
        "email_subject": "Report due Friday — URGENT",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert isinstance(data["action_items"], list)


def test_draft_smart_reply():
    resp = client.post("/api/email/draft-reply", json={
        "email_id": "test_001",
        "email_body": "Can you send me the quarterly report?",
        "email_from": "client@company.com",
        "email_subject": "Quarterly Report Request",
        "tone": "professional",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert isinstance(data["draft"], str)
    assert len(data["draft"]) > 10


# ── Calendar ──────────────────────────────────────────────────────────────────

def test_get_events():
    resp = client.get("/api/calendar/events?days=7")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert isinstance(data["events"], list)
    assert "conflicts" in data


def test_create_event():
    resp = client.post("/api/calendar/events", json={
        "title": "Test Meeting",
        "start_dt": "2025-06-10T09:00:00Z",
        "end_dt": "2025-06-10T10:00:00Z",
        "description": "Test event creation",
        "attendees": [],
        "location": "",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "event_id" in data


def test_block_focus_time():
    resp = client.post("/api/calendar/focus-block", json={
        "date": "2025-06-10",
        "duration_hours": 2,
        "title": "Deep Work",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "event_id" in data


def test_backplan_deadline():
    resp = client.post("/api/calendar/backplan", json={
        "deadline": "2025-06-15T23:59:00Z",
        "task_title": "Submit final report",
        "prep_hours": 2,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["blocks_created"] > 0


# ── AI Command Engine ─────────────────────────────────────────────────────────

def test_natural_language_command():
    resp = client.post("/api/ai/command", json={
        "command": "prepare for investor meeting Thursday",
        "include_context": True,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "result" in data
    assert "intent" in data["result"]


def test_decision_support():
    resp = client.post("/api/ai/decision-support", json={
        "decision": "Should I take on a new client project next month?",
        "goals": ["Grow revenue", "Maintain work-life balance"],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "analysis" in data


# ── Tasks ─────────────────────────────────────────────────────────────────────

def test_list_tasks():
    resp = client.get("/api/tasks/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert isinstance(data["tasks"], list)


def test_create_task():
    resp = client.post("/api/tasks/", json={
        "title": "Review Q2 report",
        "due_date": "2025-06-10T17:00:00Z",
        "notes": "Focus on financial section",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "task_id" in data


def test_complete_task():
    resp = client.patch("/api/tasks/task_001/complete")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") in ("ok", "completed")


# ── Mock service unit tests ───────────────────────────────────────────────────

class TestMockGmailService:
    def test_list_messages(self):
        svc = MockGmailService()
        emails = svc.list_messages()
        assert isinstance(emails, list)
        assert len(emails) > 0
        assert "subject" in emails[0]

    def test_classify_inbox(self):
        svc = MockGmailService()
        emails = svc.list_messages()
        classified = svc.classify_inbox(emails)
        assert "act_now" in classified
        assert "fyi_only" in classified

    def test_create_draft(self):
        svc = MockGmailService()
        result = svc.create_draft("test@example.com", "Test", "Body")
        assert result["status"] == "created"


class TestMockCalendarService:
    def test_get_events(self):
        svc = MockCalendarService()
        events = svc.get_upcoming_events()
        assert isinstance(events, list)
        assert len(events) > 0

    def test_detect_conflicts(self):
        svc = MockCalendarService()
        events = svc.get_upcoming_events()
        conflicts = svc.detect_conflicts(events)
        assert isinstance(conflicts, list)

    def test_today_summary(self):
        svc = MockCalendarService()
        summary = svc.get_today_summary()
        assert "events" in summary
        assert "conflicts" in summary


class TestMockGeminiService:
    def test_morning_briefing(self):
        svc = MockGeminiService()
        result = svc.generate_morning_briefing([], [], "Datta")
        assert "greeting" in result
        assert "top_priorities" in result
        assert len(result["top_priorities"]) > 0

    def test_action_items(self):
        svc = MockGeminiService()
        items = svc.extract_action_items("Submit by Friday", "prof@uni.edu", "Assignment Due")
        assert isinstance(items, list)

    def test_parse_command(self):
        svc = MockGeminiService()
        result = svc.parse_natural_language_command("prepare for meeting", {})
        assert "intent" in result
        assert "tasks" in result


# ── Drive Intelligence ────────────────────────────────────────────────────────

def test_drive_search():
    resp = client.get("/api/drive/search?query=investor+deck")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert isinstance(data["results"], list)
    assert data["query"] == "investor deck"

def test_drive_meeting_docs():
    resp = client.post("/api/drive/meeting-docs", json={
        "meeting_title": "Q2 Investor Pitch",
        "attendees": ["investor@fund.com", "ceo@company.com"],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "surfaced_docs" in data

def test_drive_recent():
    resp = client.get("/api/drive/recent?max_results=5")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert isinstance(data["files"], list)

def test_drive_summarize():
    resp = client.get("/api/drive/summarize/mock_file_001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "summary" in data
    assert "bullets" in data["summary"]


# ── Financial Pulse Tracker ───────────────────────────────────────────────────

def test_log_expense():
    resp = client.post("/api/finance/expense", json={
        "amount": 12.50,
        "description": "Coffee and lunch at café",
        "spreadsheet_id": "mock_sheet_id",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["logged"]["amount"] == 12.50
    assert data["logged"]["auto_categorized"] is True
    assert data["logged"]["category"] == "Food & Dining"

def test_log_expense_with_category():
    resp = client.post("/api/finance/expense", json={
        "amount": 49.99,
        "description": "Netflix subscription",
        "category": "Subscriptions",
        "spreadsheet_id": "mock_sheet_id",
    })
    assert resp.status_code == 200
    assert resp.json()["logged"]["category"] == "Subscriptions"

def test_finance_summary():
    resp = client.get("/api/finance/summary?spreadsheet_id=mock_sheet_id")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "summary" in data
    assert "day_of_month" in data

def test_detect_bills():
    resp = client.get("/api/finance/bills")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "bills_found" in data
    assert isinstance(data["bills"], list)

def test_monthly_insights():
    resp = client.get("/api/finance/monthly-insights?spreadsheet_id=mock_sheet_id")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "top_categories" in data
    assert "saving_suggestions" in data


# ── Location-Aware Context Engine ─────────────────────────────────────────────

def test_travel_time():
    resp = client.post("/api/maps/travel-time", json={
        "origin": "Connaught Place, New Delhi",
        "destination": "Indira Gandhi International Airport, Delhi",
        "mode": "driving",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "travel" in data
    assert "smart_buffer" in data
    assert data["smart_buffer"]["depart_in_minutes"] > 0

def test_departure_reminder():
    resp = client.post("/api/maps/departure-reminder", json={
        "meeting_title": "Client Meeting",
        "meeting_time": "2025-06-10T15:00:00Z",
        "origin": "My Office, Connaught Place",
        "destination": "Client HQ, Bandra, Mumbai",
        "mode": "driving",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "travel_minutes" in data
    assert "reminder_at" in data

def test_errand_batch():
    resp = client.post("/api/maps/errand-batch", json={
        "current_location": "Lajpat Nagar, New Delhi",
        "errands": ["Pick up prescription from pharmacy", "Buy groceries", "Drop off parcel at post office"],
        "radius_km": 2.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["errands_count"] == 3
    assert len(data["batched_errands"]) == 3

def test_venue_suggest():
    resp = client.post("/api/maps/venue-suggest", json={
        "attendee_locations": ["Sector 18, Noida", "Lajpat Nagar, Delhi", "Gurgaon Sector 29"],
        "venue_type": "coffee",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "suggestion" in data


# ── Life Goals & Habit Tracker ────────────────────────────────────────────────

def test_fitness_summary():
    resp = client.get("/api/fit/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "summary" in data
    s = data["summary"]
    assert "total_steps" in s
    assert "workout_sessions" in s
    assert "streak" in s
    assert "burnout_risk" in s

def test_daily_steps():
    resp = client.get("/api/fit/steps?days=7")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert isinstance(data["steps"], list)
    assert "average" in data
    assert "goal_10k" in data

def test_sleep_data():
    resp = client.get("/api/fit/sleep?days=7")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "avg_hours" in data
    assert "consistency_score" in data

def test_habit_streak():
    resp = client.get("/api/fit/streak?habit=workout")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "streak" in data
    s = data["streak"]
    assert "streak" in s
    assert "longest_streak" in s
    assert s["habit"] == "workout"

def test_burnout_risk():
    resp = client.get("/api/fit/burnout-risk")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "burnout_risk" in data
    assert data["burnout_risk"]["risk_level"] in ("low", "medium", "high", "unknown")

def test_reschedule_habit():
    resp = client.post("/api/fit/reschedule-habit", json={
        "habit_name": "Morning Run",
        "preferred_duration_minutes": 45,
        "date": "2025-06-10",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "rescheduled" in data

def test_life_score():
    resp = client.get("/api/fit/life-score")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "scores" in data
    assert "health_adherence" in data["scores"]
    assert "badge" in data


# ── Smart Communication Composer ─────────────────────────────────────────────

def test_create_meeting_notes():
    resp = client.post("/api/docs/meeting-notes", json={
        "meeting_title": "Q3 Strategy Session",
        "attendees": ["alice@company.com", "bob@company.com"],
        "brain_dump": "Discussed Q3 roadmap. Agreed to focus on product-led growth. Alice to own marketing budget.",
        "action_items": ["Alice: Submit marketing budget by Friday", "Bob: Schedule customer interviews"],
        "date": "2025-06-03",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "document" in data
    assert data["document"]["type"] == "meeting_notes"

def test_create_weekly_plan():
    resp = client.post("/api/docs/weekly-plan", json={
        "week_start": "2025-06-09",
        "top_priorities": ["Launch v1.2 feature", "Close 2 sales deals", "Hire backend engineer"],
        "must_dos": ["Daily standup", "Code review"],
        "focus_areas": ["Product development", "Revenue growth"],
        "goal_progress": [{"goal": "Revenue $50k MRR", "progress": 62, "note": "On track"}],
        "review_summary": "Strong week — shipped 3 features and closed 1 deal.",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["document"]["type"] == "weekly_plan"

def test_create_communication_draft():
    resp = client.post("/api/docs/draft", json={
        "doc_type": "proposal",
        "recipient": "enterprise@bigcorp.com",
        "subject": "LifeSync AI Enterprise Partnership Proposal",
        "context": "We want to propose a partnership for integrating LifeSync AI into their employee productivity suite.",
        "tone": "formal",
        "save_to_docs": True,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "draft" in data
    assert data["draft"]["doc_type"] == "proposal"

def test_invalid_doc_type():
    resp = client.post("/api/docs/draft", json={
        "doc_type": "invalid_type",
        "recipient": "test@example.com",
        "subject": "Test",
        "context": "Test context",
    })
    assert resp.status_code == 400

def test_follow_up_sequence():
    resp = client.post("/api/docs/follow-up-sequence", json={
        "original_email_subject": "Partnership Proposal — LifeSync AI",
        "recipient_email": "enterprise@bigcorp.com",
        "original_date": "2025-06-01",
        "follow_up_days": [3, 7, 14],
        "context": "Sent partnership proposal, awaiting response.",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["sequence_count"] == 3
    assert len(data["sequence"]) == 3

def test_list_recent_docs():
    resp = client.get("/api/docs/recent?max_results=5")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert isinstance(data["docs"], list)


# ── Weekly Life Review ────────────────────────────────────────────────────────

def test_weekly_review():
    resp = client.post("/api/review/weekly", json={
        "completed_tasks": ["Launched feature X", "Closed client Y", "Wrote blog post"],
        "missed_tasks": ["Gym on Wednesday", "Call with mentor"],
        "goals": [
            {"goal": "Run 5x per week", "progress": 60, "note": "3 runs this week"},
            {"goal": "Read 2 books per month", "progress": 50, "note": "Halfway through book 1"},
        ],
        "save_to_sheets": False,
        "create_plan_doc": False,
        "spreadsheet_id": "mock_sheet_id",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "review" in data
    assert "life_score" in data
    assert "next_week" in data
    assert "fitness_summary" in data
    r = data["review"]
    assert "productivity_score" in r
    assert "health_score" in r

def test_goal_progress():
    resp = client.post("/api/review/goal-progress", json={
        "goals": [
            {"goal": "Achieve 10k steps daily", "progress": 75, "note": "5 of 7 days met"},
            {"goal": "Read 2 books/month", "progress": 30, "note": "Early stages"},
            {"goal": "Revenue $50k MRR", "progress": 62, "note": "On track"},
        ]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert len(data["goals"]) == 3
    assert "overall_progress" in data
    for goal in data["goals"]:
        assert "status" in goal
        assert "badge" in goal

def test_next_week_preview():
    resp = client.get("/api/review/next-week")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "next_7_days" in data
    assert "rebalancing_suggestions" in data
    assert isinstance(data["rebalancing_suggestions"], list)


# ── Mock service unit tests (new services) ────────────────────────────────────

class TestMockFitService:
    def test_weekly_summary(self):
        from services.fit_service import MockFitService
        svc = MockFitService()
        summary = svc.get_weekly_fitness_summary()
        assert "total_steps" in summary
        assert "workout_sessions" in summary
        assert summary["workout_sessions"] > 0

    def test_streak_calculation(self):
        from services.fit_service import MockFitService
        svc = MockFitService()
        sessions = svc.get_activity_sessions()
        streak = svc.calculate_habit_streak(sessions, "workout")
        assert streak["streak"] >= 0
        assert streak["longest_streak"] >= streak["streak"]

    def test_burnout_risk(self):
        from services.fit_service import MockFitService
        svc = MockFitService()
        steps = svc.get_daily_steps()
        sleep = svc.get_sleep_data()
        sessions = svc.get_activity_sessions()
        risk = svc.calculate_burnout_risk(steps, sleep, sessions)
        assert risk["risk_level"] in ("low", "medium", "high", "unknown")


class TestMockDocsService:
    def test_create_meeting_notes(self):
        from services.docs_service import MockDocsService
        svc = MockDocsService()
        result = svc.create_meeting_notes("Test Meeting", ["a@b.com"], "Brain dump", ["Action 1"])
        assert result["type"] == "meeting_notes"
        assert "doc_id" in result
        assert "url" in result

    def test_create_weekly_plan(self):
        from services.docs_service import MockDocsService
        svc = MockDocsService()
        result = svc.create_weekly_plan("2025-06-09", ["P1", "P2", "P3"], [], [], [], "Good week")
        assert result["type"] == "weekly_plan"
        assert "2025-06-09" in result["title"]

    def test_create_comm_draft(self):
        from services.docs_service import MockDocsService
        svc = MockDocsService()
        result = svc.create_communication_draft("proposal", "client@co.com", "Test", "Content", "formal")
        assert result["type"] == "communication_draft"
        assert result["tone"] == "formal"
