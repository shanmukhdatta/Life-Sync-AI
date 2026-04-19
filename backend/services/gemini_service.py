"""
LifeSync AI — Google Gemini AI Service Module
Powers: core LLM reasoning, action item extraction, smart reply drafts,
        decision support, tone detection, natural language task parsing.
"""
from typing import List, Dict, Any, Optional
import json
import logging
import re

from config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Core AI reasoning engine powered by Google Gemini."""

    MODEL_NAME = "gemini-2.0-flash-exp"   # Current fast model
    PRO_MODEL = "gemini-2.0-flash-exp"    # Use same for compatibility

    def __init__(self):
        try:
            # Try new google-genai SDK first
            import google.genai as genai
            self._client = genai.Client(api_key=settings.gemini_api_key)
            self._sdk = "new"
        except ImportError:
            try:
                # Fall back to legacy SDK
                import google.generativeai as genai_legacy
                genai_legacy.configure(api_key=settings.gemini_api_key)
                self._model = genai_legacy.GenerativeModel(self.MODEL_NAME)
                self._sdk = "legacy"
            except ImportError:
                logger.error("No Gemini SDK found. Install google-genai or google-generativeai.")
                raise RuntimeError("No Gemini SDK found. Install google-genai or google-generativeai.")

    def _safe_generate(self, prompt: str, use_pro: bool = False) -> str:
        """Generate with error handling — works with both SDK versions."""
        try:
            if self._sdk == "new":
                import google.genai as genai
                response = self._client.models.generate_content(
                    model=self.MODEL_NAME,
                    contents=prompt,
                )
                return response.text.strip()
            elif self._sdk == "legacy":
                response = self._model.generate_content(prompt)
                return response.text.strip()
            else:
                return ""
        except Exception as e:
            logger.error(f"GeminiService generate error: {e}")
            return ""

    def _parse_json_response(self, text: str) -> Any:
        """Parse JSON from model response, stripping markdown fences."""
        clean = re.sub(r"```(?:json)?\n?", "", text).replace("```", "").strip()
        try:
            return json.loads(clean)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse JSON from Gemini response: {text[:200]}")
            return None

    # ── Morning briefing ──────────────────────────────────────────────────────

    def generate_morning_briefing(
        self,
        emails: List[Dict],
        calendar_events: List[Dict],
        user_name: str = "there",
    ) -> Dict[str, Any]:
        """Generate personalized morning briefing with top 3 priorities."""
        prompt = f"""You are LifeSync AI, a proactive life operations assistant.

Generate a concise morning briefing for {user_name} based on:

CALENDAR EVENTS TODAY: {json.dumps(calendar_events[:5], indent=2)}
UNREAD EMAILS: {json.dumps(emails[:5], indent=2)}

Return ONLY valid JSON:
{{
  "greeting": "Good morning, {user_name}! Here's your day.",
  "top_priorities": [
    {{"rank": 1, "title": "...", "reason": "...", "tag": "Urgent|Health Goal|Needs Reply|Can Delegate"}},
    {{"rank": 2, "title": "...", "reason": "...", "tag": "..."}},
    {{"rank": 3, "title": "...", "reason": "...", "tag": "..."}}
  ],
  "first_meeting": {{"title": "...", "time": "...", "prep_tip": "..."}},
  "urgent_email_summary": "One-sentence summary of most urgent email",
  "context_alert": "Any context-switching alert (e.g., 'Meeting in 15 min but 3 unread emails from same person')"
}}"""

        response = self._safe_generate(prompt)
        parsed = self._parse_json_response(response)
        if parsed:
            return parsed
        return {
            "greeting": f"Good morning, {user_name}!",
            "top_priorities": [],
            "urgent_email_summary": "Check your inbox for urgent items.",
            "context_alert": None,
        }

    # ── Action item extraction ────────────────────────────────────────────────

    def extract_action_items(self, email_body: str, email_from: str, email_subject: str) -> List[Dict]:
        """Extract actionable tasks from email content."""
        prompt = f"""Extract all action items, deadlines, and commitments from this email.

FROM: {email_from}
SUBJECT: {email_subject}
BODY: {email_body[:1500]}

