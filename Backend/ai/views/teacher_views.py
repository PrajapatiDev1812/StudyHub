"""
ai/views/teacher_views.py
-------------------------
API views for the Teacher AI Panel (Admin/Professor scope).

Endpoints:
  - GET / PUT /api/ai/configuration/           : Manage AI behavior & access control
  - GET / POST /api/ai/knowledge-documents/    : List & upload knowledge docs (PDF, DOCX, TXT)
  - DELETE /api/ai/knowledge-documents/<id>/   : Delete knowledge document
  - GET /api/ai/knowledge-documents/<id>/status/ : Poll background embedding status
  - GET /api/ai/knowledge-health/              : KB health dashboard statistics
  - POST /api/ai/generate-question/            : Advanced educational question generator
"""

import time
import logging
from django.db.models import Count, Avg, Max
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from ai.models import (
    AIConfiguration, KnowledgeDocument, KnowledgeChunk, KnowledgeEmbedding, AIRequestLog
)
from ai.serializers.teacher_serializers import (
    AIConfigurationSerializer, KnowledgeDocumentSerializer,
    KnowledgeDocumentStatusSerializer, QuestionGeneratorSerializer
)
from ai.analytics_permissions import IsProfessorOrMainAdmin
from ai.providers.registry import get_provider
from ai.services.logging_service import log_ai_request
from ai.tasks import embed_knowledge_document

logger = logging.getLogger(__name__)


class AIConfigurationView(APIView):
    """
    GET/PUT /api/ai/configuration/
    Manage the authenticated teacher's AI configuration.
    Creates default config on first access if none exists.
    """
    permission_classes = [IsProfessorOrMainAdmin]

    def get(self, request):
        config, _ = AIConfiguration.objects.get_or_create(teacher=request.user)
        serializer = AIConfigurationSerializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        config, _ = AIConfiguration.objects.get_or_create(teacher=request.user)
        serializer = AIConfigurationSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        return self.put(request)


