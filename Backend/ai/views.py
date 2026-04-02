import os
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from courses.models import Content

from .models import StudentNote, ChatSession, ChatMessage, ChatAttachment
from .serializers import (
    ChatRequestSerializer,
    DebugRetrievalRequestSerializer,
    StudentNoteSerializer,
    ChatSessionSerializer,
    ChatSessionUpdateSerializer,
    ChatMessageSerializer,
    MessageFeedbackSerializer,
)
from .retrieval import retrieve_relevant_chunks
from .prompts import BASE_SYSTEM_INSTRUCTION, build_rag_prompt, MODE_PROMPTS
from .gemini_client import generate_response, is_configured
from .embeddings import embed_admin_content, embed_student_note
from .throttles import AIDailyThrottle, AIBurstThrottle, AIAnonThrottle
from .services.ai_usage import increment_usage, get_usage_summary
from .services.ai_prompt_builder import build_prompt

logger = logging.getLogger(__name__)

# Read debug flag from environment
DEBUG_RAG = os.getenv('DEBUG_RAG', 'False').lower() in ('true', '1', 'yes')


def _generate_chat_title(message: str) -> str:
    """Use Gemini to generate a short title for a chat session."""
    try:
        prompt = (
            f"Generate a very short title (max 6 words) for a chat that starts with "
            f"this question. Return ONLY the title, no quotes, no explanation:\n\n"
            f"{message[:200]}"
        )
        title = generate_response(prompt=prompt, system_instruction="You are a title generator. Return only the title text, nothing else.")
        # Clean up: remove quotes, newlines, limit length
        title = title.strip().strip('"\'').strip()
        if len(title) > 80:
            title = title[:77] + '...'
        return title or message[:50]
    except Exception:
        # Fallback: use first 50 chars of message
        return message[:50] + ('...' if len(message) > 50 else '')


class ChatbotView(APIView):
    """
    POST /api/ai/chat/

    Main RAG-powered AI chatbot.
    Accepts: message, mode, level, subject, topic, debug, session_id
    Returns: AI response + session info + optional debug info

    Throttle limits (configured in settings.DEFAULT_THROTTLE_RATES):
      - Students : 50 req/day + 5 req/min burst
      - Admins   : 100 req/day (no burst limit)
      - Anonymous: 5 req/day
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIDailyThrottle, AIBurstThrottle, AIAnonThrottle]

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
        session_id = data.get('session_id')

        # ── Session Management ──
        session = None
        is_new_session = False

        if session_id:
            # Continue existing session
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            except ChatSession.DoesNotExist:
                return Response(
                    {'error': 'Chat session not found.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            # Create a new session
            session = ChatSession.objects.create(
                user=request.user,
                title='New Chat',
                mode=mode,
                level=level,
            )
            is_new_session = True

        # Save user message
        user_msg = ChatMessage.objects.create(
            session=session,
            role='user',
            content=message,
        )

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
            logger.info(f"-- RAG Debug --")
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
        prompt = build_prompt(
            user_message=message,
            mode=mode,
            level=level,
            subject=subject,
            topic=topic,
            admin_chunks=admin_chunks,
            student_chunks=student_chunks,
        )

        # ── Step 3: Call Gemini ──
        ai_response = generate_response(
            prompt=prompt,
            system_instruction=BASE_SYSTEM_INSTRUCTION,
        )

        # Save AI response
        ai_msg = ChatMessage.objects.create(
            session=session,
            role='ai',
            content=ai_response,
        )

        # Auto-generate title for new sessions
        if is_new_session:
            title = _generate_chat_title(message)
            session.title = title
            session.save(update_fields=['title'])

        # Update session timestamp
        session.save(update_fields=['updated_at'])

        # ── Step 4: Track usage (only after successful AI response) ──
        increment_usage(request.user)
        usage_summary = get_usage_summary(request.user)

        # ── Step 5: Build response ──
        response_data = {
            'reply': ai_response,
            'session_id': str(session.id),
            'session_title': session.title,
            'message_id': ai_msg.id,
            'is_new_session': is_new_session,
            'usage': usage_summary,
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


# ─────────────────────────────────────────────
# Chat Session CRUD
# ─────────────────────────────────────────────

class ChatSessionListView(APIView):
    """
    GET /api/ai/sessions/
    Returns all chat sessions for the current user, ordered by pinned + recent.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = ChatSession.objects.filter(user=request.user)
        serializer = ChatSessionSerializer(sessions, many=True)
        return Response(serializer.data)


class ChatSessionDetailView(APIView):
    """
    GET    /api/ai/sessions/<uuid>/         — Get session details
    PATCH  /api/ai/sessions/<uuid>/         — Rename, pin/unpin
    DELETE /api/ai/sessions/<uuid>/         — Delete session
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        serializer = ChatSessionSerializer(session)
        return Response(serializer.data)

    def patch(self, request, session_id):
        session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        serializer = ChatSessionUpdateSerializer(session, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ChatSessionSerializer(session).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, session_id):
        session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatSessionMessagesView(APIView):
    """
    GET /api/ai/sessions/<uuid>/messages/
    Returns all messages in a session, ordered chronologically.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        messages = ChatMessage.objects.filter(session=session).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)


class MessageFeedbackView(APIView):
    """
    PATCH /api/ai/messages/<id>/feedback/
    Set thumbs up/down feedback on an AI message.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, message_id):
        message = get_object_or_404(
            ChatMessage, id=message_id, session__user=request.user, role='ai'
        )
        serializer = MessageFeedbackSerializer(data=request.data)
        if serializer.is_valid():
            feedback_val = serializer.validated_data['feedback']
            message.feedback = feedback_val if feedback_val else None
            message.save(update_fields=['feedback'])
            return Response({'status': 'ok', 'feedback': message.feedback})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatFileUploadView(APIView):
    """
    POST /api/ai/upload/
    Upload a file (image, PDF, Word doc, PPT, video) for use in chat.
    Returns file info that the frontend can attach to a chat message.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response(
                {'error': 'No file provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Determine file type
        name = uploaded_file.name.lower()
        if name.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp')):
            file_type = 'image'
        elif name.endswith('.pdf'):
            file_type = 'pdf'
        elif name.endswith(('.doc', '.docx')):
            file_type = 'doc'
        elif name.endswith(('.ppt', '.pptx')):
            file_type = 'ppt'
        elif name.endswith(('.mp4', '.avi', '.mkv', '.mov', '.webm')):
            file_type = 'video'
        else:
            file_type = 'other'

        # We'll create a temporary attachment (no message yet)
        # The frontend will reference this when sending the chat message
        from django.core.files.storage import default_storage
        path = default_storage.save(
            f'chat_attachments/{request.user.id}/{uploaded_file.name}',
            uploaded_file,
        )

        return Response({
            'file_path': path,
            'file_name': uploaded_file.name,
            'file_type': file_type,
            'file_size': uploaded_file.size,
            'url': f'/media/{path}',
        })


# ─────────────────────────────────────────────
# Existing Views (preserved)
# ─────────────────────────────────────────────

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
    GET  /api/ai/student-notes/     -- List student's notes
    POST /api/ai/student-notes/     -- Create a note (auto-embeds)
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
