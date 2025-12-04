"""Pipeline for processing DXF files through AI labelling and regeneration."""

import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

from tqdm import tqdm

from .DXFExtractor import DXFExtractor, DXFExtractionError
from .ai_labelling_service import AILabellingService, AILabellingError
from .dxf_regenerator import regenerate_dxf_from_chunk, DXFRegenerationError

logger = logging.getLogger(__name__)


class PipelineError(Exception):
    """Raised when pipeline execution fails."""

    pass


class PipelineConfig:
    """Configuration for the labelling pipeline."""

    def __init__(
        self,
        dxf_file_path: str,
        output_jsonl: str,
        ollama_model: str = "llama3",
        chunk_size: int = 5,
        max_chunks: int = -1,
    ):
        """Initialize pipeline configuration.

        Args:
            dxf_file_path: Path to input DXF file.
            output_jsonl: Path to output JSONL file.
            ollama_model: Name of Ollama model to use.
            chunk_size: Number of entities per chunk.
            max_chunks: Maximum chunks to process (-1 for all).

        Raises:
            ValueError: If configuration is invalid.
        """
        if chunk_size < 1:
            raise ValueError("chunk_size must be at least 1")
        if max_chunks != -1 and max_chunks < 1:
            raise ValueError("max_chunks must be -1 or at least 1")

        self.dxf_file_path = Path(dxf_file_path)
        self.output_jsonl = Path(output_jsonl)
        self.ollama_model = ollama_model
        self.chunk_size = chunk_size
        self.max_chunks = max_chunks

        # Validation
        if not self.dxf_file_path.exists():
            raise ValueError(f"DXF file not found: {dxf_file_path}")

        # Ensure output directory exists
        self.output_jsonl.parent.mkdir(parents=True, exist_ok=True)


def chunk_entities(
    entities: List[Dict[str, Any]], chunk_size: int = 5
) -> List[List[Dict[str, Any]]]:
    """Split entities into smaller manageable chunks.

    Args:
        entities: List of entity dictionaries.
        chunk_size: Number of entities per chunk.

    Returns:
        List of entity chunks.

    Raises:
        ValueError: If chunk_size is invalid.
    """
    if chunk_size < 1:
        raise ValueError("chunk_size must be at least 1")

    chunks = [entities[i : i + chunk_size] for i in range(0, len(entities), chunk_size)]
    return chunks


