"""
ai/services/memory_service.py
-------------------------------
Conversation memory service stub for StudyHub AI.

Current behaviour:
    Returns the last N messages from a session in chronological order.

Future behaviour (when summarisation is activated):
    1. If session.is_summarized is True, prepend summary_text as a synthetic
       context block before the recent messages.
    2. Only messages after summary_covers_up_to_message are fetched from DB.
    3. The summarise_session() function can be called by a background job
       once a session exceeds a configurable message threshold.

The ChatbotView calls get_context_messages() instead of querying ChatMessage
directly, so the future upgrade requires zero changes to the view layer.

Usage:
    from ai.services.memory_service import get_context_messages

    messages = get_context_messages(session, recent_count=10)
    # returns list of {'role': 'user'|'ai', 'content': str}
"""

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ai.models import ChatSession

logger = logging.getLogger(__name__)

# Maximum recent messages to include in the context window.
# Adjust based on average message length and Gemini context limit.
DEFAULT_RECENT_COUNT = 10


def get_context_messages(session: 'ChatSession', recent_count: int = DEFAULT_RECENT_COUNT) -> list[dict]:
    """
    Return the messages to include in the next Gemini call for `session`.

    Parameters
    ----------
    session      : The ChatSession object.
    recent_count : Number of most-recent messages to include.

    Returns
    -------
    List of dicts: [{'role': 'user'|'ai', 'content': str}, ...]
    Ordered chronologically (oldest first).
    """
    from ai.models import ChatMessage

    try:
        # Current behaviour: return last `recent_count` messages chronologically
        qs = (
            ChatMessage.objects
            .filter(session=session)
            .order_by('-created_at')[:recent_count]
        )
        # Reverse to get chronological order
        messages = list(reversed(list(qs)))

        # ── Future: prepend summary context ────────────────────────────────
        # if session.is_summarized and session.summary_text:
        #     summary_entry = {
        #         'role': 'ai',
        #         'content': (
        #             f"[Earlier conversation summary]\n{session.summary_text}\n"
        #             f"[End of summary — continuing from message {session.summary_covers_up_to_message}]"
        #         ),
        #     }
        #     return [summary_entry] + [{'role': m.role, 'content': m.content} for m in messages]

        return [{'role': m.role, 'content': m.content} for m in messages]

    except Exception as exc:
        logger.error(f"[MemoryService] Failed to retrieve context messages: {exc}")
        return []


def build_context_string(messages: list[dict]) -> str:
    """
    Convert a list of message dicts into a formatted conversation string
    suitable for injecting into a Gemini prompt.

    Example output:
        User: What is photosynthesis?
        AI: Photosynthesis is the process by which...
        User: Give me a summary.
    """
    lines = []
    for msg in messages:
        role = 'User' if msg['role'] == 'user' else 'AI'
        lines.append(f"{role}: {msg['content'][:500]}")  # truncate long messages
    return '\n'.join(lines)


# ── Future: Session Summarisation ──────────────────────────────────────────────

def should_summarise(session: 'ChatSession', threshold: int = 30) -> bool:
    """
    Return True if the session has enough messages that summarisation
    would improve context window efficiency.

    Stub — not yet wired into any background task.
    """
    from ai.models import ChatMessage
    count = ChatMessage.objects.filter(session=session).count()
    return count >= threshold and not session.is_summarized


# def summarise_session(session: 'ChatSession') -> bool:
#     """
#     Generate a summary of old messages and store it on the session.
#     Call this from a Celery task or management command.
#
#     Returns True on success, False on failure.
#     """
#     ...
