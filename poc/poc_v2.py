"""
Complete DXF Architecture Generation System
"""

import os
import re
import ast
import json
import ezdxf
from langchain_ollama import OllamaLLM
from typing import Dict, Tuple, List


class CompleteDXFSystem:
    """Prompt + Generation + Fixing + Validation"""

    def __init__(self, model="llama3:latest"):
        self.llm = OllamaLLM(model=model)
        self.stats = {"total_requests": 0, "successful": 0, "fixed": 0, "failed": 0}

    def get_optimized_prompt(self, user_request: str) -> str:
        """Prompt with Few-Shot"""

        system = """
            You are an expert DXF code generator using ezdxf library.

            ⚠️ CRITICAL: Use ONLY these methods:
            ✓ msp.add_line(start, end, dxfattribs={})
            ✓ msp.add_lwpolyline(points, dxfattribs={})  ← Use this for rectangles!
            ✓ msp.add_circle(center, radius, dxfattribs={})
            ✓ msp.add_arc(center, radius, start_angle, end_angle, dxfattribs={})

            ✗ NEVER use: add_rectangle() - IT DOESN'T EXIST!

            RECTANGLE PATTERN:
            ```python
            msp.add_lwpolyline([
                (x1, y1),
                (x2, y1),
                (x2, y2),
                (x1, y2),
                (x1, y1)  # Close it!
            ], dxfattribs={'layer': 'WALLS'})
            ```

            COMPLETE TEMPLATE:
            ```python
            import ezdxf

            doc = ezdxf.new('R2010')
            msp = doc.modelspace()

            # Layers
            doc.layers.new('WALLS', dxfattribs={'color': 7})
            doc.layers.new('DOORS', dxfattribs={'color': 3})

            # Drawing code here

            doc.saveas('output.dxf')
            ```

            RESPOND WITH PYTHON CODE ONLY - NO MARKDOWN, NO EXPLANATIONS.
        """

        # Few-shot examples
        examples = """
            EXAMPLE 1:
            User: bedroom 4m x 3m
            Code:
            import ezdxf
            doc = ezdxf.new('R2010')
            msp = doc.modelspace()
            doc.layers.new('WALLS', dxfattribs={'color': 7})
            msp.add_lwpolyline([(0,0), (4000,0), (4000,3000), (0,3000), (0,0)], dxfattribs={'layer': 'WALLS'})
            doc.saveas('output.dxf')

            EXAMPLE 2:
            User: 2 rooms side by side
            Code:
            import ezdxf
            doc = ezdxf.new('R2010')
            msp = doc.modelspace()
            doc.layers.new('WALLS', dxfattribs={'color': 7})
            msp.add_lwpolyline([(0,0), (4000,0), (4000,3000), (0,3000), (0,0)], dxfattribs={'layer': 'WALLS'})
            msp.add_lwpolyline([(4000,0), (8000,0), (8000,3000), (4000,3000), (4000,0)], dxfattribs={'layer': 'WALLS'})
            doc.saveas('output.dxf')
        """

        full_prompt = (
            f"{system}\n\n{examples}\n\nNOW YOUR TURN:\nUser: {user_request}\nCode:"
        )
        return full_prompt

    def auto_fix_code(self, code: str) -> Tuple[str, List[str]]:
        """Auto-fixing common issues in generated code"""
        fixes = []

        # Fix 1: add_rectangle → add_lwpolyline
        pattern = (
            r"msp\.add_rectangle\(\s*\((\d+),\s*(\d+)\)\s*,\s*\((\d+),\s*(\d+)\)(.*?)\)"
        )

        def replace_rectangle(match):
            x1, y1, x2, y2, attrs = match.groups()
            fixes.append(f"Converted add_rectangle to add_lwpolyline")
            return f"""msp.add_lwpolyline([({x1},{y1}), ({x2},{y1}), ({x2},{y2}), ({x1},{y2}), ({x1},{y1})]{attrs})"""

        code = re.sub(pattern, replace_rectangle, code)

        # Fix 2: Missing import
        if "import ezdxf" not in code:
            code = "import ezdxf\n\n" + code
            fixes.append("Added missing import")

        # Fix 3: Missing saveas
        if "doc.saveas" not in code:
            code += "\n\ndoc.saveas('output.dxf')"
            fixes.append("Added missing saveas")

        # Fix 4: Extract code from markdown
        if "```python" in code:
            code = code.split("```python")[1].split("```")[0]
            fixes.append("Extracted code from markdown")
        elif "```" in code:
            code = code.split("```")[1].split("```")[0]
            fixes.append("Extracted code from code block")

        return code.strip(), fixes

    def validate_code(self, code: str) -> Tuple[bool, str]:
        """Validate the generated code"""

        # Check 1: Syntax
        try:
            ast.parse(code)
        except SyntaxError as e:
            return False, f"Syntax error: {e.msg}"

        # Check 2: No forbidden methods
        forbidden = ["add_rectangle", "add_square"]
        for method in forbidden:
            if method in code:
                return False, f"Uses forbidden method: {method}"

        # Check 3: Has required elements
        required = ["import ezdxf", "ezdxf.new", "modelspace", "saveas"]
        for element in required:
            if element not in code:
                return False, f"Missing required element: {element}"

        return True, "Valid"

    def execute_code(self, code: str) -> Tuple[bool, str]:
        """Execute the generated code safely"""
        try:
            exec_globals = {"ezdxf": ezdxf}
            exec(code, exec_globals)

            # Check if file was created
            if os.path.exists("output.dxf"):
                doc = ezdxf.readfile("output.dxf")
                entity_count = len(list(doc.modelspace()))
                return True, f"Success! Generated {entity_count} entities"
            else:
                return False, "File not created"

        except Exception as e:
            return False, f"Execution error: {str(e)}"

    def generate(self, user_request: str, max_attempts: int = 3) -> Dict:
        """Generate DXF code from user request with retries"""

        self.stats["total_requests"] += 1

        for attempt in range(max_attempts):
            print(f"\n{'='*60}")
            print(f"Attempt {attempt + 1}/{max_attempts}")
            print(f"{'='*60}")

            # Step 1: Generate
            prompt = self.get_optimized_prompt(user_request)
            raw_code = self.llm.invoke(prompt)

            print(f"\n📝 Raw generated code ({len(raw_code)} chars)")

            # Step 2: Auto-fix
            fixed_code, fixes = self.auto_fix_code(raw_code)

            if fixes:
                print(f"\n🔧 Applied {len(fixes)} fixes:")
                for fix in fixes:
                    print(f"  • {fix}")
                self.stats["fixed"] += 1

            # Step 3: Validate
            is_valid, validation_msg = self.validate_code(fixed_code)
            print(f"\n✓ Validation: {validation_msg}")

            if not is_valid:
                print(f"❌ Validation failed: {validation_msg}")
                if attempt < max_attempts - 1:
                    user_request = (
                        f"{user_request} [Previous attempt failed: {validation_msg}]"
                    )
                    continue
                else:
                    self.stats["failed"] += 1
                    return {
                        "success": False,
                        "error": validation_msg,
                        "code": fixed_code,
                    }

            # Step 4: Execute
            success, exec_msg = self.execute_code(fixed_code)
            print(f"\n{'✓' if success else '❌'} Execution: {exec_msg}")

            if success:
                self.stats["successful"] += 1
                return {
                    "success": True,
                    "code": fixed_code,
                    "message": exec_msg,
                    "fixes_applied": fixes,
                    "attempts": attempt + 1,
                }
            else:
                if attempt < max_attempts - 1:
                    user_request = f"{user_request} [Previous error: {exec_msg}]"
                else:
                    self.stats["failed"] += 1
                    return {"success": False, "error": exec_msg, "code": fixed_code}

        self.stats["failed"] += 1
        return {"success": False, "error": "Max attempts reached", "code": fixed_code}

    def print_stats(self):
        """Print system statistics"""
        print(f"\n{'='*60}")
        print("📊 SYSTEM STATISTICS")
        print(f"{'='*60}")
        print(f"Total Requests:  {self.stats['total_requests']}")
        print(
            f"Successful:      {self.stats['successful']} ({self.stats['successful']/max(1,self.stats['total_requests'])*100:.1f}%)"
        )
        print(f"Fixed & Worked:  {self.stats['fixed']}")
        print(f"Failed:          {self.stats['failed']}")
        print(f"{'='*60}")


