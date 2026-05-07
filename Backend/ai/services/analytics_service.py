"""
ai/services/analytics_service.py
----------------------------------
Role-based analytics aggregation service for the AI Usage Insights system.

Three distinct analytics profiles:
  1. Main Admin   — Full technical analytics: load, peak times, failures, token usage
  2. Professor    — Educational insights: topic difficulty, class engagement trends
  3. Student      — Personal learning insights: activity, topics explored, consistency

Privacy Guarantees:
  - Raw query_text is NEVER returned from any of these functions.
  - Professor functions are strictly scoped to students enrolled in the
    professor's courses (courses.created_by == professor).
  - Student functions are strictly scoped to the requesting user.

Caching:
  - Results are cached using Django's cache framework.
  - Admin cache: 15 minutes  (technical freshness needed)
  - Professor cache: 30 minutes
  - Student cache: 10 minutes (personal feel — more responsive)
"""

import logging
from datetime import timedelta, datetime, date

from django.utils import timezone
from django.db.models import (
    Count, Avg, Sum, Max, Min,
    Q, F, ExpressionWrapper, IntegerField,
    FloatField,
)
from django.db.models.functions import (
    TruncHour, TruncDay, TruncWeek, TruncMonth, ExtractHour, ExtractWeekDay,
)
from django.core.cache import cache

logger = logging.getLogger(__name__)


# ── Cache TTLs (seconds) ──────────────────────────────────────────────────────
CACHE_TTL_ADMIN     = 60 * 15   # 15 min
CACHE_TTL_PROFESSOR = 60 * 30   # 30 min
CACHE_TTL_STUDENT   = 60 * 10   # 10 min


# ── Helper: Date Range ────────────────────────────────────────────────────────

def _parse_date_range(start_date=None, end_date=None, default_days=30):
    """
    Resolve start/end dates. Returns (start_dt, end_dt) as timezone-aware datetimes.
    """
    now = timezone.now()
    if end_date:
        end_dt = timezone.make_aware(datetime.combine(end_date, datetime.max.time())) \
            if isinstance(end_date, date) else end_date
    else:
        end_dt = now

    if start_date:
        start_dt = timezone.make_aware(datetime.combine(start_date, datetime.min.time())) \
            if isinstance(start_date, date) else start_date
    else:
        start_dt = now - timedelta(days=default_days)

    return start_dt, end_dt


def _get_base_qs(start_dt, end_dt):
    """Return non-archived logs within the given date window."""
    from ai.models import AIRequestLog
    return AIRequestLog.objects.filter(
        is_archived=False,
        timestamp__gte=start_dt,
        timestamp__lte=end_dt,
    )


def _build_time_series(qs, interval='day'):
    """
    Aggregate a queryset into time-series data.
    Returns: {'labels': [...], 'values': [...]}
    """
    trunc_map = {
        'hour':  TruncHour,
        'day':   TruncDay,
        'week':  TruncWeek,
        'month': TruncMonth,
    }
    trunc_fn = trunc_map.get(interval, TruncDay)
    results = (
        qs.annotate(period=trunc_fn('timestamp'))
          .values('period')
          .annotate(count=Count('id'))
          .order_by('period')
    )
    labels = []
    values = []
    for row in results:
        period = row['period']
        if interval == 'hour':
            labels.append(period.strftime('%Y-%m-%d %H:00'))
        elif interval == 'day':
            labels.append(period.strftime('%Y-%m-%d'))
        elif interval == 'week':
            labels.append(period.strftime('%Y-W%W'))
        else:
            labels.append(period.strftime('%Y-%m'))
        values.append(row['count'])
    return {'labels': labels, 'values': values}


# ═══════════════════════════════════════════════════════════════════════════════
# 1. MAIN ADMIN ANALYTICS
# ═══════════════════════════════════════════════════════════════════════════════

