"""
StudyHub AI — RAG Retrieval System
Finds the most relevant chunks for a user question using cosine similarity.
"""
import json
import logging
import numpy as np
from .models import AdminContentChunk, StudentContentChunk
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


def retrieve_relevant_chunks(
    query: str,
    user=None,
    top_k_admin: int = 5,
    top_k_student: int = 3,
    min_similarity: float = 0.3,
):
    """
    Main RAG retrieval function.

    1. Convert query to embedding
    2. Search admin chunks (global knowledge)
    3. Search student chunks (personal notes, if user provided)
    4. Rank by similarity score
    5. Return top-k results with metadata

    Returns a dict with:
      - admin_chunks: list of {text, score, course, subject, topic}
      - student_chunks: list of {text, score, title}
      - all_chunks: combined sorted list (student first if relevant)
    """
    # Step 1: Generate query embedding
    try:
        query_embedding = generate_query_embedding(query)
    except Exception as e:
        logger.error(f"Failed to generate query embedding: {e}")
        return {
            'admin_chunks': [],
            'student_chunks': [],
            'all_chunks': [],
            'error': str(e),
        }

    # Step 2: Search admin chunks
    admin_results = []
    admin_chunks = AdminContentChunk.objects.exclude(
        embedding__isnull=True
    ).exclude(embedding='')

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
                    'chunk_id': chunk.id,
                })
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Skipping admin chunk {chunk.id}: {e}")
            continue

    # Sort by score (highest first) and take top-k
    admin_results.sort(key=lambda x: x['score'], reverse=True)
    admin_results = admin_results[:top_k_admin]

    # Step 3: Search student chunks (only for this user)
    student_results = []
    if user:
        student_chunks = StudentContentChunk.objects.filter(
            user=user,
            source_note__is_approved_for_ai=True,
            source_note__moderation_status__in=['approved_academic', 'approved_medical']
        ).exclude(
            embedding__isnull=True
        ).exclude(embedding='')

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

    # Step 4: Combine (student chunks first, then admin)
    all_chunks = student_results + admin_results

    logger.info(
        f"RAG retrieval for '{query[:50]}...': "
        f"{len(admin_results)} admin, {len(student_results)} student chunks"
    )

    return {
        'admin_chunks': admin_results,
        'student_chunks': student_results,
        'all_chunks': all_chunks,
    }
