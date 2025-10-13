#!/usr/bin/env python3
"""
OMR Camera Overlay - Real-time camera guide for consistent OMR sheet positioning
Shows a frame overlay to help users align their OMR sheet before capturing.

Uses EXACT same bubble positioning logic as OMRChecker --setLayout for pixel-perfect accuracy!
"""

import cv2
import numpy as np
import json
from pathlib import Path

# Import OMRChecker's core Template class for exact bubble positioning
from src.template import Template
from src.defaults.config import CONFIG_DEFAULTS

class OMRCameraOverlay:
    def __init__(self, template_path="inputs/dxuian/template.json"):
        """Initialize camera overlay with template configuration"""
        self.template_path = Path(template_path)
        self.load_template()
        self.setup_overlay()
        
    def load_template(self):
        """Load template using OMRChecker's Template class - EXACT same as --setLayout!"""
        # Use OMRChecker's Template class - this gives us traverse_bubbles!
        self.template = Template(self.template_path, CONFIG_DEFAULTS)
        
        # Extract key dimensions from Template object (not JSON)
        self.page_width = self.template.page_dimensions[0]
        self.page_height = self.template.page_dimensions[1]
        self.bubble_width = self.template.bubble_dimensions[0]
        self.bubble_height = self.template.bubble_dimensions[1]
        
        print(f"[OK] Template loaded: {self.page_width}x{self.page_height}")
        print(f"[OK] Field blocks: {len(self.template.field_blocks)}")
        print(f"[OK] Using EXACT --setLayout logic with traverse_bubbles!")
        
    def setup_overlay(self, camera_width=None, camera_height=None):
        """Setup overlay dimensions and positions"""
        # Use provided camera resolution or default
        self.camera_width = camera_width or 1280
        self.camera_height = camera_height or 720
        
        # Calculate overlay frame size (85% of camera height for better fit)
        self.overlay_height = int(self.camera_height * 0.85)
        self.overlay_width = int(self.overlay_height * (self.page_width / self.page_height))
        
        # Center the overlay perfectly
        self.overlay_x = (self.camera_width - self.overlay_width) // 2
        self.overlay_y = (self.camera_height - self.overlay_height) // 2
        
        # Calculate scale factor for bubble positions
        self.scale_x = self.overlay_width / self.page_width
        self.scale_y = self.overlay_height / self.page_height
        
        print(f"[OK] Overlay frame: {self.overlay_width}x{self.overlay_height}")
        print(f"[OK] Overlay centered at: ({self.overlay_x}, {self.overlay_y})")
        print(f"[OK] Scale factors: {self.scale_x:.2f}, {self.scale_y:.2f}")
        
    def draw_overlay(self, frame):
        """Draw the overlay on camera frame"""
        # Create a copy to draw on
        overlay_frame = frame.copy()
        
        # Draw main frame border (thick green lines) - centered
        cv2.rectangle(overlay_frame, 
                     (self.overlay_x, self.overlay_y),
                     (self.overlay_x + self.overlay_width, self.overlay_y + self.overlay_height),
                     (0, 255, 0), 4)
        
        # Add center crosshair for perfect alignment
        center_x = self.overlay_x + self.overlay_width // 2
        center_y = self.overlay_y + self.overlay_height // 2
        crosshair_size = 20
        
        # Draw center crosshair
        cv2.line(overlay_frame, 
                (center_x - crosshair_size, center_y), 
                (center_x + crosshair_size, center_y), (0, 255, 0), 2)
        cv2.line(overlay_frame, 
                (center_x, center_y - crosshair_size), 
                (center_x, center_y + crosshair_size), (0, 255, 0), 2)
        
        # Draw corner markers (help with alignment) - larger and more visible
        corner_size = 40
        # Top-left
        cv2.line(overlay_frame, 
                (self.overlay_x, self.overlay_y), 
                (self.overlay_x + corner_size, self.overlay_y), (0, 255, 0), 5)
        cv2.line(overlay_frame, 
                (self.overlay_x, self.overlay_y), 
                (self.overlay_x, self.overlay_y + corner_size), (0, 255, 0), 5)
        
        # Top-right
        cv2.line(overlay_frame, 
                (self.overlay_x + self.overlay_width, self.overlay_y), 
                (self.overlay_x + self.overlay_width - corner_size, self.overlay_y), (0, 255, 0), 5)
        cv2.line(overlay_frame, 
                (self.overlay_x + self.overlay_width, self.overlay_y), 
                (self.overlay_x + self.overlay_width, self.overlay_y + corner_size), (0, 255, 0), 5)
        
        # Bottom-left
        cv2.line(overlay_frame, 
                (self.overlay_x, self.overlay_y + self.overlay_height), 
                (self.overlay_x + corner_size, self.overlay_y + self.overlay_height), (0, 255, 0), 5)
        cv2.line(overlay_frame, 
                (self.overlay_x, self.overlay_y + self.overlay_height), 
                (self.overlay_x, self.overlay_y + self.overlay_height - corner_size), (0, 255, 0), 5)
        
        # Bottom-right
        cv2.line(overlay_frame, 
                (self.overlay_x + self.overlay_width, self.overlay_y + self.overlay_height), 
                (self.overlay_x + self.overlay_width - corner_size, self.overlay_y + self.overlay_height), (0, 255, 0), 5)
        cv2.line(overlay_frame, 
                (self.overlay_x + self.overlay_width, self.overlay_y + self.overlay_height), 
                (self.overlay_x + self.overlay_width, self.overlay_y + self.overlay_height - corner_size), (0, 255, 0), 5)
        
        # Bottom-right
        cv2.line(overlay_frame, 
                (self.overlay_x + self.overlay_width, self.overlay_y + self.overlay_height), 
                (self.overlay_x + self.overlay_width - corner_size, self.overlay_y + self.overlay_height), (0, 255, 0), 4)
        cv2.line(overlay_frame, 
                (self.overlay_x + self.overlay_width, self.overlay_y + self.overlay_height), 
                (self.overlay_x + self.overlay_width, self.overlay_y + self.overlay_height - corner_size), (0, 255, 0), 4)
        
        # Create a transparent overlay for bubbles
        bubble_overlay = frame.copy()
        bubble_overlay[:] = (0, 0, 0)  # Black background
        
        # Draw bubble position guides (sample bubbles) on transparent overlay
        self.draw_bubble_guides(bubble_overlay)
        
        # Add instructions (always visible)
        self.draw_instructions(overlay_frame)
        
        # Make bubbles semi-transparent so camera feed shows through
        alpha = 0.3
        cv2.addWeighted(frame, 1-alpha, bubble_overlay, alpha, 0, frame)
        
        return frame
        
    def draw_bubble_guides(self, frame):
        """
        Draw bubbles using EXACT same logic as python main.py --setLayout
        This uses src/core.py draw_template_layout() logic with traverse_bubbles
        """
        # Import constants for consistent colors
        from src.constants import CLR_BLACK, CLR_GRAY
        
        # Iterate through field blocks (SAME as --setLayout in src/core.py line 434)
        for field_block in self.template.field_blocks:
            s = field_block.origin  # origin coordinates
            d = field_block.dimensions  # block dimensions
            box_w, box_h = field_block.bubble_dimensions  # bubble size
            
            # Scale to overlay coordinates
            border_x1 = self.overlay_x + int(s[0] * self.scale_x)
            border_y1 = self.overlay_y + int(s[1] * self.scale_y)
            border_x2 = self.overlay_x + int((s[0] + d[0]) * self.scale_x)
            border_y2 = self.overlay_y + int((s[1] + d[1]) * self.scale_y)
            
            # Draw field block border (SAME as --setLayout line 447-453)
            cv2.rectangle(
                frame,
                (border_x1, border_y1),
                (border_x2, border_y2),
                (50, 150, 150),  # CLR_BLACK equivalent
                2,
            )
            
            # Draw field block name (SAME as --setLayout line 476-487)
            label_text = field_block.name
            text_size = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 2)[0]
            cv2.rectangle(frame, 
                         (border_x1 - 5, border_y1 - 25), 
                         (border_x1 + text_size[0] + 5, border_y1 - 5), 
                         (0, 0, 0), -1)
            cv2.putText(frame, label_text, 
                       (border_x1, border_y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 2)
            
            # Draw individual bubbles using traverse_bubbles (SAME as --setLayout line 454-463)
            # This is the KEY - using pre-calculated bubble grid!
            # Show ALL bubbles like --setLayout does (not just samples!)
            for question_idx, field_block_bubbles in enumerate(field_block.traverse_bubbles):
                # Draw ALL questions like --setLayout (remove sampling filter)
                # if question_idx not in sample_questions:
                #     continue
                
                # Draw question label
                first_bubble = field_block_bubbles[0]
                question_x = self.overlay_x + int(first_bubble.x * self.scale_x)
                question_y = self.overlay_y + int(first_bubble.y * self.scale_y)
                
                cv2.putText(frame, first_bubble.field_label, 
                           (question_x - 35, question_y + 5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
                
                # Draw each bubble (A, B, C, D) - EXACT logic from src/core.py
                for pt in field_block_bubbles:
                    # Use EXACT pre-calculated coordinates from Bubble object (line 456)
                    x = self.overlay_x + int(pt.x * self.scale_x)
                    y = self.overlay_y + int(pt.y * self.scale_y)
                    
                    # Scale bubble dimensions
                    scaled_box_w = int(box_w * self.scale_x)
                    scaled_box_h = int(box_h * self.scale_y)
                    
                    # Draw bubble rectangle with inset (EXACT same as line 457-463)
                    # Uses box_w/10 and box_h/10 inset for padding
                    cv2.rectangle(
                        frame,
                        (int(x + scaled_box_w / 10), int(y + scaled_box_h / 10)),
                        (int(x + scaled_box_w - scaled_box_w / 10), int(y + scaled_box_h - scaled_box_h / 10)),
                        (130, 130, 130),  # CLR_GRAY equivalent
                        -1,  # Filled
                    )
                    cv2.rectangle(
                        frame,
                        (int(x + scaled_box_w / 10), int(y + scaled_box_h / 10)),
                        (int(x + scaled_box_w - scaled_box_w / 10), int(y + scaled_box_h - scaled_box_h / 10)),
                        (255, 255, 0),  # Yellow border for visibility
                        2,
                    )
                    
                    # Draw bubble value (A, B, C, D) from Bubble object
                    cv2.putText(frame, str(pt.field_value), 
                               (int(x + scaled_box_w / 3), int(y + scaled_box_h * 2/3)), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0, 0, 0), 1)
                
    def draw_instructions(self, frame):
        """Draw instructions on the overlay - centered for better UX"""
        instructions = [
            "Align OMR sheet within the green frame",
            "Center the sheet using the crosshair",
            "Press SPACE to capture",
            "Press 'q' to quit"
        ]
        
        # Draw semi-transparent background for text (top-left)
        text_bg_height = len(instructions) * 25 + 15
        cv2.rectangle(frame, (10, 10), (450, text_bg_height), (0, 0, 0), -1)
        cv2.rectangle(frame, (10, 10), (450, text_bg_height), (0, 255, 0), 2)
        
        # Draw text
        for i, instruction in enumerate(instructions):
            color = (0, 255, 0) if "crosshair" in instruction else (255, 255, 255)
            cv2.putText(frame, instruction, (20, 30 + i * 25), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Add status indicator at bottom
        status_text = "Camera Ready - Align & Capture"
        text_size = cv2.getTextSize(status_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)[0]
        status_x = (frame.shape[1] - text_size[0]) // 2
        status_y = frame.shape[0] - 20
        
        cv2.rectangle(frame, (status_x - 10, status_y - 25), 
                     (status_x + text_size[0] + 10, status_y + 5), (0, 0, 0), -1)
        cv2.rectangle(frame, (status_x - 10, status_y - 25), 
                     (status_x + text_size[0] + 10, status_y + 5), (0, 255, 0), 2)
        cv2.putText(frame, status_text, (status_x, status_y), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                       
    def capture_image(self, frame):
        """Capture and save the image within the overlay frame"""
        # Crop to overlay area
        captured = frame[self.overlay_y:self.overlay_y + self.overlay_height,
                        self.overlay_x:self.overlay_x + self.overlay_width]
        
        # Resize to template dimensions for consistency
        resized = cv2.resize(captured, (self.page_width, self.page_height))
        
        return resized
        
    def run_camera(self):
        """Main camera loop"""
        # Try different camera indices (prioritize working cameras from diagnostic)
        cap = None
        # Try cameras in order of preference: 3, 1, 0, 2, 4, 5 (prioritize working camera 3)
        camera_order = [3, 1, 0, 2, 4, 5]
        for camera_idx in camera_order:
            print(f"Trying camera {camera_idx}...")
            
            # Try default backend first (good for Camo)
            cap = cv2.VideoCapture(camera_idx)
            if not cap.isOpened():
                # Fallback to DirectShow backend (good for Iriun)
                cap = cv2.VideoCapture(camera_idx, cv2.CAP_DSHOW)
            
            if cap.isOpened():
                # Set Camo-friendly settings (higher resolution)
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                
                # Test if we can actually read a frame
                ret, test_frame = cap.read()
                if ret and test_frame is not None:
                    # Check if frame is not all black (common Iriun issue)
                    if test_frame.mean() > 5:
                        print(f"[OK] Camera {camera_idx} working! Resolution: {test_frame.shape}")
                        break
                    else:
                        print(f"[X] Camera {camera_idx}: Black frame (Camo/Iriun issue?)")
                        cap.release()
                        cap = None
                else:
                    print(f"[X] Camera {camera_idx}: Opened but cannot read frames")
                    cap.release()
                    cap = None
            else:
                print(f"[X] Camera {camera_idx}: Cannot open")
                cap.release()
                cap = None
        
        if cap is None or not cap.isOpened():
            print("Error: Could not open any camera")
            print("Common causes:")
            print("- Camera is being used by another application")
            print("- Camera drivers not installed")
            print("- Camera permissions denied")
            print("Starting demo mode...")
            self.run_demo_mode()
            return
            
        # Set camera resolution
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.camera_width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.camera_height)
        
        # Get actual camera resolution (might be different from requested)
        actual_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Update overlay setup with actual camera resolution
        self.setup_overlay(actual_width, actual_height)
        print(f"[OK] Camera resolution: {actual_width}x{actual_height}")
        print(f"[OK] Overlay centered at: ({self.overlay_x}, {self.overlay_y})")
        
        print("Camera overlay started!")
        print("Instructions:")
        print("- Align your OMR sheet within the green frame")
        print("- Press SPACE to capture")
        print("- Press 'q' to quit")
        print("- Press 'd' for demo mode")
        
        capture_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Could not read frame")
                print("Switching to demo mode...")
                cap.release()
                cv2.destroyAllWindows()
                self.run_demo_mode()
                return
                
            # Draw overlay
            frame_with_overlay = self.draw_overlay(frame)
            
            # Show frame
            cv2.imshow('OMR Camera Overlay', frame_with_overlay)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                print("Quitting...")
                break
            elif key == ord('d'):
                print("Switching to demo mode...")
                cap.release()
                cv2.destroyAllWindows()
                self.run_demo_mode()
                return
            elif key == ord(' '):  # Space bar to capture
                # Capture image
                captured_image = self.capture_image(frame)
                
                # Save captured image
                capture_count += 1
                filename = f"captured_omr_{capture_count:03d}.jpg"
                filepath = Path("inputs/dxuian") / filename
                cv2.imwrite(str(filepath), captured_image)
                
                print(f"Captured and saved: {filepath}")
                print("Image ready for OMR processing!")
                
                # Show captured image briefly
                cv2.imshow('Captured Image', captured_image)
                cv2.waitKey(2000)  # Show for 2 seconds
                cv2.destroyWindow('Captured Image')
                
                return str(filepath)  # Return path for integration
                
        # Cleanup
        cap.release()
        cv2.destroyAllWindows()
        print("Camera overlay stopped.")
        
    def run_demo_mode(self):
        """Run demo mode without camera"""
        print("Demo mode started!")
        print("Instructions:")
        print("- This shows the overlay layout without camera")
        print("- Press 'q' to quit")
        print("- Press 'c' to try camera again")
        
        # Create a demo frame (gradient background)
        demo_frame = np.zeros((self.camera_height, self.camera_width, 3), dtype=np.uint8)
        
        # Create --setLayout-like dark background (not colorful gradient)
        for y in range(self.camera_height):
            for x in range(self.camera_width):
                # Create a dark gradient similar to --setLayout background
                intensity = int(20 + (y / self.camera_height) * 40)  # Dark to slightly lighter
                demo_frame[y, x] = [intensity, intensity, intensity]  # Grayscale
        
        # Add demo text
        cv2.putText(demo_frame, "Camera Overlay Demo Mode", 
                   (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.putText(demo_frame, "Press 'c' to try camera, 'q' to quit", 
                   (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(demo_frame, "Showing EXACT --setLayout bubble positions", 
                   (50, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        while True:
            # Draw overlay on demo frame
            frame_with_overlay = self.draw_overlay(demo_frame.copy())
            
            # Show frame
            cv2.imshow('OMR Camera Overlay - Demo Mode', frame_with_overlay)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                print("Quitting demo mode...")
                break
            elif key == ord('c'):
                print("Trying camera again...")
                cv2.destroyAllWindows()
                self.run_camera()
                return
                
        cv2.destroyAllWindows()
        print("Demo mode stopped.")
    
    def capture_and_save(self, save_path=None):
        """
        Capture image with overlay and save to specified path
        
        Args:
            save_path (str): Path to save captured image
            
        Returns:
            str: Path to saved image, or None if not captured
        """
        # Try to start camera
        cap = None
        # Try cameras in order of preference: 3, 1, 0, 2, 4, 5 (prioritize working camera 3)
        camera_order = [3, 1, 0, 2, 4, 5]
        for camera_idx in camera_order:
            print(f"Trying camera {camera_idx}...")
            
            # Try default backend first (good for Camo)
            cap = cv2.VideoCapture(camera_idx)
            if not cap.isOpened():
                # Fallback to DirectShow backend (good for Iriun)
                cap = cv2.VideoCapture(camera_idx, cv2.CAP_DSHOW)
            
            if cap.isOpened():
                # Set Camo-friendly settings (higher resolution)
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                
                ret, test_frame = cap.read()
                if ret and test_frame is not None:
                    # Check if frame is not all black (common Iriun issue)
                    if test_frame.mean() > 5:
                        print(f"[OK] Camera {camera_idx} working! Resolution: {test_frame.shape}")
                        break
                    else:
                        print(f"[X] Camera {camera_idx}: Black frame (Camo/Iriun issue?)")
                        cap.release()
                        cap = None
                else:
                    print(f"[X] Camera {camera_idx}: Opened but cannot read frames")
                    cap.release()
                    cap = None
            else:
                print(f"[X] Camera {camera_idx}: Cannot open")
                cap.release()
                cap = None
        
        if cap is None or not cap.isOpened():
            print("Error: Could not open camera")
            return None
        
        # Set camera resolution
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.camera_width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.camera_height)
        
        # Get actual camera resolution (might be different from requested)
        actual_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Update overlay setup with actual camera resolution
        self.setup_overlay(actual_width, actual_height)
        print(f"[OK] Camera resolution: {actual_width}x{actual_height}")
        print(f"[OK] Overlay centered at: ({self.overlay_x}, {self.overlay_y})")
        
        print("Camera overlay ready!")
        print("Press SPACE to capture, 'q' to quit")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Could not read frame")
                break
                
            # Draw overlay
            frame_with_overlay = self.draw_overlay(frame)
            
            # Show frame
            cv2.imshow('OMR Camera Overlay', frame_with_overlay)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                print("Cancelled capture")
                break
            elif key == ord(' '):  # Space bar to capture
                # Capture image
                captured_image = self.capture_image(frame)
                
                # Save captured image
                if save_path is None:
                    save_path = "inputs/dxuian/captured_omr.jpg"
                
                cv2.imwrite(save_path, captured_image)
                print(f"Captured and saved: {save_path}")
                
                # Show captured image briefly
                cv2.imshow('Captured Image', captured_image)
                cv2.waitKey(2000)  # Show for 2 seconds
                cv2.destroyWindow('Captured Image')
                
                # Cleanup and return
                cap.release()
                cv2.destroyAllWindows()
                return save_path
        
        # Cleanup
        cap.release()
        cv2.destroyAllWindows()
        return None

def main():
    """Main function"""
    print("=== OMR Camera Overlay ===")
    print("This tool helps you capture OMR sheets with consistent positioning")
    print()
    
    # Check if template exists
    template_path = "inputs/dxuian/template.json"
    if not Path(template_path).exists():
        print(f"Error: Template file not found at {template_path}")
        print("Please ensure the template.json file exists in the inputs/dxuian/ directory")
        return
    
    # Create overlay
    overlay = OMRCameraOverlay(template_path)
    
    # Check command line arguments for demo mode
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--demo":
        print("Starting in demo mode...")
        overlay.run_demo_mode()
    else:
        overlay.run_camera()

if __name__ == "__main__":
    main()