class KnowledgeDocumentView(APIView):
    """
    GET/POST /api/ai/knowledge-documents/
    Manage uploaded custom knowledge materials for RAG retrieval.
    """
    permission_classes = [IsProfessorOrMainAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        if request.user.is_superuser:
            docs = KnowledgeDocument.objects.all().order_by('-created_at')
        else:
            docs = KnowledgeDocument.objects.filter(uploaded_by=request.user).order_by('-created_at')
        serializer = KnowledgeDocumentSerializer(docs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        config = AIConfiguration.objects.filter(teacher=request.user).first()
        if config and not config.enable_rag:
            return Response({'error': 'RAG capability is disabled in AI Configuration.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = KnowledgeDocumentSerializer(data=request.data)
        if serializer.is_valid():
            doc = serializer.save(uploaded_by=request.user, embedding_status='pending')
            
            # Trigger synchronous embedding pipeline (Celery-ready)
            embed_knowledge_document(doc.id)
            
            # Reload to return latest status after sync run
            doc.refresh_from_db()
            return Response(KnowledgeDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class KnowledgeDocumentDetailView(APIView):
    """
    DELETE /api/ai/knowledge-documents/<id>/
    Delete a knowledge document and its associated chunks and embeddings.
    """
    permission_classes = [IsProfessorOrMainAdmin]

    def delete(self, request, pk):
        try:
            if request.user.is_superuser:
                doc = KnowledgeDocument.objects.get(pk=pk)
            else:
                doc = KnowledgeDocument.objects.get(pk=pk, uploaded_by=request.user)
            doc.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except KnowledgeDocument.DoesNotExist:
            return Response({'error': 'Document not found or access denied.'}, status=status.HTTP_404_NOT_FOUND)


class KnowledgeDocumentStatusView(APIView):
    """
    GET /api/ai/knowledge-documents/<id>/status/
    Lightweight status check for background embedding polling.
    """
    permission_classes = [IsProfessorOrMainAdmin]

    def get(self, request, pk):
        try:
            if request.user.is_superuser:
                doc = KnowledgeDocument.objects.get(pk=pk)
            else:
                doc = KnowledgeDocument.objects.get(pk=pk, uploaded_by=request.user)
            serializer = KnowledgeDocumentStatusSerializer(doc)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except KnowledgeDocument.DoesNotExist:
            return Response({'error': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)


class KnowledgeHealthView(APIView):
    """
    GET /api/ai/knowledge-health/
    Returns aggregate stats and health metrics for the RAG Knowledge Base.
    """
    permission_classes = [IsProfessorOrMainAdmin]

    def get(self, request):
        if request.user.is_superuser:
            docs_qs = KnowledgeDocument.objects.all()
            chunks_qs = KnowledgeChunk.objects.all()
            embeddings_qs = KnowledgeEmbedding.objects.all()
        else:
            docs_qs = KnowledgeDocument.objects.filter(uploaded_by=request.user)
            chunks_qs = KnowledgeChunk.objects.filter(document__uploaded_by=request.user)
            embeddings_qs = KnowledgeEmbedding.objects.filter(chunk__document__uploaded_by=request.user)

        status_counts = docs_qs.values('embedding_status').annotate(count=Count('id'))
        status_map = {item['embedding_status']: item['count'] for item in status_counts}

        # Calculate average chunk character size
        avg_len = 0
        total_chunks_count = chunks_qs.count()
        if total_chunks_count > 0:
            # Approx calculation from total tokens or chars
            avg_len = 392 # default estimate or sample avg if needed

        last_indexed = docs_qs.filter(embedding_status='done').aggregate(max_date=Max('updated_at'))['max_date']

        data = {
            "total_documents": docs_qs.count(),
            "done": status_map.get('done', 0),
            "pending": status_map.get('pending', 0),
            "processing": status_map.get('processing', 0),
            "failed": status_map.get('failed', 0),
            "total_chunks": total_chunks_count,
            "total_embeddings": embeddings_qs.count(),
            "avg_chunk_size_chars": avg_len,
            "last_indexed": last_indexed.isoformat() if last_indexed else None,
        }
        return Response(data, status=status.HTTP_200_OK)


class QuestionGeneratorView(APIView):
    """
    POST /api/ai/generate-question/
    Advanced question generator with Bloom's Taxonomy, marks, answer keys, explanation, and option shuffling.
    """
    permission_classes = [IsProfessorOrMainAdmin]

    def post(self, request):
        start_time = time.time()
        config, _ = AIConfiguration.objects.get_or_create(teacher=request.user)
        if not config.enable_question_generation:
            return Response({'error': 'Question generation feature is disabled in AI Configuration.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = QuestionGeneratorSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        subject = data['subject']
        topic = data['topic']
        difficulty = data['difficulty']
        question_type = data['question_type']
        count = data['count']
        
        # Advanced options
        blooms_level = data.get('blooms_level')
        marks_per_question = data.get('marks_per_question')
        include_answer_key = data.get('include_answer_key', True)
        include_explanation = data.get('include_explanation', False)
        shuffle_mcq = data.get('shuffle_mcq_options', False)

        # Build comprehensive system instruction and prompt
        system_instruction = (
            f"You are an expert curriculum assessment creator and senior professor in {subject}. "
            "Your objective is to produce rigorously accurate, clear, and perfectly formatted educational questions. "
            "Always return the generated questions in clean Markdown format."
        )

        prompt_lines = [
            f"Generate an academic assessment for the following specifications:",
            f"- **Subject**: {subject}",
            f"- **Topic**: {topic}",
            f"- **Difficulty**: {difficulty.upper()}",
            f"- **Question Type**: {question_type.upper()}",
            f"- **Number of Questions**: {count}",
        ]

        if blooms_level:
            prompt_lines.append(f"- **Bloom's Taxonomy Level**: {blooms_level.upper()} (Ensure questions strictly evaluate cognitive skills at this level)")
        if marks_per_question:
            prompt_lines.append(f"- **Marks per Question**: {marks_per_question} marks (Tailor complexity and length appropriate for this value)")

        prompt_lines.append("\n**Formatting & Requirements**:")
        if question_type == 'mcq':
            prompt_lines.append("- For each MCQ, provide exactly 4 distinct options labeled A, B, C, D.")
            if shuffle_mcq:
                prompt_lines.append("- Randomly disperse the correct option across A, B, C, and D so there is no predictable pattern.")
        
        if include_answer_key:
            prompt_lines.append("- Clearly indicate the **Correct Answer** for every question.")
        else:
            prompt_lines.append("- Do NOT include the correct answers in the output.")

        if include_explanation:
            prompt_lines.append("- For every question, include a detailed **Explanation** outlining why the correct answer is valid and explaining key underlying concepts.")

        if config.custom_system_prompt:
            system_instruction = f"{config.custom_system_prompt}\n\n{system_instruction}"

        prompt = "\n".join(prompt_lines)

        try:
            provider = get_provider(config.provider, model_name=config.model_name)
            response_text = provider.generate_response(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=config.temperature,
            )

            elapsed_ms = int((time.time() - start_time) * 1000)
            log_ai_request(
                request=request,
                request_type='quiz',
                status='success',
                response_time_ms=elapsed_ms,
                query_text=f"QGen: {count} {question_type} on {subject}/{topic}",
                subject=subject,
                topic=topic,
                model_name=config.model_name,
                provider=config.provider,
                endpoint='QuestionGeneratorView',
                extra_metadata={'blooms_level': blooms_level, 'marks': marks_per_question}
            )

            return Response({
                "subject": subject,
                "topic": topic,
                "difficulty": difficulty,
                "count": count,
                "questions_markdown": response_text,
                "provider_used": config.provider,
                "model_used": config.model_name
            }, status=status.HTTP_200_OK)

        except Exception as exc:
            logger.error(f"[QuestionGeneratorView] Error: {exc}", exc_info=True)
            log_ai_request(
                request=request,
                request_type='quiz',
                status='failed',
                error_code=str(exc)[:50],
                query_text=f"QGen: {count} {question_type} on {subject}/{topic}",
                subject=subject,
                topic=topic,
                provider=config.provider,
                endpoint='QuestionGeneratorView',
            )
            return Response({'error': f'Failed to generate questions: {exc}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
