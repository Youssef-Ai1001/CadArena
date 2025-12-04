"""
AI Service for CadArena with flexible provider support.
Currently supports Ollama, designed to easily accommodate custom providers.
"""
import asyncio
import aiohttp
from typing import Optional
from app.core.config import settings


class AIProvider:
    """Base class for AI providers - allows easy extension for custom providers."""
    
    async def generate_dxf(self, prompt: str) -> str:
        """Generate DXF code from prompt. Must be implemented by subclasses."""
        raise NotImplementedError


class OllamaProvider(AIProvider):
    """Ollama AI provider implementation."""
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3"):
        self.base_url = base_url
        self.model = model
        self.timeout = aiohttp.ClientTimeout(total=120)
    
    async def generate_dxf(self, prompt: str) -> str:
        """Generate DXF using Ollama API."""
        system_prompt = """You are a CAD expert that generates DXF (Drawing Exchange Format) code from natural language descriptions.

Your task is to:
1. Understand the user's CAD design request
2. Generate valid DXF code that represents the design
3. Return ONLY the DXF code, nothing else

DXF format rules:
- Start with "0\\nSECTION\\n  2\\nENTITIES"
- Each entity should follow DXF format
- Common entities: LINE, CIRCLE, ARC, POLYLINE
- End with "  0\\nENDSEC\\n  0\\nEOF"

Example DXF for a line from (10,10) to (50,50):
0
SECTION
  2
ENTITIES
  0
LINE
 10
10.0
 20
10.0
 11
50.0
 21
50.0
  0
ENDSEC
  0
EOF

Generate clean, valid DXF code only."""
        
        full_prompt = f"{system_prompt}\n\nUser request: {prompt}\n\nGenerate the DXF code:"
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                        }
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("response", "").strip()
                    else:
                        error_text = await response.text()
                        print(f"Ollama API error ({response.status}): {error_text}")
                        return None
        except aiohttp.ClientError as e:
            print(f"Error connecting to Ollama: {e}")
            return None
        except asyncio.TimeoutError:
            print("Ollama request timed out")
            return None
        except Exception as e:
            print(f"Unexpected error calling Ollama: {e}")
            return None


class CustomProvider(AIProvider):
    """
    Template for custom AI provider implementation.
    
    To use a custom provider:
    1. Implement the generate_dxf method
    2. Update CADArenaAIService to use your provider
    3. Configure provider settings in config.py
    """
    
    def __init__(self, api_key: str = "", api_url: str = ""):
        self.api_key = api_key
        self.api_url = api_url
    
    async def generate_dxf(self, prompt: str) -> str:
        """
        Implement your custom AI provider logic here.
        
        Args:
            prompt: User's natural language prompt
            
        Returns:
            Clean DXF code string
        """
        # TODO: Implement your custom provider logic
        # Example structure:
        # - Make API call to your provider
        # - Parse response
        # - Extract DXF code
        # - Return clean DXF string
        
        raise NotImplementedError("Custom provider not yet implemented")


class CADArenaAIService:
    """
    Core AI service for CadArena with flexible provider support.
    
    🚀 PROVIDER SYSTEM: Easy to swap between providers or add custom ones.
    - Current: Ollama (llama3)
    - Future: Add your custom provider by implementing AIProvider interface
    """
    
    def __init__(self):
        """Initialize AI service with configured provider."""
        self.provider = self._initialize_provider()
    
    def _initialize_provider(self) -> AIProvider:
        """
        Initialize the AI provider based on configuration.
        
        To add a custom provider:
        1. Create a new provider class inheriting from AIProvider
        2. Update this method to return your provider
        3. Configure settings in config.py
        """
        provider_type = getattr(settings, 'AI_PROVIDER', 'ollama').lower()
        
        if provider_type == 'ollama':
            return OllamaProvider(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL
            )
        elif provider_type == 'custom':
            # TODO: Initialize your custom provider here
            # return CustomProvider(
            #     api_key=settings.CUSTOM_PROVIDER_API_KEY,
            #     api_url=settings.CUSTOM_PROVIDER_URL
            # )
            raise ValueError("Custom provider not yet configured. Set AI_PROVIDER=ollama or implement CustomProvider.")
        else:
            raise ValueError(f"Unknown AI provider: {provider_type}")
    
    def _extract_dxf_from_response(self, response: str) -> str:
        """
        Extract clean DXF code from AI response.
        
        Args:
            response: Raw response from AI provider
            
        Returns:
            Clean DXF code
        """
        if not response:
            return ""
        
        # Remove markdown code blocks if present
        if "```" in response:
            parts = response.split("```")
            for part in parts:
                if "dxf" in part.lower() or "SECTION" in part or "ENTITIES" in part:
                    response = part
                    break
        
        # Remove "dxf" label if present
        lines = response.split("\n")
        dxf_lines = []
        in_dxf = False
        
        for line in lines:
            if "SECTION" in line or "ENTITIES" in line:
                in_dxf = True
            if in_dxf:
                dxf_lines.append(line)
            if "EOF" in line:
                break
        
        if dxf_lines:
            return "\n".join(dxf_lines)
        
        # Fallback: return response as-is if no extraction worked
        return response.strip()
    
    async def generate_dxf_from_prompt(self, prompt: str) -> str:
        """
        Generate DXF code from natural language prompt.
        
        This method works with any provider that implements the AIProvider interface.
        To switch providers, just update the provider initialization.
        
        Args:
            prompt: User's natural language prompt for CAD generation
            
        Returns:
            Clean DXF code as a string
        """
        # Call the configured provider
        response = await self.provider.generate_dxf(prompt)
        
        if response:
            dxf_code = self._extract_dxf_from_response(response)
            # Validate basic DXF structure
            if "ENTITIES" in dxf_code and "EOF" in dxf_code:
                return dxf_code
        
        # Fallback to mock DXF if provider fails
        print("AI provider generation failed, using fallback DXF")
        return self._get_fallback_dxf()
    
    def _get_fallback_dxf(self) -> str:
        """Return a simple fallback DXF when AI provider fails."""
        return """0
SECTION
  2
ENTITIES
  0
LINE
 10
10.0
 20
10.0
 11
50.0
 21
50.0
  0
ENDSEC
  0
EOF"""


# Singleton instance - configured via settings
ai_service = CADArenaAIService()
