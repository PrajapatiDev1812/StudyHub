"""
ai/services/document_processor.py
------------------------------------
Text extraction and chunking service for KnowledgeDocument uploads.

Supports:
    - PDF  : via pdfplumber
    - DOCX : via python-docx
    - TXT  : plain file read

Usage:
    from ai.services.document_processor import extract_text_from_file, chunk_document_text

    text   = extract_text_from_file(file_path, file_type='pdf')
    chunks = chunk_document_text(text)   # list of str
"""

import logging
import re

logger = logging.getLogger(__name__)

# ── Chunk Settings ─────────────────────────────────────────────────────────────
DEFAULT_CHUNK_SIZE = 450   # characters
DEFAULT_OVERLAP    = 50    # characters overlap between consecutive chunks
MAX_FILE_BYTES     = 10 * 1024 * 1024   # 10 MB upload limit (enforced in view too)


# ── Text Extraction ────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract plain text from a PDF file using pdfplumber.
    Handles multi-page documents and ignores extraction errors on individual pages.
    """
    try:
        import pdfplumber
        pages = []
        with pdfplumber.open(file_path) as pdf:
            for i, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text() or ''
                    if text.strip():
                        pages.append(text)
                except Exception as exc:
                    logger.warning(f"[DocProcessor] PDF page {i} extraction failed: {exc}")
        return '\n\n'.join(pages)
    except Exception as exc:
        logger.error(f"[DocProcessor] PDF extraction failed for '{file_path}': {exc}")
        raise ValueError(f"Could not extract text from PDF: {exc}") from exc


def extract_text_from_docx(file_path: str) -> str:
    """
    Extract plain text from a DOCX file using python-docx.
    Includes paragraph text only (not tables or headers for now).
    """
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        return '\n\n'.join(paragraphs)
    except Exception as exc:
        logger.error(f"[DocProcessor] DOCX extraction failed for '{file_path}': {exc}")
        raise ValueError(f"Could not extract text from DOCX: {exc}") from exc


def extract_text_from_txt(file_path: str) -> str:
    """Read plain text from a .txt file."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            return f.read()
    except Exception as exc:
        logger.error(f"[DocProcessor] TXT read failed for '{file_path}': {exc}")
        raise ValueError(f"Could not read text file: {exc}") from exc


def extract_text_from_file(file_path: str, file_type: str) -> str:
    """
    Dispatch to the correct extractor based on file_type.

    Parameters
    ----------
    file_path : Absolute path to the file on disk.
    file_type : One of 'pdf', 'docx', 'txt'.

    Returns
    -------
    Extracted text string. May be empty if the document has no readable text.

    Raises
    ------
    ValueError : If file_type is unsupported or extraction fails critically.
    """
    file_type = file_type.lower().strip('.')

    if file_type == 'pdf':
        return extract_text_from_pdf(file_path)
    elif file_type in ('docx', 'doc'):
        return extract_text_from_docx(file_path)
    elif file_type == 'txt':
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: '{file_type}'. Allowed: pdf, docx, txt")


# ── Text Chunking ──────────────────────────────────────────────────────────────

def _clean_text(text: str) -> str:
    """Remove excessive whitespace and normalize newlines."""
    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()


def chunk_document_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_OVERLAP,
) -> list[str]:
    """
    Split a long text into overlapping chunks suitable for embedding.

    Attempts to break at sentence boundaries (period/newline) within the
    last quarter of each chunk to preserve semantic coherence.

    Parameters
    ----------
    text       : Full extracted document text.
    chunk_size : Target chunk size in characters.
    overlap    : Number of trailing characters from previous chunk to repeat.

    Returns
    -------
    List of non-empty text strings.
    """
    text = _clean_text(text)
    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))

        # Try to break at a natural boundary in the last 25% of the chunk
        if end < len(text):
            boundary_start = start + int(chunk_size * 0.75)
            best_break = max(
                text.rfind('. ', boundary_start, end),
                text.rfind('.\n', boundary_start, end),
                text.rfind('\n', boundary_start, end),
            )
            if best_break > boundary_start:
                end = best_break + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap
        if start >= len(text):
            break

    return chunks


def approximate_token_count(text: str) -> int:
    """Rough token count estimate: len(text) // 4 (common approximation)."""
    return max(1, len(text) // 4)
