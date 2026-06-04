import datetime
from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from focus.models import FocusSession
from tasks.models import Task
from courses.models import Progress, Course, Subject
from ai.models import AIRequestLog

class StudentAnalyticsService:
    def __init__(self, user, start_date=None, end_date=None):
        self.user = user
        self.now = timezone.now()
        
        # Parse dates
        if isinstance(start_date, str):
            start_date = datetime.date.fromisoformat(start_date)
        if isinstance(end_date, str):
            end_date = datetime.date.fromisoformat(end_date)
            
        self.start_date = start_date
        self.end_date = end_date

    def _get_date_filter(self, date_field):
        """Helper to return Q objects for date filtering."""
        q = Q()
        if self.start_date:
            # start_date is a date, so we want >= midnight of that date
            dt = datetime.datetime.combine(self.start_date, datetime.time.min)
            dt = timezone.make_aware(dt) if timezone.is_naive(dt) else dt
            q &= Q(**{f"{date_field}__gte": dt})
        if self.end_date:
            # end_date is a date, so we want <= end of that date
            dt = datetime.datetime.combine(self.end_date, datetime.time.max)
            dt = timezone.make_aware(dt) if timezone.is_naive(dt) else dt
            q &= Q(**{f"{date_field}__lte": dt})
        return q

    def get_summary_stats(self):
        """Returns top-level summary cards data."""
        # 1. Total Study Time (from completed FocusSessions)
        fs_q = self._get_date_filter('start_time')
        focus_stats = FocusSession.objects.filter(
            student=self.user,
            status='completed'
        ).filter(fs_q).aggregate(
            total_seconds=Sum('total_focus_seconds'),
            sessions_count=Count('id')
        )
        total_focus_seconds = focus_stats['total_seconds'] or 0
        total_study_time_hours = round(total_focus_seconds / 3600, 1)
        sessions_completed = focus_stats['sessions_count'] or 0

        # 2. Tasks Completed
        t_q = self._get_date_filter('completed_at')
        tasks_completed = Task.objects.filter(
            user=self.user,
            completed=True
        ).filter(t_q).count()
        
        # 3. Content Completed (from Progress)
        p_q = self._get_date_filter('completed_at')
        content_completed = Progress.objects.filter(
            student=self.user
        ).filter(p_q).count()

        # Productivity Score (Simple heuristic)
        # 1 point per 10 mins focus, 5 points per task, 10 points per content
        productivity_score = int((total_focus_seconds / 600) + (tasks_completed * 5) + (content_completed * 10))

        return {
            'total_study_time_hours': total_study_time_hours,
            'sessions_completed': sessions_completed,
            'tasks_completed': tasks_completed,
            'content_completed': content_completed,
            'productivity_score': productivity_score,
        }

    def get_study_distribution(self):
        """Returns daily distribution of study hours and tasks completed."""
        # We'll generate a timeline from start_date to end_date (or last 7 days if None)
        end = self.end_date or self.now.date()
        start = self.start_date or (end - datetime.timedelta(days=7))
        
        # Limit to 365 days max for performance
        if (end - start).days > 365:
            start = end - datetime.timedelta(days=365)
            
        days = (end - start).days
        labels = []
        study_hours = []
        tasks = []

        fs_q = self._get_date_filter('start_time')
        focus_rows = (
            FocusSession.objects.filter(student=self.user, status='completed').filter(fs_q)
            .annotate(day=TruncDate('start_time'))
            .values('day')
            .annotate(total=Sum('total_focus_seconds'))
        )
        focus_map = {row['day']: row['total'] for row in focus_rows}

        task_rows = (
            Task.objects.filter(user=self.user, completed=True).filter(self._get_date_filter('completed_at'))
            .annotate(day=TruncDate('completed_at'))
            .values('day')
            .annotate(count=Count('id'))
        )
        task_map = {row['day']: row['count'] for row in task_rows}

        prog_rows = (
            Progress.objects.filter(student=self.user).filter(self._get_date_filter('completed_at'))
            .annotate(day=TruncDate('completed_at'))
            .values('day')
            .annotate(count=Count('id'))
        )
        prog_map = {row['day']: row['count'] for row in prog_rows}
        
        for i in range(days + 1):
            current_date = start + datetime.timedelta(days=i)
            labels.append(current_date.strftime('%b %d'))
            
            f_sec = focus_map.get(current_date, 0) or 0
            study_hours.append(round(f_sec / 3600, 2))
            
            t_count = task_map.get(current_date, 0) or 0
            c_count = prog_map.get(current_date, 0) or 0
            tasks.append(t_count + c_count)
            
        return {
            'labels': labels,
            'study_hours': study_hours,
            'tasks_completed': tasks
        }

    def get_course_distribution(self):
        """Returns focus time distributed by course."""
        fs_q = self._get_date_filter('start_time')
        sessions = FocusSession.objects.filter(
            student=self.user,
            status='completed'
        ).filter(fs_q).exclude(course__isnull=True).values('course__name').annotate(
            total_sec=Sum('total_focus_seconds')
        ).order_by('-total_sec')
        
        labels = [s['course__name'] for s in sessions]
        values = [round(s['total_sec'] / 3600, 2) for s in sessions]
        
        if not labels:
            # Try subjects if course is empty
            sessions = FocusSession.objects.filter(
                student=self.user,
                status='completed'
            ).filter(fs_q).exclude(subject__isnull=True).values('subject__name').annotate(
                total_sec=Sum('total_focus_seconds')
            ).order_by('-total_sec')
            labels = [s['subject__name'] for s in sessions]
            values = [round(s['total_sec'] / 3600, 2) for s in sessions]
            
        return {
            'labels': labels,
            'values': values
        }

    def get_time_of_day_analysis(self):
        """Aggregates focus sessions into Morning, Afternoon, Evening, Night."""
        from django.db.models.functions import ExtractHour
        from django.db.models import Sum

        fs_q = self._get_date_filter('start_time')
        rows = (
            FocusSession.objects.filter(student=self.user, status='completed').filter(fs_q)
            .annotate(hour=ExtractHour('start_time'))
            .values('hour')
            .annotate(total=Sum('total_focus_seconds'))
        )
        
        distribution = {
            'Morning (6 AM - 12 PM)': 0,
            'Afternoon (12 PM - 5 PM)': 0,
            'Evening (5 PM - 10 PM)': 0,
            'Night (10 PM - 6 AM)': 0
        }
        
        for row in rows:
            hour = row['hour']
            sec = row['total'] or 0
            
            if 6 <= hour < 12:
                distribution['Morning (6 AM - 12 PM)'] += sec
            elif 12 <= hour < 17:
                distribution['Afternoon (12 PM - 5 PM)'] += sec
            elif 17 <= hour < 22:
                distribution['Evening (5 PM - 10 PM)'] += sec
            else:
                distribution['Night (10 PM - 6 AM)'] += sec
                
        return {
            'labels': list(distribution.keys()),
            'values': [
                round(distribution['Morning (6 AM - 12 PM)'] / 3600, 2),
                round(distribution['Afternoon (12 PM - 5 PM)'] / 3600, 2),
                round(distribution['Evening (5 PM - 10 PM)'] / 3600, 2),
                round(distribution['Night (10 PM - 6 AM)'] / 3600, 2)
            ]
        }

    def get_focus_mode_analytics(self):
        """Compares Normal vs Strict mode."""
        fs_q = self._get_date_filter('start_time')
        qs = FocusSession.objects.filter(student=self.user).filter(fs_q)
        
        normal_sessions = qs.filter(mode='normal')
        strict_sessions = qs.filter(mode='strict')
        
        def calc_stats(sqs):
            total = sqs.count()
            completed = sqs.filter(status='completed').count()
            abandoned = sqs.filter(status='abandoned').count()
            avg_sec = sqs.filter(status='completed').aggregate(Avg('total_focus_seconds'))['total_focus_seconds__avg'] or 0
            return {
                'total': total,
                'completed': completed,
                'abandoned': abandoned,
                'avg_duration_min': round(avg_sec / 60, 1),
                'completion_rate': round((completed / total * 100) if total > 0 else 0, 1)
            }
            
        return {
            'normal_mode': calc_stats(normal_sessions),
            'strict_mode': calc_stats(strict_sessions)
        }

    def get_ai_learning_insights(self):
        """Insights from AIRequestLog showing where AI was used."""
        ai_q = self._get_date_filter('timestamp')
        logs = AIRequestLog.objects.filter(
            user=self.user,
            status='success'
        ).filter(ai_q)
        
        # Top topics
        top_topics_data = logs.exclude(detected_topic='').values('detected_topic').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        top_topics = {
            'labels': [t['detected_topic'] for t in top_topics_data],
            'values': [t['count'] for t in top_topics_data]
        }
        
        # Focus mode integration
        # Count AI requests that have a focus_session linked
        # Wait, AIRequestLog doesn't have focus_session FK currently.
        # We can approximate by checking if timestamp falls within a focus session,
        # but that's heavy. We'll just return general AI usage stats for now.
        
        total_ai_interactions = logs.count()
        
        return {
            'top_topics': top_topics,
            'total_interactions': total_ai_interactions
        }

    def get_smart_insights(self):
        """Generate human-readable sentences based on data."""
        insights = []
        
        # 1. Best time of day
        tod = self.get_time_of_day_analysis()
        max_val = max(tod['values']) if tod['values'] else 0
        if max_val > 0:
            idx = tod['values'].index(max_val)
            best_time = tod['labels'][idx].split(' (')[0]
            insights.append({
                'type': 'time',
                'title': 'Prime Time',
                'body': f"You study most effectively in the {best_time}."
            })
            
        # 2. Strict vs Normal
        modes = self.get_focus_mode_analytics()
        if modes['strict_mode']['completion_rate'] > modes['normal_mode']['completion_rate'] and modes['strict_mode']['total'] > 2:
            insights.append({
                'type': 'focus',
                'title': 'Strict Mode Works',
                'body': "Your completion rate is higher when using Strict Mode."
            })
            
        # 3. Top AI Topic
        ai = self.get_ai_learning_insights()
        if ai['top_topics']['labels']:
            top = ai['top_topics']['labels'][0]
            insights.append({
                'type': 'ai',
                'title': 'AI Assistant',
                'body': f"You used the AI Assistant the most while exploring {top}."
            })
            
        if not insights:
            insights.append({
                'type': 'general',
                'title': 'Keep going!',
                'body': "Complete more sessions to unlock personalized insights."
            })
            
        return insights

    def get_all_analytics(self):
        return {
            'summary': self.get_summary_stats(),
            'study_distribution': self.get_study_distribution(),
            'course_distribution': self.get_course_distribution(),
            'time_of_day': self.get_time_of_day_analysis(),
            'focus_mode': self.get_focus_mode_analytics(),
            'ai_insights': self.get_ai_learning_insights(),
            'smart_insights': self.get_smart_insights()
        }