# ============================================================================
# USAGE EXAMPLES
# ============================================================================


def example_basic():
    """Simple example: single request"""
    system = CompleteDXFSystem()

    result = system.generate("Draw a bedroom 4m x 3m with a door")

    if result["success"]:
        print("\n✓ Success!")
        print(f"Code ({len(result['code'])} chars):")
        print(result["code"])
    else:
        print(f"\n❌ Failed: {result['error']}")


def example_batch():
    """Processing multiple requests in batch"""
    system = CompleteDXFSystem()

    requests = [
        "bedroom 3m x 4m",
        "bathroom 2m x 2m with shower",
        "kitchen 5m x 4m with island",
        "living room 6m x 5m with fireplace",
        "2-bedroom apartment 12m x 10m",
    ]

    print("Processing batch requests...\n")

    results = []
    for i, request in enumerate(requests, 1):
        print(f"\n{'#'*60}")
        print(f"Request {i}/{len(requests)}: {request}")
        print(f"{'#'*60}")

        result = system.generate(request)
        results.append({"request": request, "success": result["success"]})

        # Rename output file
        if result["success"] and os.path.exists("output.dxf"):
            os.rename("output.dxf", f"output_{i}.dxf")

    # Print summary
    print("\n" + "=" * 60)
    print("BATCH SUMMARY")
    print("=" * 60)
    for i, r in enumerate(results, 1):
        status = "✓" if r["success"] else "❌"
        print(f"{status} {i}. {r['request']}")

    system.print_stats()


def example_interactive():
    """Interactive mode: user inputs requests"""
    system = CompleteDXFSystem()

    print("\n" + "=" * 60)
    print("🏗️  DXF Architecture Generator")
    print("=" * 60)
    print("Enter your architectural requests (or 'quit' to exit)")
    print("Example: bedroom 4m x 3m with door and window")
    print("=" * 60 + "\n")

    while True:
        request = input("📐 Your request: ").strip()

        if request.lower() in ["quit", "exit", "q"]:
            break

        if not request:
            continue

        result = system.generate(request)

        if result["success"]:
            print(f"\n✓ Generated successfully! → output.dxf")

            # Ask if user wants to see code
            show = input("Show code? (y/n): ").lower()
            if show == "y":
                print("\n" + "-" * 60)
                print(result["code"])
                print("-" * 60)
        else:
            print(f"\n❌ Failed: {result['error']}")

        print()

    system.print_stats()


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print(
        """
╔═══════════════════════════════════════════════════════════╗
║         DXF ARCHITECTURE GENERATION SYSTEM                ║
║                 Complete Solution                         ║
╚═══════════════════════════════════════════════════════════╝
    """
    )

    # Choose example to run
    print("Choose example:")
    print("1. Basic example (single request)")
    print("2. Batch processing (multiple requests)")
    print("3. Interactive mode")

    choice = input("\nChoice (1-3): ").strip()

    if choice == "1":
        example_basic()
    elif choice == "2":
        example_batch()
    elif choice == "3":
        example_interactive()
    else:
        print("Running default example...")
        example_basic()
