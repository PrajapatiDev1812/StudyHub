"""
ai/tasks.py
-----------
Background embedding pipeline for KnowledgeDocument uploads.

Currently runs SYNCHRONOUSLY (called directly from the upload view).

Celery integration:
    When Celery + Redis workers are available, change the call in
    ai/views/teacher_views.py from:

        embed_knowledge_document(doc.id)

    to:

        embed_knowledge_document_async.delay(doc.id)

    and uncomment the @shared_task decorator below.

Pipeline:
    1. Load KnowledgeDocument
    2. Mark embedding_status = 'processing'
    3. Extract text (if not already extracted)
    4. Chunk text → create KnowledgeChunk rows
    5. Generate embeddings → create KnowledgeEmbedding rows
    6. Mark status = 'done' (or 'failed')
    7. Update counters
"""

import json
import logging

logger = logging.getLogger(__name__)

# Minimum confidence threshold for low-confidence RAG answers
MIN_CONFIDENCE_THRESHOLD = 0.35


def embed_knowledge_document(document_id: int) -> bool:
    """
    Run the full embedding pipeline for a KnowledgeDocument.

    Parameters
    ----------
    document_id : Primary key of the KnowledgeDocument to embed.

    Returns
    -------
    True on success, False on failure.
    """
    from ai.models import KnowledgeDocument, KnowledgeChunk, KnowledgeEmbedding
    from ai.services.document_processor import (
        extract_text_from_file,
        chunk_document_text,
        approximate_token_count,
    )
    from ai.gemini_client import generate_embedding, is_configured

    try:
        doc = KnowledgeDocument.objects.get(pk=document_id)
    except KnowledgeDocument.DoesNotExist:
        logger.error(f"[EmbedTask] KnowledgeDocument {document_id} not found.")
        return False

    # ── Step 1: Mark as processing ──────────────────────────────────────────
    doc.embedding_status = 'processing'
    doc.error_message = ''
    doc.save(update_fields=['embedding_status', 'error_message', 'updated_at'])

    try:
        # ── Step 2: Extract text (if not already done) ──────────────────────
        if not doc.extracted_text.strip():
            logger.info(f"[EmbedTask] Extracting text from '{doc.title}' ({doc.file_type})")
            extracted = extract_text_from_file(
                file_path=doc.file.path,
                file_type=doc.file_type,
            )
            doc.extracted_text = extracted
            doc.save(update_fields=['extracted_text', 'updated_at'])
        else:
            extracted = doc.extracted_text

        if not extracted.strip():
            raise ValueError("No readable text found in document.")

        # ── Step 3: Delete old chunks (re-embed case) ────────────────────────
        KnowledgeChunk.objects.filter(document=doc).delete()

        # ── Step 4: Chunk text → KnowledgeChunk rows ─────────────────────────
        chunks = chunk_document_text(extracted)
        logger.info(f"[EmbedTask] '{doc.title}' → {len(chunks)} chunks")

        chunk_objects = []
        for i, chunk_text in enumerate(chunks):
            chunk_objects.append(KnowledgeChunk(
                document=doc,
                chunk_index=i,
                chunk_text=chunk_text,
                token_count=approximate_token_count(chunk_text),
            ))

        KnowledgeChunk.objects.bulk_create(chunk_objects)
        doc.total_chunks = len(chunk_objects)
        doc.embedded_chunks = 0
        doc.save(update_fields=['total_chunks', 'embedded_chunks', 'updated_at'])

        # ── Step 5: Generate embeddings → KnowledgeEmbedding rows ────────────
        if not is_configured():
            raise RuntimeError(
                "GEMINI_API_KEY not configured — cannot generate embeddings. "
                "Please add GEMINI_API_KEY to Backend/.env"
            )

        saved_chunks = KnowledgeChunk.objects.filter(document=doc).order_by('chunk_index')
        embedded_count = 0

        for chunk in saved_chunks:
            try:
                vector = generate_embedding(chunk.chunk_text)
                KnowledgeEmbedding.objects.create(
                    chunk=chunk,
                    embedding_vector=json.dumps(vector),
                    embedding_model='gemini-embedding-001',
                    embedding_version='v1',
                )
                embedded_count += 1
            except Exception as exc:
                logger.warning(f"[EmbedTask] Embedding failed for chunk {chunk.chunk_index}: {exc}")

        # ── Step 6: Mark done ─────────────────────────────────────────────────
        doc.embedded_chunks = embedded_count
        doc.embedding_status = 'done' if embedded_count > 0 else 'failed'
        if embedded_count == 0:
            doc.error_message = "All chunk embeddings failed. Check GEMINI_API_KEY and API quota."
        doc.save(update_fields=['embedded_chunks', 'embedding_status', 'error_message', 'updated_at'])

        logger.info(
            f"[EmbedTask] '{doc.title}' done: "
            f"{embedded_count}/{len(chunks)} chunks embedded."
        )
        return embedded_count > 0

    except Exception as exc:
        logger.error(f"[EmbedTask] Failed for document {document_id}: {exc}", exc_info=True)
        try:
            doc.embedding_status = 'failed'
            doc.error_message = str(exc)[:500]
            doc.save(update_fields=['embedding_status', 'error_message', 'updated_at'])
        except Exception:
            pass
        return False


# ── Future Celery Task (uncomment when Celery is configured) ──────────────────
# from celery import shared_task
#
# @shared_task(bind=True, max_retries=3, default_retry_delay=30)
# def embed_knowledge_document_async(self, document_id: int):
#     success = embed_knowledge_document(document_id)
#     if not success:
#         raise self.retry(exc=RuntimeError(f"Embedding failed for doc {document_id}"))
