"""
ai/services/moderation.py
-------------------------
Handles prompt classification and output moderation for academic safety.
"""

import logging
from ..gemini_client import generate_response

logger = logging.getLogger(__name__)

# ── Classification Policy ──
CLASSIFICATION_SYSTEM_INSTRUCTION = """You are an Academic Content Moderator for a student platform.
Your task is to classify user prompts into exactly ONE of these four categories:

1. academic: Standard educational topics (Math, Physics, History, Coding, etc.)
2. sensitive_academic: Biology, Anatomy, reproduction, medical topics, gynecology.
3. unsafe_adult: Pornography, erotic stories, sexual roleplay, explicit nudity, aroused intent.
4. unknown_or_borderline: Unclear mixed intent, slang that could be sexual, or non-academic off-topic.

Rules:
- If it's for school/college biology, it's 'sensitive_academic'.
- If it's for arousal or roleplay, it's 'unsafe_adult'.
- If it's a normal school subject, it's 'academic'.
- Return ONLY the category name in lowercase.
"""

def classify_content(text: str) -> str:
    """
    Classifies a user prompt via a fast Gemini call.
    Returns: 'academic', 'sensitive_academic', 'unsafe_adult', or 'unknown_or_borderline'
    """
    if not text:
        return 'unknown_or_borderline'

    try:
        # Use a very short, specific prompt for classification
        response = generate_response(
            prompt=f"Classify this prompt: \"{text}\"",
            system_instruction=CLASSIFICATION_SYSTEM_INSTRUCTION
        ).strip().lower()

        # If Gemini's own safety filters blocked the classification, it's unsafe.
        if "blocked" in response or "safety" in response:
            return 'unsafe_adult'

        valid_categories = ['academic', 'sensitive_academic', 'unsafe_adult', 'unknown_or_borderline']
        for cat in valid_categories:
            if cat in response:
                return cat
        
        return 'unknown_or_borderline'
    except Exception as e:
        logger.error(f"Moderation classification failed: {e}")
        # Default to a safe fallback
        return 'unknown_or_borderline'

def moderate_response(text: str) -> bool:
    """
    Checks if the AI's own response is safe to show.
    Returns True if SAFE, False if UNSAFE.
    """
    if not text:
        return True

    try:
        verdict = generate_response(
            prompt=f"Is this text clinically/academically safe or sexually explicit? Answer 'SAFE' or 'UNSAFE'.\nText: {text[:1000]}",
            system_instruction="You are a safety filter. If the text is erotic or explicit, say UNSAFE. If it is textbook/medical, say SAFE."
        ).strip().upper()

        return 'SAFE' in verdict
    except Exception as e:
        logger.error(f"Output moderation failed: {e}")
        return True # Default to True to avoid blocking valid math/science unexpectedly

def is_academic(classification: str) -> bool:
    return classification in ['academic', 'sensitive_academic']
