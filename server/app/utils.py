from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

# async def generate_ai_response(
#     message: str, context: str = "", welcome_msg: str = ""
# ) -> str:
#     """Generate AI response using local Ollama server"""

#     system_prompt = f"""You are a helpful AI assistant.
#     Welcome message: {welcome_msg}

#     Context from documents along with chat history:
#     {context}

#     Please provide a helpful response based on the context provided.
#     If the context doesn't contain relevant information, provide a general helpful response.
#     Don't mention 'context' word
#     """

#     try:
#         response = requests.post(
#             "http://localhost:11434/api/generate",
#             json={
#                 "model": "gemma3:1b",  # or "llama2", "gemma", etc.
#                 "prompt": message,
#                 "system": system_prompt,
#                 "stream": False,
#             },
#         )
#         if response.status_code == 200:
#             return response.json()["response"]
#         else:
#             return f"Sorry, I encountered an error. Please try again later."

#     except Exception as e:
#         return f"Error generating response: {str(e)}"


# Configure the API key


async def generate_ai_response(
    message: str, context: str = "", welcome_msg: str = ""
) -> str:
    """Generate AI response using Google Gemini 2.5 Flash-Lite API"""

    system_prompt = f"""You are a helpful AI assistant.
    Welcome message: {welcome_msg}

    Context from documents along with chat history:
    {context}

    Please provide a helpful response based on the context provided.
    If the context doesn't contain relevant information, provide a general helpful response.
    Don't mention 'context' word
    """

    try:
        full_prompt = f"{system_prompt}\n\nUser: {message}\n\nAssistant:"

        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

        response = client.models.generate_content(
            model="gemini-2.5-flash-lite", contents=full_prompt
        )

        return response.text

    except Exception as e:
        return f"Error generating response: {str(e)}"
