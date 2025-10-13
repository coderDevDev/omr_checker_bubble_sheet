#!/usr/bin/env python3
"""
Simple OMR Workflow - Camera Overlay → Process → Results
Easy-to-use script that combines camera overlay with OMRChecker processing
"""

import sys
from pathlib import Path

def main():
    """Simple workflow: Capture → Process → Results"""
    print("=== Simple OMR Workflow ===")
    print("1. Camera overlay capture")
    print("2. Process with OMRChecker")
    print("3. Get results")
    print()
    
    # Check if template exists
    template_path = "inputs/dxuian/template.json"
    if not Path(template_path).exists():
        print(f"Error: Template not found at {template_path}")
        print("Please ensure template.json exists in inputs/dxuian/")
        return
    
    print("Step 1: Capture OMR sheet with camera overlay")
    print("This will open the camera overlay with:")
    print("  [OK] Perfect centering in camera view")
    print("  [OK] Crosshair for precise alignment")
    print("  [OK] Transparent bubbles over camera feed")
    print("  [OK] All 4 corner markers for guidance")
    print("  [OK] Exact bubble positions from template.json")
    
    # Import and use camera overlay
    from camera_overlay import OMRCameraOverlay
    
    overlay = OMRCameraOverlay(template_path)
    
    # Try to capture image (with fallback to demo mode)
    print("\nTrying to access camera...")
    print("Note: Camera 3 (Camo) will be prioritized for best results")
    captured_path = overlay.capture_and_save("inputs/dxuian/captured_omr.jpg")
    
    if not captured_path:
        print("\nCamera not available. Options:")
        print("1. Run demo mode to see the overlay layout")
        print("2. Process an existing image file")
        print("3. Exit")
        
        choice = input("\nEnter choice (1-3): ").strip()
        
        if choice == "1":
            print("\nRunning demo mode...")
            overlay.run_demo_mode()
            print("\nDemo mode completed. You can now:")
            print("- Take a photo with your phone using the overlay as a guide")
            print("- Save the photo and process it with option 2")
            return
        elif choice == "2":
            # Process existing image
            image_path = input("Enter path to your OMR image: ").strip()
            if Path(image_path).exists():
                captured_path = image_path
                print(f"Using existing image: {captured_path}")
            else:
                print(f"File not found: {image_path}")
                return
        else:
            print("Exiting.")
            return
    
    print(f"\nStep 2: Processing {Path(captured_path).name}")
    print("This will run OMRChecker on the captured image")
    
    # Process with OMRChecker
    try:
        # Use the existing OMRChecker workflow
        import subprocess
        
        # Run OMRChecker on the captured image
        cmd = [sys.executable, "main.py", "-i", "inputs/dxuian", "-o", "outputs"]
        print(f"Running: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("[OK] Processing completed successfully!")
            print("\nOutput:")
            print(result.stdout)
            
            # Show results location
            print(f"\n[OK] Results saved in: outputs/")
            print("Check the following files:")
            print("- outputs/dxuian/Results/ - CSV results")
            print("- outputs/dxuian/CheckedOMRs/ - Visual verification")
            print("- outputs/dxuian/Evaluation/ - Answer analysis")
            
            # Show specific results file if it exists
            results_dir = Path("outputs/dxuian/Results")
            if results_dir.exists():
                result_files = list(results_dir.glob("*.csv"))
                if result_files:
                    latest_result = max(result_files, key=lambda p: p.stat().st_mtime)
                    print(f"\n📊 Latest results: {latest_result}")
                    
                    # Show a preview of the results
                    try:
                        import pandas as pd
                        df = pd.read_csv(latest_result)
                        print(f"\n📋 Results Preview:")
                        print(f"   Total responses: {len(df)}")
                        if len(df) > 0:
                            print(f"   Sample response: {df.iloc[0].to_dict()}")
                    except:
                        print("   (CSV preview not available)")
            
        else:
            print("[X] Processing failed:")
            print(result.stderr)
            
    except Exception as e:
        print(f"[X] Error during processing: {e}")
    
    print(f"\n🎉 Complete! Your captured image: {captured_path}")
    print("\n📱 Next time, you can:")
    print("   python simple_omr_workflow.py  # Full workflow")
    print("   python camera_overlay.py       # Just camera overlay")
    print("   python main.py -i inputs/dxuian -o outputs  # Just processing")
    print("\n🎯 Centering Features Used:")
    print("   [OK] Perfect centering in camera view")
    print("   [OK] Crosshair for precise alignment")
    print("   [OK] Transparent bubbles over camera feed")
    print("   [OK] All 4 corner markers for guidance")
    print("   [OK] Dynamic resolution adaptation")

if __name__ == "__main__":
    main()
