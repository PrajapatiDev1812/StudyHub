"""
ai/views/session_action_views.py
---------------------------------
Teacher Workspace — per-session action endpoints.

  POST /api/ai/sessions/<uuid>/pin/       — toggle pin
  POST /api/ai/sessions/<uuid>/archive/   — toggle archive
  POST /api/ai/sessions/<uuid>/duplicate/ — deep copy session + messages
  POST /api/ai/sessions/<uuid>/share/     — generate share token
  POST /api/ai/sessions/<uuid>/export/    — return TXT / Markdown / PDF
  GET  /api/ai/sessions/search/           — full-text search
  GET  /api/ai/sessions/teacher/          — teacher-scoped session list
"""

import io
import logging
# pyrefly: ignore [missing-import]
from datetime import timedelta, datetime, timezone
# pyrefly: ignore [missing-import]
from django.shortcuts import get_object_or_404
# pyrefly: ignore [missing-import]
from django.utils import timezone as tz
# pyrefly: ignore [missing-import]
from django.db import models as db_models
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin
from ai.models import ChatSession, ChatMessage

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def _teacher_session(request, session_id):
    """Return the session, ensuring it belongs to the current teacher."""
    return get_object_or_404(ChatSession, id=session_id, user=request.user)


def _session_to_text(session, messages):
    """Render a session as plain text."""
    lines = [
        f"StudyHub AI Conversation",
        f"========================",
        f"Title   : {session.title}",
        f"Mode    : {session.get_mode_display()}",
        f"Subject : {session.subject.name if session.subject else '—'}",
        f"Topic   : {session.topic.name   if session.topic   else '—'}",
        f"Created : {session.created_at.strftime('%Y-%m-%d %H:%M')}",
        f"Messages: {len(messages)}",
        f"",
    ]
    for msg in messages:
        role = "Teacher" if msg.role == "user" else "AI"
        ts   = msg.created_at.strftime('%H:%M')
        lines.append(f"[{ts}] {role}:")
        lines.append(msg.content)
        lines.append("")
    return "\n".join(lines)


def _session_to_markdown(session, messages):
    """Render a session as Markdown."""
    lines = [
        f"# {session.title}",
        f"",
        f"| Field | Value |",
        f"|---|---|",
        f"| **Mode** | {session.get_mode_display()} |",
        f"| **Subject** | {session.subject.name if session.subject else '—'} |",
        f"| **Topic** | {session.topic.name   if session.topic   else '—'} |",
        f"| **Created** | {session.created_at.strftime('%Y-%m-%d %H:%M')} |",
        f"| **Messages** | {len(messages)} |",
        f"",
        f"---",
        f"",
    ]
    for msg in messages:
        role  = "**Teacher**" if msg.role == "user" else "**🤖 StudyHub AI**"
        ts    = msg.created_at.strftime('%H:%M')
        lines.append(f"### {role} _{ts}_")
        lines.append(msg.content)
        lines.append("")
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# Views
# ─────────────────────────────────────────────────────────────

class TeacherChatSessionListView(APIView):
    """
    GET /api/ai/chat-sessions/
    Returns all chat sessions for the current teacher (admin role),
    excluding archived by default unless ?archived=true is passed.
    Supports ?search= and ?subject= filters.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # pyrefly: ignore [missing-import]
        from ai.serializers.workspace_serializers import TeacherChatSessionSerializer
        # Exclude soft-deleted sessions
        qs = ChatSession.objects.filter(user=request.user, is_deleted=False)

        show_archived = request.query_params.get('archived', '').lower() == 'true'
        if show_archived:
            qs = qs.filter(is_archived=True)
        else:
            qs = qs.exclude(is_archived=True)

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                db_models.Q(title__icontains=search) |
                db_models.Q(messages__content__icontains=search)
            ).distinct()

        subject_id = request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        qs = qs.select_related('subject', 'topic').prefetch_related('tags')
        serializer = TeacherChatSessionSerializer(qs, many=True)
        return Response(serializer.data)


class ChatSessionPinView(APIView):
    """POST /api/ai/sessions/<uuid>/pin/ — toggle pin."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        session = _teacher_session(request, session_id)
        session.is_pinned = not session.is_pinned
        session.save(update_fields=['is_pinned'])
        return Response({'is_pinned': session.is_pinned})


class ChatSessionArchiveView(APIView):
    """POST /api/ai/sessions/<uuid>/archive/ — toggle archive."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        session = _teacher_session(request, session_id)
        session.is_archived = not session.is_archived
        session.save(update_fields=['is_archived'])
        return Response({'is_archived': session.is_archived})


class ChatSessionDuplicateView(APIView):
    """POST /api/ai/sessions/<uuid>/duplicate/ — deep copy session + messages."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        original = _teacher_session(request, session_id)
        messages = list(original.messages.order_by('created_at'))

        # Create copy
        copy = ChatSession.objects.create(
            user        = request.user,
            title       = f"{original.title} (Copy)",
            mode        = original.mode,
            level       = original.level,
            subject     = original.subject,
            topic       = original.topic,
            is_pinned   = False,
            is_archived = False,
            is_shared   = False,
        )

        # Copy messages
        for msg in messages:
            ChatMessage.objects.create(
                session  = copy,
                role     = msg.role,
                content  = msg.content,
                feedback = None,
            )

        # pyrefly: ignore [missing-import]
        from ai.serializers.workspace_serializers import TeacherChatSessionSerializer
        return Response(TeacherChatSessionSerializer(copy).data, status=status.HTTP_201_CREATED)


