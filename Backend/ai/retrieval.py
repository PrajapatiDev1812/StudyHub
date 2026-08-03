"""
StudyHub AI — RAG Retrieval System
Finds the most relevant chunks for a user question using cosine similarity.

Soft-Delete Safety:
  All chunk queries exclude content from soft-deleted courses, subjects,
  topics, or source_content to prevent the AI from citing deleted materials.
"""
import json
import logging
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from .models import AdminContentChunk, StudentContentChunk
# pyrefly: ignore [missing-import]
from .gemini_client import generate_query_embedding

logger = logging.getLogger(__name__)


def cosine_similarity(vec_a: list, vec_b: list) -> float:
    """
    Compute cosine similarity between two vectors.
    Returns a float between -1 and 1 (higher = more similar).
    """
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)

    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(dot / (norm_a * norm_b))


# Enhancement 6: configurable low-confidence threshold
MIN_CONFIDENCE_THRESHOLD = 0.35


def retrieve_relevant_chunks(
    query: str,
    user=None,
    top_k_admin: int = 5,
    top_k_student: int = 3,
    top_k_knowledge: int = 3,
    min_similarity: float = 0.3,
):
    """
    Main RAG retrieval function.

    Sources searched (in order of priority in combined output):
      1. AdminContentChunk  — course-hierarchy embedded content
      2. KnowledgeEmbedding — teacher-uploaded knowledge documents
      3. StudentContentChunk — personal student notes (user-scoped)

    Returns a dict with:
      - admin_chunks    : list of {text, score, course, subject, topic, source_title, chunk_index}
      - student_chunks  : list of {text, score, title}
      - knowledge_chunks: list of {text, score, document, subject, topic, chunk_index}
      - all_chunks      : combined sorted list
      - confidence      : float 0.0–1.0 (top similarity score across all sources)
      - low_confidence  : bool (True when confidence < MIN_CONFIDENCE_THRESHOLD)
    """
    # Step 1: Generate query embedding
    try:
        query_embedding = generate_query_embedding(query)
    except Exception as e:
        logger.error(f"Failed to generate query embedding: {e}")
        return {
            'admin_chunks': [],
            'student_chunks': [],
            'knowledge_chunks': [],
            'all_chunks': [],
            'confidence': 0.0,
            'low_confidence': True,
            'error': str(e),
        }

    # Step 2: Search admin chunks — exclude chunks linked to soft-deleted content
    admin_results = []
    admin_chunks = AdminContentChunk.objects.exclude(
        embedding__isnull=True
    ).exclude(embedding='').filter(
        # Only include chunks from ACTIVE (non-soft-deleted) parents
        course__is_deleted=False,
    ).filter(
        # Exclude chunks whose subject is soft-deleted (if subject exists)
        models.Q(subject__isnull=True) | models.Q(subject__is_deleted=False)
    ).filter(
        # Exclude chunks whose topic is soft-deleted (if topic exists)
        models.Q(topic__isnull=True) | models.Q(topic__is_deleted=False)
    ).filter(
        # Exclude chunks whose source content is soft-deleted (if exists)
        models.Q(source_content__isnull=True) | models.Q(source_content__is_deleted=False)
    ).select_related('course', 'subject', 'topic', 'source_content')

    for chunk in admin_chunks:
        try:
            chunk_embedding = json.loads(chunk.embedding)
            score = cosine_similarity(query_embedding, chunk_embedding)

            if score >= min_similarity:
                admin_results.append({
                    'text': chunk.chunk_text,
                    'score': round(score, 4),
                    'source': 'admin',
                    'course': chunk.course.name if chunk.course else 'N/A',
                    'subject': chunk.subject.name if chunk.subject else 'N/A',
                    'topic': chunk.topic.name if chunk.topic else 'N/A',
                    'source_title': chunk.source_content.title if chunk.source_content else 'N/A',
                    'chunk_index': chunk.chunk_index,
                    'chunk_id': chunk.id,
                })
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Skipping admin chunk {chunk.id}: {e}")
            continue

    # Sort by score (highest first) and take top-k
    admin_results.sort(key=lambda x: x['score'], reverse=True)
    admin_results = admin_results[:top_k_admin]

    # Step 3: Search KnowledgeEmbedding chunks (Enhancement 2)
    knowledge_results = []
    try:
        from .models import KnowledgeEmbedding
        knowledge_embeddings = (
            KnowledgeEmbedding.objects
            .select_related('chunk', 'chunk__document', 'chunk__document__subject')
            .filter(chunk__document__embedding_status='done')
        )
        for ke in knowledge_embeddings:
            try:
                chunk_embedding = json.loads(ke.embedding_vector)
                score = cosine_similarity(query_embedding, chunk_embedding)
                if score >= min_similarity:
                    doc = ke.chunk.document
                    knowledge_results.append({
                        'text': ke.chunk.chunk_text,
                        'score': round(score, 4),
                        'source': 'knowledge',
                        'document': doc.title,
                        'subject': doc.subject.name if doc.subject else 'N/A',
                        'topic': 'N/A',
                        'chunk_index': ke.chunk.chunk_index,
                        'chunk_id': ke.chunk.id,
                    })
            except (json.JSONDecodeError, Exception) as e:
                logger.warning(f"Skipping knowledge chunk {ke.id}: {e}")
                continue
        knowledge_results.sort(key=lambda x: x['score'], reverse=True)
        knowledge_results = knowledge_results[:top_k_knowledge]
    except Exception as e:
        logger.warning(f"KnowledgeEmbedding retrieval skipped: {e}")

    # Step 4: Search student chunks (only for this user)
    student_results = []
    if user:
        student_chunks = StudentContentChunk.objects.filter(
            user=user,
            source_note__is_approved_for_ai=True,
            source_note__moderation_status__in=['approved_academic', 'approved_medical']
        ).exclude(
            embedding__isnull=True
        ).exclude(embedding='').filter(
            # Exclude student chunks linked to soft-deleted topics (if topic set)
            models.Q(source_note__topic__isnull=True) | models.Q(source_note__topic__is_deleted=False)
        ).filter(
            # Exclude student chunks linked to soft-deleted subjects
            models.Q(source_note__subject__isnull=True) | models.Q(source_note__subject__is_deleted=False)
        )

        for chunk in student_chunks:
            try:
                chunk_embedding = json.loads(chunk.embedding)
                score = cosine_similarity(query_embedding, chunk_embedding)

                if score >= min_similarity:
                    student_results.append({
                        'text': chunk.chunk_text,
                        'score': round(score, 4),
                        'source': 'student',
                        'title': chunk.title or 'Untitled Note',
                        'chunk_id': chunk.id,
                    })
            except (json.JSONDecodeError, Exception) as e:
                logger.warning(f"Skipping student chunk {chunk.id}: {e}")
                continue

        student_results.sort(key=lambda x: x['score'], reverse=True)
        student_results = student_results[:top_k_student]

    # Step 5: Combine (student chunks first, then admin, then knowledge)
    all_chunks = student_results + admin_results + knowledge_results

    # Enhancement 6: compute confidence score
    confidence = max((c['score'] for c in all_chunks), default=0.0)
    low_confidence = confidence < MIN_CONFIDENCE_THRESHOLD

    logger.info(
        f"RAG retrieval for '{query[:50]}...': "
        f"{len(admin_results)} admin, {len(student_results)} student, "
        f"{len(knowledge_results)} knowledge chunks | confidence={confidence:.3f}"
    )

    return {
        'admin_chunks': admin_results,
        'student_chunks': student_results,
        'knowledge_chunks': knowledge_results,
        'all_chunks': all_chunks,
        'confidence': round(confidence, 4),
        'low_confidence': low_confidence,
    }
