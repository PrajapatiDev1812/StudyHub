"""
focus/services.py
-----------------
TimerSuggestionService — smart focus/break duration recommendations
based on topic difficulty and the student's own session history.
"""
from django.db.models import Avg
from .models import FocusSession

# ── Difficulty → Focus/Break suggestion table ──────────────────────
DIFFICULTY_CONFIG = {
    'easy':   {'focus': 25, 'break': 5},
    'medium': {'focus': 45, 'break': 10},
    'hard':   {'focus': 60, 'break': 15},
}
DEFAULT_CONFIG = {'focus': 25, 'break': 5}

# Friendly preset options for the frontend
FOCUS_PRESETS = [25, 30, 45, 60]
BREAK_PRESETS = [5, 10, 15]


def get_timer_suggestions(student, topic=None):
    """
    Return suggested focus & break durations for the student.

    Strategy (Hybrid):
    1. Start with difficulty-based suggestion if a topic is provided.
    2. Blend with the student's average successful session duration.
    3. Round to the nearest friendly preset value.

    Returns a dict with:
      - suggested_focus_minutes
      - suggested_break_minutes
      - source: 'difficulty' | 'usage' | 'hybrid'
      - focus_presets: list of selectable values
      - break_presets: list of selectable values
    """
    # Step 1: Difficulty base
    if topic and hasattr(topic, 'difficulty'):
        difficulty = topic.difficulty or 'medium'
        base = DIFFICULTY_CONFIG.get(difficulty, DEFAULT_CONFIG)
        source = 'difficulty'
    else:
        base = DEFAULT_CONFIG.copy()
        source = 'manual'

    # Step 2: Blend with student usage history (completed sessions only)
    history = FocusSession.objects.filter(
        student=student,
        status='completed',
        total_focus_seconds__gt=0,
    )

    if history.exists():
        avg_focus_seconds = history.aggregate(
            avg=Avg('total_focus_seconds')
        )['avg'] or 0
        avg_focus_minutes = round(avg_focus_seconds / 60)

        if avg_focus_minutes > 0:
            # Blend: 60% difficulty suggestion + 40% history
            blended_focus = int(base['focus'] * 0.6 + avg_focus_minutes * 0.4)
            # Snap to nearest preset
            suggested_focus = _snap_to_preset(blended_focus, FOCUS_PRESETS)
            # Break is proportional: ~20% of focus time
            suggested_break = _snap_to_preset(
                max(5, round(suggested_focus * 0.2)), BREAK_PRESETS
            )
            source = 'hybrid'
        else:
            suggested_focus = base['focus']
            suggested_break = base['break']
    else:
        suggested_focus = base['focus']
        suggested_break = base['break']

    return {
        'suggested_focus_minutes': suggested_focus,
        'suggested_break_minutes': suggested_break,
        'source': source,
        'focus_presets': FOCUS_PRESETS,
        'break_presets': BREAK_PRESETS,
        'difficulty': topic.difficulty if topic else None,
    }


def _snap_to_preset(value, presets):
    """Round a value to the nearest item in the presets list."""
    return min(presets, key=lambda p: abs(p - value))
