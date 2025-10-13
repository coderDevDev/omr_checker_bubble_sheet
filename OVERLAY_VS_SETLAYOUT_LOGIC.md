# Camera Overlay vs `--setLayout` Logic Comparison

## Your Question

You noticed that `python main.py --setLayout` shows **correct and precise** bubble positioning. You want to understand **what logic it uses** so the camera overlay can match it exactly.

---

## 🎯 The Key Difference

### **`--setLayout` (OMRChecker Core)**

Uses the **`FieldBlock.traverse_bubbles`** system - a pre-calculated grid of exact bubble coordinates.

### **Camera Overlay (Current)**

Uses **manual calculation** with `origin`, `labelsGap`, and `bubblesGap` properties.

---

## 📐 How `--setLayout` Works (The Correct Way)

### **Step 1: Generate Bubble Grid** (`src/template.py`)

```python
class FieldBlock:
    def generate_bubble_grid(self, bubble_values, bubbles_gap, direction, field_type, labels_gap):
        _h, _v = (1, 0) if (direction == "vertical") else (0, 1)
        self.traverse_bubbles = []

        # Start from origin
        lead_point = [float(self.origin[0]), float(self.origin[1])]

        # For each question (e.g., Q1, Q2, Q3...)
        for field_label in self.parsed_field_labels:
            bubble_point = lead_point.copy()
            field_bubbles = []

            # For each option (A, B, C, D)
            for bubble_value in bubble_values:
                # Create a Bubble object with EXACT coordinates
                field_bubbles.append(
                    Bubble(bubble_point.copy(), field_label, field_type, bubble_value)
                )
                # Move horizontally to next option
                bubble_point[_h] += bubbles_gap

            self.traverse_bubbles.append(field_bubbles)
            # Move vertically to next question
            lead_point[_v] += labels_gap
```

**Key Points:**

- `_h, _v = (1, 0)` for vertical means: horizontal index = 1 (Y), vertical index = 0 (X)
- `_h, _v = (0, 1)` for horizontal means: horizontal index = 0 (X), vertical index = 1 (Y)
- Each bubble gets its own `Bubble` object with exact `(x, y)` coordinates
- `bubble_point[_h] += bubbles_gap` moves along the bubble values (A→B→C→D)
- `lead_point[_v] += labels_gap` moves to the next question (Q1→Q2→Q3...)

### **Step 2: Draw Bubbles** (`src/core.py`)

```python
@staticmethod
def draw_template_layout(img, template, shifted=True, draw_qvals=False, border=-1):
    # Resize image to exact template dimensions
    img = ImageUtils.resize_util(
        img, template.page_dimensions[0], template.page_dimensions[1]
    )

    final_align = img.copy()

    for field_block in template.field_blocks:
        s, d = field_block.origin, field_block.dimensions
        box_w, box_h = field_block.bubble_dimensions
        shift = field_block.shift

        # Draw field block border
        cv2.rectangle(
            final_align,
            (s[0] + shift, s[1]) if shifted else (s[0], s[1]),
            (s[0] + shift + d[0], s[1] + d[1]) if shifted else (s[0] + d[0], s[1] + d[1]),
            constants.CLR_BLACK,
            3,
        )

        # Draw individual bubbles using pre-calculated coordinates
        for field_block_bubbles in field_block.traverse_bubbles:  # ← KEY: Pre-calculated grid
            for pt in field_block_bubbles:
                x, y = (pt.x + field_block.shift, pt.y) if shifted else (pt.x, pt.y)

                # Draw bubble rectangle
                cv2.rectangle(
                    final_align,
                    (int(x + box_w / 10), int(y + box_h / 10)),
                    (int(x + box_w - box_w / 10), int(y + box_h - box_h / 10)),
                    constants.CLR_GRAY,
                    border,
                )
```

**Key Points:**

- Uses `field_block.traverse_bubbles` - **pre-calculated** exact coordinates
- Each bubble position is already computed during template initialization
- Just iterates through the pre-made grid and draws at exact coordinates
- Applies inset: `box_w / 10` and `box_h / 10` for padding inside the bubble rectangle

---

## 🔴 How Camera Overlay Currently Works (Less Precise)

### **Current Camera Overlay Logic** (`camera_overlay.py`)

```python
def draw_bubble_guides(self, frame):
    for col_idx in range(5):
        col_name = f"Column{col_idx + 1}"
        col_config = self.template["fieldBlocks"][col_name]

        # Calculate column position
        col_x = self.overlay_x + int(col_config["origin"][0] * self.scale_x)
        col_y = self.overlay_y + int(col_config["origin"][1] * self.scale_y)

        # Draw sample bubbles
        for question_idx in sample_questions:
            question_label = col_config["fieldLabels"][question_idx]
            bubble_y = col_y + int(question_idx * col_config["labelsGap"] * self.scale_y)  # ← MANUAL calculation

            # Draw bubbles
            for option_idx, option_value in enumerate(bubble_values):
                if direction == "horizontal":
                    option_x = col_x + int(option_idx * col_config["bubblesGap"] * self.scale_x)  # ← MANUAL calculation
```

**Problems:**

1. ❌ **Manual calculation** instead of using pre-generated grid
2. ❌ **Rounding errors** from `int()` conversions and scaling
3. ❌ **No Bubble objects** - just calculates on the fly
4. ❌ **Sampling only** - shows sample questions [0, 4, 9, 14, 19] instead of all bubbles
5. ❌ **Different scaling** - applies overlay scaling on top of template coordinates

---

## ✅ Solution: Use OMRChecker's Core Logic

