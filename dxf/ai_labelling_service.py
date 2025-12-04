"""AI labelling service for generating architectural descriptions."""

import json
import logging
from typing import List, Dict, Any, Optional

from langchain_community.llms import Ollama
from langchain_core.language_models import LLM

logger = logging.getLogger(__name__)

# Prompt template for generating architectural descriptions
LABELLING_PROMPT = """
You are a creative Architectural Designer Bot. 
Your task is to review a small list of extracted geometric entities and generate a single, highly descriptive natural language command that an architect would use to create them.

RULES:
1. Be descriptive (e.g., 'Draw a wall' instead of 'Draw a line').
2. Combine entities into a single coherent request.
3. Use English only.
4. Output ONLY the raw text command, nothing else.

ENTITIES TO DESCRIBE:
---
{entities_data}
---
"""

class AILabellingError(Exception):
    """Raised when AI labelling fails."""
    pass


class AILabellingService:
    """Service for generating architectural labels using Ollama LLM.
    
    Attributes:
        model_name: Name of the LLM model to use.
        llm: Instance of the language model.
        temperature: Temperature parameter for model generation.
    """

    def __init__(self, model_name: str = "llama3", temperature: float = 0.7, llm_instance: Optional[LLM] = None):
        """Initialize AILabellingService.
        
        Args:
            model_name: Name of the Ollama model to use.
            temperature: Temperature for generation (0.0-1.0).
            llm_instance: Optional pre-configured LLM instance for testing.
            
        Raises:
            AILabellingError: If LLM initialization fails.
        """
        if not 0.0 <= temperature <= 1.0:
            raise ValueError("Temperature must be between 0.0 and 1.0")
            
        self.model_name = model_name
        self.temperature = temperature
        self.llm = llm_instance
        
        if self.llm is None:
            try:
                self.llm = Ollama(model=self.model_name, temperature=self.temperature)
                logger.info(f"Initialized Ollama model: {self.model_name}")
            except Exception as e:
                logger.error(
                    f"Failed to initialize Ollama. Is the server running? Details: {e}",
                    exc_info=True
                )
                raise AILabellingError(f"Could not initialize LLM: {e}") from e

    def generate_label(self, entities_chunk: List[Dict[str, Any]]) -> Optional[str]:
        """Generate an architectural label for a chunk of entities.
        
        Args:
            entities_chunk: List of extracted DXF entity dictionaries.
            
        Returns:
            Generated label string, or None if generation fails.
            
        Raises:
            ValueError: If entities_chunk is empty.
        """
        if not entities_chunk or len(entities_chunk) == 0:
            raise ValueError("entities_chunk cannot be empty")
            
        if self.llm is None:
            logger.error("LLM not initialized")
            return None

        try:
            # Prepare prompt
            entities_str = json.dumps(entities_chunk, indent=2, ensure_ascii=False)
            full_prompt = LABELLING_PROMPT.format(entities_data=entities_str)

            # Call the model with timeout consideration
            label = self.llm.invoke(full_prompt).strip()
            
            if not label:
                logger.warning("LLM returned empty string")
                return None
            
            # Clean output
            clean_label = (
                label
                .replace("```", "")
                .replace("TEXT:", "")
                .replace("```python", "")
                .replace("```json", "")
                .replace("\n\n", " ")
                .strip()
            )

            if not clean_label:
                logger.warning("Generated label is empty after cleaning")
                return None
                
            logger.debug(f"Generated label: {clean_label[:50]}...")
            return clean_label

        except Exception as e:
            logger.error(f"Error calling Ollama model: {e}", exc_info=True)
            return None
