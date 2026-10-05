# pyrefly: ignore [missing-import]
from django.urls import path
# pyrefly: ignore [missing-import]
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
    AIConfigurationView,
    KnowledgeDocumentView,
    KnowledgeDocumentDetailView,
    KnowledgeDocumentStatusView,
    KnowledgeHealthView,
    QuestionGeneratorView,
    # ── Teacher Workspace Session Actions ──
    TeacherChatSessionListView,
    ChatSessionPinView,
    ChatSessionArchiveView,
    ChatSessionDuplicateView,
    ChatSessionShareView,
    ChatSessionExportView,
    ChatSessionSearchView,
    # ── Educational Action Views ──
    SaveAsNotesView,
    GenerateQuizView,
    GenerateFlashcardsView,
    ConvertToMaterialView,
    GenerateAssignmentView,
    BloomsTaxonomyView,
    StudentInsightView,
    GeneratedContentListView,
    GeneratedContentDetailView,
    PromptTemplateListView,
    PromptTemplateDetailView,
    ConversationTagListView,
    ConversationTagDetailView,
)
from .views.chatgpt_views import ChatGPTChatListView, ChatGPTMessagesView
from .views.ai_usage_view import AIUsageView
from .views_analytics import (
    AdminAnalyticsOverviewView,
    ProfessorClassInsightsView,
    StudentLearningInsightsView,
    StudentWeeklyActivityView,
    StudentTopTopicsView,
)
from . import views_governance as _gov

