"""
ai/providers/base_provider.py
------------------------------
Abstract base class for all AI providers in StudyHub.

To add a new provider (e.g. OpenAI, Claude):
    1. Create a new file: ai/providers/openai_provider.py
    2. Subclass BaseAIProvider and implement all abstract methods
    3. Register it in ai/providers/registry.py

Current providers:
    - google (GoogleProvider → Gemini API)
"""

from abc import ABC, abstractmethod
import logging

logger = logging.getLogger(__name__)


class BaseAIProvider(ABC):
    """
    Common interface all AI providers must implement.
    """

    # ── Core Generation ────────────────────────────────────────────────────────

    @abstractmethod
    def generate_response(
        self,
        prompt: str,
        system_instruction: str = '',
        temperature: float = 0.2,
    ) -> str:
        """
        Generate a text response from a prompt.

        Parameters
        ----------
        prompt             : The user-facing content (question, context, etc.)
        system_instruction : Optional system/role instruction prepended to context.
        temperature        : Sampling temperature (0.0 = deterministic, 1.0 = creative).

        Returns
        -------
        str — the model's text response.
        """
        ...

    @abstractmethod
    def generate_embedding(self, text: str) -> list:
        """
        Generate a dense vector embedding for indexing / storage.
        Typically uses RETRIEVAL_DOCUMENT task type.

        Returns list of floats (e.g. 768 or 1536 dimensions).
        """
        ...

    @abstractmethod
    def generate_query_embedding(self, text: str) -> list:
        """
        Generate a dense vector embedding optimised for search queries.
        Typically uses RETRIEVAL_QUERY task type.

        Returns list of floats.
        """
        ...

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True if the provider API key / credentials are available."""
        ...

    # ── Convenience Methods (default implementations) ──────────────────────────

    def summarize(self, text: str, max_length: int = 3000) -> str:
        """
        Summarise `text` into bullet points.
        Default implementation calls generate_response — providers may override
        to use a dedicated summarisation endpoint.
        """
        prompt = (
            f"Summarize the following study material in clear, concise bullet points. "
            f"Keep it educational and structured:\n\n{text[:max_length]}"
        )
        return self.generate_response(
            prompt=prompt,
            system_instruction=(
                "You are an academic summarisation assistant. "
                "Return only structured bullet-point summaries."
            ),
            temperature=0.1,
        )

    def moderate(self, text: str) -> str:
        """
        Classify user content for safety.
        Returns one of: 'academic', 'sensitive_academic', 'unsafe_adult',
        'unknown_or_borderline'.
        Default implementation calls generate_response — override for
        providers that have a dedicated moderation API.
        """
        classification_instruction = (
            "You are an Academic Content Moderator. "
            "Classify the following prompt into exactly ONE category: "
            "academic, sensitive_academic, unsafe_adult, or unknown_or_borderline. "
            "Return ONLY the category name in lowercase."
        )
        response = self.generate_response(
            prompt=f'Classify this prompt: "{text}"',
            system_instruction=classification_instruction,
            temperature=0.0,
        )
        valid = ['academic', 'sensitive_academic', 'unsafe_adult', 'unknown_or_borderline']
        resp_lower = response.strip().lower()
        for cat in valid:
            if cat in resp_lower:
                return cat
        return 'unknown_or_borderline'

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} configured={self.is_configured()}>"
