"""
LLM Integration Service for SAMRAKSHA
Unified interface for LLaMA model access for assistant and chatbot services
"""

import os
import httpx
import structlog
import asyncio
from typing import Optional, Dict, Any, List
from enum import Enum

logger = structlog.get_logger()

class MessageRole(str, Enum):
    """Message roles for chat API"""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"

class LLMConfig:
    """LLM Configuration"""
    def __init__(self):
        self.base_url = os.getenv("LLAMACPP_URL", os.getenv("LLM_URL", "http://llamacpp:8080"))
        self.timeout = float(os.getenv("LLM_TIMEOUT", "30.0"))
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.1"))
        self.max_tokens = int(os.getenv("LLM_MAX_TOKENS", "500"))
        self.context_size = int(os.getenv("LLM_CONTEXT_SIZE", "512"))

class LLMIntegration:
    """
    Unified LLM integration for both assistant and chatbot
    Supports multiple API formats with fallback mechanisms
    """
    
    def __init__(self, config: Optional[LLMConfig] = None):
        self.config = config or LLMConfig()
        logger.info("LLM Integration initialized", base_url=self.config.base_url)
    
    async def health_check(self) -> bool:
        """Check if LLM service is healthy"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.config.base_url}/health")
                return resp.status_code == 200
        except Exception as e:
            logger.warning("Health check failed", error=str(e))
            return False
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Chat completion using OpenAI-compatible API format
        Used by: Assistant & Chatbot services
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            system: System prompt (added to messages if provided)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text response
        """
        config_temp = temperature or self.config.temperature
        config_tokens = max_tokens or self.config.max_tokens
        
        # Add system message if provided
        if system:
            messages = [
                {"role": "system", "content": system},
                *messages
            ]
        
        url = f"{self.config.base_url}/v1/chat/completions"
        payload = {
            "messages": messages,
            "temperature": config_temp,
            "max_tokens": config_tokens,
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                resp = await client.post(url, json=payload)
            
            if resp.status_code == 200:
                data = resp.json()
                if "choices" in data and len(data["choices"]) > 0:
                    choice = data["choices"][0]
                    if isinstance(choice, dict) and "message" in choice:
                        content = choice["message"].get("content", "").strip()
                        if content:
                            logger.info("Chat completion successful", tokens=config_tokens)
                            return content
            
            logger.warning("Chat completion failed", status=resp.status_code)
            
        except asyncio.TimeoutError:
            logger.error("Chat completion timeout")
        except Exception as e:
            logger.error("Chat completion error", error=str(e))
        
        # Fallback: return generic response
        return "I'm having trouble processing your request. Please try again."
    
    async def completion(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Text completion endpoint
        Used by: Translation service, fallback completion
        
        Args:
            prompt: Input prompt
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text
        """
        config_temp = temperature or self.config.temperature
        config_tokens = max_tokens or self.config.max_tokens
        
        url = f"{self.config.base_url}/completion"
        payload = {
            "prompt": prompt,
            "temperature": config_temp,
            "n_predict": config_tokens,
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                resp = await client.post(url, json=payload)
            
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("content", "").strip()
                if content:
                    logger.info("Completion successful")
                    return content
            
            logger.warning("Completion failed", status=resp.status_code)
            
        except Exception as e:
            logger.error("Completion error", error=str(e))
        
        return ""
    
    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        system: Optional[str] = None
    ):
        """
        Streaming chat completion
        Used by: Real-time chatbot responses
        
        Yields:
            Response chunks as they become available
        """
        if system:
            messages = [
                {"role": "system", "content": system},
                *messages
            ]
        
        url = f"{self.config.base_url}/v1/chat/completions"
        payload = {
            "messages": messages,
            "temperature": self.config.temperature,
            "stream": True
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                async with client.stream("POST", url, json=payload) as resp:
                    if resp.status_code == 200:
                        async for line in resp.aiter_lines():
                            if line.startswith("data: "):
                                try:
                                    import json
                                    chunk = json.loads(line[6:])
                                    if "choices" in chunk:
                                        delta = chunk["choices"][0].get("delta", {})
                                        if "content" in delta:
                                            yield delta["content"]
                                except Exception:
                                    pass
        except Exception as e:
            logger.error("Streaming error", error=str(e))
            yield "Error processing stream"

# Global instance for use across services
_llm_instance: Optional[LLMIntegration] = None

def get_llm() -> LLMIntegration:
    """Get or create LLM integration instance"""
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMIntegration()
    return _llm_instance