Return ONLY valid JSON array:
[
  {{
    "action": "Clear description of what needs to be done",
    "deadline": "ISO date or null",
    "priority": "high|medium|low",
    "suggested_duration_minutes": 30
  }}
]

If no action items, return empty array: []"""

        response = self._safe_generate(prompt)
        parsed = self._parse_json_response(response)
        return parsed if isinstance(parsed, list) else []

    # ── Smart reply drafting ──────────────────────────────────────────────────

    def draft_smart_reply(
        self,
        email_body: str,
        email_from: str,
        email_subject: str,
        thread_history: List[Dict],
        tone: str = "professional",
    ) -> str:
        """Draft a context-aware reply to an email."""
        history_text = "\n".join([
            f"[{m.get('date', '')}] {m.get('from', '')}: {m.get('snippet', '')}"
            for m in thread_history[-3:]
        ])

        prompt = f"""You are LifeSync AI drafting a smart email reply.

EMAIL TO REPLY TO:
From: {email_from}
Subject: {email_subject}
Body: {email_body[:1000]}

THREAD HISTORY (last 3 messages):
{history_text}

TONE: {tone}

Write a concise, {tone} reply that:
- Addresses all questions/requests
- Is ready to send with one tap (minimal editing needed)
- Does NOT include a subject line
- Does NOT use placeholder text

Write only the email body:"""

        return self._safe_generate(prompt) or "Thank you for reaching out. I'll get back to you shortly."

    # ── Natural language task parsing ─────────────────────────────────────────

    def parse_natural_language_command(self, command: str, context: Dict) -> Dict[str, Any]:
        """
        Parse natural language commands into structured workflows.
        E.g., "prepare for investor meeting Thursday" → task list + time blocks.
        """
        prompt = f"""You are LifeSync AI's conversational task engine.

USER COMMAND: "{command}"

CURRENT CONTEXT:
- Calendar events: {json.dumps(context.get('events', [])[:3], indent=2)}
- Recent emails: {json.dumps(context.get('emails', [])[:3], indent=2)}

Parse this command into a structured workflow. Return ONLY valid JSON:
{{
  "intent": "prepare_meeting|schedule_event|send_email|block_time|chain_workflow|other",
  "understood_as": "Plain English explanation of what you understood",
  "tasks": [
    {{"task": "...", "estimated_minutes": 30, "suggested_time": "2025-06-03T09:00:00Z"}}
  ],
  "calendar_blocks": [
    {{"title": "...", "start": "ISO datetime", "end": "ISO datetime"}}
  ],
  "emails_to_surface": ["email subject patterns to find"],
  "clarification_needed": null
}}

If ambiguous, set clarification_needed to ONE specific question."""

        response = self._safe_generate(prompt, use_pro=True)
        parsed = self._parse_json_response(response)
        return parsed or {
            "intent": "other",
            "understood_as": command,
            "tasks": [],
            "calendar_blocks": [],
            "emails_to_surface": [],
            "clarification_needed": "Could you clarify what you'd like me to do?",
        }

    # ── Tone detection ────────────────────────────────────────────────────────

    def detect_email_tone(self, email_body: str, relationship: str = "unknown") -> str:
        """Detect appropriate reply tone based on email content and relationship."""
        prompt = f"""Analyze this email and determine the best reply tone.

RELATIONSHIP: {relationship}
EMAIL: {email_body[:500]}

Return ONLY one of: formal, friendly, urgent, apologetic, assertive"""

        response = self._safe_generate(prompt)
        valid_tones = {"formal", "friendly", "urgent", "apologetic", "assertive"}
        tone = response.strip().lower()
        return tone if tone in valid_tones else "professional"

    # ── Decision support ──────────────────────────────────────────────────────

    def generate_decision_support(
        self,
        decision: str,
        calendar_load: List[Dict],
        goals: List[str],
    ) -> Dict[str, Any]:
        """Provide pros/cons based on calendar load and stated goals."""
        prompt = f"""You are LifeSync AI providing decision support.

DECISION: {decision}
CALENDAR LOAD (next 7 days): {len(calendar_load)} events
STATED GOALS: {', '.join(goals[:5])}

