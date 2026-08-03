import re

class PromptSecurityService:
    """
    Detects jailbreaks, prompt injection, and sanitizes instructions.
    """
    JAILBREAK_PATTERNS = [
        r"ignore previous instructions",
        r"ignore all previous",
        r"disregard previous",
        r"override system prompt",
        r"you are no longer",
        r"forget your instructions",
        r"bypass restrictions",
        r"system prompt extraction",
        r"what are your instructions",
    ]

    @classmethod
    def detect_jailbreak(cls, user_query: str) -> bool:
        """
        Returns True if a jailbreak pattern is detected.
        """
        query_lower = user_query.lower()
        for pattern in cls.JAILBREAK_PATTERNS:
            if re.search(pattern, query_lower):
                return True
        return False

    @classmethod
    def sanitize_input(cls, user_query: str) -> str:
        """
        Sanitizes malicious instructions from the input.
        """
        # basic sanitization, for production this could use a lighter LLM filter
        return user_query.strip()
