"""
ai/views/educational_action_views.py
-------------------------------------
StudyHub-exclusive educational actions for the Teacher AI Workspace.

All endpoints require IsAuthenticated + IsAdmin.
All AI-generated content starts as 'draft' — never auto-published.

Endpoints:
  POST /api/ai/sessions/<uuid>/educational/save-notes/
  POST /api/ai/sessions/<uuid>/educational/generate-quiz/
  POST /api/ai/sessions/<uuid>/educational/generate-flashcards/
  POST /api/ai/sessions/<uuid>/educational/convert-material/
  POST /api/ai/sessions/<uuid>/educational/generate-assignment/
  POST /api/ai/sessions/<uuid>/educational/blooms-questions/
  POST /api/ai/sessions/<uuid>/educational/student-insight/

  GET  /api/ai/generated-content/           — list all generated content
  PATCH /api/ai/generated-content/<id>/     — update status / title
  DELETE /api/ai/generated-content/<id>/    — delete draft

  GET  /api/ai/prompt-templates/            — list templates
  POST /api/ai/prompt-templates/            — create template
  DELETE /api/ai/prompt-templates/<id>/     — delete template

  GET  /api/ai/conversation-tags/           — list tags
  POST /api/ai/conversation-tags/           — create tag
  DELETE /api/ai/conversation-tags/<id>/    — delete tag
"""

import json
import logging
# pyrefly: ignore [missing-import]
from django.shortcuts import get_object_or_404
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated
# pyrefly: ignore [missing-import]
from accounts.permissions import IsAdmin
from ai.models import ChatSession, ChatMessage, AIGeneratedContent, PromptTemplate, ConversationTag
from ai.gemini_client import generate_response

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def _get_teacher_session(request, session_id):
    return get_object_or_404(ChatSession, id=session_id, user=request.user)


def _get_conversation_text(session):
    """Return the full conversation as a readable text block."""
    messages = session.messages.order_by('created_at')
    parts = []
    for msg in messages:
        role = "Teacher" if msg.role == "user" else "AI"
        parts.append(f"{role}: {msg.content}")
    return "\n\n".join(parts)


def _ai_generate(prompt, temperature=0.4):
    """Wrapper around the existing Gemini client."""
    return generate_response(
        prompt=prompt,
        system_instruction="You are an expert educational content creator. Return structured, high-quality content.",
        temperature=temperature,
    )


# ─────────────────────────────────────────────────────────────
# Educational Action Views
# ─────────────────────────────────────────────────────────────

class SaveAsNotesView(APIView):
    """POST /api/ai/sessions/<uuid>/educational/save-notes/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        session = _get_teacher_session(request, session_id)
        conv    = _get_conversation_text(session)

        course_id  = request.data.get('course_id')
        subject_id = request.data.get('subject_id') or (session.subject_id if session.subject else None)
        topic_id   = request.data.get('topic_id')   or (session.topic_id   if session.topic   else None)

        prompt = f"""Convert the following educational conversation into well-structured study notes.
Format with clear headings, bullet points, key concepts, and a brief summary.

Conversation:
{conv}

