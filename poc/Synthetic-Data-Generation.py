import json
import random
import ezdxf
import io
import math
from tqdm import tqdm

# ==============================================================================
# SECTION 1: CONFIGURATION
# ==============================================================================

# The instruction text that will guide the model's behavior.
INSTRUCTION_TEXT = "You are an expert CAD assistant named CadArena. Your task is to convert the user's request into valid DXF code. Respond ONLY with the raw DXF code, without any extra text, explanations, or markdown code fences."

# Number of examples to generate for each shape/element type.
NUM_SAMPLES = {
    "line": 800,
    "circle": 800,
    "arc": 500,
    "rectangle": 600,
    "polygon": 400,
    "ellipse": 300,
    "polyline": 400,
    "text": 200,
    "door": 300,
    "window": 300,
    "wall": 400,
    "room": 250,
    "stairs": 200,
    "column": 200,
    "simple_building": 150,
    "floor_plan": 100,
}

OUTPUT_FILE = "dataset_v1.jsonl"
COORDINATE_RANGE = (-10000, 10000)
RADIUS_RANGE = (50, 1000)
DIMENSION_RANGE = (100, 2000)
ANGLE_RANGE = (0, 360)

# --- 2. Prompt Templates (User Inputs in English) ---

PROMPT_TEMPLATES = {
    "line": [
        "Draw a line from ({x1},{y1}) to ({x2},{y2}).",
        "Create a line segment between point {p1} and point {p2}.",
        "A line with start point {p1} and end point {p2}.",
        "line: {p1} -> {p2}",
        "I need a straight line connecting {p1} to {p2}.",
    ],
    "circle": [
        "Create a circle with its center at ({cx},{cy}) and a radius of {radius}.",
        "Draw a circle centered at {center} with a diameter of {diameter}.",
        "A circle, please. Center: {center}, radius: {radius}.",
        "circle: c=({cx},{cy}), r={radius}",
        "I want a circular shape at {center}, radius {radius}.",
    ],
    "arc": [
        "Draw an arc with center ({cx},{cy}), radius {radius}, from {start_angle} degrees to {end_angle} degrees.",
        "arc: center {center}, r={radius}, start={start_angle}, end={end_angle}",
        "I need an arc. Center point is {center}, radius is {radius}, and it goes from {start_angle} to {end_angle} degrees.",
    ],
    "rectangle": [
        "Draw a rectangle with width {width} and height {height}, starting from the bottom-left corner at ({x},{y}).",
        "A {width} by {height} rectangle at ({x},{y}).",
        "rectangle: origin=({x},{y}), w={width}, h={height}",
        "Create a rectangular shape {width}x{height} starting at point ({x},{y}).",
    ],
    "polygon": [
        "Draw a {sides}-sided regular polygon centered at ({cx},{cy}) with a radius of {radius}.",
        "Create a regular polygon with {sides} sides, center {center}, and radius {radius}.",
        "polygon: {sides} sides, center=({cx},{cy}), r={radius}",
    ],
    "ellipse": [
        "Draw an ellipse centered at ({cx},{cy}) with a major axis of {major_x},{major_y} and a minor axis ratio of {ratio}.",
        "Create an ellipse: center {center}, major axis endpoint ({major_x},{major_y}), minor/major ratio {ratio}.",
        "ellipse: c=({cx},{cy}), major_axis=({major_x},{major_y}), ratio={ratio}",
    ],
    "polyline": [
        "Draw a polyline through these points: {points_str}.",
        "Create a connected line path: {points_str}.",
        "polyline connecting: {points_str}",
    ],
    "text": [
        "Add the text '{text}' at position ({x},{y}) with a height of {height}.",
        "Insert text: '{text}' at {pos}, height={height}",
        "Place the label '{text}' at coordinates ({x},{y}), text height {height}.",
    ],
    "door": [
        "Draw a standard 90-degree door opening at ({x},{y}) with a width of {width}, swinging to the {direction}.",
        "Create a door symbol: position ({x},{y}), width {width}, swing direction: {direction}",
        "door symbol: pos=({x},{y}), w={width}, swing={direction}",
    ],
    "window": [
        "Draw a window at ({x},{y}), with a width of {width} and a wall thickness of {thickness}.",
        "Create a window symbol: position ({x},{y}), dimensions {width}x{thickness}.",
        "window: pos=({x},{y}), {width} wide, {thickness} thick",
    ],
    "wall": [
        "Draw a wall from ({x1},{y1}) to ({x2},{y2}) with a thickness of {thickness}.",
        "Create a double-line wall between {p1} and {p2}, thickness {thickness}.",
        "wall: from {p1} to {p2}, {thickness} thick",
    ],
    "room": [
        "Draw a rectangular room at ({x},{y}) with dimensions {width} by {height} and wall thickness {thickness}.",
        "Create a room: origin ({x},{y}), size {width}x{height}, wall thickness {thickness}.",
        "room: pos=({x},{y}), size={width}x{height}, thickness={thickness}",
    ],
    "stairs": [
        "Draw a staircase at ({x},{y}) with {steps} steps, a total width of {width}, and a total length of {length}.",
        "Create stairs: start at ({x},{y}), {steps} risers, width {width}, run {length}.",
    ],
    "column": [
        "Draw a circular column at ({x},{y}) with a diameter of {diameter}.",
        "Create a round column with center at ({x},{y}) and diameter {diameter}.",
        "column: center=({x},{y}), d={diameter}",
    ],
    "simple_building": [
        "Draw a simple building footprint, {width} by {depth} at ({x},{y}), divided into {rooms} equal rooms.",
        "Create a building layout {width}x{depth} starting at ({x},{y}), with {rooms} internal divisions.",
    ],
    "floor_plan": [
        "Generate a simple 2-bedroom floor plan with a living room and a bathroom.",
        "Create a basic apartment layout with one bedroom, a kitchen, and a bathroom.",
    ],
}

