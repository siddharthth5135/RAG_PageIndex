import os
from litellm import acompletion
from dotenv import load_dotenv

load_dotenv()

class AsyncLiteLLMClient:
    def __init__(self, model_name: str = "ollama/qwen2.5-coder:7b"):
        self.model_name = model_name
        
    async def generate_response(self, system_prompt: str, user_message: str, temperature: float = 0.1) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        try:
            response = await acompletion(
                model=self.model_name,
                messages=messages,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error during async LLM call: {e}")
            raise