def get_admin_overview(start_date=None, end_date=None):
    """
    Platform-wide technical overview for the main admin.
    Cached for CACHE_TTL_ADMIN seconds.

    Returns:
    {
        "summary": {total_requests, active_users, avg_daily_requests,
                    peak_day, failure_rate_pct, throttle_rate_pct,
                    avg_response_ms, total_tokens_used},
        "status_breakdown": {"chart": {"labels": [...], "values": [...]}},
        "requests_over_time": {"chart": {...}},
        "top_topics":   {"chart": {...}},
        "top_courses":  {"chart": {...}},
        "hourly_heatmap": [...],   # list of {hour, count}
    }
    """
    start_dt, end_dt = _parse_date_range(start_date, end_date, default_days=30)
    cache_key = f'ai_insights:admin:overview:{start_dt.date()}:{end_dt.date()}'
    cached = cache.get(cache_key)
    if cached:
        return cached

    qs = _get_base_qs(start_dt, end_dt)
    total = qs.count()

    if total == 0:
        result = _empty_admin_overview()
        cache.set(cache_key, result, CACHE_TTL_ADMIN)
        return result

    active_users = qs.values('user').distinct().count()

    # Status breakdown
    status_counts = dict(
        qs.values('status').annotate(c=Count('id')).values_list('status', 'c')
    )
    success_count   = status_counts.get('success', 0)
    failed_count    = status_counts.get('failed', 0)
    throttled_count = status_counts.get('throttled', 0)
    blocked_count   = status_counts.get('blocked', 0)

    failure_rate   = round((failed_count   / total) * 100, 2) if total else 0
    throttle_rate  = round((throttled_count / total) * 100, 2) if total else 0

    # Avg response time (success only to avoid skew from blocked/throttled)
    avg_resp = qs.filter(status='success').aggregate(
        avg=Avg('response_time_ms')
    )['avg'] or 0

    # Token usage
    token_stats = qs.aggregate(
        total_tokens=Sum('total_tokens'),
        avg_tokens=Avg('total_tokens'),
    )
    total_tokens = token_stats['total_tokens'] or 0

    # Peak day
    peak_day_row = (
        qs.annotate(day=TruncDay('timestamp'))
          .values('day')
          .annotate(c=Count('id'))
          .order_by('-c')
          .first()
    )
    peak_day = peak_day_row['day'].strftime('%Y-%m-%d') if peak_day_row else 'N/A'

    # Avg daily requests
    num_days = max((end_dt - start_dt).days, 1)
    avg_daily = round(total / num_days, 1)

    # Top topics (detected_topic free text, non-empty)
    top_topics_qs = (
        qs.exclude(detected_topic='')
          .values('detected_topic')
          .annotate(c=Count('id'))
          .order_by('-c')[:10]
    )
    top_topics_chart = {
        'labels': [r['detected_topic'] for r in top_topics_qs],
        'values': [r['c']             for r in top_topics_qs],
    }

    # Top courses
    top_courses_qs = (
        qs.filter(course__isnull=False)
          .values('course__name')
          .annotate(c=Count('id'))
          .order_by('-c')[:10]
    )
    top_courses_chart = {
        'labels': [r['course__name'] for r in top_courses_qs],
        'values': [r['c']            for r in top_courses_qs],
    }

    # Requests over time (daily default)
    requests_over_time = _build_time_series(qs, interval='day')

    # Hourly heatmap data (hour-of-day distribution)
    hourly_data = (
        qs.annotate(hour=ExtractHour('timestamp'))
          .values('hour')
          .annotate(c=Count('id'))
          .order_by('hour')
    )
    hourly_heatmap = [
        {'hour': row['hour'], 'count': row['c']}
        for row in hourly_data
    ]

    # Most active users (for admin — privacy: returns usernames only)
    top_users_qs = (
        qs.filter(user__isnull=False)
          .values('user__username', 'user__id')
          .annotate(c=Count('id'))
          .order_by('-c')[:10]
    )
    top_users = [
        {'username': r['user__username'], 'user_id': r['user__id'], 'count': r['c']}
        for r in top_users_qs
    ]

    result = {
        'summary': {
            'total_requests':     total,
            'active_users':       active_users,
            'avg_daily_requests': avg_daily,
            'peak_day':           peak_day,
            'failure_rate_pct':   failure_rate,
            'throttle_rate_pct':  throttle_rate,
            'avg_response_ms':    round(avg_resp, 1),
            'total_tokens_used':  total_tokens,
        },
        'status_breakdown': {
            'chart': {
                'labels': ['Success', 'Failed', 'Throttled', 'Blocked'],
                'values': [success_count, failed_count, throttled_count, blocked_count],
            }
        },
        'requests_over_time': {'chart': requests_over_time},
        'top_topics':         {'chart': top_topics_chart},
        'top_courses':        {'chart': top_courses_chart},
        'top_users':          top_users,
        'hourly_heatmap':     hourly_heatmap,
        'date_range':         {'start': start_dt.date().isoformat(), 'end': end_dt.date().isoformat()},
    }
    cache.set(cache_key, result, CACHE_TTL_ADMIN)
    return result