# --- 3. DXF Generation Functions (using ezdxf) ---

def create_dxf_string(drawing_func, *args, **kwargs):
    """A generic function to create a DXF string from a drawing function."""
    doc = ezdxf.new()
    msp = doc.modelspace()
    drawing_func(msp, *args, **kwargs)
    with io.StringIO() as stream:
        doc.write(stream)
        return stream.getvalue()

def draw_line(msp, p1, p2):
    msp.add_line(p1, p2)

def draw_circle(msp, center, radius):
    msp.add_circle(center, radius=radius)

def draw_arc(msp, center, radius, start_angle, end_angle):
    msp.add_arc(center, radius=radius, start_angle=start_angle, end_angle=end_angle)

def draw_rectangle_as_polyline(msp, origin, width, height):
    x, y = origin
    points = [(x, y), (x + width, y), (x + width, y + height), (x, y + height)]
    msp.add_lwpolyline(points, close=True)

def draw_polygon(msp, center, radius, sides):
    msp.add_regular_polygon(center, radius, num_sides=sides)

def draw_ellipse(msp, center, major_axis_endpoint, ratio):
    msp.add_ellipse(center, major_axis=major_axis_endpoint, ratio=ratio)

def draw_polyline(msp, points):
    msp.add_lwpolyline(points)

def draw_text(msp, position, text, height):
    msp.add_text(text, dxfattribs={'insert': position, 'height': height})

def draw_door(msp, position, width, direction):
    x, y = position
    p1 = (x - width / 2, y)
    p2 = (x + width / 2, y)
    
    # Door frame lines (jambs)
    msp.add_line((p1[0], p1[1] - 5), (p1[0], p1[1] + 5))
    msp.add_line((p2[0], p2[1] - 5), (p2[0], p2[1] + 5))
    
    # Door swing arc and panel
    if direction.lower() in ['right', 'r']:
        msp.add_line(p1, (p1[0], p1[1] + width))
        msp.add_arc(p1, radius=width, start_angle=90, end_angle=0)
    else: # left
        msp.add_line(p2, (p2[0], p2[1] + width))
        msp.add_arc(p2, radius=width, start_angle=90, end_angle=180)

def draw_window(msp, position, width, thickness):
    x, y = position
    msp.add_line((x, y - thickness/2), (x + width, y - thickness/2))
    msp.add_line((x, y + thickness/2), (x + width, y + thickness/2))
    msp.add_line((x, y - thickness/2), (x, y + thickness/2))
    msp.add_line((x + width, y - thickness/2), (x + width, y + thickness/2))
    msp.add_line((x + width/2, y - thickness/2), (x + width/2, y + thickness/2))

def draw_wall(msp, p1, p2, thickness):
    msp.add_line(p1, p2) # Simplified as a single line for now
    # For a more complex representation, you could use polylines or hatches.

def draw_room(msp, origin, width, height, thickness):
    x, y = origin
    # Outer rectangle
    msp.add_lwpolyline([(x, y), (x + width, y), (x + width, y + height), (x, y + height)], close=True)
    # Inner rectangle for thickness
    msp.add_lwpolyline([(x + thickness, y + thickness), 
                        (x + width - thickness, y + thickness), 
                        (x + width - thickness, y + height - thickness), 
                        (x, y + height - thickness)], close=True) # Note: A simple inset, not perfect corners

def draw_stairs(msp, position, steps, width, length):
    x, y = position
    step_depth = length / steps
    for i in range(steps + 1):
        y_pos = y + i * step_depth
        msp.add_line((x, y_pos), (x + width, y_pos))
    msp.add_line((x, y), (x, y + length))
    msp.add_line((x + width, y), (x + width, y + length))

def draw_column(msp, position, diameter):
    msp.add_circle(position, radius=diameter / 2)
    hatch = msp.add_hatch(color=2)
    hatch.paths.add_polyline_path(ezdxf.path.make_path(msp.query(f'CIRCLE(center==({position[0]},{position[1]}))')[0]).vertices(), flags=1)


