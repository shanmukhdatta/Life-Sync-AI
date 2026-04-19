"""
LifeSync AI — Google Drive API Service Module
Powers: pre-meeting doc surfacing, smart summarization,
        auto-organization, cross-doc natural language search.
"""
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class DriveService:
    """Service-oriented Drive module — independently testable."""

    def __init__(self, credentials: Credentials):
        self.service = build("drive", "v3", credentials=credentials)

    def search_files(self, query: str, max_results: int = 10) -> List[Dict]:
        """Search Drive files by natural language query."""
        try:
            # Convert NL query to Drive query syntax
            drive_query = f"name contains '{query}' or fullText contains '{query}'"
            result = self.service.files().list(
                q=drive_query,
                pageSize=max_results,
                fields="files(id,name,mimeType,modifiedTime,webViewLink,owners)",
            ).execute()
            return [self._parse_file(f) for f in result.get("files", [])]
        except Exception as e:
            logger.error(f"DriveService.search_files error: {e}")
            return []

    def _parse_file(self, file: Dict) -> Dict[str, Any]:
        return {
            "id": file.get("id"),
            "name": file.get("name"),
            "type": file.get("mimeType", "").split(".")[-1],
            "modified": file.get("modifiedTime"),
            "link": file.get("webViewLink"),
            "owner": file.get("owners", [{}])[0].get("emailAddress", ""),
        }

    def surface_meeting_docs(self, meeting_title: str, attendees: List[str]) -> List[Dict]:
        """Auto-surface relevant Drive docs before a meeting."""
        keywords = meeting_title.replace(":", "").replace("-", " ").split()
        results = []
        for keyword in keywords[:3]:
            results.extend(self.search_files(keyword, max_results=3))

        # Deduplicate
        seen = set()
        unique = []
        for doc in results:
            if doc.get("id") and doc["id"] not in seen:
                seen.add(doc["id"])
                unique.append(doc)
        return unique[:5]

    def get_recent_files(self, max_results: int = 10) -> List[Dict]:
        """Get recently modified files."""
        try:
            result = self.service.files().list(
                orderBy="modifiedTime desc",
                pageSize=max_results,
                fields="files(id,name,mimeType,modifiedTime,webViewLink)",
            ).execute()
            return [self._parse_file(f) for f in result.get("files", [])]
        except Exception as e:
            logger.error(f"DriveService.get_recent_files error: {e}")
            return []


class MockDriveService:
    """Mock Drive service for testing."""

    MOCK_FILES = [
        {"id": "mock_doc_001", "name": "Q2 Investor Deck", "type": "presentation", "modified": "2025-06-01T10:00:00Z", "link": "https://drive.google.com/mock1", "owner": "user@example.com"},
        {"id": "mock_doc_002", "name": "Project Proposal Template", "type": "document", "modified": "2025-05-28T09:00:00Z", "link": "https://drive.google.com/mock2", "owner": "user@example.com"},
    ]

    def search_files(self, query, max_results=10) -> List[Dict]:
        return self.MOCK_FILES

    def surface_meeting_docs(self, meeting_title, attendees) -> List[Dict]:
        return self.MOCK_FILES[:2]

    def get_recent_files(self, max_results=10) -> List[Dict]:
        return self.MOCK_FILES
