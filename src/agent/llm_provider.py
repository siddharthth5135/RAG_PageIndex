import os
from litellm import acompletion
from dotenv import load_dotenv

load_dotenv()

# Define professional fallback order
# Priority: Groq (Fastest) -> Gemini (Reliable) -> Ollama (Local Fallback if configured)
DEFAULT_FALLBACKS = ["groq/llama-3.3-70b-versatile", "gemini/gemini-1.5-flash"]

async def smart_completion(messages, temperature=0.1, model=None):
    """
    Executes an LLM call with automatic failover logic.
    If the primary model hits a rate limit or error, it switches to the fallback.
    """
    primary_model = model or DEFAULT_FALLBACKS[0]
    
    # Filter out models that might not have keys configured
    active_fallbacks = [m for m in DEFAULT_FALLBACKS if m != primary_model]
    
    try:
        # We use litellm's built-in fallback mechanism
        response = await acompletion(
            model=primary_model,
            messages=messages,
            temperature=temperature,
            fallbacks=active_fallbacks
        )
        return response
    except Exception as e:
        print(f"LLM Provider Error: {str(e)}")
        raise e
