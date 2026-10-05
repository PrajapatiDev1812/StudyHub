"""
ai/services/injection_guard.py
--------------------------------
Prompt injection & jailbreak detection for StudyHub AI.

Runs BEFORE the Gemini API is called (no API cost for blocked requests).
Uses regex pattern matching against a curated threat list.

Usage:
    from ai.services.injection_guard import is_injection_attempt

    blocked, pattern = is_injection_attempt(user_message)
    if blocked:
        return refusal_response
"""

import re
import logging

logger = logging.getLogger(__name__)

# ── Threat Pattern Library ─────────────────────────────────────────────────────

_PATTERNS: list[tuple[str, str]] = [
    # Instruction override attempts
    (r"ignore\s+(all\s+|your\s+|previous\s+|above\s+|the\s+)?instructions?",
     "instruction_override"),
    (r"(disregard|forget|override|bypass|circumvent)\s+(all\s+)?(your\s+)?(previous\s+)?(instructions?|rules?|guidelines?|constraints?|restrictions?)",
     "instruction_override"),

    # Prompt / system reveal attempts
    (r"(reveal|show|print|display|output|repeat|tell me|what is)\s+(your\s+)?(the\s+)?(system\s+|hidden\s+|original\s+|actual\s+|real\s+)?(prompt|instruction|directive|context|rules?)",
     "prompt_reveal"),
    (r"(what|show me)\s+(was\s+)?(your\s+)?(initial|starting|base|first)\s+(prompt|instruction)",
     "prompt_reveal"),

    # API key / secret reveal attempts
    (r"(reveal|show|expose|print|output|display)\s+(the\s+|your\s+)?(api\s*key|secret\s*key|secret|token|credential|password|env\s*var)",
     "secret_reveal"),
    (r"(what is|tell me|show me)\s+(your\s+)?(api|gemini|openai|secret)\s+(key|token|credential)",
     "secret_reveal"),

    # Identity override (act-as attacks)
    (r"(act\s+as|you\s+are\s+now|pretend\s+(you\s+are|to\s+be)|behave\s+as|roleplay\s+as)\s+(another|a\s+different|an?\s+(unrestricted|uncensored|jailbroken|evil|free|unfiltered|raw))",
     "identity_override"),
    (r"\bDAN\b",   "identity_override"),
    (r"jailbreak", "jailbreak"),
    (r"do\s+anything\s+now",   "jailbreak"),
    (r"developer\s+mode",      "jailbreak"),

    # Safety filter bypass
    (r"(disable|turn\s+off|bypass|override|remove|ignore|skip)\s+(your\s+|all\s+)?(safety|content\s+filter|filter|moderation|restriction|rule|guideline|censorship|block)",
     "safety_bypass"),

    # Malware / code execution
    (r"(write|generate|create|produce|give me|make)\s+(me\s+)?(a\s+)?(malware|virus|ransomware|exploit|keylogger|trojan|worm|spyware|payload|shell\s*code)",
     "malware"),
    (r"(execute|run|eval|exec|os\.system|subprocess|__import__)\s*\(",
     "code_execution"),

    # Document / data exfiltration
    (r"(show|list|dump|extract|output|display|give\s+me)\s+(all\s+)?(your\s+)?(hidden\s+|uploaded\s+|private\s+|internal\s+|stored\s+)?(document|file|material|knowledge|data|database|training)",
     "data_exfil"),

    # Persona / impersonation
    (r"you\s+are\s+(now\s+)?(?!StudyHub|an?\s+academic|an?\s+educational|a\s+helpful)",
     "identity_override"),
    (r"(simulate|emulate|act\s+like)\s+(gpt|chatgpt|claude|gemini\s+pro|llm|ai\s+assistant)",
     "identity_override"),
]

# Pre-compile all patterns for performance
_COMPILED_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(pat, re.IGNORECASE | re.UNICODE), label)
    for pat, label in _PATTERNS
]

# Maximum characters to scan (avoids quadratic backtracking on massive inputs)
_MAX_SCAN_LEN = 2000


def is_injection_attempt(text: str) -> tuple[bool, str]:
    """
    Check whether `text` appears to be a prompt injection or jailbreak attempt.

    Parameters
    ----------
    text : The raw user message to inspect.

    Returns
    -------
    (True, matched_label)  — if a threat pattern is detected.
    (False, '')            — if the text appears safe.

    Notes
    -----
    - Only the first `_MAX_SCAN_LEN` characters are scanned.
    - All exceptions are caught; on error returns (False, '') to avoid
      blocking legitimate requests due to regex bugs.
    """
    if not text:
        return False, ''

    scan_text = text[:_MAX_SCAN_LEN]

    try:
        for pattern, label in _COMPILED_PATTERNS:
            if pattern.search(scan_text):
                logger.warning(
                    f"[InjectionGuard] Threat detected — pattern: '{label}' "
                    f"in text: '{scan_text[:80]}...'"
                )
                return True, label
    except Exception as exc:
        logger.error(f"[InjectionGuard] Pattern matching error: {exc}")

    return False, ''


# Standard refusal message — shown to the user when injection is detected
INJECTION_REFUSAL = (
    "I'm an academic assistant for StudyHub and cannot process that request. "
    "Please ask an educational question related to your studies."
)
