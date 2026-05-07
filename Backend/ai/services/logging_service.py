"""
ai/services/logging_service.py
-------------------------------
High-reliability logging service for the AI Usage Insights system.

Responsibilities:
- Capture every AI interaction outcome (success, failed, throttled, blocked)
- Enforce privacy rules: query_text is always truncated and sanitized
- Resolve educational context (course/subject/topic FKs) from request data
- Never raise exceptions — logging must NOT interrupt the AI response pipeline

Usage:
    from ai.services.logging_service import log_ai_request

    log_ai_request(
        request=request,
        request_type='chat',
        status='success',
        response_time_ms=432,
        subject='Machine Learning',
        topic='PCA',
    )
"""

import logging
import re
from django.utils import timezone

logger = logging.getLogger(__name__)

# Maximum characters stored for query_text (privacy-safe truncation)
QUERY_TEXT_MAX_LEN = 300


def sanitize_query(text: str) -> str:
    """
    Truncate and strip control characters from raw user query.
    This is the ONLY transformation applied — no semantic changes.
    """
    if not text:
        return ''
    # Strip control / non-printable characters
    cleaned = re.sub(r'[\x00-\x1f\x7f]', ' ', text).strip()
    return cleaned[:QUERY_TEXT_MAX_LEN]


def _resolve_course_fk(course_name: str):
    """
    Try to resolve a course FK from a name string.
    Returns None if not found — log entry remains without FK.
    """
    if not course_name:
        return None
    try:
        from courses.models import Course
        return Course.objects.filter(name__iexact=course_name).first()
    except Exception:
        return None


def _resolve_subject_fk(subject_name: str, course=None):
    """
    Try to resolve a subject FK from a name string, optionally scoped to a course.
    """
    if not subject_name:
        return None
    try:
        from courses.models import Subject
        qs = Subject.objects.filter(name__iexact=subject_name)
        if course:
            qs = qs.filter(course=course)
        return qs.first()
    except Exception:
        return None


def _resolve_topic_fk(topic_name: str, subject=None):
    """
    Try to resolve a topic FK from a name string, optionally scoped to a subject.
    """
    if not topic_name:
        return None
    try:
        from courses.models import Topic
        qs = Topic.objects.filter(name__iexact=topic_name)
        if subject:
            qs = qs.filter(subject=subject)
        return qs.first()
    except Exception:
        return None


def log_ai_request(
    request,
    *,
    request_type: str = 'chat',
    status: str = 'success',
    response_time_ms: int = None,
    query_text: str = '',
    subject: str = '',
    topic: str = '',
    error_code: str = '',
    input_tokens: int = None,
    output_tokens: int = None,
    total_tokens: int = None,
    model_name: str = '',
    extra_metadata: dict = None,
) -> None:
    """
    Create one AIRequestLog entry for an AI interaction.

    Parameters
    ----------
    request       : DRF / Django request object (used for user + context).
    request_type  : 'chat' | 'summary' | 'quiz' | 'explain' | 'other'
    status        : 'success' | 'failed' | 'throttled' | 'blocked'
    response_time_ms : Elapsed ms from request start to response completion.
    query_text    : Raw user message — will be sanitized and truncated.
    subject       : Subject name string from request context.
    topic         : Topic name string from request context.
    error_code    : Short error identifier for failed requests.
    input_tokens  : Gemini input token count (if available).
    output_tokens : Gemini output token count (if available).
    total_tokens  : Gemini total token count (if available).
    model_name    : Model identifier string (e.g. 'gemini-2.0-flash').
    extra_metadata: Any additional dict to store in the metadata JSONField.

    Returns
    -------
    None — this function is intentionally fire-and-forget.
    All exceptions are caught and logged; the pipeline is never disrupted.
    """
    try:
        from ai.models import AIRequestLog

        user = getattr(request, 'user', None)
        if user and not user.is_authenticated:
            user = None

        role_snapshot = ''
        if user:
            role_snapshot = 'superuser' if user.is_superuser else getattr(user, 'role', '')

        # ── Privacy: sanitize query text ──────────────────────────────────────
        safe_query = sanitize_query(query_text)

        # ── Resolve educational context FKs (best-effort) ────────────────────
        course_obj  = None
        subject_obj = _resolve_subject_fk(subject)
        topic_obj   = _resolve_topic_fk(topic, subject=subject_obj)

        # Try to resolve course from subject FK if found
        if subject_obj:
            course_obj = subject_obj.course

        # ── Build metadata dict ───────────────────────────────────────────────
        metadata = {}
        if extra_metadata and isinstance(extra_metadata, dict):
            metadata.update(extra_metadata)

        # ── Create the log entry ──────────────────────────────────────────────
        AIRequestLog.objects.create(
            user=user,
            role_snapshot=role_snapshot,
            request_type=request_type,
            query_text=safe_query,
            status=status,
            response_time_ms=response_time_ms,
            course=course_obj,
            subject=subject_obj,
            related_topic=topic_obj,
            detected_topic=topic or subject or '',
            error_code=error_code,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            model_name=model_name,
            metadata=metadata,
        )

    except Exception as exc:
        # CRITICAL: logging must never crash the AI pipeline
        logger.warning(f"[AI Insights] Failed to write AIRequestLog: {exc}", exc_info=True)


def log_throttled_request(request, request_type: str = 'chat') -> None:
    """
    Convenience wrapper to log a throttled AI request.
    Called from the throttle class or view before returning 429.
    """
    log_ai_request(
        request,
        request_type=request_type,
        status='throttled',
        error_code='throttled',
    )


def log_blocked_request(request, reason: str = '', request_type: str = 'chat', query_text: str = '') -> None:
    """
    Convenience wrapper to log a moderation-blocked AI request.
    """
    log_ai_request(
        request,
        request_type=request_type,
        status='blocked',
        error_code=reason or 'moderation_block',
        query_text=query_text,
    )
