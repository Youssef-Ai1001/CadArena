"""DXF regeneration from extracted entity data."""

import io
import logging
from typing import List, Dict, Any, Set

import ezdxf

logger = logging.getLogger(__name__)

DXF_VERSION = "R2010"
DEFAULT_TEXT_HEIGHT = 50
DEFAULT_BLOCK_SIZE = 50


class DXFRegenerationError(Exception):
    """Raised when DXF regeneration fails."""

    pass


def _define_blocks(doc: Any, entities: List[Dict[str, Any]]) -> None:
    """Define all referenced blocks in the document.

    Args:
        doc: The ezdxf document object.
        entities: List of entity dictionaries.
    """
    referenced_blocks: Set[str] = {
        e["block_name"] for e in entities if e.get("block_name")
    }

    for block_name in referenced_blocks:
        if block_name not in doc.blocks:
            block = doc.blocks.new(name=block_name)
            # Generic block representation
            block.add_line((-DEFAULT_BLOCK_SIZE, 0), (DEFAULT_BLOCK_SIZE, 0))
            block.add_line((0, -DEFAULT_BLOCK_SIZE), (0, DEFAULT_BLOCK_SIZE))
            block.add_circle((0, 0), radius=DEFAULT_BLOCK_SIZE)
            logger.debug(f"Defined block: {block_name}")


def _add_entities_to_modelspace(msp: Any, entities: List[Dict[str, Any]]) -> None:
    """Add entities to the modelspace.

    Args:
        msp: The modelspace object.
        entities: List of entity dictionaries.

    Raises:
        DXFRegenerationError: If all entities fail to be added.
    """
    failed_entities = 0

    for data in entities:
        etype = data.get("type")

        try:
            if etype == "LINE":
                msp.add_line(data["start"], data["end"])

            elif etype == "CIRCLE":
                msp.add_circle(data["center"], radius=data["radius"])

            elif etype == "ARC":
                msp.add_arc(
                    data["center"],
                    radius=data["radius"],
                    start_angle=data["start_angle"],
                    end_angle=data["end_angle"],
                )

            elif etype == "POINT":
                msp.add_point(data["point"])

            elif etype in ("LWPOLYLINE", "POLYLINE"):
                msp.add_lwpolyline(data["points"])

            elif etype == "ELLIPSE":
                msp.add_ellipse(
                    data["center"],
                    major_axis=data["major_axis"],
                    ratio=data["ratio"],
                    start_param=data["start_param"],
                    end_param=data["end_param"],
                )

            elif etype == "SPLINE":
                msp.add_spline(fit_points=data["fit_points"])

            elif etype == "TEXT":
                msp.add_text(
                    data["text"],
                    dxfattribs={
                        "insert": data["insert"],
                        "height": DEFAULT_TEXT_HEIGHT,
                    },
                )

            elif etype == "MTEXT":
                msp.add_mtext(
                    data["text"],
                    dxfattribs={
                        "insert": data["insert"],
                        "height": DEFAULT_TEXT_HEIGHT,
                    },
                )

            elif etype == "INSERT":
                xscale, yscale = data.get("scale", (1.0, 1.0))
                msp.add_blockref(
                    data["block_name"],
                    data["insert"],
                    dxfattribs={
                        "rotation": data.get("rotation", 0),
                        "xscale": xscale,
                        "yscale": yscale,
                    },
                )

            elif etype == "HATCH":
                if data.get("paths"):
                    hatch = msp.add_hatch(color=3)
                    vertices = data["paths"][0]
                    if vertices:
                        hatch.paths.add_polyline_path(vertices, flags=1)

        except Exception as e:
            failed_entities += 1
            logger.warning(f"Failed to add {etype} entity: {e}")

    if failed_entities > 0:
        logger.warning(f"Failed to add {failed_entities}/{len(entities)} entities")


def regenerate_dxf_from_chunk(chunk: List[Dict[str, Any]]) -> str:
    """Regenerate a DXF file string from structured entity data.

    Args:
        chunk: List of entity dictionaries with extracted DXF data.

    Returns:
        DXF file content as string.

    Raises:
        DXFRegenerationError: If regeneration fails.
        ValueError: If chunk is empty.
    """
    if not chunk:
        raise ValueError("Entity chunk cannot be empty")

    try:
        doc = ezdxf.new(dxfversion=DXF_VERSION)
        msp = doc.modelspace()

        # Define all referenced blocks
        _define_blocks(doc, chunk)

        # Add entities to modelspace
        _add_entities_to_modelspace(msp, chunk)

        # Serialize to string
        with io.StringIO() as stream:
            doc.write(stream)
            dxf_content = stream.getvalue()

        logger.debug(f"Regenerated DXF with {len(chunk)} entities")
        return dxf_content

    except Exception as e:
        logger.error(f"DXF regeneration failed: {e}", exc_info=True)
        raise DXFRegenerationError(f"Failed to regenerate DXF: {e}") from e
