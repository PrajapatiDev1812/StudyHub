from django.urls import path
from .views import (
    ChatbotView,
    SummaryView,
    EmbedAdminContentView,
    StudentNoteListCreateView,
    StudentNoteDetailView,
    ChatSessionListView,
    ChatSessionDetailView,
    ChatSessionMessagesView,
    MessageFeedbackView,
    ChatFileUploadView,
)

urlpatterns = [
    # Main AI chat (RAG-powered, now with session support)
    path('chat/', ChatbotView.as_view(), name='ai-chat'),

    # Chat Session CRUD
    path('sessions/', ChatSessionListView.as_view(), name='ai-sessions'),
    path('sessions/<uuid:session_id>/', ChatSessionDetailView.as_view(), name='ai-session-detail'),
    path('sessions/<uuid:session_id>/messages/', ChatSessionMessagesView.as_view(), name='ai-session-messages'),

    # Message feedback (thumbs up/down)
    path('messages/<int:message_id>/feedback/', MessageFeedbackView.as_view(), name='ai-message-feedback'),

    # File upload for chat
    path('upload/', ChatFileUploadView.as_view(), name='ai-upload'),

    # AI content summarizer
    path('summary/', SummaryView.as_view(), name='ai-summary'),

    # Admin: embed a content item
    path('embed-content/<int:content_id>/', EmbedAdminContentView.as_view(), name='ai-embed-content'),

    # Student notes CRUD
    path('student-notes/', StudentNoteListCreateView.as_view(), name='ai-student-notes'),
    path('student-notes/<int:pk>/', StudentNoteDetailView.as_view(), name='ai-student-note-detail'),
]
