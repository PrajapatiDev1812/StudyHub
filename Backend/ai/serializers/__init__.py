"""
ai/serializers/__init__.py
Re-exports ALL original serializers from ai/serializers.py
plus the new AIUsageSerializer — keeps backwards compatibility.
"""

import importlib.util
import os

# Load the original flat serializers.py (shadowed by this package)
_spec = importlib.util.spec_from_file_location(
    "ai._serializers_flat",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "serializers.py"),
)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)

# Re-export all original serializer classes
ChatRequestSerializer         = _mod.ChatRequestSerializer
DebugRetrievalRequestSerializer = _mod.DebugRetrievalRequestSerializer
StudentNoteSerializer         = _mod.StudentNoteSerializer
ChatSessionSerializer         = _mod.ChatSessionSerializer
ChatSessionUpdateSerializer   = _mod.ChatSessionUpdateSerializer
ChatMessageSerializer         = _mod.ChatMessageSerializer
MessageFeedbackSerializer     = _mod.MessageFeedbackSerializer

# New usage serializer
from .ai_usage_serializer import AIUsageSerializer  # noqa

__all__ = [
    'ChatRequestSerializer',
    'DebugRetrievalRequestSerializer',
    'StudentNoteSerializer',
    'ChatSessionSerializer',
    'ChatSessionUpdateSerializer',
    'ChatMessageSerializer',
    'MessageFeedbackSerializer',
    'AIUsageSerializer',
]
