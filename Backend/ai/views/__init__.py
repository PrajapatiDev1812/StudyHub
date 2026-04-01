"""
ai/views/__init__.py
Exposes all view classes so that `from ai.views import X` continues to work
after we introduced the views/ sub-package.
"""

# ── Legacy views (still live in ai/views.py as a flat module) ──
# We import them from the parent package's actual module file.
import importlib
import sys
import os

# Load the flat views.py under a private name so we don't shadow this package
_flat = importlib.util.spec_from_file_location(
    "ai._views_flat",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "views.py"),
)
_mod = importlib.util.module_from_spec(_flat)
_flat.loader.exec_module(_mod)

# Re-export all public names from the flat module
ChatbotView                = _mod.ChatbotView
SummaryView                = _mod.SummaryView
EmbedAdminContentView      = _mod.EmbedAdminContentView
StudentNoteListCreateView  = _mod.StudentNoteListCreateView
StudentNoteDetailView      = _mod.StudentNoteDetailView
ChatSessionListView        = _mod.ChatSessionListView
ChatSessionDetailView      = _mod.ChatSessionDetailView
ChatSessionMessagesView    = _mod.ChatSessionMessagesView
MessageFeedbackView        = _mod.MessageFeedbackView
ChatFileUploadView         = _mod.ChatFileUploadView

# ── New modular views ──
from .ai_usage_view import AIUsageView  # noqa

__all__ = [
    'ChatbotView',
    'SummaryView',
    'EmbedAdminContentView',
    'StudentNoteListCreateView',
    'StudentNoteDetailView',
    'ChatSessionListView',
    'ChatSessionDetailView',
    'ChatSessionMessagesView',
    'MessageFeedbackView',
    'ChatFileUploadView',
    'AIUsageView',
]