def draw_simple_building(msp, origin, width, depth, rooms):
    x, y = origin
    draw_rectangle_as_polyline(msp, origin, width, depth)
    if rooms == 2:
        msp.add_line((x + width / 2, y), (x + width / 2, y + depth))
    elif rooms == 4:
        msp.add_line((x + width / 2, y), (x + width / 2, y + depth))
        msp.add_line((x, y + depth / 2), (x + width, y + depth / 2))

def draw_floor_plan(msp, origin, rooms_config):
    # This is a very simplified example. A real generator would be much more complex.
    x, y = origin
    current_x, current_y = x, y
    
    for room in rooms_config:
        msp.add_lwpolyline([(current_x, current_y), 
                            (current_x + room['w'], current_y), 
                            (current_x + room['w'], current_y + room['h']), 
                            (current_x, current_y + room['h'])], close=True)
        msp.add_text(room['name'], dxfattribs={'insert': (current_x + room['w']/2, current_y + room['h']/2), 'height': 20}).set_placement('MIDDLE_CENTER')
        current_x += room['w'] + 50 # Add a small gap
    
# --- 4. Main Data Generation Logic ---

def generate_and_save_dataset():
    """Generates the full dataset and saves it to a JSONL file."""
    dataset = []
    
    total_samples = sum(NUM_SAMPLES.values())
    pbar = tqdm(total=total_samples, desc="Generating Dataset")
    
    for _ in range(NUM_SAMPLES["line"]):
        p1 = (round(random.uniform(*COORDINATE_RANGE), 1), round(random.uniform(*COORDINATE_RANGE), 1))
        p2 = (round(random.uniform(*COORDINATE_RANGE), 1), round(random.uniform(*COORDINATE_RANGE), 1))
        template = random.choice(PROMPT_TEMPLATES["line"])
        prompt_text = template.format(p1=f"{p1[0]},{p1[1]}", p2=f"{p2[0]},{p2[1]}", x1=p1[0], y1=p1[1], x2=p2[0], y2=p2[1])
        dxf_output = create_dxf_string(draw_line, p1, p2)
        dataset.append({"instruction": INSTRUCTION_TEXT, "input": prompt_text, "output": dxf_output})
        pbar.update(1)

    for _ in range(NUM_SAMPLES["circle"]):
        center = (round(random.uniform(*COORDINATE_RANGE), 1), round(random.uniform(*COORDINATE_RANGE), 1))
        radius = round(random.uniform(*RADIUS_RANGE), 1)
        template = random.choice(PROMPT_TEMPLATES["circle"])
        prompt_text = template.format(center=f"{center[0]},{center[1]}", cx=center[0], cy=center[1], radius=radius, diameter=radius*2)
        dxf_output = create_dxf_string(draw_circle, center, radius)
        dataset.append({"instruction": INSTRUCTION_TEXT, "input": prompt_text, "output": dxf_output})
        pbar.update(1)

    for _ in range(NUM_SAMPLES["arc"]):
        center = (round(random.uniform(*COORDINATE_RANGE), 1), round(random.uniform(*COORDINATE_RANGE), 1))
        radius = round(random.uniform(*RADIUS_RANGE), 1)
        start_angle = random.randint(0, 359)
        end_angle = (start_angle + random.randint(45, 180)) % 360
        template = random.choice(PROMPT_TEMPLATES["arc"])
        prompt_text = template.format(center=f"{center[0]},{center[1]}", cx=center[0], cy=center[1], radius=radius, start_angle=start_angle, end_angle=end_angle)
        dxf_output = create_dxf_string(draw_arc, center, radius, start_angle, end_angle)
        dataset.append({"instruction": INSTRUCTION_TEXT, "input": prompt_text, "output": dxf_output})
        pbar.update(1)
        
    for _ in range(NUM_SAMPLES["rectangle"]):
        origin = (round(random.uniform(*COORDINATE_RANGE), 1), round(random.uniform(*COORDINATE_RANGE), 1))
        width, height = round(random.uniform(*DIMENSION_RANGE), 1), round(random.uniform(*DIMENSION_RANGE), 1)
        template = random.choice(PROMPT_TEMPLATES["rectangle"])
        prompt_text = template.format(x=origin[0], y=origin[1], width=width, height=height)
        dxf_output = create_dxf_string(draw_rectangle_as_polyline, origin, width, height)
        dataset.append({"instruction": INSTRUCTION_TEXT, "input": prompt_text, "output": dxf_output})
        pbar.update(1)

    pbar.close()
    random.shuffle(dataset)
    
    # Save to JSONL file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        for entry in dataset:
            f.write(json.dumps(entry) + "\n")
            
    print(f"\nDataset successfully generated and saved to '{OUTPUT_FILE}' with {len(dataset)} examples.")

# --- Main Execution ---
if __name__ == "__main__":
    generate_and_save_dataset()