class ChatSessionShareView(APIView):
    """POST /api/ai/sessions/<uuid>/share/ — generate share token."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        session = _teacher_session(request, session_id)
        sharing_level = request.data.get('sharing_level', 'private')

        if sharing_level not in ('private', 'institution', 'public'):
            return Response(
                {'error': 'Invalid sharing_level. Choose: private, institution, public.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if sharing_level == 'private':
            # Remove share
            session.is_shared     = False
            session.sharing_level = 'private'
            session.share_token   = None
            session.save(update_fields=['is_shared', 'sharing_level', 'share_token'])
            return Response({'is_shared': False, 'sharing_level': 'private', 'share_token': None})

        token = session.generate_share_token()
        session.sharing_level = sharing_level
        session.save(update_fields=['sharing_level'])
        share_url = f"{request.build_absolute_uri('/').rstrip('/')}shared/chat/{token}/"
        return Response({
            'is_shared':     True,
            'sharing_level': sharing_level,
            'share_token':   token,
            'share_url':     share_url,
        })


class ChatSessionExportView(APIView):
    """POST /api/ai/sessions/<uuid>/export/ — return as TXT, Markdown, or PDF."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        session  = _teacher_session(request, session_id)
        fmt      = request.data.get('format', 'txt').lower()
        messages = list(session.messages.order_by('created_at'))

        if fmt == 'txt':
            content  = _session_to_text(session, messages)
            filename = f"{session.title[:60]}.txt"
            return Response({
                'filename': filename,
                'content':  content,
                'format':   'txt',
            })

        elif fmt == 'md' or fmt == 'markdown':
            content  = _session_to_markdown(session, messages)
            filename = f"{session.title[:60]}.md"
            return Response({
                'filename': filename,
                'content':  content,
                'format':   'markdown',
            })

        elif fmt == 'pdf':
            try:
                from reportlab.lib.pagesizes import A4
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import cm
                from reportlab.lib import colors
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
                import base64

                buf = io.BytesIO()
                doc = SimpleDocTemplate(buf, pagesize=A4,
                                        leftMargin=2*cm, rightMargin=2*cm,
                                        topMargin=2*cm, bottomMargin=2*cm)
                styles = getSampleStyleSheet()

                title_style = ParagraphStyle('Title2', parent=styles['Title'],
                                             fontSize=18, spaceAfter=6,
                                             textColor=colors.HexColor('#6c63ff'))
                meta_style  = ParagraphStyle('Meta', parent=styles['Normal'],
                                             fontSize=9, textColor=colors.HexColor('#888888'))
                user_style  = ParagraphStyle('UserMsg', parent=styles['Normal'],
                                             fontSize=10, leftIndent=0,
                                             textColor=colors.HexColor('#1a1a2e'),
                                             backColor=colors.HexColor('#f0f0ff'),
                                             borderPad=4)
                ai_style    = ParagraphStyle('AiMsg', parent=styles['Normal'],
                                             fontSize=10,
                                             textColor=colors.HexColor('#1a1a2e'))

                story = []
                story.append(Paragraph(session.title, title_style))
                story.append(Spacer(1, 0.2*cm))

                meta = (f"Mode: {session.get_mode_display()} | "
                        f"Subject: {session.subject.name if session.subject else '—'} | "
                        f"Topic: {session.topic.name if session.topic else '—'} | "
                        f"Created: {session.created_at.strftime('%Y-%m-%d %H:%M')}")
                story.append(Paragraph(meta, meta_style))
                story.append(HRFlowable(width="100%", thickness=1,
                                         color=colors.HexColor('#6c63ff'), spaceAfter=12))

                for msg in messages:
                    role     = "Teacher" if msg.role == "user" else "🤖 StudyHub AI"
                    ts       = msg.created_at.strftime('%H:%M')
                    label    = f"<b>{role}</b> <font size='8' color='#888888'>{ts}</font>"
                    sty      = user_style if msg.role == "user" else ai_style
                    safe_txt = msg.content.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    story.append(Paragraph(label, styles['Normal']))
                    story.append(Paragraph(safe_txt, sty))
                    story.append(Spacer(1, 0.4*cm))

                doc.build(story)
                pdf_bytes = buf.getvalue()
                pdf_b64   = base64.b64encode(pdf_bytes).decode('utf-8')
                filename  = f"{session.title[:60]}.pdf"
                return Response({'filename': filename, 'content_b64': pdf_b64, 'format': 'pdf'})

            except ImportError:
                # reportlab not available — return markdown as fallback
                content  = _session_to_markdown(session, messages)
                filename = f"{session.title[:60]}.md"
                return Response({
                    'filename': filename,
                    'content':  content,
                    'format':   'markdown',
                    'note':     'PDF generation requires reportlab. Returned Markdown instead.',
                })
        else:
            return Response(
                {'error': 'Invalid format. Choose: txt, md, pdf.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ChatSessionSearchView(APIView):
    """
    GET /api/ai/sessions/search/?q=<query>
    Full-text search across session titles and message content.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # pyrefly: ignore [missing-import]
        from ai.serializers.workspace_serializers import TeacherChatSessionSerializer
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])

        sessions = ChatSession.objects.filter(
            user=request.user,
            is_archived=False,
        ).filter(
            db_models.Q(title__icontains=query) |
            db_models.Q(messages__content__icontains=query)
        ).select_related('subject', 'topic').prefetch_related('tags').distinct()

        serializer = TeacherChatSessionSerializer(sessions, many=True)
        return Response(serializer.data)
