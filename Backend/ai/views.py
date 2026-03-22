import time
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from courses.models import Content

class ChatbotView(APIView):
    """
    POST /api/ai/chat/
    Simulated AI Chatbot Endpoint.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message')
        if not user_message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Simulate AI processing delay
        time.sleep(1.5)

        # Simulated response (In production, integrate google-generativeai or openai here)
        ai_response = f"Hello {request.user.username}! I am the StudyHub AI assistant. You said: '{user_message}'. How can I help you study today?"

        return Response({
            'response': ai_response
        })

class SummaryView(APIView):
    """
    POST /api/ai/summary/
    Simulated AI Content Summarizer.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        content_id = request.data.get('content_id')
        if not content_id:
            return Response({'error': 'content_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            content = Content.objects.get(id=content_id)
        except Content.DoesNotExist:
            return Response({'error': 'Content not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Simulate AI processing delay
        time.sleep(2)

        ai_summary = f"Summary for '{content.title}': This is an automatically generated AI summary. This content covers key concepts of the topic in {content.content_type} format. Make sure to review the main points!"

        return Response({
            'content_id': content.id,
            'title': content.title,
            'summary': ai_summary
        })
