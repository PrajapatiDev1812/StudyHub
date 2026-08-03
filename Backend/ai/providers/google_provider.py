"""
ai/providers/google_provider.py
--------------------------------
Google Gemini implementation of BaseAIProvider.

This class wraps the google-genai SDK exactly as the original gemini_client.py did,
but behind the provider interface — making it swappable in the future.

API Key: read from GEMINI_API_KEY environment variable.
"""

import os
import logging

from .base_provider import BaseAIProvider

logger = logging.getLogger(__name__)

# Lazy import so Django can start even if google-genai is not installed
try:
    from google import genai
    # pyrefly: ignore [missing-import]
    from google.genai import types as genai_types
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False
    logger.warning("google-genai package not installed. GoogleProvider will be disabled.")


# ── Safety settings shared across all generation calls ────────────────────────
_SAFETY_SETTINGS = [
    {'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold': 'BLOCK_LOW_AND_ABOVE'},
    {'category': 'HARM_CATEGORY_HATE_SPEECH',        'threshold': 'BLOCK_LOW_AND_ABOVE'},
    {'category': 'HARM_CATEGORY_HARASSMENT',         'threshold': 'BLOCK_LOW_AND_ABOVE'},
    {'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',  'threshold': 'BLOCK_LOW_AND_ABOVE'},
]

# Models tried in fallback order if the primary is rate-limited
_DEFAULT_MODELS = [
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash',
]

_DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001'


class GoogleProvider(BaseAIProvider):
    """
    AI provider backed by the Google Gemini API.
    Supports text generation and embedding via google-genai SDK.
    """

    def __init__(self, api_key: str = None, model_name: str = None):
        """
        Parameters
        ----------
        api_key    : Override the GEMINI_API_KEY env var (used for per-teacher config).
        model_name : Override the default model list (single model string).
        """
        self._api_key   = api_key or os.getenv('GEMINI_API_KEY', '')
        self._model_name = model_name  # None = use fallback list
        self._client    = None

        if _GENAI_AVAILABLE and self._api_key and self._api_key != 'YOUR_API_KEY_HERE':
            try:
                self._client = genai.Client(api_key=self._api_key)
            except Exception as exc:
                logger.error(f"[GoogleProvider] Failed to initialise Gemini client: {exc}")

    # ── BaseAIProvider interface ───────────────────────────────────────────────

    def is_configured(self) -> bool:
        return self._client is not None

    def generate_response(
        self,
        prompt: str,
        system_instruction: str = '',
        temperature: float = 0.2,
    ) -> str:
        if not self.is_configured():
            return (
                "Gemini API key is not configured. "
                "Please set GEMINI_API_KEY in Backend/.env file. "
                "Get a free key from https://aistudio.google.com/apikey"
            )

        models_to_try = (
            [self._model_name] if self._model_name else _DEFAULT_MODELS
        )

        safety = [
            genai_types.SafetySetting(category=s['category'], threshold=s['threshold'])
            for s in _SAFETY_SETTINGS
        ]

        for model_name in models_to_try:
            try:
                config = genai_types.GenerateContentConfig(
                    system_instruction=system_instruction or None,
                    safety_settings=safety,
                    temperature=temperature,
                )
                response = self._client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )
                if not response.text:
                    if (
                        response.candidates
                        and response.candidates[0].finish_reason == 'SAFETY'
                    ):
                        return (
                            "Blocked by safety filters: This assistant only provides "
                            "academic and educational support."
                        )
                    return "The response was blocked or empty due to safety guidelines."

                return response.text

            except Exception as exc:
                error_str = str(exc)
                if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
                    logger.warning(f"[GoogleProvider] {model_name} rate-limited, trying next...")
                    continue
                logger.error(f"[GoogleProvider] Gemini API error with {model_name}: {exc}")
                return f"AI service error: {error_str[:200]}"

        return (
            "The AI service is temporarily rate-limited. "
            "Please wait a minute and try again. "
            "If this persists, check your API quota at https://ai.dev/rate-limit"
        )

    def generate_embedding(self, text: str) -> list:
        if not self.is_configured():
            raise RuntimeError("Gemini API key not configured")
        try:
            result = self._client.models.embed_content(
                model=_DEFAULT_EMBEDDING_MODEL,
                contents=text,
                config=genai_types.EmbedContentConfig(task_type='RETRIEVAL_DOCUMENT'),
            )
            return list(result.embeddings[0].values)
        except Exception as exc:
            logger.error(f"[GoogleProvider] Embedding error: {exc}")
            raise

    def generate_query_embedding(self, text: str) -> list:
        if not self.is_configured():
            raise RuntimeError("Gemini API key not configured")
        try:
            result = self._client.models.embed_content(
                model=_DEFAULT_EMBEDDING_MODEL,
                contents=text,
                config=genai_types.EmbedContentConfig(task_type='RETRIEVAL_QUERY'),
            )
            return list(result.embeddings[0].values)
        except Exception as exc:
            logger.error(f"[GoogleProvider] Query embedding error: {exc}")
            raise
