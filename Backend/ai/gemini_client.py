"""
ai/gemini_client.py
--------------------
BACKWARD-COMPATIBILITY SHIM.

All existing imports of this module continue to work unchanged:
    from .gemini_client import generate_response, generate_embedding, is_configured

Internally this module now delegates to GoogleProvider from the provider layer.
New code should import directly from ai.providers.registry:
    from ai.providers.registry import get_default_provider
"""

from .providers.google_provider import GoogleProvider as _GoogleProvider

# ── Module-level singleton (matches old gemini_client.py behaviour) ────────────
_provider = _GoogleProvider()


def is_configured() -> bool:
    """Check if the Gemini API key is set and client is ready."""
    return _provider.is_configured()


def generate_response(prompt: str, system_instruction: str = '', temperature: float = 0.2) -> str:
    """
    Send a prompt to Gemini and return the text response.
    Signature is identical to the original gemini_client.generate_response().
    """
    return _provider.generate_response(
        prompt=prompt,
        system_instruction=system_instruction,
        temperature=temperature,
    )


def generate_embedding(text: str) -> list:
    """
    Generate a document embedding vector.
    Signature identical to original gemini_client.generate_embedding().
    """
    return _provider.generate_embedding(text)


def generate_query_embedding(text: str) -> list:
    """
    Generate a query embedding vector.
    Signature identical to original gemini_client.generate_query_embedding().
    """
    return _provider.generate_query_embedding(text)
