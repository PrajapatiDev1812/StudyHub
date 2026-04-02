"""
StudyHub AI — Gemini Client
Wrapper around the Google GenAI SDK (new google-genai package).
"""
import os
import logging
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Configure on import
_API_KEY = os.getenv('GEMINI_API_KEY', '')
_client = None

if _API_KEY and _API_KEY != 'YOUR_API_KEY_HERE':
    _client = genai.Client(api_key=_API_KEY)


def is_configured() -> bool:
    """Check if the Gemini API key is set."""
    return _client is not None


def generate_response(prompt: str, system_instruction: str = '') -> str:
    """
    Send a prompt to Gemini and return the text response.
    Tries multiple models in case one is rate-limited.
    """
    if not is_configured():
        return (
            "Gemini API key is not configured. "
            "Please set GEMINI_API_KEY in Backend/.env file. "
            "Get a free key from https://aistudio.google.com/apikey"
        )

    # Models to try in order of preference
    models_to_try = [
        'gemini-2.0-flash', 
        'gemini-flash-latest',
        'gemini-2.5-flash',
    ]

    # Strict Safety Settings
    safety_settings = [
        types.SafetySetting(
            category='HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold='BLOCK_LOW_AND_ABOVE'
        ),
        types.SafetySetting(
            category='HARM_CATEGORY_HATE_SPEECH',
            threshold='BLOCK_LOW_AND_ABOVE'
        ),
        types.SafetySetting(
            category='HARM_CATEGORY_HARASSMENT',
            threshold='BLOCK_LOW_AND_ABOVE'
        ),
        types.SafetySetting(
            category='HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold='BLOCK_LOW_AND_ABOVE'
        ),
    ]

    for model_name in models_to_try:
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction or None,
                safety_settings=safety_settings,
                temperature=0.2, # Lower temperature for better classification accuracy
            )
            response = _client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            
            # Check for safety blocker
            if not response.text:
                if response.candidates and response.candidates[0].finish_reason == 'SAFETY':
                    return "Blocked by safety filters: This assistant only provides academic and educational support."
                return "The response was blocked or empty due to safety guidelines."

            return response.text
        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
                logger.warning(f"Model {model_name} rate-limited, trying next...")
                continue
            logger.error(f"Gemini API error with {model_name}: {e}")
            return f"AI service error: {error_str[:200]}"

    return (
        "The AI service is temporarily rate-limited. "
        "Please wait a minute and try again. "
        "If this persists, check your API quota at https://ai.dev/rate-limit"
    )


def generate_embedding(text: str) -> list:
    """
    Generate an embedding vector for a text string.
    Returns a list of 768 floats.
    """
    if not is_configured():
        raise RuntimeError("Gemini API key not configured")

    try:
        result = _client.models.embed_content(
            model='gemini-embedding-001',
            contents=text,
            config=types.EmbedContentConfig(
                task_type='RETRIEVAL_DOCUMENT',
            ),
        )
        return list(result.embeddings[0].values)
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise


def generate_query_embedding(text: str) -> list:
    """
    Generate an embedding for a search query.
    Uses RETRIEVAL_QUERY task type for better search quality.
    """
    if not is_configured():
        raise RuntimeError("Gemini API key not configured")

    try:
        result = _client.models.embed_content(
            model='gemini-embedding-001',
            contents=text,
            config=types.EmbedContentConfig(
                task_type='RETRIEVAL_QUERY',
            ),
        )
        return list(result.embeddings[0].values)
    except Exception as e:
        logger.error(f"Query embedding error: {e}")
        raise