def run_labelling_pipeline(
    dxf_file_path: str,
    output_jsonl: str,
    ollama_model: str,
    chunk_size: int,
    max_chunks: int = -1,
) -> int:
    """Run the complete DXF labelling pipeline.

    Extracts entities from DXF, generates labels using AI, regenerates DXF,
    and saves training pairs to JSONL.

    Args:
        dxf_file_path: Path to input DXF file.
        output_jsonl: Path to output JSONL file.
        ollama_model: Name of Ollama model to use.
        chunk_size: Number of entities per chunk.
        max_chunks: Maximum chunks to process (-1 for all).

    Returns:
        Number of training pairs generated.

    Raises:
        PipelineError: If pipeline execution fails.
    """
    try:
        config = PipelineConfig(
            dxf_file_path=dxf_file_path,
            output_jsonl=output_jsonl,
            ollama_model=ollama_model,
            chunk_size=chunk_size,
            max_chunks=max_chunks,
        )
    except ValueError as e:
        raise PipelineError(f"Invalid pipeline configuration: {e}") from e

    try:
        # 1. EXTRACTION
        logger.info("Starting DXF extraction...")
        extractor = DXFExtractor(str(config.dxf_file_path))

        if not extractor.load_file():
            raise PipelineError("Failed to load DXF file")

        all_entities = extractor.extract_entities()
        if not all_entities or len(all_entities) == 0:
            raise PipelineError("No entities found in DXF file")

        logger.info(f"Extracted {len(all_entities)} entities from DXF")

        # 2. INITIALIZE AI SERVICE
        logger.info(f"Initializing {config.ollama_model} model...")
        try:
            labeller = AILabellingService(model_name=config.ollama_model)
        except AILabellingError as e:
            raise PipelineError(f"Failed to initialize AI service: {e}") from e

        # 3. CHUNKING
        entity_chunks = chunk_entities(all_entities, config.chunk_size)
        if config.max_chunks > 0:
            entity_chunks = entity_chunks[: config.max_chunks]

        if len(entity_chunks) == 0:
            raise PipelineError("No chunks created from entities")

        logger.info(f"Processing {len(entity_chunks)} chunks (chunk size: {config.chunk_size})")

        # 4. LABELLING AND REGENERATION LOOP
        final_dataset = []
        failed_chunks = 0

        for chunk in tqdm(entity_chunks, desc="Processing chunks"):
            try:
                # Validate chunk
                if not chunk or len(chunk) == 0:
                    logger.warning("Skipped empty chunk")
                    failed_chunks += 1
                    continue

                # Get label from AI
                label = labeller.generate_label(chunk)

                # Validate label
                if not label:
                    logger.warning("Generated label is None")
                    failed_chunks += 1
                    continue

                if len(label) < 10:
                    logger.warning(f"Label too short ({len(label)} chars): {label}")
                    failed_chunks += 1
                    continue

                if label.lower().startswith("error"):
                    logger.warning(f"Label contains error: {label}")
                    failed_chunks += 1
                    continue

                # Regenerate DXF
                clean_dxf = regenerate_dxf_from_chunk(chunk)

                # Create training pair
                training_pair = {
                    "instruction": "You are a CAD generation bot. Generate the DXF code for the user's request.",
                    "input": label,
                    "output": clean_dxf,
                }
                final_dataset.append(training_pair)

            except (DXFRegenerationError, DXFExtractionError, AILabellingError) as e:
                logger.warning(f"Skipped chunk due to error: {e}")
                failed_chunks += 1
                continue
            except Exception as e:
                logger.error(f"Unexpected error processing chunk: {e}", exc_info=True)
                failed_chunks += 1
                continue

        # 5. SAVE RESULTS
        if len(final_dataset) == 0:
            logger.warning("No training pairs were generated!")

        logger.info(
            f"Saving {len(final_dataset)} training pairs to {config.output_jsonl}"
        )
        with open(config.output_jsonl, "w", encoding="utf-8") as f:
            for item in final_dataset:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")

        # Log summary
        success_rate = (
            (len(final_dataset) / len(entity_chunks) * 100)
            if entity_chunks
            else 0
        )
        logger.info(
            f"Pipeline complete: {len(final_dataset)} pairs saved "
            f"({success_rate:.1f}% success rate), "
            f"{failed_chunks} chunks failed"
        )

        return len(final_dataset)

    except PipelineError:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in pipeline: {e}", exc_info=True)
        raise PipelineError(f"Pipeline failed: {e}") from e


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Configuration
    INPUT_DXF = "/home/mango/Obsidian/Graduation Project /CadArena/data/dxf/AnyConv.com__الاول.dxf"
    OUTPUT_JSONL = "/home/mango/Obsidian/Graduation Project /CadArena/data/processed/reverse_engineered_data_ollama.jsonl"
    OLLAMA_MODEL = "llama3"
    CHUNK_SIZE = 7
    MAX_CHUNKS = 5  # Use -1 for full run

    # Run pipeline
    try:
        num_pairs = run_labelling_pipeline(
            dxf_file_path=INPUT_DXF,
            output_jsonl=OUTPUT_JSONL,
            ollama_model=OLLAMA_MODEL,
            chunk_size=CHUNK_SIZE,
            max_chunks=MAX_CHUNKS,
        )
        print(f"\n✓ Pipeline successful: {num_pairs} training pairs generated")
    except PipelineError as e:
        print(f"\n✗ Pipeline failed: {e}")
        exit(1)
