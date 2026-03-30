"""
StudyHub AI — Embeddings Engine
Handles text chunking and embedding generation/storage.
"""
import json
import logging
from .models import AdminContentChunk, StudentContentChunk, StudentNote
from .gemini_client import generate_embedding
from courses.models import Content

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# TEXT CHUNKING
# ─────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Split a long text into overlapping chunks.

    Example with chunk_size=500, overlap=50:
      Chunk 1: chars 0-500
      Chunk 2: chars 450-950
      Chunk 3: chars 900-1400
      ...

    Returns a list of text strings.
    """
    if not text or not text.strip():
        return []

    text = text.strip()

    # If text fits in one chunk, return it directly
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size

        # Try to break at a sentence boundary (period, newline)
        if end < len(text):
            # Look for the last period or newline before `end`
            break_at = max(
                text.rfind('.', start, end),
                text.rfind('\n', start, end),
            )
            if break_at > start + (chunk_size // 2):
                end = break_at + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move forward by chunk_size minus overlap
        start = end - overlap
        if start >= len(text):
            break

    return chunks


# ─────────────────────────────────────────────
# EMBED ADMIN CONTENT
# ─────────────────────────────────────────────

def embed_admin_content(content: Content) -> int:
    """
    Take a Content object, chunk its text, generate embeddings,
    and store as AdminContentChunk records.

    Returns the number of chunks created.
    """
    # Get the text to embed
    text = content.text_content or ''
    if not text.strip():
        logger.warning(f"Content '{content.title}' has no text to embed.")
        return 0

    # Delete old chunks for this content (re-embed)
    AdminContentChunk.objects.filter(source_content=content).delete()

    # Get references
    topic = content.topic
    subject = topic.subject if topic else None
    course = subject.course if subject else None

    # Chunk the text
    chunks = chunk_text(text)
    logger.info(f"Chunking '{content.title}': {len(chunks)} chunks created")

    created_count = 0
    for i, chunk in enumerate(chunks):
        try:
            embedding = generate_embedding(chunk)
            AdminContentChunk.objects.create(
                course=course,
                subject=subject,
                topic=topic,
                source_content=content,
                chunk_text=chunk,
                chunk_index=i,
                embedding=json.dumps(embedding),
            )
            created_count += 1
        except Exception as e:
            logger.error(f"Failed to embed chunk {i} of '{content.title}': {e}")

    logger.info(f"Embedded '{content.title}': {created_count}/{len(chunks)} chunks")
    return created_count


# ─────────────────────────────────────────────
# EMBED STUDENT NOTE
# ─────────────────────────────────────────────

def embed_student_note(note: StudentNote) -> int:
    """
    Take a StudentNote, chunk its text, generate embeddings,
    and store as StudentContentChunk records.

    Returns the number of chunks created.
    """
    text = note.content or ''
    if not text.strip():
        return 0

    # Delete old chunks for this note
    StudentContentChunk.objects.filter(source_note=note).delete()

    chunks = chunk_text(text)
    logger.info(f"Chunking student note '{note.title}': {len(chunks)} chunks")

    created_count = 0
    for i, chunk in enumerate(chunks):
        try:
            embedding = generate_embedding(chunk)
            StudentContentChunk.objects.create(
                user=note.user,
                source_note=note,
                title=note.title,
                chunk_text=chunk,
                chunk_index=i,
                embedding=json.dumps(embedding),
            )
            created_count += 1
        except Exception as e:
            logger.error(f"Failed to embed student chunk {i}: {e}")

    return created_count
