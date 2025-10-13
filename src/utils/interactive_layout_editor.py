"""
Interactive Layout Editor for OMR Templates

Enhanced version of the layout editor with drag and drop capabilities
"""

import cv2
import json
import numpy as np
from pathlib import Path
from typing import Optional

from src.constants import CLR_BLACK, CLR_GRAY, TEXT_SIZE
from src.logger import logger


class InteractiveLayoutEditor:
    """Interactive layout editor with drag and drop capabilities"""
    
    def __init__(self, template_path: Path, image_path: Optional[Path] = None):
        self.template_path = template_path
        self.image_path = image_path
        
        # Load the actual Template object (same as the original system)
        from src.defaults import CONFIG_DEFAULTS
        from src.template import Template
        self.template = Template(template_path, CONFIG_DEFAULTS)
        
        # UI State
        self.selected_block = None
        self.dragging = False
        self.drag_offset = (0, 0)
        self.window_name = "Interactive Layout Editor"
        
        # Load and prepare image
        self.original_image = self.load_image()
        self.display_image = self.original_image.copy()
        self.scale_factor = 1.0
        
        # Mouse callback setup
        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)
        cv2.setMouseCallback(self.window_name, self.mouse_callback)
        
    
    def load_image(self) -> np.ndarray:
        """Load and prepare the background image"""
        if self.image_path and self.image_path.exists():
            image = cv2.imread(str(self.image_path), cv2.IMREAD_COLOR)
            if image is None:
                logger.warning(f"Could not load image: {self.image_path}")
                return self.create_blank_image()
        else:
            # Create a blank image if no image is provided
            return self.create_blank_image()
        
        # Resize image to match template dimensions using ImageUtils (same as original)
        from src.utils.image import ImageUtils
        image = ImageUtils.resize_util(
            image, self.template.page_dimensions[0], self.template.page_dimensions[1]
        )
        return image
    
    def create_blank_image(self) -> np.ndarray:
        """Create a blank white image with template dimensions"""
        page_width, page_height = self.template.page_dimensions
        image = np.ones((page_height, page_width, 3), dtype=np.uint8) * 255
        return image
    
    
    def draw_field_block(self, image: np.ndarray, block_name: str, 
                        is_selected: bool = False) -> np.ndarray:
        """Draw a field block using the exact same logic as the original system"""
        # Get the actual field block from the template
        template_field_block = None
        for fb in self.template.field_blocks:
            if fb.name == block_name:
                template_field_block = fb
                break
        
        if not template_field_block:
            return image
        
        # Use exact same drawing logic as original draw_template_layout
        s = template_field_block.origin
        d = template_field_block.dimensions
        box_w, box_h = template_field_block.bubble_dimensions
        
        # Choose colors based on selection
        if is_selected:
            border_color = (0, 255, 0)  # Green for selected
        else:
            border_color = CLR_BLACK
        
        # Draw field block border (same as original)
        cv2.rectangle(
            image,
            (s[0], s[1]),
            (s[0] + d[0], s[1] + d[1]),
            border_color,
            3,
        )
        
        # Draw individual bubbles using traverse_bubbles (same as original)
        for field_block_bubbles in template_field_block.traverse_bubbles:
            for pt in field_block_bubbles:
                x, y = pt.x, pt.y  # No shift since we're using shifted=False
                cv2.rectangle(
                    image,
                    (int(x + box_w / 10), int(y + box_h / 10)),
                    (int(x + box_w - box_w / 10), int(y + box_h - box_h / 10)),
                    CLR_GRAY,
                    -1,  # Fill the bubble
                )
                cv2.rectangle(
                    image,
                    (int(x + box_w / 10), int(y + box_h / 10)),
                    (int(x + box_w - box_w / 10), int(y + box_h - box_h / 10)),
                    border_color,
                    2,
                )
        
        # Draw field name (same as original)
        text_in_px = cv2.getTextSize(
            template_field_block.name, cv2.FONT_HERSHEY_SIMPLEX, TEXT_SIZE, 4
        )
        cv2.putText(
            image,
            template_field_block.name,
            (int(s[0] + d[0] - text_in_px[0][0]), int(s[1] - text_in_px[0][1])),
            cv2.FONT_HERSHEY_SIMPLEX,
            TEXT_SIZE,
            border_color,
            4,
        )
        
        # Draw coordinates in debug mode
        coord_text = f"({s[0]},{s[1]})"
        cv2.putText(
            image, coord_text, (s[0], s[1] + d[1] + 20),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, border_color, 1
        )
        
        return image
    
    def draw_grid(self, image: np.ndarray) -> np.ndarray:
        """Draw a grid on the image"""
        height, width = image.shape[:2]
        
        # Draw vertical lines
        for x in range(0, width, 50):
            cv2.line(image, (x, 0), (x, height), (200, 200, 200), 1)
        
        # Draw horizontal lines
        for y in range(0, height, 50):
            cv2.line(image, (0, y), (width, y), (200, 200, 200), 1)
        
        return image
    
    def get_block_at_position(self, x: int, y: int) -> Optional[str]:
        """Get the field block at the given position"""
        for field_block in self.template.field_blocks:
            s = field_block.origin
            d = field_block.dimensions
            
            if s[0] <= x <= s[0] + d[0] and s[1] <= y <= s[1] + d[1]:
                return field_block.name
        
        return None
    
    def mouse_callback(self, event, x, y, flags, param):
        """Handle mouse events for drag and drop"""
        if event == cv2.EVENT_LBUTTONDOWN:
            # Check if clicking on a field block
            clicked_block = self.get_block_at_position(x, y)
            if clicked_block:
                self.selected_block = clicked_block
                # Find the selected field block to get its origin
                for field_block in self.template.field_blocks:
                    if field_block.name == clicked_block:
                        self.drag_offset = (x - field_block.origin[0], y - field_block.origin[1])
                        break
                self.dragging = True
                logger.info(f"Selected block: {clicked_block}")
            else:
                self.selected_block = None
                self.dragging = False
        
        elif event == cv2.EVENT_MOUSEMOVE and self.dragging and self.selected_block:
            # Find the selected field block in template
            selected_field_block = None
            for field_block in self.template.field_blocks:
                if field_block.name == self.selected_block:
                    selected_field_block = field_block
                    break
            
            if selected_field_block:
                new_x = max(0, x - self.drag_offset[0])
                new_y = max(0, y - self.drag_offset[1])
                
                # Ensure block stays within image bounds
                page_width, page_height = self.template.page_dimensions
                new_x = min(new_x, page_width - selected_field_block.dimensions[0])
                new_y = min(new_y, page_height - selected_field_block.dimensions[1])
                
                # Update block position
                selected_field_block.origin = (new_x, new_y)
                self.redraw()
        
        elif event == cv2.EVENT_LBUTTONUP:
            self.dragging = False
    
    def redraw(self):
        """Redraw the entire image with current field block positions"""
        self.display_image = self.original_image.copy()
        
        # Draw grid
        self.display_image = self.draw_grid(self.display_image)
        
        # Draw all field blocks using template field blocks
        for field_block in self.template.field_blocks:
            is_selected = (field_block.name == self.selected_block)
            self.display_image = self.draw_field_block(self.display_image, field_block.name, is_selected)
        
        # Add instructions
        self.draw_instructions()
        
        cv2.imshow(self.window_name, self.display_image)
    
    def draw_instructions(self):
        """Draw instruction text on the image"""
        instructions = [
            "Interactive Layout Editor",
            "Drag field blocks to reposition them",
            "Press 'S' to save, 'R' to reset, 'Q' to quit"
        ]
        
        y_offset = 30
        for instruction in instructions:
            cv2.putText(
                self.display_image, instruction,
                (10, y_offset),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, CLR_BLACK, 2
            )
            y_offset += 25
    
    def save_template(self):
        """Save the current field block positions to template.json"""
        # Load the original template data
        with open(self.template_path, 'r') as f:
            template_data = json.load(f)
        
        # Update template data with new positions from template object
        for field_block in self.template.field_blocks:
            if field_block.name in template_data['fieldBlocks']:
                template_data['fieldBlocks'][field_block.name]['origin'] = list(field_block.origin)
        
        # Write to file
        with open(self.template_path, 'w') as f:
            json.dump(template_data, f, indent=2)
        
        logger.info(f"Template saved to: {self.template_path}")
    
    def reset_template(self):
        """Reset field blocks to original positions"""
        # Reload the template to get original positions
        from src.defaults import CONFIG_DEFAULTS
        from src.template import Template
        self.template = Template(self.template_path, CONFIG_DEFAULTS)
        self.selected_block = None
        self.redraw()
        logger.info("Template reset to original positions")
    
    def run(self):
        """Main loop for the interactive editor"""
        logger.info("Starting Interactive Layout Editor")
        logger.info("Instructions:")
        logger.info("- Click and drag field blocks to move them")
        logger.info("- Press 'S' to save changes")
        logger.info("- Press 'R' to reset to original positions")
        logger.info("- Press 'Q' to quit")
        
        self.redraw()
        
        while True:
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q') or key == 27:  # Q or ESC
                break
            elif key == ord('s'):  # Save
                self.save_template()
            elif key == ord('r'):  # Reset
                self.reset_template()
            elif key == ord('h'):  # Help
                self.show_help()
        
        cv2.destroyAllWindows()
        logger.info("Interactive Layout Editor closed")
    
    def show_help(self):
        """Show help information"""
        help_text = [
            "Interactive Layout Editor Help:",
            "",
            "Mouse Controls:",
            "- Left click and drag: Move field blocks",
            "",
            "Keyboard Controls:",
            "- S: Save current positions to template.json",
            "- R: Reset to original positions",
            "- Q or ESC: Quit editor",
            "- H: Show this help",
            "",
            "Field blocks show:",
            "- Green border: Selected block",
            "- Red border: Unselected blocks",
            "- Coordinates: Bottom-left corner of each block"
        ]
        
        for i, line in enumerate(help_text):
            print(line)


def launch_interactive_editor(template_path: Path, image_path: Optional[Path] = None):
    """Launch the interactive layout editor"""
    try:
        editor = InteractiveLayoutEditor(template_path, image_path)
        editor.run()
    except Exception as e:
        logger.error(f"Error launching interactive editor: {e}")
        raise
