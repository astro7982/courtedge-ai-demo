"""
Server-side conversation memory store.

Stores conversation history by session_id for context-aware routing.
Uses in-memory storage - suitable for demo purposes.
For production, consider Redis or a database.
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import uuid
import logging

logger = logging.getLogger(__name__)


@dataclass
class Message:
    """A single message in a conversation."""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Conversation:
    """A conversation session with message history."""
    session_id: str
    messages: List[Message] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_activity: datetime = field(default_factory=datetime.utcnow)

    def add_message(self, role: str, content: str) -> None:
        """Add a message to the conversation."""
        self.messages.append(Message(role=role, content=content))
        self.last_activity = datetime.utcnow()

    def get_history(self, max_messages: int = 20) -> List[Dict[str, str]]:
        """Get recent message history as list of dicts."""
        recent = self.messages[-max_messages:] if len(self.messages) > max_messages else self.messages
        return [{"role": m.role, "content": m.content} for m in recent]

    def get_context_summary(self, max_messages: int = 10) -> str:
        """Get a text summary of recent conversation for LLM context."""
        recent = self.messages[-max_messages:] if len(self.messages) > max_messages else self.messages
        if not recent:
            return ""

        lines = []
        for msg in recent:
            prefix = "User" if msg.role == "user" else "Assistant"
            # Truncate long messages for context
            content = msg.content[:500] + "..." if len(msg.content) > 500 else msg.content
            lines.append(f"{prefix}: {content}")

        return "\n".join(lines)


class ConversationStore:
    """
    In-memory store for conversation sessions.

    Features:
    - Automatic session creation
    - TTL-based expiration (default 1 hour)
    - Max messages per conversation (default 100)
    """

    def __init__(
        self,
        ttl_minutes: int = 60,
        max_messages: int = 100,
        max_sessions: int = 1000
    ):
        self._conversations: Dict[str, Conversation] = {}
        self._ttl = timedelta(minutes=ttl_minutes)
        self._max_messages = max_messages
        self._max_sessions = max_sessions

    def get_or_create_session(self, session_id: Optional[str] = None) -> str:
        """Get existing session or create a new one."""
        # Clean up expired sessions periodically
        self._cleanup_expired()

        if session_id and session_id in self._conversations:
            return session_id

        # Create new session
        new_id = session_id or str(uuid.uuid4())
        self._conversations[new_id] = Conversation(session_id=new_id)
        logger.info(f"Created new conversation session: {new_id}")
        return new_id

    def add_message(self, session_id: str, role: str, content: str) -> None:
        """Add a message to a conversation."""
        if session_id not in self._conversations:
            self.get_or_create_session(session_id)

        conversation = self._conversations[session_id]
        conversation.add_message(role, content)

        # Trim if too many messages
        if len(conversation.messages) > self._max_messages:
            conversation.messages = conversation.messages[-self._max_messages:]

    def get_history(self, session_id: str, max_messages: int = 20) -> List[Dict[str, str]]:
        """Get conversation history for a session."""
        if session_id not in self._conversations:
            return []
        return self._conversations[session_id].get_history(max_messages)

    def get_context_summary(self, session_id: str, max_messages: int = 10) -> str:
        """Get conversation context summary for LLM routing."""
        if session_id not in self._conversations:
            return ""
        return self._conversations[session_id].get_context_summary(max_messages)

    def clear_session(self, session_id: str) -> None:
        """Clear a specific session."""
        if session_id in self._conversations:
            del self._conversations[session_id]
            logger.info(f"Cleared conversation session: {session_id}")

    def _cleanup_expired(self) -> None:
        """Remove expired sessions."""
        now = datetime.utcnow()
        expired = [
            sid for sid, conv in self._conversations.items()
            if now - conv.last_activity > self._ttl
        ]
        for sid in expired:
            del self._conversations[sid]
            logger.info(f"Expired conversation session: {sid}")

        # Also enforce max sessions limit
        if len(self._conversations) > self._max_sessions:
            # Remove oldest sessions
            sorted_sessions = sorted(
                self._conversations.items(),
                key=lambda x: x[1].last_activity
            )
            to_remove = len(self._conversations) - self._max_sessions
            for sid, _ in sorted_sessions[:to_remove]:
                del self._conversations[sid]
                logger.info(f"Removed old session due to limit: {sid}")


# Global instance for the application
conversation_store = ConversationStore()