Return ONLY valid JSON:
{{
  "summary": "One-sentence framing of the decision",
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2", "Con 3"],
  "recommendation": "Your recommendation with brief reasoning",
  "calendar_impact": "How this affects your schedule"
}}"""

        response = self._safe_generate(prompt, use_pro=True)
        parsed = self._parse_json_response(response)
        return parsed or {"summary": decision, "pros": [], "cons": [], "recommendation": "Insufficient context."}

    # ── Weekly life review ────────────────────────────────────────────────────

    def generate_weekly_review(
        self,
        completed_tasks: List[str],
        missed_tasks: List[str],
        habit_data: Dict,
        goal_progress: Dict,
    ) -> Dict[str, Any]:
        """Generate automated weekly life review."""
        prompt = f"""Generate a weekly life review for LifeSync AI user.

COMPLETED: {completed_tasks[:10]}
MISSED: {missed_tasks[:10]}
HABIT ADHERENCE: {json.dumps(habit_data, indent=2)}
GOAL PROGRESS: {json.dumps(goal_progress, indent=2)}

Return ONLY valid JSON:
{{
  "headline": "One-sentence week summary",
  "productivity_score": 75,
  "health_score": 60,
  "wins": ["Win 1", "Win 2"],
  "patterns_noticed": ["Pattern 1"],
  "next_week_recommendations": ["Rec 1", "Rec 2", "Rec 3"],
  "focus_area": "The one thing to focus on next week"
}}"""

        response = self._safe_generate(prompt)
        parsed = self._parse_json_response(response)
        return parsed or {
            "headline": "A productive week with room to grow.",
            "productivity_score": 70,
            "health_score": 65,
            "wins": [],
            "patterns_noticed": [],
            "next_week_recommendations": [],
        }


# ── Mock implementation for testing ──────────────────────────────────────────

class MockGeminiService:
    """Complete mock for unit testing without live Gemini calls."""

    def generate_morning_briefing(self, emails, calendar_events, user_name="there") -> Dict:
        return {
            "greeting": f"Good morning, {user_name}! Here's your day.",
            "top_priorities": [
                {"rank": 1, "title": "Reply to client proposal email", "reason": "Urgent — deadline today", "tag": "Urgent"},
                {"rank": 2, "title": "Team standup at 9 AM", "reason": "First meeting of the day", "tag": "Needs Reply"},
                {"rank": 3, "title": "Complete assignment 3", "reason": "Due Friday", "tag": "Urgent"},
            ],
            "first_meeting": {"title": "Team Standup", "time": "9:00 AM", "prep_tip": "Review yesterday's progress"},
            "urgent_email_summary": "Client needs proposal by end of day — immediate action required.",
            "context_alert": "Meeting in 30 min but 2 unread emails from the same attendee.",
        }

    def extract_action_items(self, email_body, email_from, email_subject) -> List[Dict]:
        return [{"action": "Submit assignment by Friday", "deadline": "2025-06-06", "priority": "high", "suggested_duration_minutes": 120}]

    def draft_smart_reply(self, email_body, email_from, email_subject, thread_history, tone="professional") -> str:
        return "Thank you for your message. I'll review the details and get back to you by end of day with a complete response."

    def parse_natural_language_command(self, command, context) -> Dict:
        return {
            "intent": "prepare_meeting",
            "understood_as": f"Prepare for: {command}",
            "tasks": [{"task": "Review attendee backgrounds", "estimated_minutes": 20, "suggested_time": None}],
            "calendar_blocks": [],
            "emails_to_surface": [],
            "clarification_needed": None,
        }

    def detect_email_tone(self, email_body, relationship="unknown") -> str:
        return "professional"

    def generate_decision_support(self, decision, calendar_load, goals) -> Dict:
        return {"summary": decision, "pros": ["Pro 1", "Pro 2"], "cons": ["Con 1"], "recommendation": "Proceed with caution.", "calendar_impact": "Moderate impact."}

    def generate_weekly_review(self, completed_tasks, missed_tasks, habit_data, goal_progress) -> Dict:
        return {"headline": "Solid week — keep the momentum.", "productivity_score": 78, "health_score": 65, "wins": ["Completed 3 major tasks"], "patterns_noticed": ["Most productive in mornings"], "next_week_recommendations": ["Block 2 deep work sessions"]}