Return ONLY the formatted study notes. Use markdown."""

        try:
            notes_content = _ai_generate(prompt, temperature=0.3)
            title = f"Notes: {session.title}"

            content_obj = AIGeneratedContent.objects.create(
                teacher        = request.user,
                content_type   = 'notes',
                title          = title,
                content        = notes_content,
                source_session = session,
                course_id      = course_id,
                subject_id     = subject_id,
                topic_id       = topic_id,
                status         = 'draft',
                metadata       = {'source': 'save_as_notes'},
            )

            from ai.serializers.workspace_serializers import AIGeneratedContentSerializer
            return Response(AIGeneratedContentSerializer(content_obj).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"SaveAsNotes failed: {e}")
            return Response({'error': 'Failed to generate notes.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateQuizView(APIView):
    """POST /api/ai/sessions/<uuid>/educational/generate-quiz/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        session         = _get_teacher_session(request, session_id)
        conv            = _get_conversation_text(session)
        question_type   = request.data.get('question_type', 'mcq')
        difficulty      = request.data.get('difficulty', 'medium')
        question_count  = int(request.data.get('question_count', 5))
        subject_id      = request.data.get('subject_id') or (session.subject_id if session.subject else None)
        topic_id        = request.data.get('topic_id')   or (session.topic_id   if session.topic   else None)

        type_instructions = {
            'mcq':          'multiple choice questions (4 options, mark the correct one)',
            'short_answer': 'short answer questions (1-3 sentence answers)',
            'long_answer':  'long answer / essay questions',
            'case_study':   'case study based questions with scenario',
        }
        type_desc = type_instructions.get(question_type, 'multiple choice questions')

        prompt = f"""Based on the following educational conversation, generate exactly {question_count} {type_desc}.
Difficulty level: {difficulty}

Conversation:
{conv}

Return a JSON array with objects containing:
- "question": the question text
- "type": "{question_type}"
- "difficulty": "{difficulty}"
- {"\"options\": [\"A\", \"B\", \"C\", \"D\"], \"correct_answer\": \"A\"," if question_type == 'mcq' else "\"answer_hint\": brief answer guide,"}
- "bloom_level": one of [remember, understand, apply, analyze, evaluate, create]

Return ONLY valid JSON, no markdown wrapper."""

        try:
            raw = _ai_generate(prompt, temperature=0.5)
            # Try to parse JSON; if it fails, return raw with a flag
            try:
                questions = json.loads(raw)
            except Exception:
                # Strip markdown code fences if present
                clean = raw.strip().lstrip('```json').lstrip('```').rstrip('```').strip()
                try:
                    questions = json.loads(clean)
                except Exception:
                    questions = raw  # return as raw text

            title = f"Quiz: {session.title}"
            content_obj = AIGeneratedContent.objects.create(
                teacher        = request.user,
                content_type   = 'quiz',
                title          = title,
                content        = json.dumps(questions) if isinstance(questions, (list, dict)) else questions,
                source_session = session,
                subject_id     = subject_id,
                topic_id       = topic_id,
                status         = 'draft',
                metadata       = {
                    'question_type':  question_type,
                    'difficulty':     difficulty,
                    'question_count': question_count,
                },
            )

            from ai.serializers.workspace_serializers import AIGeneratedContentSerializer
            return Response({
                **AIGeneratedContentSerializer(content_obj).data,
                'questions': questions,
                'requires_review': True,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"GenerateQuiz failed: {e}")
            return Response({'error': 'Failed to generate quiz.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateFlashcardsView(APIView):
    """POST /api/ai/sessions/<uuid>/educational/generate-flashcards/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        session    = _get_teacher_session(request, session_id)
        conv       = _get_conversation_text(session)
        card_count = int(request.data.get('card_count', 10))
        subject_id = request.data.get('subject_id') or (session.subject_id if session.subject else None)

        prompt = f"""Extract key concepts from the following educational conversation and create {card_count} flashcards.

Conversation:
{conv}

Return a JSON array with objects:
- "front": the question or concept (concise, 1-2 sentences)
- "back": the answer or explanation (clear, 2-4 sentences)
- "difficulty": easy | medium | hard
- "topic_tag": brief topic label

Return ONLY valid JSON array, no markdown wrapper."""

        try:
            raw = _ai_generate(prompt, temperature=0.4)
            try:
                cards = json.loads(raw)
            except Exception:
                clean = raw.strip().lstrip('```json').lstrip('```').rstrip('```').strip()
                try:
                    cards = json.loads(clean)
                except Exception:
                    cards = raw

            title = f"Flashcards: {session.title}"
            content_obj = AIGeneratedContent.objects.create(
                teacher        = request.user,
                content_type   = 'flashcards',
                title          = title,
                content        = json.dumps(cards) if isinstance(cards, (list, dict)) else cards,
                source_session = session,
                subject_id     = subject_id,
                status         = 'draft',
                metadata       = {'card_count': card_count},
            )

            from ai.serializers.workspace_serializers import AIGeneratedContentSerializer
            return Response({
                **AIGeneratedContentSerializer(content_obj).data,
                'flashcards': cards,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"GenerateFlashcards failed: {e}")
            return Response({'error': 'Failed to generate flashcards.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConvertToMaterialView(APIView):
    """POST /api/ai/sessions/<uuid>/educational/convert-material/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        session    = _get_teacher_session(request, session_id)
        conv       = _get_conversation_text(session)
        course_id  = request.data.get('course_id')
        subject_id = request.data.get('subject_id') or (session.subject_id if session.subject else None)
        topic_id   = request.data.get('topic_id')   or (session.topic_id   if session.topic   else None)

        prompt = f"""Transform the following educational conversation into formal lecture notes / teaching material.

Structure with:
# Topic Heading
## Learning Objectives (3-5 bullet points)
## Key Concepts (with clear explanations)
## Examples (concrete examples for each concept)
## Key Takeaways (summary)
## Further Reading (2-3 suggested topics)

Conversation:
{conv}

Return ONLY the formatted lecture notes in markdown."""

        try:
            material = _ai_generate(prompt, temperature=0.35)
            title = f"Lecture: {session.title}"
            content_obj = AIGeneratedContent.objects.create(
                teacher        = request.user,
                content_type   = 'lecture_material',
                title          = title,
                content        = material,
                source_session = session,
                course_id      = course_id,
                subject_id     = subject_id,
                topic_id       = topic_id,
                status         = 'draft',
                metadata       = {'source': 'convert_material'},
            )

            from ai.serializers.workspace_serializers import AIGeneratedContentSerializer
            return Response(AIGeneratedContentSerializer(content_obj).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"ConvertToMaterial failed: {e}")
            return Response({'error': 'Failed to convert to material.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateAssignmentView(APIView):
    """POST /api/ai/sessions/<uuid>/educational/generate-assignment/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        session    = _get_teacher_session(request, session_id)
        conv       = _get_conversation_text(session)
        course_id  = request.data.get('course_id')
        subject_id = request.data.get('subject_id') or (session.subject_id if session.subject else None)
        topic_id   = request.data.get('topic_id')   or (session.topic_id   if session.topic   else None)
        difficulty = request.data.get('difficulty', 'medium')
        due_days   = request.data.get('due_days', 7)

        prompt = f"""Create a comprehensive student assignment based on the following educational conversation.
Difficulty: {difficulty} | Estimated completion: {due_days} days

Include:
# Assignment Title
## Instructions (clear step-by-step)
## Learning Outcomes (what students will demonstrate)
## Tasks (3-5 numbered tasks with clear descriptions)
## Submission Guidelines (format, length, deadline format)
## Grading Rubric (criteria and marks breakdown totaling 100)

Conversation:
{conv}

Return ONLY the assignment in markdown format."""

        try:
            assignment = _ai_generate(prompt, temperature=0.4)
            title = f"Assignment: {session.title}"
            content_obj = AIGeneratedContent.objects.create(
                teacher        = request.user,
                content_type   = 'assignment',
                title          = title,
                content        = assignment,
                source_session = session,
                course_id      = course_id,
                subject_id     = subject_id,
                topic_id       = topic_id,
                status         = 'draft',
                metadata       = {'difficulty': difficulty, 'due_days': due_days},
            )

            from ai.serializers.workspace_serializers import AIGeneratedContentSerializer
            return Response(AIGeneratedContentSerializer(content_obj).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"GenerateAssignment failed: {e}")
            return Response({'error': 'Failed to generate assignment.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BloomsTaxonomyView(APIView):
    """POST /api/ai/sessions/<uuid>/educational/blooms-questions/
    Generate draft questions across all 6 Bloom's levels.
    Teacher must confirm before saving.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        session    = _get_teacher_session(request, session_id)
        conv       = _get_conversation_text(session)
        save_draft = request.data.get('save_draft', False)
        subject_id = request.data.get('subject_id') or (session.subject_id if session.subject else None)

        prompt = f"""Based on the educational conversation below, generate questions for each of Bloom's Taxonomy levels.
Generate 2 questions per level (12 total).

Conversation:
{conv}

Return a JSON object with these keys:
- "remember": [questions testing recall/recognition]
- "understand": [questions testing comprehension/explanation]
- "apply": [questions testing application of knowledge]
- "analyze": [questions testing breaking down/relationships]
- "evaluate": [questions testing judgment/critique]
- "create": [questions testing synthesis/design]

Each question object: {{"question": "...", "bloom_level": "...", "example_answer": "..."}}
Return ONLY valid JSON, no markdown."""

        try:
            raw = _ai_generate(prompt, temperature=0.5)
            try:
                questions = json.loads(raw)
            except Exception:
                clean = raw.strip().lstrip('```json').lstrip('```').rstrip('```').strip()
                try:
                    questions = json.loads(clean)
                except Exception:
                    questions = raw

            response_data = {
                'questions': questions,
                'requires_confirmation': True,
                'message': "Review these questions. Click 'Save to Draft' to save them for further editing before publishing.",
            }

            if save_draft:
                title = f"Bloom's Questions: {session.title}"
                content_obj = AIGeneratedContent.objects.create(
                    teacher        = request.user,
                    content_type   = 'blooms_questions',
                    title          = title,
                    content        = json.dumps(questions) if isinstance(questions, (list, dict)) else questions,
                    source_session = session,
                    subject_id     = subject_id,
                    status         = 'draft',
                    metadata       = {'bloom_levels': list(questions.keys()) if isinstance(questions, dict) else []},
                )
                from ai.serializers.workspace_serializers import AIGeneratedContentSerializer
                response_data['saved'] = AIGeneratedContentSerializer(content_obj).data

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"BloomsTaxonomy failed: {e}")
            return Response({'error': "Failed to generate Bloom's questions."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentInsightView(APIView):
    """POST /api/ai/sessions/<uuid>/educational/student-insight/
    Use existing analytics data to answer teacher queries about student performance.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, session_id):
        session = _get_teacher_session(request, session_id)
        query   = request.data.get('query', '').strip()

        if not query:
            return Response({'error': 'query is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Pull existing analytics data
        try:
            from ai.models import AIRequestLog
            # pyrefly: ignore [missing-import]
            from django.db.models import Count, Avg

            # Top topics students are asking about
            top_topics = list(
                AIRequestLog.objects.filter(
                    role_snapshot='student',
                    status='success',
                ).values('detected_topic').annotate(
                    count=Count('id')
                ).order_by('-count')[:10]
            )

            # Average response time & error rate
            stats = AIRequestLog.objects.filter(role_snapshot='student').aggregate(
                avg_time=Avg('response_time_ms'),
                total=Count('id'),
            )

            context = f"""Analytics context for teacher query:
Top topics students ask about: {top_topics}
Total student AI interactions: {stats.get('total', 0)}
Average AI response time: {stats.get('avg_time', 0):.0f}ms
"""
        except Exception:
            context = "Analytics data unavailable."

        prompt = f"""You are a teaching analytics assistant for StudyHub.
A teacher asked: "{query}"

{context}

Answer based on the analytics context. Be specific, actionable, and educational.
If data is limited, say so and provide general pedagogical guidance."""

        try:
            answer = _ai_generate(prompt, temperature=0.4)
            return Response({
                'query':   query,
                'insight': answer,
                'source':  'student_analytics',
            })
        except Exception as e:
            logger.error(f"StudentInsight failed: {e}")
            return Response({'error': 'Failed to generate insight.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────
# Generated Content Library
# ─────────────────────────────────────────────────────────────

class GeneratedContentListView(APIView):
    """GET /api/ai/generated-content/ — list all generated content for teacher."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from ai.serializers.workspace_serializers import AIGeneratedContentSerializer
        content_type = request.query_params.get('type')
        status_filter = request.query_params.get('status')

        qs = AIGeneratedContent.objects.filter(teacher=request.user)
        if content_type:
            qs = qs.filter(content_type=content_type)
        if status_filter:
            qs = qs.filter(status=status_filter)

        serializer = AIGeneratedContentSerializer(qs, many=True)
        return Response(serializer.data)


class GeneratedContentDetailView(APIView):
    """PATCH/DELETE /api/ai/generated-content/<id>/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from ai.serializers.workspace_serializers import AIGeneratedContentSerializer
        obj = get_object_or_404(AIGeneratedContent, id=pk, teacher=request.user)
        allowed_fields = {'title', 'status', 'content', 'course_id', 'subject_id', 'topic_id'}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        # Enforce draft → reviewed → published workflow
        if 'status' in data and data['status'] not in ('draft', 'reviewed', 'published'):
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return Response(AIGeneratedContentSerializer(obj).data)

    def delete(self, request, pk):
        obj = get_object_or_404(AIGeneratedContent, id=pk, teacher=request.user)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────
# Prompt Templates Library
# ─────────────────────────────────────────────────────────────

class PromptTemplateListView(APIView):
    """GET/POST /api/ai/prompt-templates/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from ai.serializers.workspace_serializers import PromptTemplateSerializer
        templates = PromptTemplate.objects.filter(teacher=request.user)
        return Response(PromptTemplateSerializer(templates, many=True).data)

    def post(self, request):
        from ai.serializers.workspace_serializers import PromptTemplateSerializer
        serializer = PromptTemplateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(teacher=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PromptTemplateDetailView(APIView):
    """PATCH/DELETE /api/ai/prompt-templates/<id>/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from ai.serializers.workspace_serializers import PromptTemplateSerializer
        obj = get_object_or_404(PromptTemplate, id=pk, teacher=request.user)
        serializer = PromptTemplateSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Bump use_count if prompted
            if request.data.get('use'):
                obj.use_count = (obj.use_count or 0) + 1
                obj.save(update_fields=['use_count'])
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(PromptTemplate, id=pk, teacher=request.user)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────
# Conversation Tags
# ─────────────────────────────────────────────────────────────

class ConversationTagListView(APIView):
    """GET/POST /api/ai/conversation-tags/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from ai.serializers.workspace_serializers import ConversationTagSerializer
        tags = ConversationTag.objects.filter(teacher=request.user)
        return Response(ConversationTagSerializer(tags, many=True).data)

    def post(self, request):
        from ai.serializers.workspace_serializers import ConversationTagSerializer
        serializer = ConversationTagSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(teacher=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConversationTagDetailView(APIView):
    """DELETE /api/ai/conversation-tags/<id>/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, pk):
        obj = get_object_or_404(ConversationTag, id=pk, teacher=request.user)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
