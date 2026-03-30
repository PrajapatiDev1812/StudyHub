"""
StudyHub AI — Signals
Auto-embed content when admin saves a Content item with text.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from courses.models import Content
from .gemini_client import is_configured

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Content)
def auto_embed_content(sender, instance, created, **kwargs):
    """
    Whenever a Content item is saved with text_content,
    automatically generate embeddings.
    Only runs if Gemini API key is configured.
    """
    if not instance.text_content or not instance.text_content.strip():
        return

    if not is_configured():
        logger.debug("Skipping auto-embed: Gemini API key not configured.")
        return

    # Import here to avoid circular imports
    from .embeddings import embed_admin_content

    try:
        count = embed_admin_content(instance)
        logger.info(f"Auto-embedded '{instance.title}': {count} chunks")
    except Exception as e:
        logger.error(f"Auto-embed failed for '{instance.title}': {e}")