To make the camera overlay **exactly match** `--setLayout`, we need to:

### **Option 1: Import FieldBlock Class** (Recommended)

```python
from src.template import Template
from pathlib import Path

class OMRCameraOverlay:
    def __init__(self, template_path, config_path="inputs/config.json"):
        self.template_path = template_path

        # Load template using OMRChecker's Template class
        from src.defaults.config import CONFIG_DEFAULTS
        self.template = Template(Path(template_path), CONFIG_DEFAULTS)

        # Now we have access to field_block.traverse_bubbles!
        self.page_width = self.template.page_dimensions[0]
        self.page_height = self.template.page_dimensions[1]

    def draw_bubble_guides(self, frame):
        """Draw ALL bubbles using exact FieldBlock.traverse_bubbles"""
        for field_block in self.template.field_blocks:
            s = field_block.origin
            d = field_block.dimensions
            box_w, box_h = field_block.bubble_dimensions

            # Scale coordinates
            scale_x = self.overlay_width / self.page_width
            scale_y = self.overlay_height / self.page_height

            # Draw ALL bubbles using pre-calculated grid
            for field_block_bubbles in field_block.traverse_bubbles:
                for pt in field_block_bubbles:
                    # Use EXACT coordinates from Bubble object
                    x = self.overlay_x + int(pt.x * scale_x)
                    y = self.overlay_y + int(pt.y * scale_y)

                    # Draw bubble with exact dimensions
                    bubble_width = int(box_w * scale_x)
                    bubble_height = int(box_h * scale_y)

                    cv2.ellipse(frame, (x, y),
                              (bubble_width // 2, bubble_height // 2),
                              0, 0, 360, (255, 255, 0), 2)

                    # Draw bubble value (A, B, C, D)
                    cv2.putText(frame, str(pt.field_value),
                              (x - 3, y + 5),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 255, 0), 1)
```

### **Option 2: Replicate Bubble Grid Logic** (If you can't import)

```python
def generate_bubble_grid(self, col_config):
    """Replicate OMRChecker's bubble grid generation"""
    bubble_values = self.get_bubble_values(col_config)
    direction = col_config.get("direction", "horizontal")
    bubbles_gap = col_config["bubblesGap"]
    labels_gap = col_config["labelsGap"]
    origin = col_config["origin"]
    field_labels = col_config["fieldLabels"]

    # Determine horizontal and vertical indices
    _h, _v = (1, 0) if (direction == "vertical") else (0, 1)

    traverse_bubbles = []
    lead_point = [float(origin[0]), float(origin[1])]

    # For each question
    for field_label in field_labels:
        bubble_point = lead_point.copy()
        field_bubbles = []

        # For each option (A, B, C, D)
        for bubble_value in bubble_values:
            field_bubbles.append({
                'x': round(bubble_point[0]),
                'y': round(bubble_point[1]),
                'label': field_label,
                'value': bubble_value
            })
            bubble_point[_h] += bubbles_gap

        traverse_bubbles.append(field_bubbles)
        lead_point[_v] += labels_gap

    return traverse_bubbles
```

---

## 🔍 Key Differences Summary

| Aspect                | `--setLayout` (Correct)                    | Camera Overlay (Current)        |
| --------------------- | ------------------------------------------ | ------------------------------- |
| **Bubble Grid**       | Pre-calculated `traverse_bubbles`          | Manual calculation each frame   |
| **Coordinates**       | Exact `Bubble` objects with `pt.x`, `pt.y` | Calculated: `col_x + idx * gap` |
| **Bubble Count**      | Shows ALL bubbles                          | Shows only sample [0,4,9,14,19] |
| **Direction Support** | Full `vertical`/`horizontal` support       | Partial support                 |
| **Field Types**       | Automatic from `FIELD_TYPES` dict          | Manual mapping                  |
| **Precision**         | Float→Round at creation                    | Int conversions each frame      |
| **Scaling**           | Applied once after calculation             | Applied during calculation      |

---

## 🎯 Recommendation

**Use Option 1** (Import FieldBlock) because:

1. ✅ **Guaranteed accuracy** - uses same code as OMRChecker
2. ✅ **All bubbles shown** - not just samples
3. ✅ **Future-proof** - automatically supports new field types
4. ✅ **Less code** - no need to replicate logic
5. ✅ **Exact matching** - 100% consistent with `--setLayout`

The key insight is that `--setLayout` doesn't recalculate bubble positions every time - it **generates them once** during template initialization, then just draws from that pre-computed grid. Your camera overlay should do the same!

---

## 📊 Visual Comparison

### **`--setLayout` Logic Flow:**

```
Template.json → FieldBlock.__init__() → generate_bubble_grid() → traverse_bubbles[]
                                                                         ↓
                                                    draw_template_layout() → Uses pt.x, pt.y
```

### **Camera Overlay Current Flow:**

```
Template.json → load_template() → Store origin, gaps
                                        ↓
                        draw_bubble_guides() → Calculate x = origin + idx * gap (EVERY FRAME)
```

### **Camera Overlay SHOULD BE:**

```
Template.json → Template class → FieldBlock → traverse_bubbles[]
                                                     ↓
                              draw_bubble_guides() → Use pt.x, pt.y (pre-calculated)
```

---

## 🚀 Next Steps

1. Import `Template` class from `src.template`
2. Replace manual bubble calculation with `field_block.traverse_bubbles` iteration
3. Test against `--setLayout` output for pixel-perfect matching
4. Consider showing all bubbles instead of just samples for complete accuracy
