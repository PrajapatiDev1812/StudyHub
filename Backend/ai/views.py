import os
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from courses.models import Content

from .models import StudentNote
from .serializers import (
    ChatRequestSerializer,
    DebugRetrievalRequestSerializer,
    StudentNoteSerializer,
)
from .retrieval import retrieve_relevant_chunks
from .prompts import BASE_SYSTEM_INSTRUCTION, build_rag_prompt, MODE_PROMPTS
from .gemini_client import generate_response, is_configured
from .embeddings import embed_admin_content, embed_student_note

logger = logging.getLogger(__name__)

# Read debug flag from environment
DEBUG_RAG = os.getenv('DEBUG_RAG', 'False').lower() in ('true', '1', 'yes')


class ChatbotView(APIView):
    """
    POST /api/ai/chat/

    Main RAG-powered AI chatbot.
    Accepts: message, mode, level, subject, topic, debug
    Returns: AI response + optional debug info
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        message = data['message'].strip()
        mode = data['mode']
        level = data['level']
        subject = data.get('subject', '')
        topic = data.get('topic', '')
        show_debug = data.get('debug', False) or DEBUG_RAG

        # ── Step 1: Retrieve relevant chunks ──
        retrieval = retrieve_relevant_chunks(
            query=message,
            user=request.user,
            top_k_admin=5,
            top_k_student=3,
        )

        admin_chunks = retrieval['admin_chunks']
        student_chunks = retrieval['student_chunks']
        fallback_used = len(admin_chunks) == 0 and len(student_chunks) == 0

        # Debug logging
        if show_debug:
            logger.info(f"── RAG Debug ──")
            logger.info(f"Query: {message[:80]}")
            logger.info(f"Mode: {mode} | Level: {level}")
            logger.info(f"Admin chunks: {len(admin_chunks)}")
            for c in admin_chunks:
                logger.info(f"  [{c['score']}] {c['source']}: {c['text'][:80]}...")
            logger.info(f"Student chunks: {len(student_chunks)}")
            for c in student_chunks:
                logger.info(f"  [{c['score']}] {c['source']}: {c['text'][:80]}...")
            logger.info(f"Fallback: {fallback_used}")

        # ── Step 2: Build prompt ──
        prompt = build_rag_prompt(
            message=message,
            admin_chunks=admin_chunks,
            student_chunks=student_chunks,
            mode=mode,
            level=level,
            subject=subject,
            topic=topic,
        )

        # ── Step 3: Call Gemini ──
        ai_response = generate_response(
            prompt=prompt,
            system_instruction=BASE_SYSTEM_INSTRUCTION,
        )

        # ── Step 4: Build response ──
        response_data = {
            'response': ai_response,
        }

        if show_debug:
            response_data['debug'] = {
                'mode_used': mode,
                'level': level,
                'admin_chunks_used': len(admin_chunks),
                'student_chunks_used': len(student_chunks),
                'fallback_used': fallback_used,
                'gemini_configured': is_configured(),
                'retrieved_chunks': [
                    {
                        'text': c['text'][:200] + '...' if len(c['text']) > 200 else c['text'],
                        'source': c['source'],
                        'similarity_score': c['score'],
                        **({
                            'course': c.get('course', ''),
                            'topic': c.get('topic', ''),
                        } if c['source'] == 'admin' else {
                            'title': c.get('title', ''),
                        }),
                    }
                    for c in retrieval['all_chunks']
                ],
            }

        return Response(response_data)


class SummaryView(APIView):
    """
    POST /api/ai/summary/
    AI-powered content summarizer using Gemini.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        content_id = request.data.get('content_id')
        if not content_id:
            return Response(
                {'error': 'content_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            content = Content.objects.get(id=content_id)
        except Content.DoesNotExist:
            return Response(
                {'error': 'Content not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        text = content.text_content or ''
        if not text.strip():
            return Response({
                'content_id': content.id,
                'title': content.title,
                'summary': 'No text content available to summarize.',
            })

        prompt = (
            f"Summarize the following study material in clear, concise bullet points. "
            f"Keep it educational and structured:\n\n{text[:3000]}"
        )

        ai_summary = generate_response(
            prompt=prompt,
            system_instruction=BASE_SYSTEM_INSTRUCTION,
        )

        return Response({
            'content_id': content.id,
            'title': content.title,
            'summary': ai_summary,
        })


class DebugRetrievalView(APIView):
    """
    POST /api/debug/retrieval/
    Debug endpoint: returns retrieved chunks WITHOUT calling Gemini.
    Shows similarity scores and source types.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DebugRetrievalRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        query = serializer.validated_data['query']

        retrieval = retrieve_relevant_chunks(
            query=query,
            user=request.user,
        )

        return Response({
            'query': query,
            'total_chunks_found': len(retrieval['all_chunks']),
            'admin_chunks': [
                {
                    'chunk_id': c['chunk_id'],
                    'text': c['text'],
                    'similarity_score': c['score'],
                    'course': c.get('course', ''),
                    'subject': c.get('subject', ''),
                    'topic': c.get('topic', ''),
                }
                for c in retrieval['admin_chunks']
            ],
            'student_chunks': [
                {
                    'chunk_id': c['chunk_id'],
                    'text': c['text'],
                    'similarity_score': c['score'],
                    'title': c.get('title', ''),
                }
                for c in retrieval['student_chunks']
            ],
        })


class EmbedAdminContentView(APIView):
    """
    POST /api/ai/embed-content/<id>/
    Admin triggers embedding generation for a specific Content item.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, content_id):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can embed content.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            content = Content.objects.get(id=content_id)
        except Content.DoesNotExist:
            return Response(
                {'error': 'Content not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not is_configured():
            return Response(
                {'error': 'Gemini API key not configured. Set GEMINI_API_KEY in .env'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        chunks_created = embed_admin_content(content)
        return Response({
            'message': f'Embedded "{content.title}" into {chunks_created} chunks.',
            'content_id': content.id,
            'chunks_created': chunks_created,
        })


# ─────────────────────────────────────────────
# Student Notes CRUD
# ─────────────────────────────────────────────

class StudentNoteListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/ai/student-notes/     — List student's notes
    POST /api/ai/student-notes/     — Create a note (auto-embeds)
    """
    serializer_class = StudentNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudentNote.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        note = serializer.save(user=self.request.user)
        # Auto-embed if API key is available
        if is_configured():
            try:
                embed_student_note(note)
            except Exception as e:
                logger.warning(f"Auto-embed failed for note {note.id}: {e}")


class StudentNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/ai/student-notes/<id>/
    PUT    /api/ai/student-notes/<id>/
    DELETE /api/ai/student-notes/<id>/
    """
    serializer_class = StudentNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudentNote.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        note = serializer.save()
        # Re-embed on content change
        if is_configured():
            try:
                embed_student_note(note)
            except Exception as e:
                logger.warning(f"Re-embed failed for note {note.id}: {e}")
