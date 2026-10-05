import re
from typing import Dict, Any, Tuple
from ai.models_safety import AIContentPolicy, AISafetyPolicy
from courses.models import Content


class FastSafetyClassifier:
    """
    Fast regex-based or lightweight NLP safety classifier.
    """
    UNSAFE_PATTERNS = {
        'adult_content': [r'\b(explicit|porn|nsfw|sex|erotic)\b'],
        'violence': [r'\b(kill|murder|terror|bomb)\b'],
        'hate_speech': [r'\b(slur|hate|racist)\b'],
    }

    @classmethod
    def classify(cls, text: str) -> Tuple[bool, str, str]:
        """
        Returns (is_unsafe, category, risk_level)
        """
        text_lower = text.lower()
        for category, patterns in cls.UNSAFE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    return True, category, 'high'
        return False, '', 'low'


class AcademicContextEngine:
    """
    Validates if a sensitive query has academic justification.
    """
    @classmethod
    def is_academically_justified(cls, query: str, user: Any, course: Any, material: Content) -> bool:
        """
        Checks AIContentPolicy and course context.
        """
        if not material:
            return False
            
        try:
            policy = material.ai_policy
            if policy and policy.allow_sensitive_topic:
                return True
        except Content.ai_policy.RelatedObjectDoesNotExist:
            pass
            
        # Add more logic like checking subject classification
        return False


class GeminiSafetyFallback:
    """
    Fallback safety evaluator using Gemini for ambiguous queries.
    """
    @classmethod
    def evaluate(cls, query: str, context: Dict) -> Tuple[bool, str, str]:
        # This would call the Gemini API in a real implementation
        # For now, it returns a mock safe response
        return False, '', 'low'


class AIModerationLayer:
    """
    Orchestrates the hybrid moderation pipeline.
    """
    @classmethod
    def pre_request_check(cls, query: str, user: Any, course: Any, material: Content) -> Dict[str, Any]:
        """
        Runs before hitting Gemini API.
        """
        is_unsafe, category, risk = FastSafetyClassifier.classify(query)
        
        if is_unsafe:
            # Check for academic exception
            if AcademicContextEngine.is_academically_justified(query, user, course, material):
                return {'action': 'allow', 'reason': 'academic_exception'}
            
            # If not justified, block
            return {
                'action': 'block', 
                'category': category, 
                'risk': risk, 
                'reason': 'safety_violation'
            }
            
        return {'action': 'allow'}

    @classmethod
    def post_response_check(cls, response_text: str) -> Dict[str, Any]:
        """
        Validates Gemini response for leakage.
        """
        is_unsafe, category, risk = FastSafetyClassifier.classify(response_text)
        if is_unsafe:
            return {'action': 'block', 'category': category}
        return {'action': 'allow'}
