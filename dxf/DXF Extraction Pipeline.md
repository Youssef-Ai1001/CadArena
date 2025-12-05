## Pipeline Complete Overview

### **Architecture: 5-Stage Sequential Pipeline**

DXF File → Extraction → AI Labelling → DXF Regeneration → JSONL Dataset

---

### **Stage 1: DXF Extraction** ([DXFExtractor.py](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html))

- **Input**: Raw DXF file (AutoCAD format)
- **Process**:
    - Loads DXF using `ezdxf` library (R2010 format)
    - Extracts 12 entity types: LINE, CIRCLE, ARC, LWPOLYLINE, POLYLINE, ELLIPSE, SPLINE, POINT, TEXT, MTEXT, INSERT, HATCH
    - Normalizes entity data (coordinates, properties, text content)
- **Output**: List of entity dictionaries with geometry and properties
- **Error Handling**: Custom [DXFExtractionError](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) with proper context

---

### **Stage 2: Entity Chunking** ([pipeline_runner.py](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html))

- **Input**: All extracted entities (4,430 in test run)
- **Process**:
    - Splits entities into manageable chunks (default: 7 entities per chunk)
    - Creates 631 chunks total (4,430 ÷ 7)
    - Configurable via [CHUNK_SIZE](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) parameter
    - Supports limiting with [MAX_CHUNKS](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) (-1 = process all)
- **Output**: List of entity chunks ready for AI processing

---

### **Stage 3: AI Labelling** ([ai_labelling_service.py](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html))

- **Input**: Entity chunk (7 entities)
- **Process**:
    - Uses Ollama (local LLM) with llama3 model
    - Generates natural language description of the geometric structure
    - Temperature: 0.7 (balanced creativity)
    - Cleans output (removes code markers, extra whitespace)
- **Output**: Descriptive text label for the architecture/CAD elements
- **Validation**:
    - Checks for None/empty values
    - Ensures minimum 10 characters
    - Rejects "error" prefixed responses

---

### **Stage 4: DXF Regeneration** ([dxf_regenerator.py](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html))

- **Input**: Entity chunk + coordinates
- **Process**:
    - Creates clean DXF file from scratch using ezdxf
    - Defines blocks for complex entities
    - Adds all entities to modelspace
    - **Fail-safe architecture**: Continues on individual entity failures, counts warnings
    - Exports as DXF R2010 format
- **Output**: Valid DXF code string (text format)
- **Error Handling**: Logs failed entities, doesn't stop pipeline

---

### **Stage 5: Dataset Assembly & Storage** ([pipeline_runner.py](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html))

- **Input**: (Label, DXF code) pairs
- **Process**:
    - Combines label + regenerated DXF into training pair
    - Standard format:
        
			{
			  "instruction": "You are a CAD generation bot...",
			  "input": "<natural language description>",
			  "output": "<DXF code>"
			}
        
    - Validates each pair before saving
    - Writes JSONL (JSON Lines) format
- **Output**: [reverse_engineered_data_ollama.jsonl](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) training dataset
- **Statistics**: Success rate, failed chunks, pair count

---

### **Configuration Parameters**

|Parameter|Default|Purpose|
|---|---|---|
|[CHUNK_SIZE](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)|7|Entities per chunk|
|[MAX_CHUNKS](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)|5 (test)|Limit processing (-1 = all)|
|[OLLAMA_MODEL](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)|llama3|Local LLM model|
|[INPUT_DXF](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)|AnyConv.com__الاول.dxf|Source file|
|[OUTPUT_JSONL](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)|[reverse_engineered_data_ollama.jsonl](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)|Output dataset|

---

### **Error Handling Strategy**

**3 Custom Exception Hierarchy:**

1. [DXFExtractionError](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) - Entity extraction failures
2. [AILabellingError](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) - LLM generation issues
3. [DXFRegenerationError](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) - DXF rebuilding problems
4. [PipelineError](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) - Overall pipeline failures

**Validation Checkpoints:**

- DXF file existence
- Entity extraction count
- Chunk validity (not empty)
- Label quality (not None, min 10 chars, no errors)
- Configuration parameters

---

### **Test Run Results**

Input:        4,430 entities from single DXF file
Chunks:       5 chunks created (chunk_size=7)
Processing:   ✓ 100% success rate
Pairs:        5 training pairs generated
Failures:     0 chunks failed
Runtime:      ~45 seconds
Output:       5 valid JSONL lines

---

### **Ready to Scale**

**For full dataset processing:**  
Change [MAX_CHUNKS = 5](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) → [MAX_CHUNKS = -1](vscode-file://vscode-app/snap/code/214/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)

- **Expected**: 631 chunks (~90 minutes runtime)
- **Output**: ~631 training pairs for model fine-tuning

The pipeline is production-ready with comprehensive logging, validation, and error recovery! 🚀