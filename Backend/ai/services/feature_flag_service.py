"""
ai/services/feature_flag_service.py
-------------------------------------
AI Feature Flag resolution service.

Checks whether a specific AI feature is enabled for a given context
(user, university, role). Results are cached in Redis for performance.

Resolution order (most specific wins):
    1. University + Role flag
    2. University-level flag
    3. Role-level flag
    4. Platform-level flag
    5. Default: enabled (if no flags exist)

Usage:
    from ai.services.feature_flag_service import is_feature_enabled

    if not is_feature_enabled('ai_chat', user=request.user):
        return 403

Features:
    ai_chat, ai_notes, ai_summaries, ai_quiz_generator,
    ai_flashcards, ai_translation, ai_code_assistant
"""

import logging
# pyrefly: ignore [missing-import]
from django.core.cache import cache
# pyrefly: ignore [missing-import]
from django.conf import settings

logger = logging.getLogger(__name__)

_PREFIX = getattr(settings, 'AI_GOVERNANCE_CACHE_PREFIX', 'studyhub:ai_gov')
_TTL = getattr(settings, 'AI_GOVERNANCE_CACHE_TTL', 300)


def is_feature_enabled(feature: str, user=None, university=None) -> bool:
    """
    Check if an AI feature is enabled for the given context.

    Parameters
    ----------
    feature    : Feature key (e.g. 'ai_chat', 'ai_summaries')
    user       : User instance (optional, used to resolve role and university)
    university : University instance or ID (optional)

    Returns
    -------
    bool — True if the feature is enabled, False if disabled.
    """
    role = ''
    if user:
        role = getattr(user, 'role', '')

    # Build a cache key from all context dimensions
    uni_id = ''
    if university:
        uni_id = university if isinstance(university, (int, str)) else university.pk

    cache_key = f"{_PREFIX}:feature:{feature}:{role}:{uni_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    result = _resolve_feature_flag(feature, role, uni_id)
    cache.set(cache_key, result, timeout=_TTL)
    return result


def _resolve_feature_flag(feature: str, role: str, university_id) -> bool:
    """
    Resolve a feature flag from the database.

    Resolution order:
        1. University + Role flag (most specific)
        2. University-level flag
        3. Role-level flag
        4. Platform-level flag
        5. Default: True (feature enabled if no flag exists)
    """
    try:
        from ai.models_governance import AIFeatureFlag

        # 1. University + Role
        if university_id and role:
            flag = AIFeatureFlag.objects.filter(
                feature=feature,
                scope='role',
                university_id=university_id,
                role=role,
            ).first()
            if flag:
                return flag.is_enabled

        # 2. University-level
        if university_id:
            flag = AIFeatureFlag.objects.filter(
                feature=feature,
                scope='university',
                university_id=university_id,
            ).first()
            if flag:
                return flag.is_enabled

        # 3. Role-level (no university)
        if role:
            flag = AIFeatureFlag.objects.filter(
                feature=feature,
                scope='role',
                university__isnull=True,
                role=role,
            ).first()
            if flag:
                return flag.is_enabled

        # 4. Platform-level
        flag = AIFeatureFlag.objects.filter(
            feature=feature,
            scope='platform',
        ).first()
        if flag:
            return flag.is_enabled

    except Exception as exc:
        logger.warning(f"[FeatureFlags] Error resolving {feature}: {exc}")

    # 5. Default: enabled
    return True


def get_all_feature_states(user=None, university=None) -> dict:
    """
    Get the enabled/disabled state of all AI features for the given context.

    Returns a dict like:
    {
        'ai_chat': True,
        'ai_notes': True,
        'ai_summaries': False,
        ...
    }
    """
    from ai.models_governance import AIFeatureFlag

    features = [choice[0] for choice in AIFeatureFlag.FEATURE_CHOICES]
    return {
        feature: is_feature_enabled(feature, user=user, university=university)
        for feature in features
    }
