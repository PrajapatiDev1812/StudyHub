from django.urls import path
from .views import (
    ChatbotView,
    SummaryView,
    EmbedAdminContentView,
    StudentNoteListCreateView,
    StudentNoteDetailView,
)

urlpatterns = [
    # Main AI chat (RAG-powered)
    path('chat/', ChatbotView.as_view(), name='ai-chat'),

    # AI content summarizer
    path('summary/', SummaryView.as_view(), name='ai-summary'),

    # Admin: embed a content item
    path('embed-content/<int:content_id>/', EmbedAdminContentView.as_view(), name='ai-embed-content'),

    # Student notes CRUD
    path('student-notes/', StudentNoteListCreateView.as_view(), name='ai-student-notes'),
    path('student-notes/<int:pk>/', StudentNoteDetailView.as_view(), name='ai-student-note-detail'),
]
