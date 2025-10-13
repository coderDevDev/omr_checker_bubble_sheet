# Interactive Layout Editor

The Interactive Layout Editor is an enhanced version of the OMR template layout editor that allows you to visually drag and drop field blocks to adjust their positions directly on the image.

## Features

- **Drag and Drop**: Click and drag field blocks to reposition them
- **Visual Feedback**: Selected blocks are highlighted in green, unselected in red
- **Real-time Updates**: See changes immediately as you drag
- **Grid Overlay**: Visual grid to help with alignment
- **Coordinate Display**: Shows exact coordinates for each field block
- **Keyboard Shortcuts**: Quick access to save, reset, and help functions
- **Background Image**: Use your OMR sheet image as background for perfect alignment

## How to Use

### Method 1: Using the Main Command (Recommended)

```bash
python main.py --setLayout --inputDir inputs
```

This will automatically launch the interactive editor with your template and any images in the input directory.

### Method 2: Using the Test Script

```bash
python test_interactive_editor.py
```

This will launch the editor with the template from `inputs/template.json` and image from `inputs/dxuian/omrcollegesheet.jpg`.

### Method 3: Direct Python Usage

```python
from src.utils.interactive_layout_editor import launch_interactive_editor
from pathlib import Path

# Launch with template and background image
launch_interactive_editor(
    template_path=Path("inputs/template.json"),
    image_path=Path("inputs/dxuian/omrcollegesheet.jpg")
)

# Launch with blank background
launch_interactive_editor(
    template_path=Path("inputs/template.json"),
    image_path=None
)
```

## Controls

### Mouse Controls

- **Left Click + Drag**: Move field blocks to new positions
- **Left Click**: Select a field block (shows green border)

### Keyboard Shortcuts

- **S**: Save current positions to `template.json`
- **R**: Reset all field blocks to original positions
- **Q** or **ESC**: Quit the editor
- **H**: Show help information

## Visual Elements

- **Green Border**: Currently selected field block
- **Red Border**: Unselected field blocks
- **Semi-transparent Fill**: Field block area
- **Gray Rectangles**: Individual answer bubbles (A, B, C, D)
- **Field Name**: Displayed above each field block
- **Coordinates**: Shown at bottom-left of each block in format `(x,y)`
- **Grid Lines**: 50-pixel grid for alignment assistance

## Workflow

1. **Launch the Editor**: Run `python main.py --setLayout --inputDir inputs`
2. **Load Background**: The editor will use your OMR sheet image as background
3. **Adjust Positions**: Click and drag field blocks to align with actual bubbles
4. **Save Changes**: Press 'S' to save new positions to `template.json`
5. **Test**: Run OMR processing to verify alignment is correct

## Tips for Best Results

1. **Use High-Quality Images**: The better your background image, the easier alignment will be
2. **Zoom In**: Use the grid lines to ensure precise alignment
3. **Check Coordinates**: The coordinate display helps verify exact positioning
4. **Save Frequently**: Press 'S' often to avoid losing changes
5. **Reset if Needed**: Press 'R' to undo all changes and start over

## File Structure

The editor automatically:

- Loads your existing `template.json` file
- Uses the first image in your input directory as background
- Updates the `origin` coordinates in `template.json` when you save
- Preserves all other template settings (dimensions, labels, etc.)

## Troubleshooting

### Editor Won't Launch

- Ensure OpenCV is installed: `pip install opencv-python`
- Check that your template.json file is valid
- Verify image file exists and is readable

### Field Blocks Not Aligning

- Make sure your background image matches your actual OMR sheets
- Check that page dimensions in template.json match your image
- Use the grid overlay to ensure precise positioning

### Changes Not Saving

- Ensure you have write permissions to the template.json file
- Press 'S' to explicitly save changes
- Check the console for any error messages

## Comparison with Web Editor

| Feature            | Python Interactive Editor | Web Layout Editor |
| ------------------ | ------------------------- | ----------------- |
| Drag & Drop        | ✅ Native OpenCV          | ✅ HTML5 Canvas   |
| Real-time Updates  | ✅ Immediate              | ✅ Immediate      |
| Background Image   | ✅ Full Support           | ✅ Full Support   |
| Coordinate Display | ✅ Built-in               | ✅ Debug Mode     |
| Keyboard Shortcuts | ✅ Full Support           | ✅ Limited        |
| File Integration   | ✅ Direct JSON            | ✅ API Required   |
| Performance        | ✅ Native Speed           | ✅ Good           |
| Cross-platform     | ✅ Yes                    | ✅ Web Browser    |

The Python Interactive Editor is recommended for:

- Precise alignment work
- Direct template editing
- Offline usage
- Performance-critical scenarios

## Example Session

```
$ python main.py --setLayout --inputDir inputs

[INFO] Launching Interactive Layout Editor with image: inputs/dxuian/omrcollegesheet.jpg
[INFO] Starting Interactive Layout Editor
[INFO] Instructions:
[INFO] - Click and drag field blocks to move them
[INFO] - Press 'S' to save changes
[INFO] - Press 'R' to reset to original positions
[INFO] - Press 'Q' to quit

# User drags Column1 block to better align with bubbles
[INFO] Selected block: Column1
[INFO] Template saved to: inputs/template.json
[INFO] Interactive Layout Editor closed
```

This enhanced layout editor makes template creation and adjustment much more intuitive and efficient!
