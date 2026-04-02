"""
check_models.py
---------------
Lists available Gemini models using the current configuration.
"""

import os
import django
from google import genai

# Setup Django (to get env vars)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai.gemini_client import is_configured, _API_KEY

def check():
    if not _API_KEY:
        print("API Key not set!")
        return

    client = genai.Client(api_key=_API_KEY)
    print("Listing models...")
    try:
        # The new SDK might have a different way to list models
        # client.models.list() returns an iterator of model objects
        for m in client.models.list():
            print(f"- {m.name} (Supported: {m.supported_actions})")
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    check()
