import uuid
import time
from typing import Dict, Any, Tuple
from .moderation_service import AIModerationLayer
from .prompt_security import PromptSecurityService
from .quota_service import AIQuotaService
from ai.models_safety import AIGovernanceLog, AISafetyViolationCounter
from courses.models import Content


class AIGovernanceGateway:
    """
    Centralized Gateway for AI Requests.
    Orchestrates RBAC, Quota, Moderation, and RAG.
    """

    @classmethod
    def process_request(cls, user, university, query: str, course=None, material: Content=None, **kwargs) -> Dict[str, Any]:
        """
        Main pipeline for processing an AI request securely.
        """
        request_id = uuid.uuid4()
        start_time = time.time()
        
        # 1. Prompt Security Check (Jailbreak Detection)
        if PromptSecurityService.detect_jailbreak(query):
            cls._log_violation(user, university, 'jailbreak_attempt')
            cls._create_request_log(
                request_id, user, university, 'blocked_safety', query, 
                category='jailbreak', latency_ms=int((time.time() - start_time)*1000)
            )
            return {"error": "Request blocked due to security policy violation.", "status": "blocked"}

        query = PromptSecurityService.sanitize_input(query)

        # 2. AI Moderation Check
        mod_result = AIModerationLayer.pre_request_check(query, user, course, material)
        if mod_result['action'] == 'block':
            cls._log_violation(user, university, mod_result['category'])
            cls._create_request_log(
                request_id, user, university, 'blocked_safety', query, 
                category=mod_result['category'], latency_ms=int((time.time() - start_time)*1000)
            )
            return {"error": "I can only assist with academic questions related to your enrolled courses and approved learning materials.", "status": "blocked"}

        # 3. Quota Verification
        quota_result = AIQuotaService.check_quota(user)
        if not quota_result.allowed:
            cls._create_request_log(
                request_id, user, university, 'blocked_quota', query, 
                latency_ms=int((time.time() - start_time)*1000)
            )
            return {"error": "AI Quota Exceeded.", "status": "blocked"}

        # 4. RAG Retrieval (Mocked for now)
        # retrieved_docs = RAGEngine.search(query, course)
        retrieved_docs = []

        # 5. Gemini API Call
        # gemini_response = GeminiClient.generate(query, retrieved_docs)
        gemini_response = "Mock AI Response"

        # 6. Response Safety Validation
        post_mod_result = AIModerationLayer.post_response_check(gemini_response)
        if post_mod_result['action'] == 'block':
            cls._create_request_log(
                request_id, user, university, 'blocked_safety', query, 
                category=post_mod_result['category'], latency_ms=int((time.time() - start_time)*1000),
                quota_consumed=False  # User said "Blocked requests do NOT consume quota"
            )
            return {"error": "The generated response was blocked by safety policies.", "status": "blocked"}

        # Consume quota on success
        AIQuotaService.consume_quota(user, tokens_used=10) # Mock 10 tokens

        # 7. Finalize and Log
        latency = int((time.time() - start_time) * 1000)
        cls._create_request_log(
            request_id, user, university, 'success', query, 
            latency_ms=latency, quota_consumed=True
        )

        return {"response": gemini_response, "status": "success"}

    @classmethod
    def _log_violation(cls, user, university, violation_type):
        if not user or not university:
            return
        counter, created = AISafetyViolationCounter.objects.get_or_create(
            user=user, university=university, violation_type=violation_type
        )
        counter.violation_count += 1
        counter.save()

    @classmethod
    def _create_request_log(cls, request_id, user, university, status, query, category=None, latency_ms=0, quota_consumed=False):
        try:
            AIGovernanceLog.objects.create(
                id=request_id,
                user=user,
                university=university,
                request_status=status,
                quota_consumed=quota_consumed,
                safety_category=category,
                latency_ms=latency_ms
            )
        except Exception as e:
            # Silently fail logging in production to avoid blocking the request
            print(f"Failed to create request log: {e}")
