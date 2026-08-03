# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated
# pyrefly: ignore [missing-import]
from django.shortcuts import get_object_or_404
from ai.models import ChatSession
from ai.serializers import ChatSessionSerializer

class ChatGPTChatListView(APIView):
    """
    GET /api/chats/ - List all non-deleted chat sessions
    POST /api/chats/ - Create a new empty chat session
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = ChatSession.objects.filter(user=request.user, is_deleted=False).order_by('-updated_at')
        return Response(ChatSessionSerializer(sessions, many=True).data)

    def post(self, request):
        session = ChatSession.objects.create(
            user=request.user,
            title=request.data.get('title', 'New Conversation'),
            mode=request.data.get('mode', 'student_mode'),
            level=request.data.get('level', 'beginner')
        )
        return Response(ChatSessionSerializer(session).data, status=status.HTTP_201_CREATED)

from ai.views import ChatbotView

class ChatGPTMessagesView(ChatbotView):
    """
    GET /api/chats/<uuid>/messages/ - Get message history
    POST /api/chats/<uuid>/messages/ - Send a message
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, chat_id, *args, **kwargs):
        from ai.serializers import ChatMessageSerializer
        session = get_object_or_404(ChatSession, id=chat_id, user=request.user, is_deleted=False)
        messages = ChatMessage.objects.filter(session=session).order_by('created_at')
        return Response(ChatMessageSerializer(messages, many=True).data)

    def post(self, request, chat_id, *args, **kwargs):
        self.kwargs['chat_id'] = chat_id
        return super().post(request, *args, **kwargs)

