#!/usr/bin/env python3
"""
Integrated OMR Workflow - Camera Overlay + Processing
Combines camera overlay capture with OMRChecker processing workflow
"""

import cv2
import numpy as np
from pathlib import Path
import json
from datetime import datetime
import os

# Import OMRChecker core classes
from src.template import Template
from src.defaults.config import CONFIG_DEFAULTS
from src.entry import process_dir
from src.utils.file import Paths, setup_dirs_for_paths, setup_outputs_for_template
from src.utils.parsing import get_concatenated_response

# Import camera overlay
from camera_overlay import OMRCameraOverlay

class IntegratedOMRWorkflow:
    """
    Complete OMR workflow: Camera Overlay → Capture → Process → Results
    """
    
    def __init__(self, template_path="inputs/dxuian/template.json", 
                 output_dir="outputs", evaluation_path=None):
        """Initialize integrated workflow"""
        self.template_path = Path(template_path)
        self.output_dir = Path(output_dir)
        self.evaluation_path = Path(evaluation_path) if evaluation_path else None
        
        # Load template (same as OMRChecker)
        self.template = Template(self.template_path, CONFIG_DEFAULTS)
        self.tuning_config = CONFIG_DEFAULTS
        
        # Load evaluation config if available
        self.evaluation_config = None
        if self.evaluation_path and self.evaluation_path.exists():
            from src.evaluation import EvaluationConfig
            self.evaluation_config = EvaluationConfig(
                self.template_path.parent,
                self.evaluation_path,
                self.template,
                self.tuning_config
            )
        
        # Initialize camera overlay
        self.camera_overlay = OMRCameraOverlay(template_path)
        
        # Setup output directories
        self.setup_output_dirs()
        
        print(f"✓ Integrated OMR Workflow initialized")
        print(f"✓ Template: {self.template_path}")
        print(f"✓ Output: {self.output_dir}")
        if self.evaluation_config:
            print(f"✓ Evaluation: {self.evaluation_path}")
    
    def setup_output_dirs(self):
        """Setup output directories like OMRChecker"""
        self.paths = Paths(self.output_dir)
        self.outputs_namespace = setup_outputs_for_template(self.paths, self.template)
        setup_dirs_for_paths(self.paths)
    
    def capture_with_overlay(self, save_path=None):
        """
        Step 1: Use camera overlay to capture perfectly aligned OMR sheet
        
        Returns:
            str: Path to captured image
        """
        print("\n=== Step 1: Camera Overlay Capture ===")
        print("Instructions:")
        print("- Align your OMR sheet within the green frame")
        print("- The overlay shows EXACT bubble positions")
        print("- Press SPACE to capture")
        print("- Press 'q' to quit")
        
        # Use camera overlay to capture image
        if save_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            save_path = self.output_dir / f"captured_omr_{timestamp}.jpg"
        
        captured_path = self.camera_overlay.capture_and_save(str(save_path))
        
        if captured_path:
            print(f"✓ Image captured: {captured_path}")
            return captured_path
        else:
            print("✗ No image captured")
            return None
    
    def process_captured_image(self, image_path):
        """
        Step 2: Process captured image using OMRChecker logic
        
        Returns:
            dict: OMR response data
            float: Score (if evaluation available)
        """
        print(f"\n=== Step 2: Processing {Path(image_path).name} ===")
        
        # Load image
        in_omr = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
        if in_omr is None:
            print(f"✗ Could not load image: {image_path}")
            return None, 0
        
        print(f"✓ Image loaded: {in_omr.shape}")
        
        # Reset save images
        self.template.image_instance_ops.reset_all_save_img()
        self.template.image_instance_ops.append_save_img(1, in_omr)
        
        # Apply preprocessors (resize, crop, align, etc.)
        in_omr = self.template.image_instance_ops.apply_preprocessors(
            Path(image_path), in_omr, self.template
        )
        
        if in_omr is None:
            print("✗ Preprocessing failed")
            return None, 0
        
        # Read OMR response using exact same logic as main.py
        file_id = Path(image_path).name
        save_dir = self.outputs_namespace.paths.save_marked_dir
        
        response_dict, final_marked, multi_marked, _ = \
            self.template.image_instance_ops.read_omr_response(
                self.template, image=in_omr, name=file_id, save_dir=save_dir
            )
        
        # Concatenate response
        omr_response = get_concatenated_response(response_dict, self.template)
        
        print(f"✓ OMR Response: {omr_response}")
        
        # Evaluate if evaluation config available
        score = 0
        if self.evaluation_config:
            from src.evaluation import evaluate_concatenated_response
            score = evaluate_concatenated_response(
                omr_response, self.evaluation_config, Path(image_path), 
                self.outputs_namespace.paths.evaluation_dir
            )
            print(f"✓ Score: {round(score, 2)}")
        
        # Save results
        self.save_results(Path(image_path).name, image_path, omr_response, score, 
                         final_marked, multi_marked)
        
        return omr_response, score
    
    def save_results(self, file_name, file_path, omr_response, score, 
                    final_marked, multi_marked):
        """Save results to CSV and directories"""
        # Prepare response array
        resp_array = []
        for k in self.template.output_columns:
            resp_array.append(omr_response[k])
        
        # Save to results CSV
        results_line = [file_name, file_path, 
                       self.outputs_namespace.paths.save_marked_dir / file_name, 
                       score] + resp_array
        
        import pandas as pd
        from csv import QUOTE_NONNUMERIC
        pd.DataFrame(results_line, dtype=str).T.to_csv(
            self.outputs_namespace.files_obj["Results"],
            mode="a",
            quoting=QUOTE_NONNUMERIC,
            header=False,
            index=False,
        )
        
        print(f"✓ Results saved to: {self.outputs_namespace.files_obj['Results']}")
    
    def run_complete_workflow(self):
        """Run complete workflow: Capture → Process → Results"""
        print("=== Integrated OMR Workflow ===")
        print("This workflow combines camera overlay with OMRChecker processing")
        print()
        
        while True:
            print("\nOptions:")
            print("1. Capture and process OMR sheet")
            print("2. Process existing image")
            print("3. Demo mode (no camera)")
            print("4. Quit")
            
            choice = input("\nEnter choice (1-4): ").strip()
            
            if choice == "1":
                # Capture with overlay
                captured_path = self.capture_with_overlay()
                if captured_path:
                    # Process captured image
                    omr_response, score = self.process_captured_image(captured_path)
                    if omr_response:
                        print(f"\n✓ Complete! Check results in: {self.output_dir}")
            
            elif choice == "2":
                # Process existing image
                image_path = input("Enter path to image: ").strip()
                if Path(image_path).exists():
                    omr_response, score = self.process_captured_image(image_path)
                    if omr_response:
                        print(f"\n✓ Complete! Check results in: {self.output_dir}")
                else:
                    print(f"✗ File not found: {image_path}")
            
            elif choice == "3":
                # Demo mode
                print("\n=== Demo Mode ===")
                self.camera_overlay.run_demo_mode()
            
            elif choice == "4":
                print("Goodbye!")
                break
            
            else:
                print("Invalid choice. Please enter 1-4.")

def main():
    """Main function"""
    print("Integrated OMR Workflow")
    print("Camera Overlay + OMRChecker Processing")
    print()
    
    # Check if template exists
    template_path = "inputs/dxuian/template.json"
    if not Path(template_path).exists():
        print(f"Error: Template not found at {template_path}")
        print("Please ensure template.json exists in inputs/dxuian/")
        return
    
    # Check for evaluation file
    evaluation_path = "inputs/dxuian/evaluation.json"
    if not Path(evaluation_path).exists():
        evaluation_path = None
        print("Note: No evaluation.json found - will process without scoring")
    
    # Initialize and run workflow
    workflow = IntegratedOMRWorkflow(
        template_path=template_path,
        output_dir="outputs",
        evaluation_path=evaluation_path
    )
    
    workflow.run_complete_workflow()

if __name__ == "__main__":
    main()
