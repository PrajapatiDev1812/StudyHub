"""
ai/providers/registry.py
-------------------------
Provider registry and factory for StudyHub AI.

To add a new provider:
    1. Create ai/providers/<name>_provider.py
    2. Add it to PROVIDER_REGISTRY below
    3. Update AIConfiguration.PROVIDER_CHOICES in models.py

Usage:
    from ai.providers.registry import get_provider

    provider = get_provider('google')
    response = provider.generate_response(prompt="What is photosynthesis?")
"""

import logging

from .google_provider import GoogleProvider

logger = logging.getLogger(__name__)

# ── Registry map: provider key → class ────────────────────────────────────────
PROVIDER_REGISTRY = {
    'google': GoogleProvider,
    # 'openai': OpenAIProvider,   # future
    # 'anthropic': AnthropicProvider,  # future
}

# Human-readable choices for AIConfiguration.provider field
PROVIDER_CHOICES = [
    ('google', 'Google Gemini'),
    # ('openai', 'OpenAI GPT'),
]

# Per-provider available model names for the frontend dropdown
PROVIDER_MODELS = {
    'google': [
        ('gemini-2.0-flash',  'Gemini 2.0 Flash (Recommended)'),
        ('gemini-2.5-flash',  'Gemini 2.5 Flash'),
        ('gemini-flash-latest', 'Gemini Flash (Latest)'),
    ],
}


def get_provider(name: str = 'google', api_key: str = None, model_name: str = None):
    """
    Instantiate and return the requested AI provider.

    Parameters
    ----------
    name       : Provider key (must exist in PROVIDER_REGISTRY).
    api_key    : Optional API key override (for per-teacher config).
    model_name : Optional model override.

    Returns
    -------
    BaseAIProvider instance.
    """
    provider_cls = PROVIDER_REGISTRY.get(name)
    if provider_cls is None:
        logger.warning(f"[Registry] Unknown provider '{name}', falling back to Google.")
        provider_cls = GoogleProvider

    try:
        if api_key or model_name:
            return provider_cls(api_key=api_key, model_name=model_name)
        return provider_cls()
    except Exception as exc:
        logger.error(f"[Registry] Failed to instantiate {name} provider: {exc}")
        return GoogleProvider()  # safe fallback


def get_default_provider():
    """Return the default (Google Gemini) provider."""
    return get_provider('google')
