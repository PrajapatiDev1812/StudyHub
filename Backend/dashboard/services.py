# pyrefly: ignore [missing-import]
import datetime
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.db.models import Sum, Count
from focus.models import FocusSession
from tasks.models import Task, TaskAssignment
from courses.models import Course, Progress
from ai.models import AIRequestLog

class DashboardService:
    def __init__(self, user):
        self.user = user
        self.now = timezone.now()
        # "This week" is the last 7 days including today
        self.week_start = self.now - datetime.timedelta(days=7)
        self.today_start = timezone.make_aware(datetime.datetime.combine(self.now.date(), datetime.time.min))

    def get_summary(self):
        """Returns Enrolled Courses, Weekly Study Time, Tasks Completed, Current Streak."""
        enrolled = Course.objects.filter(enrollments__student=self.user).count()
        
        # Weekly Study Time
        weekly_focus = FocusSession.objects.filter(
            student=self.user,
            status='completed',
            start_time__gte=self.week_start
        ).aggregate(total_sec=Sum('total_focus_seconds'))['total_sec'] or 0
        study_time_hours = round(weekly_focus / 3600, 1)
        
        # Tasks Completed (This Week) — personal COMPLETED + academic VERIFIED
        tasks_completed = (
            Task.objects.filter(
                user=self.user, source='STUDENT_CREATED', status='COMPLETED',
                updated_at__gte=self.week_start,
            ).count()
            +
            TaskAssignment.objects.filter(
                student=self.user, status='VERIFIED',
                verified_at__gte=self.week_start,
            ).count()
        )
        
        # Current Streak (from UserStats if gamification exists, otherwise calculate from FocusSession)
        # Using gamification.UserStats
        streak = 0
        try:
            from gamification.models import UserStats
            stats = UserStats.objects.get(user=self.user)
            streak = stats.streak_days
        except Exception:
            # Fallback: simple check if they studied today
            studied_today = FocusSession.objects.filter(
                student=self.user,
                start_time__gte=self.today_start
            ).exists()
            streak = 1 if studied_today else 0

        return {
            'enrolled_courses': enrolled,
            'study_time_week_hours': study_time_hours,
            'tasks_completed_week': tasks_completed,
            'current_streak': streak
        }

    def get_weekly_activity(self):
        """Returns a small graph data for the last 7 days."""
        # pyrefly: ignore [missing-import]
        from django.db.models.functions import TruncDate
        # pyrefly: ignore [missing-import]
        from django.db.models import Sum

        days = 7
        labels = []
        study_hours = []

        week_ago = (self.now - datetime.timedelta(days=7)).date()
        rows = (
            FocusSession.objects
            .filter(student=self.user, status='completed', start_time__date__gte=week_ago)
            .annotate(day=TruncDate('start_time'))
            .values('day')
            .annotate(total=Sum('total_focus_seconds'))
        )
        sec_map = {row['day']: row['total'] for row in rows}
        
        for i in range(days):
            d = (self.now - datetime.timedelta(days=days - 1 - i)).date()
            labels.append(d.strftime('%a')) # Mon, Tue, etc.
            
            sec = sec_map.get(d, 0) or 0
            study_hours.append(round(sec / 3600, 1))
            
        return {
            'labels': labels,
            'study_hours': study_hours
        }

    def get_recent_activity(self):
        """Returns the single most recent Focus Session, Task, and AI Interaction."""
        last_focus = FocusSession.objects.filter(student=self.user).order_by('-start_time').first()
        last_task = (
            Task.objects.filter(
                user=self.user, source='STUDENT_CREATED', status='COMPLETED'
            ).order_by('-updated_at').first()
        )
        last_verified_assignment = (
            TaskAssignment.objects.filter(
                student=self.user, status='VERIFIED'
            ).order_by('-verified_at').first()
        )
        # Use the more recent of the two
        if last_verified_assignment and last_task:
            if (last_verified_assignment.verified_at or timezone.datetime.min.replace(tzinfo=timezone.utc)) > (last_task.updated_at or timezone.datetime.min.replace(tzinfo=timezone.utc)):
                last_task = None  # prefer assignment below
            else:
                last_verified_assignment = None
        last_ai = AIRequestLog.objects.filter(user=self.user).order_by('-timestamp').first()
        
        def format_focus(f):
            if not f: return None
            title = f.subject.name if f.subject else 'General Study'
            return {'title': title, 'time': f.start_time.isoformat(), 'type': 'focus'}
            
        def format_task(t):
            if not t: return None
            return {'title': t.title, 'time': t.updated_at.isoformat(), 'type': 'task'}

        def format_verified_assignment(a):
            if not a: return None
            return {'title': a.task.title, 'time': a.verified_at.isoformat(), 'type': 'task'}

        def format_ai(a):
            if not a: return None
            topic = a.detected_topic or 'General Query'
            return {'title': f"AI Chat: {topic}", 'time': a.timestamp.isoformat(), 'type': 'ai'}

        activities = [a for a in [
            format_focus(last_focus),
            format_task(last_task),
            format_verified_assignment(last_verified_assignment),
            format_ai(last_ai)
        ] if a]
        activities.sort(key=lambda x: x['time'], reverse=True)
        
        return activities

    def get_continue_learning(self):
        """Returns the last accessed course/topic based on progress or enrollment."""
        last_progress = (
            Progress.objects
            .filter(student=self.user)
            .select_related('content__topic__subject__course')
            .order_by('-completed_at')
            .first()
        )
        
        if last_progress:
            content = last_progress.content
            topic = content.topic
            course = topic.subject.course
            
            # Calculate course progress
            total = course.subjects.aggregate(Count('topics__contents'))['topics__contents__count'] or 0
            completed = Progress.objects.filter(student=self.user, content__topic__subject__course=course).count()
            pct = int((completed / total * 100)) if total > 0 else 0
            
            return {
                'has_data': True,
                'course_id': course.id,
                'course_name': course.name,
                'last_topic': topic.name,
                'progress_pct': pct
            }
            
        return {'has_data': False}

    def get_smart_insights(self):
        """Returns 2-4 friendly, actionable insights based on recent data."""
        insights = []
        
        # Check if studied today
        studied_today = FocusSession.objects.filter(
            student=self.user,
            start_time__gte=self.today_start
        ).exists()
        
        if not studied_today:
            insights.append("You haven't studied yet today. A quick 25-minute session is a great start!")
        else:
            insights.append("Great job studying today! Keep the momentum going.")
            
        # Check most active day this week
        weekly = self.get_weekly_activity()
        if sum(weekly['study_hours']) > 0:
            max_val = max(weekly['study_hours'])
            idx = weekly['study_hours'].index(max_val)
            best_day = weekly['labels'][idx]
            # Convert short day to full
            day_map = {'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'}
            insights.append(f"You were most productive on {day_map.get(best_day, best_day)} this week.")
            
        # Strict mode check
        normal_completed = FocusSession.objects.filter(student=self.user, mode='normal', status='completed').count()
        strict_completed = FocusSession.objects.filter(student=self.user, mode='strict', status='completed').count()
        
        if strict_completed > normal_completed and strict_completed > 0:
            insights.append("Strict mode improves your completion rate. Try using it more often!")
            
        return insights[:3]

    def get_ai_summary(self):
        """Returns Top AI topic and a brief suggestion."""
        recent_logs = AIRequestLog.objects.filter(
            user=self.user, 
            timestamp__gte=self.week_start
        ).exclude(detected_topic='')
        
        if not recent_logs.exists():
            return {
                'has_data': False,
                'message': 'Use the AI Assistant to get personalized learning suggestions.'
            }
            
        top_topic = recent_logs.values('detected_topic').annotate(c=Count('id')).order_by('-c').first()
        topic_name = top_topic['detected_topic']
        
        return {
            'has_data': True,
            'top_topic': topic_name,
            'message': f"You recently asked AI about {topic_name}. Try reviewing your notes or taking a practice quiz on this topic to solidify your understanding!"
        }
