import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = "gemini-1.5-flash-latest"
ENDPOINT = "https://generativelanguage.googleapis.com/v1"
METHOD = "generateContent"

def call_gemini_api(prompt):
    """
    Calls the Google Gemini API using the v1beta endpoint and gemini-1.5-flash-latest model.
    The API key is loaded from environment variables.
    """
    if not GOOGLE_API_KEY:
        print("Error: GOOGLE_API_KEY environment variable not set.")
        return None

    url = f"{ENDPOINT}/models/{MODEL_NAME}:{METHOD}?key={GOOGLE_API_KEY}"
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    print(f"--- LUMINA: Gemini API Request ---")
    print(f"Model: {MODEL_NAME}")
    print(f"Endpoint: {ENDPOINT}")
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        
        data = response.json()
        if 'candidates' in data and len(data['candidates']) > 0:
            result = data['candidates'][0]['content']['parts'][0]['text']
            print("Status: SUCCESS")
            return result
        else:
            print("Status: FAILED (No candidates found)")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Status: ERROR")
        print(f"Message: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")
        return None

if __name__ == "__main__":
    test_prompt = "Respond with only the word READY."
    response = call_gemini_api(test_prompt)
    if response:
        print(f"Response: {response.strip()}")
