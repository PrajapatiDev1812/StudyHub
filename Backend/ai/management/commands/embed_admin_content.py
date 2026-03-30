"""
Management command to embed all existing admin Content items.
Usage: python manage.py embed_admin_content
"""
from django.core.management.base import BaseCommand
from courses.models import Content
from ai.embeddings import embed_admin_content
from ai.gemini_client import is_configured


class Command(BaseCommand):
    help = 'Generate embeddings for all admin Content items that have text_content.'

    def handle(self, *args, **options):
        if not is_configured():
            self.stderr.write(self.style.ERROR(
                'Gemini API key not configured. Set GEMINI_API_KEY in .env'
            ))
            return

        contents = Content.objects.exclude(
            text_content__isnull=True
        ).exclude(
            text_content__exact=''
        )

        total = contents.count()
        self.stdout.write(f'Found {total} content items with text to embed.')

        success = 0
        for i, content in enumerate(contents, 1):
            self.stdout.write(f'[{i}/{total}] Embedding: {content.title}...')
            try:
                chunks = embed_admin_content(content)
                self.stdout.write(self.style.SUCCESS(f'  → {chunks} chunks created'))
                success += 1
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'  → Failed: {e}'))

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Embedded {success}/{total} content items.'
        ))
