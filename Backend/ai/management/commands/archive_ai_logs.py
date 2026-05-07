"""
ai/management/commands/archive_ai_logs.py
------------------------------------------
Management command to archive (or permanently delete) old AIRequestLog entries.

This is the retention policy mechanism for the AI Usage Insights system.

Usage:
    # Archive (soft-delete) logs older than 90 days (default):
    python manage.py archive_ai_logs

    # Archive logs older than 60 days:
    python manage.py archive_ai_logs --days 60

    # Permanently DELETE archived logs older than 180 days:
    python manage.py archive_ai_logs --purge --days 180

    # Dry run — see how many would be affected without making changes:
    python manage.py archive_ai_logs --dry-run

Recommended: run weekly via a cron job or Celery Beat.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Archive or purge old AIRequestLog entries for retention policy.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Number of days to retain active logs (default: 90).',
        )
        parser.add_argument(
            '--purge',
            action='store_true',
            default=False,
            help='Permanently DELETE already-archived logs older than --days. '
                 'Without this flag, logs are only soft-archived (is_archived=True).',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Show how many records would be affected without making changes.',
        )

    def handle(self, *args, **options):
        from ai.models import AIRequestLog

        days     = options['days']
        purge    = options['purge']
        dry_run  = options['dry_run']
        cutoff   = timezone.now() - timedelta(days=days)

        if purge:
            # Permanently delete logs that are already archived AND older than cutoff
            target_qs = AIRequestLog.objects.filter(
                is_archived=True,
                timestamp__lt=cutoff,
            )
            count = target_qs.count()
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'[DRY RUN] Would permanently DELETE {count} archived logs '
                        f'older than {days} days (before {cutoff.date()}).'
                    )
                )
            else:
                deleted, _ = target_qs.delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Permanently deleted {deleted} archived AI request logs '
                        f'older than {days} days.'
                    )
                )
        else:
            # Soft-archive: set is_archived=True on active logs older than cutoff
            target_qs = AIRequestLog.objects.filter(
                is_archived=False,
                timestamp__lt=cutoff,
            )
            count = target_qs.count()
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'[DRY RUN] Would archive {count} active logs '
                        f'older than {days} days (before {cutoff.date()}).'
                    )
                )
            else:
                updated = target_qs.update(is_archived=True)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Archived {updated} AI request logs older than {days} days. '
                        f'They are now excluded from live dashboards.'
                    )
                )