def _empty_admin_overview():
    empty_chart = {'labels': [], 'values': []}
    return {
        'summary': {
            'total_requests': 0, 'active_users': 0, 'avg_daily_requests': 0,
            'peak_day': 'N/A', 'failure_rate_pct': 0, 'throttle_rate_pct': 0,
            'avg_response_ms': 0, 'total_tokens_used': 0,
        },
        'status_breakdown': {'chart': {'labels': ['Success', 'Failed', 'Throttled', 'Blocked'], 'values': [0, 0, 0, 0]}},
        'requests_over_time': {'chart': empty_chart},
        'top_topics': {'chart': empty_chart},
        'top_courses': {'chart': empty_chart},
        'top_users': [],
        'hourly_heatmap': [],
        'date_range': {},
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 2. PROFESSOR ANALYTICS (Educational, Class-Scoped)
# ═══════════════════════════════════════════════════════════════════════════════

def _get_professor_student_ids(professor):
    """
    Return the set of student user IDs enrolled in any course created by this professor.
    This is the core scope-guard — professors can only see their own students.
    """
    from courses.models import Enrollment
    enrolled = Enrollment.objects.filter(
        course__created_by=professor
    ).values_list('student_id', flat=True)
    return list(set(enrolled))


def get_professor_class_overview(professor, start_date=None, end_date=None, course_id=None):
    """
    Educational engagement overview for a professor.
    - NEVER exposes raw query text.
    - Strictly scoped to the professor's enrolled students.

    Returns:
    {
        "summary": {enrolled_students, active_learners, total_interactions,
                    avg_interactions_per_student},
        "engagement_over_time": {"chart": {...}},  # weekly/daily line chart
        "topic_insights": {
            "most_asked":    {"chart": {...}},
            "difficult_topics": [...]              # topics with high repeat frequency
        },
        "insights": [...]   # rule-based educational insight cards
    }
    """
    start_dt, end_dt = _parse_date_range(start_date, end_date, default_days=30)
    cache_key = f'ai_insights:prof:{professor.id}:{start_dt.date()}:{end_dt.date()}:{course_id}'
    cached = cache.get(cache_key)
    if cached:
        return cached

    student_ids = _get_professor_student_ids(professor)

    if not student_ids:
        result = _empty_professor_overview()
        cache.set(cache_key, result, CACHE_TTL_PROFESSOR)
        return result

    qs = _get_base_qs(start_dt, end_dt).filter(user_id__in=student_ids)

    # Optional: scope to a single course
    if course_id:
        qs = qs.filter(course_id=course_id)

    total_interactions = qs.count()
    active_learners    = qs.values('user').distinct().count()
    enrolled_count     = len(student_ids)
    avg_per_student    = round(total_interactions / max(active_learners, 1), 1)

    # Engagement trend over time
    engagement_chart = _build_time_series(qs, interval='day')

    # Most asked topics (aggregated, NOT showing which student asked what)
    most_asked_qs = (
        qs.exclude(detected_topic='')
          .values('detected_topic')
          .annotate(c=Count('id'))
          .order_by('-c')[:10]
    )
    most_asked_chart = {
        'labels': [r['detected_topic'] for r in most_asked_qs],
        'values': [r['c']             for r in most_asked_qs],
    }

    # Difficult topic detection:
    # Topics with >= 3 queries from different students are flagged as "difficult"
    difficult_qs = (
        qs.exclude(detected_topic='')
          .values('detected_topic')
          .annotate(
              total_queries=Count('id'),
              unique_students=Count('user', distinct=True),
          )
          .filter(unique_students__gte=2, total_queries__gte=3)
          .order_by('-total_queries')[:8]
    )
    difficult_topics = [
        {
            'topic':           r['detected_topic'],
            'total_queries':   r['total_queries'],
            'unique_students': r['unique_students'],
            'difficulty_hint': 'Multiple students have asked repeated questions about this topic.',
        }
        for r in difficult_qs
    ]

    # Subject-level breakdown
    subject_qs = (
        qs.filter(subject__isnull=False)
          .values('subject__name')
          .annotate(c=Count('id'))
          .order_by('-c')[:8]
    )
    subject_chart = {
        'labels': [r['subject__name'] for r in subject_qs],
        'values': [r['c']             for r in subject_qs],
    }

    # Rule-based insights
    insights = _generate_professor_insights(
        most_asked_qs, difficult_topics, active_learners, enrolled_count
    )

    result = {
        'summary': {
            'enrolled_students':          enrolled_count,
            'active_learners':            active_learners,
            'total_interactions':         total_interactions,
            'avg_interactions_per_student': avg_per_student,
        },
        'engagement_over_time': {'chart': engagement_chart},
        'topic_insights': {
            'most_asked':     {'chart': most_asked_chart},
            'subject_breakdown': {'chart': subject_chart},
            'difficult_topics': difficult_topics,
        },
        'insights': insights,
        'date_range': {'start': start_dt.date().isoformat(), 'end': end_dt.date().isoformat()},
    }
    cache.set(cache_key, result, CACHE_TTL_PROFESSOR)
    return result


def _generate_professor_insights(most_asked_qs, difficult_topics, active_learners, enrolled_count):
    insights = []
    if difficult_topics:
        top_difficult = difficult_topics[0]['topic']
        insights.append({
            'type': 'difficult_topic',
            'icon': '⚠️',
            'title': f'Repeated doubts: {top_difficult}',
            'body': f'Multiple students have been repeatedly asking about "{top_difficult}". '
                    f'Consider dedicating a revision session or supplementary material to this topic.',
        })
    if active_learners < enrolled_count * 0.5:
        insights.append({
            'type': 'low_engagement',
            'icon': '📉',
            'title': 'Low AI engagement this period',
            'body': f'Only {active_learners} out of {enrolled_count} enrolled students have been '
                    f'using the AI assistant. You may want to encourage exploration.',
        })
    most_asked_list = list(most_asked_qs)
    if most_asked_list:
        top_topic = most_asked_list[0]['detected_topic']
        insights.append({
            'type': 'hot_topic',
            'icon': '🔥',
            'title': f'Most explored: {top_topic}',
            'body': f'"{top_topic}" is the most actively explored topic in your class right now.',
        })
    return insights


def _empty_professor_overview():
    empty_chart = {'labels': [], 'values': []}
    return {
        'summary': {'enrolled_students': 0, 'active_learners': 0, 'total_interactions': 0, 'avg_interactions_per_student': 0},
        'engagement_over_time': {'chart': empty_chart},
        'topic_insights': {
            'most_asked': {'chart': empty_chart},
            'subject_breakdown': {'chart': empty_chart},
            'difficult_topics': [],
        },
        'insights': [],
        'date_range': {},
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 3. STUDENT PERSONAL LEARNING INSIGHTS (Privacy-first, Encouraging)
# ═══════════════════════════════════════════════════════════════════════════════

def get_student_learning_insights(student, start_date=None, end_date=None):
    """
    Personal learning insights for a student.
    - Returns ONLY this student's data (enforced by queryset filter on student pk).
    - Uses encouraging, growth-oriented language in insight card text.
    - NEVER shows raw request count as the primary feature.

    Returns:
    {
        "summary": {topics_explored, study_days, active_study_streak, peak_hour},
        "weekly_activity": {"chart": {...}},   # 7-day bar chart
        "top_topics": {"chart": {...}},
        "hourly_pattern": {"chart": {...}},    # active study hours
        "insights": [...]                      # encouraging personal insight cards
    }
    """
    start_dt, end_dt = _parse_date_range(start_date, end_date, default_days=30)
    cache_key = f'ai_insights:student:{student.id}:{start_dt.date()}:{end_dt.date()}'
    cached = cache.get(cache_key)
    if cached:
        return cached

    # STRICT self-scope: NEVER query other users
    qs = _get_base_qs(start_dt, end_dt).filter(user=student)
    total = qs.count()

    if total == 0:
        result = _empty_student_insights()
        cache.set(cache_key, result, CACHE_TTL_STUDENT)
        return result

    # Topics Explored (unique detected_topics)
    topics_explored = qs.exclude(detected_topic='').values('detected_topic').distinct().count()

    # Study days (distinct calendar days with at least 1 interaction)
    study_days_qs = (
        qs.annotate(day=TruncDay('timestamp'))
          .values('day')
          .distinct()
    )
    study_days = study_days_qs.count()

    # Peak hour of day
    peak_hour_row = (
        qs.annotate(hour=ExtractHour('timestamp'))
          .values('hour')
          .annotate(c=Count('id'))
          .order_by('-c')
          .first()
    )
    peak_hour = peak_hour_row['hour'] if peak_hour_row else None

    # Study streak (consecutive days up to today)
    streak = _calculate_streak(qs)

    # Weekly activity (last 7 days, day-by-day)
    last_7_start = timezone.now() - timedelta(days=7)
    weekly_qs = qs.filter(timestamp__gte=last_7_start)
    weekly_chart = _build_time_series(weekly_qs, interval='day')

    # Top topics
    top_topics_qs = (
        qs.exclude(detected_topic='')
          .values('detected_topic')
          .annotate(c=Count('id'))
          .order_by('-c')[:8]
    )
    top_topics_chart = {
        'labels': [r['detected_topic'] for r in top_topics_qs],
        'values': [r['c']             for r in top_topics_qs],
    }

    # Hourly pattern (study hour distribution)
    hourly_qs = (
        qs.annotate(hour=ExtractHour('timestamp'))
          .values('hour')
          .annotate(c=Count('id'))
          .order_by('hour')
    )
    hourly_chart = {
        'labels': [f"{row['hour']:02d}:00" for row in hourly_qs],
        'values': [row['c']               for row in hourly_qs],
    }

    # Subject distribution
    subject_qs = (
        qs.filter(subject__isnull=False)
          .values('subject__name')
          .annotate(c=Count('id'))
          .order_by('-c')[:6]
    )
    subject_chart = {
        'labels': [r['subject__name'] for r in subject_qs],
        'values': [r['c']             for r in subject_qs],
    }

    # Generate encouraging personal insight cards
    top_topics_list = list(top_topics_qs)
    insights = _generate_student_insights(
        top_topics_list, peak_hour, study_days, streak, total
    )

    result = {
        'summary': {
            'topics_explored':    topics_explored,
            'study_days':         study_days,
            'active_study_streak': streak,
            'peak_study_hour':    f"{peak_hour:02d}:00" if peak_hour is not None else 'N/A',
        },
        'weekly_activity':  {'chart': weekly_chart},
        'top_topics':       {'chart': top_topics_chart},
        'hourly_pattern':   {'chart': hourly_chart},
        'subject_breakdown': {'chart': subject_chart},
        'insights': insights,
        'date_range': {'start': start_dt.date().isoformat(), 'end': end_dt.date().isoformat()},
    }
    cache.set(cache_key, result, CACHE_TTL_STUDENT)
    return result


def _calculate_streak(qs):
    """
    Calculate the number of consecutive days (ending today) the student has been active.
    """
    today = timezone.localdate()
    study_days = set(
        qs.annotate(day=TruncDay('timestamp'))
          .values_list('day', flat=True)
          .distinct()
    )
    streak = 0
    check_day = today
    while True:
        # Convert check_day to a date-only for comparison
        if any(d.date() == check_day if hasattr(d, 'date') else d == check_day for d in study_days):
            streak += 1
            check_day -= timedelta(days=1)
        else:
            break
    return streak


def _generate_student_insights(top_topics_list, peak_hour, study_days, streak, total):
    """
    Rule-based, encouragement-oriented personal insight cards.
    Language is positive and growth-focused. NO surveillance wording.
    """
    insights = []

    if top_topics_list:
        top = top_topics_list[0]['detected_topic']
        insights.append({
            'type': 'top_topic',
            'icon': '🎯',
            'title': f'Most explored: {top}',
            'body': f'You\'ve been exploring "{top}" a lot lately. '
                    f'Great focus! Consider reviewing core concepts to deepen your understanding.',
        })

    if peak_hour is not None:
        hour_label = f"{peak_hour:02d}:00–{(peak_hour+1)%24:02d}:00"
        insights.append({
            'type': 'peak_hour',
            'icon': '⏰',
            'title': f'Your active study hour: {hour_label}',
            'body': f'You tend to study most actively around {hour_label}. '
                    f'This is your golden learning window — keep it consistent!',
        })

    if streak >= 3:
        insights.append({
            'type': 'streak',
            'icon': '🔥',
            'title': f'{streak}-day learning streak!',
            'body': f'You\'ve been active for {streak} consecutive days. '
                    f'Consistent practice is the key to mastery — keep it up!',
        })
    elif study_days >= 5:
        insights.append({
            'type': 'consistency',
            'icon': '📅',
            'title': f'{study_days} active study days this month',
            'body': 'You\'ve been consistent with your learning sessions this month. '
                    'Regular practice builds long-term retention.',
        })

    if len(top_topics_list) >= 2:
        second_topic = top_topics_list[1]['detected_topic']
        insights.append({
            'type': 'breadth',
            'icon': '📚',
            'title': 'Exploring multiple topics',
            'body': f'You\'ve been actively exploring both "{top_topics_list[0]["detected_topic"]}" '
                    f'and "{second_topic}". Broad exploration is excellent for building connections between concepts.',
        })

    return insights


def _empty_student_insights():
    empty_chart = {'labels': [], 'values': []}
    return {
        'summary': {'topics_explored': 0, 'study_days': 0, 'active_study_streak': 0, 'peak_study_hour': 'N/A'},
        'weekly_activity':   {'chart': empty_chart},
        'top_topics':        {'chart': empty_chart},
        'hourly_pattern':    {'chart': empty_chart},
        'subject_breakdown': {'chart': empty_chart},
        'insights': [{
            'type': 'welcome',
            'icon': '👋',
            'title': 'Start your learning journey!',
            'body': 'Use the AI assistant to explore topics and your learning insights will appear here.',
        }],
        'date_range': {},
    }
