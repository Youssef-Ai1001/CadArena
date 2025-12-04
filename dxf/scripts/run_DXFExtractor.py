import sys
from pathlib import Path

# Ensure project root is on sys.path so `import cad` works when running this script directly
project_root = Path(__file__).resolve().parents[1]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from cad.parser.DXFExtractor import DXFExtractor


extractor = DXFExtractor("/home/mango/Obsidian/Graduation Project /CadArena/data/dxf/AnyConv.com__الاول.dxf")
extractor.load_file()
entities = extractor.extract_entities()

if entities:
    extractor.save_to_json(entities, "/home/mango/Obsidian/Graduation Project /CadArena/data/processed/AnyConv.com__الاول.json")