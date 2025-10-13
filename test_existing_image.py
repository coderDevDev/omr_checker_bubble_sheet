#!/usr/bin/env python3
"""
Test processing existing OMR image with the integrated workflow
"""

import sys
from pathlib import Path

def main():
    """Test processing the existing omrcollegesheet.jpg"""
    print("=== Test Processing Existing Image ===")
    print("This will process the existing omrcollegesheet.jpg using OMRChecker")
    print()
    
    # Check if template and image exist
    template_path = "inputs/dxuian/template.json"
    image_path = "inputs/dxuian/omrcollegesheet.jpg"
    
    if not Path(template_path).exists():
        print(f"Error: Template not found at {template_path}")
        return
    
    if not Path(image_path).exists():
        print(f"Error: Image not found at {image_path}")
        return
    
    print(f"✓ Template: {template_path}")
    print(f"✓ Image: {image_path}")
    print()
    
    print("Step 1: Run OMRChecker on existing image")
    print("This will process omrcollegesheet.jpg using the current workflow")
    
    # Process with OMRChecker
    try:
        import subprocess
        
        # Run OMRChecker on the existing image
        cmd = [sys.executable, "main.py", "-i", "inputs/dxuian", "-o", "outputs"]
        print(f"Running: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✓ Processing completed successfully!")
            print("\nOutput:")
            print(result.stdout)
            
            # Show results location
            print(f"\n✓ Results saved in: outputs/")
            print("Check the following files:")
            print("- outputs/dxuian/Results/ - CSV results")
            print("- outputs/dxuian/CheckedOMRs/ - Visual verification")
            print("- outputs/dxuian/Evaluation/ - Scores (if evaluation.json provided)")
            
            # Show a sample of the results
            results_dir = Path("outputs/dxuian/Results")
            if results_dir.exists():
                csv_files = list(results_dir.glob("*.csv"))
                if csv_files:
                    latest_csv = max(csv_files, key=lambda f: f.stat().st_mtime)
                    print(f"\n📊 Latest results file: {latest_csv}")
                    
                    # Show first few lines
                    with open(latest_csv, 'r') as f:
                        lines = f.readlines()[:5]  # First 5 lines
                        print("\nSample results:")
                        for line in lines:
                            print(f"  {line.strip()}")
            
        else:
            print("✗ Processing failed:")
            print(result.stderr)
            
    except Exception as e:
        print(f"✗ Error during processing: {e}")
    
    print(f"\n✓ Complete! This demonstrates the OMRChecker processing workflow")
    print("Now you can use the camera overlay to capture new images with the same processing!")

if __name__ == "__main__":
    main()
