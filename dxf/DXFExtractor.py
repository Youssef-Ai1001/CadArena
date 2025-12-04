"""DXF file extraction module."""

import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

import ezdxf
from ezdxf import recover

logger = logging.getLogger(__name__)

# Supported DXF entity types for extraction
SUPPORTED_ENTITY_TYPES = {
    "LINE",
    "CIRCLE",
    "ARC",
    "LWPOLYLINE",
    "POLYLINE",
    "ELLIPSE",
    "SPLINE",
    "POINT",
    "TEXT",
    "MTEXT",
    "INSERT",
    "HATCH",
}


class DXFExtractionError(Exception):
    """Raised when DXF extraction fails."""

    pass


class DXFExtractor:
    """Extracts geometric entities from DXF files.

    Attributes:
        file_path: Path to the DXF file.
        supported_types: Set of DXF entity types to extract.
    """

    def __init__(self, file_path: str, supported_types: Optional[set] = None):
        """Initialize DXFExtractor.

        Args:
            file_path: Path to the DXF file.
            supported_types: Custom set of entity types to extract. Defaults to SUPPORTED_ENTITY_TYPES.

        Raises:
            ValueError: If file_path is invalid.
        """
        self.file_path = Path(file_path)
        if not self.file_path.exists():
            raise ValueError(f"DXF file not found: {file_path}")
        if not self.file_path.suffix.lower() == ".dxf":
            raise ValueError(
                f"Invalid file type: {self.file_path.suffix}. Expected .dxf"
            )

        self.supported_types = supported_types or SUPPORTED_ENTITY_TYPES
        self.doc = None
        self.msp = None
        self._is_loaded = False

    def load_file(self) -> bool:
        """Load and parse the DXF file.

        Returns:
            True if file loaded successfully, False otherwise.
        """
        try:
            self.doc, auditor = recover.readfile(str(self.file_path))

            if auditor.errors:
                logger.warning(f"DXF file has {len(auditor.errors)} recovery errors")
                for err in auditor.errors:
                    logger.debug(f"  - {err}")

            self.msp = self.doc.modelspace()
            self._is_loaded = True
            logger.info(f"Successfully loaded DXF file: {self.file_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to read DXF file: {e}", exc_info=True)
            return False

    def extract_entities(self) -> List[Dict[str, Any]]:
        """Extract all supported entities from the DXF file.

        Returns:
            List of dictionaries containing entity data.

        Raises:
            DXFExtractionError: If extraction fails.
        """
        if not self._is_loaded or not self.msp:
            raise DXFExtractionError("DXF file not loaded. Call load_file() first.")

        extracted_entities = []
        entity_count_by_type = {}

        try:
            for entity in self.msp:
                etype = entity.dxftype()
                if etype not in self.supported_types:
                    continue

                data = {"type": etype}
                self._fill_entity_data(entity, data)
                extracted_entities.append(data)
                entity_count_by_type[etype] = entity_count_by_type.get(etype, 0) + 1

        except Exception as e:
            logger.error(f"Error during entity extraction: {e}", exc_info=True)
            raise DXFExtractionError(f"Failed to extract entities: {e}") from e

        logger.info(f"Extracted {len(extracted_entities)} entities")
        for etype, count in sorted(entity_count_by_type.items()):
            logger.debug(f"  {etype}: {count}")

        return extracted_entities

    def _fill_entity_data(self, entity: Any, data: Dict[str, Any]) -> None:
        """Fill entity data dictionary with extracted attributes.

        Args:
            entity: The DXF entity object.
            data: Dictionary to populate with entity attributes.
        """
        etype = entity.dxftype()

        try:
            if etype == "LINE":
                data["start"] = (entity.dxf.start.x, entity.dxf.start.y)
                data["end"] = (entity.dxf.end.x, entity.dxf.end.y)

            elif etype == "CIRCLE":
                data["center"] = (entity.dxf.center.x, entity.dxf.center.y)
                data["radius"] = entity.dxf.radius

            elif etype == "ARC":
                data.update(
                    {
                        "center": (entity.dxf.center.x, entity.dxf.center.y),
                        "radius": entity.dxf.radius,
                        "start_angle": entity.dxf.start_angle,
                        "end_angle": entity.dxf.end_angle,
                    }
                )

            elif etype == "POINT":
                data["point"] = (entity.dxf.location.x, entity.dxf.location.y)

            elif etype == "ELLIPSE":
                data.update(
                    {
                        "center": (entity.dxf.center.x, entity.dxf.center.y),
                        "major_axis": (
                            entity.dxf.major_axis.x,
                            entity.dxf.major_axis.y,
                        ),
                        "ratio": entity.dxf.ratio,
                        "start_param": entity.dxf.start_param,
                        "end_param": entity.dxf.end_param,
                    }
                )

            elif etype == "SPLINE":
                data["fit_points"] = [(p.x, p.y) for p in entity.fit_points]

            elif etype == "LWPOLYLINE":
                data["points"] = [(p[0], p[1]) for p in entity.get_points()]

            elif etype == "POLYLINE":
                vertices = (
                    list(entity.vertices())
                    if callable(entity.vertices)
                    else entity.vertices
                )
                data["points"] = [
                    (v.dxf.location.x, v.dxf.location.y) for v in vertices
                ]

            elif etype == "TEXT":
                data.update(
                    {
                        "text": entity.dxf.text,
                        "insert": (entity.dxf.insert.x, entity.dxf.insert.y),
                    }
                )

            elif etype == "MTEXT":
                data.update(
                    {
                        "text": entity.text,
                        "insert": (entity.dxf.insert.x, entity.dxf.insert.y),
                    }
                )

            elif etype == "INSERT":
                data.update(
                    {
                        "block_name": entity.dxf.name,
                        "insert": (entity.dxf.insert.x, entity.dxf.insert.y),
                        "scale": (entity.dxf.xscale, entity.dxf.yscale),
                        "rotation": entity.dxf.rotation,
                    }
                )

            elif etype == "HATCH":
                data["pattern"] = entity.dxf.pattern_name
                try:
                    data["paths"] = [
                        [(v.x, v.y) for v in edge.vertices]
                        for edge in entity.paths
                        if hasattr(edge, "vertices")
                    ]
                except Exception as e:
                    logger.warning(f"Failed to extract HATCH paths: {e}")
                    data["paths"] = []

        except Exception as e:
            logger.warning(f"Error extracting {etype} entity data: {e}")
            raise DXFExtractionError(f"Failed to extract data for {etype}: {e}") from e

    def save_to_json(self, entities: List[Dict[str, Any]], filename: str) -> bool:
        """Save extracted entities to a JSON file.

        Args:
            entities: List of extracted entity dictionaries.
            filename: Output filename.

        Returns:
            True if save successful, False otherwise.
        """
        try:
            import json

            output_path = Path(filename)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(entities, f, indent=4)

            logger.info(f"Saved {len(entities)} entities to {filename}")
            return True

        except Exception as e:
            logger.error(f"Failed to save JSON to {filename}: {e}", exc_info=True)
            return False
