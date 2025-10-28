import google.generativeai as genai
import os
from dotenv import load_dotenv

# --- Configuration ---
# Make sure your .env file is in the same directory, or set the key directly.
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found.")
    print("Please make sure your .env file is present and contains your API key.")
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)

        print("--- Available Gemini Models ---")
        for m in genai.list_models():
            # Check if the model supports the 'generateContent' method
            if 'generateContent' in m.supported_generation_methods:
                print(f"Model Name: {m.name}")

    except Exception as e:
        print(f"An error occurred: {e}")
        print("Please check if your API key is valid and has access to the Generative Language API.")
