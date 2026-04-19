"""
LifeSync AI — Gmail API Service Module
Powers: email parsing, action item extraction, smart reply drafts,
        Inbox Zero classification, thread context memory, email-to-calendar bridge.
"""
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from typing import List, Dict, Any, Optional
import base64
import email
import logging
import re
from datetime import datetime

logger = logging.getLogger(__name__)


class GmailService:
    """Service-oriented Gmail module — independently testable."""

    def __init__(self, credentials: Credentials):
        self.service = build("gmail", "v1", credentials=credentials)
        self.user_id = "me"

    # ── Core fetching ─────────────────────────────────────────────────────────

    def list_messages(self, max_results: int = 20, query: str = "") -> List[Dict]:
        """List inbox messages with optional query filter."""
        try:
            result = self.service.users().messages().list(
                userId=self.user_id,
                maxResults=max_results,
                q=query or "in:inbox is:unread",
            ).execute()
            messages = result.get("messages", [])
            return [self._get_message_summary(m["id"]) for m in messages[:max_results]]
        except Exception as e:
            logger.error(f"GmailService.list_messages error: {e}")
            return []

    def _get_message_summary(self, msg_id: str) -> Dict[str, Any]:
        """Fetch and parse a single message."""
        try:
            msg = self.service.users().messages().get(
                userId=self.user_id,
                id=msg_id,
                format="full",
            ).execute()

            headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
            snippet = msg.get("snippet", "")
            body = self._extract_body(msg.get("payload", {}))

            return {
                "id": msg_id,
                "thread_id": msg.get("threadId"),
                "from": headers.get("From", ""),
                "subject": headers.get("Subject", "(No Subject)"),
                "date": headers.get("Date", ""),
                "snippet": snippet,
                "body": body[:2000],  # Cap for processing
                "labels": msg.get("labelIds", []),
                "is_unread": "UNREAD" in msg.get("labelIds", []),
            }
        except Exception as e:
            logger.error(f"GmailService._get_message_summary error for {msg_id}: {e}")
            return {}

    def _extract_body(self, payload: Dict) -> str:
        """Recursively extract plain text body from MIME payload."""
        if payload.get("mimeType") == "text/plain":
            data = payload.get("body", {}).get("data", "")
            if data:
                return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")

        for part in payload.get("parts", []):
            text = self._extract_body(part)
            if text:
                return text
        return ""

    # ── Inbox Zero classification ──────────────────────────────────────────────

    def classify_inbox(self, emails: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Classify emails into: Act Now / Read Later / FYI Only / Delegate.
        Rule-based fallback — AI classification done via Gemini service.
        """
        classified: Dict[str, List] = {
            "act_now": [],
            "read_later": [],
            "fyi_only": [],
            "delegate": [],
        }

        urgent_keywords = ["urgent", "asap", "immediately", "deadline", "action required", "due today"]
        delegate_keywords = ["fyi", "forwarding", "cc:", "newsletter", "unsubscribe"]

        for email_item in emails:
            snippet = (email_item.get("snippet", "") + " " + email_item.get("subject", "")).lower()

            if any(kw in snippet for kw in urgent_keywords):
                classified["act_now"].append(email_item)
            elif any(kw in snippet for kw in delegate_keywords):
                classified["fyi_only"].append(email_item)
            elif not email_item.get("is_unread"):
                classified["read_later"].append(email_item)
            else:
                classified["act_now"].append(email_item)

        return classified

    # ── Thread context memory ─────────────────────────────────────────────────

    def get_thread_history(self, thread_id: str) -> List[Dict]:
        """Fetch all messages in a thread for context memory."""
        try:
            thread = self.service.users().threads().get(
                userId=self.user_id,
                id=thread_id,
                format="metadata",
            ).execute()
            messages = thread.get("messages", [])
            summaries = []
            for msg in messages[-5:]:  # Last 5 messages for context
                headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
                summaries.append({
                    "from": headers.get("From", ""),
                    "date": headers.get("Date", ""),
                    "snippet": msg.get("snippet", ""),
                })
            return summaries
        except Exception as e:
            logger.error(f"GmailService.get_thread_history error: {e}")
            return []

    # ── Draft creation ────────────────────────────────────────────────────────

    def create_draft(self, to: str, subject: str, body: str, thread_id: Optional[str] = None) -> Dict:
        """Create a Gmail draft (one-tap approval pattern)."""
        try:
            import email.mime.text
            msg = email.mime.text.MIMEText(body)
            msg["to"] = to
            msg["subject"] = subject

            raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
            draft_body: Dict[str, Any] = {"message": {"raw": raw}}
            if thread_id:
                draft_body["message"]["threadId"] = thread_id

            draft = self.service.users().drafts().create(
                userId=self.user_id,
                body=draft_body,
            ).execute()
            return {"draft_id": draft["id"], "status": "created"}
        except Exception as e:
            logger.error(f"GmailService.create_draft error: {e}")
            return {"error": str(e)}

    # ── Bill detection ────────────────────────────────────────────────────────

    def find_billing_emails(self) -> List[Dict]:
        """Find billing/invoice emails for calendar reminder creation."""
        billing_queries = [
            "subject:(invoice OR bill OR payment due OR receipt)",
            "from:(billing OR payments OR invoice OR no-reply)",
        ]
        billing_emails = []
        for query in billing_queries:
            emails = self.list_messages(max_results=10, query=query)
            billing_emails.extend(emails)

        # Deduplicate by id
        seen = set()
        unique = []
        for e in billing_emails:
            if e.get("id") and e["id"] not in seen:
                seen.add(e["id"])
                unique.append(e)
        return unique[:20]


# ── Mock implementation for testing ──────────────────────────────────────────

class MockGmailService:
    """Complete mock — enables unit testing without live API calls."""

    MOCK_EMAILS = [
        {
            "id": "mock_001",
            "thread_id": "thread_001",
            "from": "professor@university.edu",
            "subject": "Assignment 3 — Due Friday",
            "date": "Mon, 3 Jun 2025 09:00:00 +0000",
            "snippet": "Please submit your assignment by Friday 11:59 PM. This is 30% of your grade.",
            "body": "Please submit your assignment by Friday 11:59 PM. This is 30% of your grade.",
            "labels": ["INBOX", "UNREAD"],
            "is_unread": True,
        },
        {
            "id": "mock_002",
            "thread_id": "thread_002",
            "from": "client@company.com",
            "subject": "URGENT: Project proposal needed ASAP",
            "date": "Mon, 3 Jun 2025 08:30:00 +0000",
            "snippet": "We need the proposal by end of today. This is urgent.",
            "body": "We need the proposal by end of today. This is urgent.",
            "labels": ["INBOX", "UNREAD"],
            "is_unread": True,
        },
        {
            "id": "mock_003",
            "thread_id": "thread_003",
            "from": "billing@saas-tool.com",
            "subject": "Invoice #1042 — Payment Due",
            "date": "Mon, 3 Jun 2025 07:00:00 +0000",
            "snippet": "Your invoice of $49.00 is due on June 15, 2025.",
            "body": "Your invoice of $49.00 is due on June 15, 2025.",
            "labels": ["INBOX"],
            "is_unread": False,
        },
    ]

    def list_messages(self, max_results: int = 20, query: str = "") -> List[Dict]:
        return self.MOCK_EMAILS[:max_results]

    def classify_inbox(self, emails: List[Dict]) -> Dict[str, List[Dict]]:
        return {
            "act_now": [self.MOCK_EMAILS[0], self.MOCK_EMAILS[1]],
            "read_later": [],
            "fyi_only": [self.MOCK_EMAILS[2]],
            "delegate": [],
        }

    def get_thread_history(self, thread_id: str) -> List[Dict]:
        return [{"from": "mock@example.com", "date": "Mon, 3 Jun 2025", "snippet": "Mock thread message"}]

    def create_draft(self, to: str, subject: str, body: str, thread_id=None) -> Dict:
        return {"draft_id": "mock_draft_001", "status": "created"}

    def find_billing_emails(self) -> List[Dict]:
        return [self.MOCK_EMAILS[2]]
