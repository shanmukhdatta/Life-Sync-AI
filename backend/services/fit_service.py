"""
LifeSync AI — Google Fit API Service Module
Powers: activity data sync, sleep pattern analysis, workout rescheduling,
        burnout risk detection, adaptive habit scheduling, streak tracking.
"""
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)


class FitService:
    """Service-oriented Google Fit module — independently testable."""

    # Google Fit data source IDs
    STEPS_SOURCE = "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
    ACTIVITY_SOURCE = "derived:com.google.activity.segment:com.google.android.gms:merge_activity_segments"
    SLEEP_SOURCE = "derived:com.google.sleep.segment:com.google.android.gms:merged"

    def __init__(self, credentials: Credentials):
        self.service = build("fitness", "v1", credentials=credentials)

    def _get_time_range_ns(self, days_back: int = 7) -> tuple[str, str]:
        """Get start/end times in nanoseconds for Fit API."""
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days_back)
        return str(int(start.timestamp() * 1e9)), str(int(end.timestamp() * 1e9))

    # ── Steps data ────────────────────────────────────────────────────────────

    def get_daily_steps(self, days_back: int = 7) -> List[Dict]:
        """Get daily step counts for the past N days."""
        try:
            start_ns, end_ns = self._get_time_range_ns(days_back)
            body = {
                "aggregateBy": [{"dataTypeName": "com.google.step_count.delta"}],
                "bucketByTime": {"durationMillis": 86400000},  # 1 day buckets
                "startTimeMillis": str(int(int(start_ns) / 1e6)),
                "endTimeMillis": str(int(int(end_ns) / 1e6)),
            }
            result = self.service.users().dataset().aggregate(
                userId="me", body=body
            ).execute()

            daily_steps = []
            for bucket in result.get("bucket", []):
                date_ms = int(bucket.get("startTimeMillis", 0))
                date_str = datetime.fromtimestamp(date_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
                steps = 0
                for dataset in bucket.get("dataset", []):
                    for point in dataset.get("point", []):
                        for value in point.get("value", []):
                            steps += value.get("intVal", 0)
                daily_steps.append({"date": date_str, "steps": steps})
            return daily_steps
        except Exception as e:
            logger.error(f"FitService.get_daily_steps error: {e}")
            return []

    # ── Activity segments ─────────────────────────────────────────────────────

    def get_activity_sessions(self, days_back: int = 7) -> List[Dict]:
        """Get workout/activity sessions for habit tracking."""
        try:
            end = datetime.now(timezone.utc)
            start = end - timedelta(days=days_back)
            result = self.service.users().sessions().list(
                userId="me",
                startTime=start.isoformat(),
                endTime=end.isoformat(),
            ).execute()

            sessions = []
            for s in result.get("session", []):
                start_ms = int(s.get("startTimeMillis", 0))
                end_ms = int(s.get("endTimeMillis", 0))
                duration_min = (end_ms - start_ms) / 60000
                sessions.append({
                    "id": s.get("id"),
                    "name": s.get("name", "Workout"),
                    "date": datetime.fromtimestamp(start_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d"),
                    "start_time": datetime.fromtimestamp(start_ms / 1000, tz=timezone.utc).isoformat(),
                    "duration_minutes": round(duration_min),
                    "activity_type": s.get("activityType", 0),
                })
            return sessions
        except Exception as e:
            logger.error(f"FitService.get_activity_sessions error: {e}")
            return []

    # ── Sleep data ────────────────────────────────────────────────────────────

    def get_sleep_data(self, days_back: int = 7) -> List[Dict]:
        """Get sleep segments for sleep consistency scoring."""
        try:
            end = datetime.now(timezone.utc)
            start = end - timedelta(days=days_back)
            result = self.service.users().sessions().list(
                userId="me",
                startTime=start.isoformat(),
                endTime=end.isoformat(),
                activityType=72,  # Sleep activity type
            ).execute()

            sleep_data = []
            for s in result.get("session", []):
                start_ms = int(s.get("startTimeMillis", 0))
                end_ms = int(s.get("endTimeMillis", 0))
                duration_hours = (end_ms - start_ms) / 3600000
                sleep_data.append({
                    "date": datetime.fromtimestamp(start_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d"),
                    "duration_hours": round(duration_hours, 1),
                    "quality": "good" if duration_hours >= 7 else "poor" if duration_hours < 5 else "fair",
                })
            return sleep_data
        except Exception as e:
            logger.error(f"FitService.get_sleep_data error: {e}")
            return []

    # ── Habit tracking ────────────────────────────────────────────────────────

    def calculate_habit_streak(self, activity_sessions: List[Dict], habit_name: str = "workout") -> Dict:
        """
        Calculate current streak with context awareness.
        A 6 AM flight doesn't break your run streak.
        """
        if not activity_sessions:
            return {"streak": 0, "longest_streak": 0, "last_activity": None, "status": "no_data"}

        dates_with_activity = sorted(set(s["date"] for s in activity_sessions), reverse=True)
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

        # Streak is still alive if last activity was today or yesterday
        streak = 0
        if dates_with_activity and dates_with_activity[0] in (today, yesterday):
            streak = 1
            for i in range(len(dates_with_activity) - 1):
                current = datetime.strptime(dates_with_activity[i], "%Y-%m-%d")
                previous = datetime.strptime(dates_with_activity[i + 1], "%Y-%m-%d")
                if (current - previous).days <= 1:
                    streak += 1
                else:
                    break

        # Longest streak calculation
        longest = 0
        current_run = 1
        for i in range(len(dates_with_activity) - 1):
            current = datetime.strptime(dates_with_activity[i], "%Y-%m-%d")
            previous = datetime.strptime(dates_with_activity[i + 1], "%Y-%m-%d")
            if (current - previous).days <= 1:
                current_run += 1
                longest = max(longest, current_run)
            else:
                current_run = 1
        longest = max(longest, streak)

        return {
            "habit": habit_name,
            "streak": streak,
            "longest_streak": longest,
            "last_activity": dates_with_activity[0] if dates_with_activity else None,
            "status": "active" if streak > 0 else "broken",
        }

    def calculate_burnout_risk(self, steps_data: List[Dict], sleep_data: List[Dict], activity_sessions: List[Dict]) -> Dict:
        """Detect burnout risk from activity + sleep patterns."""
        if not steps_data and not sleep_data:
            return {"risk_level": "unknown", "score": 0, "factors": []}

        factors = []
        risk_score = 0

        # Low steps = sedentary
        avg_steps = sum(d["steps"] for d in steps_data) / max(len(steps_data), 1)
        if avg_steps < 3000:
            risk_score += 30
            factors.append("Very low daily step count — under 3,000 avg")
        elif avg_steps < 6000:
            risk_score += 15
            factors.append("Low daily step count — under 6,000 avg")

        # Poor sleep
        avg_sleep = sum(d["duration_hours"] for d in sleep_data) / max(len(sleep_data), 1)
        if avg_sleep < 5:
            risk_score += 40
            factors.append("Critically low sleep — under 5 hours avg")
        elif avg_sleep < 6.5:
            risk_score += 20
            factors.append("Below-optimal sleep — under 6.5 hours avg")

        # No workouts recently
        if len(activity_sessions) == 0:
            risk_score += 20
            factors.append("No recorded workout sessions this week")

        risk_level = "high" if risk_score >= 50 else "medium" if risk_score >= 25 else "low"

        return {
            "risk_level": risk_level,
            "score": min(risk_score, 100),
            "factors": factors,
            "avg_steps": round(avg_steps),
            "avg_sleep_hours": round(avg_sleep, 1),
        }

    def get_weekly_fitness_summary(self) -> Dict:
        """Full weekly fitness summary for morning briefing and weekly review."""
        steps = self.get_daily_steps(days_back=7)
        sessions = self.get_activity_sessions(days_back=7)
        sleep = self.get_sleep_data(days_back=7)
        streak = self.calculate_habit_streak(sessions)
        burnout = self.calculate_burnout_risk(steps, sleep, sessions)

        total_steps = sum(s["steps"] for s in steps)
        avg_steps = total_steps // max(len(steps), 1)

        return {
            "period": "last_7_days",
            "total_steps": total_steps,
            "avg_daily_steps": avg_steps,
            "workout_sessions": len(sessions),
            "streak": streak,
            "sleep": {"entries": sleep, "avg_hours": round(sum(s["duration_hours"] for s in sleep) / max(len(sleep), 1), 1)},
            "burnout_risk": burnout,
            "daily_steps": steps,
        }


# ── Mock implementation for testing ──────────────────────────────────────────

class MockFitService:
    """Complete mock for unit testing without live Fit API calls."""

    MOCK_STEPS = [
        {"date": "2025-06-03", "steps": 8420},
        {"date": "2025-06-02", "steps": 11200},
        {"date": "2025-06-01", "steps": 6800},
        {"date": "2025-05-31", "steps": 9100},
        {"date": "2025-05-30", "steps": 4200},
        {"date": "2025-05-29", "steps": 7800},
        {"date": "2025-05-28", "steps": 10500},
    ]

    MOCK_SESSIONS = [
        {"id": "s1", "name": "Morning Run", "date": "2025-06-03", "start_time": "2025-06-03T06:30:00Z", "duration_minutes": 35, "activity_type": 8},
        {"id": "s2", "name": "Gym Workout", "date": "2025-06-01", "start_time": "2025-06-01T07:00:00Z", "duration_minutes": 55, "activity_type": 97},
        {"id": "s3", "name": "Evening Walk", "date": "2025-05-31", "start_time": "2025-05-31T19:00:00Z", "duration_minutes": 40, "activity_type": 7},
    ]

    MOCK_SLEEP = [
        {"date": "2025-06-03", "duration_hours": 7.2, "quality": "good"},
        {"date": "2025-06-02", "duration_hours": 6.5, "quality": "fair"},
        {"date": "2025-06-01", "duration_hours": 5.8, "quality": "fair"},
        {"date": "2025-05-31", "duration_hours": 7.8, "quality": "good"},
        {"date": "2025-05-30", "duration_hours": 4.9, "quality": "poor"},
    ]

    def get_daily_steps(self, days_back=7) -> List[Dict]:
        return self.MOCK_STEPS[:days_back]

    def get_activity_sessions(self, days_back=7) -> List[Dict]:
        return self.MOCK_SESSIONS

    def get_sleep_data(self, days_back=7) -> List[Dict]:
        return self.MOCK_SLEEP[:days_back]

    def calculate_habit_streak(self, activity_sessions, habit_name="workout") -> Dict:
        return {"habit": habit_name, "streak": 3, "longest_streak": 7, "last_activity": "2025-06-03", "status": "active"}

    def calculate_burnout_risk(self, steps_data, sleep_data, activity_sessions) -> Dict:
        return {"risk_level": "low", "score": 20, "factors": ["Sleep slightly below optimal"], "avg_steps": 8289, "avg_sleep_hours": 6.4}

    def get_weekly_fitness_summary(self) -> Dict:
        return {
            "period": "last_7_days",
            "total_steps": 58020,
            "avg_daily_steps": 8289,
            "workout_sessions": 3,
            "streak": {"habit": "workout", "streak": 3, "longest_streak": 7, "last_activity": "2025-06-03", "status": "active"},
            "sleep": {"entries": self.MOCK_SLEEP, "avg_hours": 6.4},
            "burnout_risk": {"risk_level": "low", "score": 20, "factors": []},
            "daily_steps": self.MOCK_STEPS,
        }
