import subprocess
import re
import os

user_input = "Draw a line from point (10, 20) to (150, 250)"

MASTER_PROMPT = f"""
You are an expert CAD assistant.
Your only task is to output **only the DXF ENTITIES section** corresponding to the user request.
Do NOT include HEADER, TABLES, ENDSEC, or EOF.

Example:
USER: Draw a line from (0,0) to (100,200)
ASSISTANT:
0
LINE
8
0
10
0.0
20
0.0
30
0.0
11
100.0
21
200.0
31
0.0

Now respond for:
USER: {user_input}
ASSISTANT:
"""

try:
    print("⚙️ Generating DXF Entities using LLaMA3...")

    result = subprocess.run(
        ["ollama", "run", "llama3", MASTER_PROMPT],
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())

    entities = result.stdout.strip()

    entities_match = re.search(r"(0\s+LINE[\s\S]*)", entities)
    if entities_match:
        entities = entities_match.group(1)

    dxf_template = f"""0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
TABLES
0
ENDSEC
0
SECTION
2
ENTITIES
{entities}
0
ENDSEC
0
EOF
"""

    output_filename = "./output/English/output_v1.dxf"
    with open(output_filename, "w") as f:
        f.write(dxf_template)

    print("\n✅ DXF file created successfully and should open fine now!")
    print(f"📁 Saved as: {os.path.abspath(output_filename)}")

except subprocess.TimeoutExpired:
    print("❌ Model took too long to respond.")
except RuntimeError as e:
    print(f"❌ Model error: {e}")
except Exception as e:
    print(f"⚠️ Unexpected error: {e}")