urlpatterns = [
    # ── Main AI chat (RAG-powered, with session + usage tracking) ─────────────
    path('chat/', ChatbotView.as_view(), name='ai-chat'),

    # ── Standard ChatGPT-like API Endpoints ───────────────────────────────────
    path('chats/', ChatGPTChatListView.as_view(), name='ai-chats-list'),
    path('chats/<uuid:chat_id>/messages/', ChatGPTMessagesView.as_view(), name='ai-chats-messages'),
    path('chats/<uuid:session_id>/', ChatSessionDetailView.as_view(), name='ai-chats-detail'),

    # ── AI Usage stats ────────────────────────────────────────────────────────
    path('usage/', AIUsageView.as_view(), name='ai-usage'),

    # ── Student Chat Session CRUD (backward-compatible) ───────────────────────
    path('sessions/', ChatSessionListView.as_view(), name='ai-sessions'),
    path('sessions/<uuid:session_id>/', ChatSessionDetailView.as_view(), name='ai-session-detail'),
    path('sessions/<uuid:session_id>/messages/', ChatSessionMessagesView.as_view(), name='ai-session-messages'),

    # ── Teacher Workspace — Chat Session list ─────────────────────────────────
    path('chat-sessions/', TeacherChatSessionListView.as_view(), name='ai-teacher-sessions'),
    path('sessions/search/', ChatSessionSearchView.as_view(), name='ai-session-search'),

    # ── Teacher Workspace — Session Actions ───────────────────────────────────
    path('sessions/<uuid:session_id>/pin/',       ChatSessionPinView.as_view(),       name='ai-session-pin'),
    path('sessions/<uuid:session_id>/archive/',   ChatSessionArchiveView.as_view(),   name='ai-session-archive'),
    path('sessions/<uuid:session_id>/duplicate/', ChatSessionDuplicateView.as_view(), name='ai-session-duplicate'),
    path('sessions/<uuid:session_id>/share/',     ChatSessionShareView.as_view(),     name='ai-session-share'),
    path('sessions/<uuid:session_id>/export/',    ChatSessionExportView.as_view(),    name='ai-session-export'),

    # ── Teacher Workspace — Educational Actions ───────────────────────────────
    path('sessions/<uuid:session_id>/educational/save-notes/',         SaveAsNotesView.as_view(),         name='ai-edu-save-notes'),
    path('sessions/<uuid:session_id>/educational/generate-quiz/',      GenerateQuizView.as_view(),        name='ai-edu-gen-quiz'),
    path('sessions/<uuid:session_id>/educational/generate-flashcards/',GenerateFlashcardsView.as_view(),  name='ai-edu-gen-flashcards'),
    path('sessions/<uuid:session_id>/educational/convert-material/',   ConvertToMaterialView.as_view(),   name='ai-edu-convert-material'),
    path('sessions/<uuid:session_id>/educational/generate-assignment/', GenerateAssignmentView.as_view(), name='ai-edu-gen-assignment'),
    path('sessions/<uuid:session_id>/educational/blooms-questions/',   BloomsTaxonomyView.as_view(),      name='ai-edu-blooms'),
    path('sessions/<uuid:session_id>/educational/student-insight/',    StudentInsightView.as_view(),      name='ai-edu-student-insight'),

    # ── Generated Content Library ─────────────────────────────────────────────
    path('generated-content/', GeneratedContentListView.as_view(), name='ai-generated-content'),
    path('generated-content/<int:pk>/', GeneratedContentDetailView.as_view(), name='ai-generated-content-detail'),

    # ── Prompt Templates ──────────────────────────────────────────────────────
    path('prompt-templates/', PromptTemplateListView.as_view(), name='ai-prompt-templates'),
    path('prompt-templates/<int:pk>/', PromptTemplateDetailView.as_view(), name='ai-prompt-template-detail'),

    # ── Conversation Tags ─────────────────────────────────────────────────────
    path('conversation-tags/', ConversationTagListView.as_view(), name='ai-conv-tags'),
    path('conversation-tags/<int:pk>/', ConversationTagDetailView.as_view(), name='ai-conv-tag-detail'),

    # ── Message feedback (thumbs up/down) ─────────────────────────────────────
    path('messages/<int:message_id>/feedback/', MessageFeedbackView.as_view(), name='ai-message-feedback'),

    # ── File upload for chat ──────────────────────────────────────────────────
    path('upload/', ChatFileUploadView.as_view(), name='ai-upload'),

    # ── AI content summarizer ─────────────────────────────────────────────────
    path('summary/', SummaryView.as_view(), name='ai-summary'),

    # ── Admin: embed a content item ───────────────────────────────────────────
    path('embed-content/<int:content_id>/', EmbedAdminContentView.as_view(), name='ai-embed-content'),

    # ── Student notes CRUD ────────────────────────────────────────────────────
    path('student-notes/', StudentNoteListCreateView.as_view(), name='ai-student-notes'),
    path('student-notes/<int:pk>/', StudentNoteDetailView.as_view(), name='ai-student-note-detail'),

    # ── AI Usage & Learning Insights ──────────────────────────────────────────
    path('analytics/admin/overview/', AdminAnalyticsOverviewView.as_view(), name='ai-analytics-admin-overview'),
    path('analytics/professor/class-insights/', ProfessorClassInsightsView.as_view(), name='ai-analytics-professor-class'),
    path('analytics/student/learning-insights/', StudentLearningInsightsView.as_view(), name='ai-analytics-student-insights'),
    path('analytics/student/weekly-activity/',   StudentWeeklyActivityView.as_view(),  name='ai-analytics-student-weekly'),
    path('analytics/student/top-topics/',        StudentTopTopicsView.as_view(),        name='ai-analytics-student-topics'),

    # ── Teacher AI Panel ──────────────────────────────────────────────────────
    path('configuration/', AIConfigurationView.as_view(), name='ai-configuration'),
    path('knowledge-documents/', KnowledgeDocumentView.as_view(), name='ai-knowledge-docs'),
    path('knowledge-documents/<int:pk>/', KnowledgeDocumentDetailView.as_view(), name='ai-knowledge-doc-detail'),
    path('knowledge-documents/<int:pk>/status/', KnowledgeDocumentStatusView.as_view(), name='ai-knowledge-doc-status'),
    path('knowledge-health/', KnowledgeHealthView.as_view(), name='ai-knowledge-health'),
    path('generate-question/', QuestionGeneratorView.as_view(), name='ai-generate-question'),

    # ═══════════════════════════════════════════════════════════════════════════
    # AI GOVERNANCE MODULE (Admin Only)
    # ═══════════════════════════════════════════════════════════════════════════

    # ── Universities ──────────────────────────────────────────────────────────
    path('admin/universities/', _gov.UniversityListCreateView.as_view(), name='ai-admin-universities'),
    path('admin/universities/<int:pk>/', _gov.UniversityDetailView.as_view(), name='ai-admin-university-detail'),

    # ── AI Providers ──────────────────────────────────────────────────────────
    path('admin/providers/', _gov.AIProviderListCreateView.as_view(), name='ai-admin-providers'),
    path('admin/providers/<int:pk>/', _gov.AIProviderDetailView.as_view(), name='ai-admin-provider-detail'),

    # ── AI Models ─────────────────────────────────────────────────────────────
    path('admin/models/', _gov.AIModelListCreateView.as_view(), name='ai-admin-models'),
    path('admin/models/<int:pk>/', _gov.AIModelDetailView.as_view(), name='ai-admin-model-detail'),

    # ── AI Quota Policies ─────────────────────────────────────────────────────
    path('admin/quotas/', _gov.AIQuotaPolicyListCreateView.as_view(), name='ai-admin-quotas'),
    path('admin/quotas/<int:pk>/', _gov.AIQuotaPolicyDetailView.as_view(), name='ai-admin-quota-detail'),
    path('admin/quotas/reset/<int:user_id>/', _gov.AIQuotaResetView.as_view(), name='ai-admin-quota-reset'),

    # ── AI User Quota Overrides ───────────────────────────────────────────────
    path('admin/user-quotas/', _gov.AIUserQuotaListCreateView.as_view(), name='ai-admin-user-quotas'),
    path('admin/user-quotas/<int:pk>/', _gov.AIUserQuotaDetailView.as_view(), name='ai-admin-user-quota-detail'),

    # ── AI Feature Flags ──────────────────────────────────────────────────────
    path('admin/feature-flags/', _gov.AIFeatureFlagListCreateView.as_view(), name='ai-admin-feature-flags'),
    path('admin/feature-flags/<int:pk>/', _gov.AIFeatureFlagDetailView.as_view(), name='ai-admin-feature-flag-detail'),

    # ── AI Usage (Admin View) ─────────────────────────────────────────────────
    path('admin/usage/', _gov.AIUsageOverviewView.as_view(), name='ai-admin-usage'),
    path('admin/usage/<int:user_id>/', _gov.AIUsageUserDetailView.as_view(), name='ai-admin-usage-user'),

    # ── AI Request Logs ───────────────────────────────────────────────────────
    path('admin/logs/', _gov.AIRequestLogListView.as_view(), name='ai-admin-logs'),

    # ── AI Audit Logs ─────────────────────────────────────────────────────────
    path('admin/audit-logs/', _gov.AIAuditLogListView.as_view(), name='ai-admin-audit-logs'),

    # ── AI Analytics Dashboard ────────────────────────────────────────────────
    path('admin/analytics/dashboard/', _gov.AIAnalyticsDashboardView.as_view(), name='ai-admin-analytics-dashboard'),

    # ── Reports / Export ──────────────────────────────────────────────────────
    path('admin/reports/export/', _gov.AIReportExportView.as_view(), name='ai-admin-reports-export'),
]

# pyrefly: ignore [missing-import]
from rest_framework.routers import DefaultRouter
from . import views_safety

router = DefaultRouter()
router.register(r'admin/safety/configurations', views_safety.AIGovernanceConfigViewSet, basename='ai-admin-safety-config')
router.register(r'admin/safety/policies', views_safety.AISafetyPolicyViewSet, basename='ai-admin-safety-policy')
router.register(r'admin/safety/prompts', views_safety.AIPromptVersionViewSet, basename='ai-admin-safety-prompt')
router.register(r'admin/safety/content-policies', views_safety.AIContentPolicyViewSet, basename='ai-admin-safety-content')
router.register(r'admin/safety/feature-policies', views_safety.AIFeaturePolicyViewSet, basename='ai-admin-safety-feature')

urlpatterns += router.urls

