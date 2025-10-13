#!/usr/bin/env python3
"""
Iriun Camera Fix - Optimized for Iriun Webcam app
"""

import cv2
import numpy as np

def test_iriun_camera():
    """Test Iriun Webcam specifically"""
    print("=== Iriun Webcam Test ===")
    print("Testing camera with Iriun-specific settings")
    print()
    
    # Iriun typically uses DirectShow backend
    print("Trying DirectShow backend (recommended for Iriun)...")
    
    try:
        # Use DirectShow backend specifically
        cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
        
        if not cap.isOpened():
            print("✗ Cannot open camera with DirectShow")
            print("Trying default backend...")
            cap = cv2.VideoCapture(1)
            
            if not cap.isOpened():
                print("✗ Cannot open camera with default backend")
                return False
        
        print("✓ Camera opened successfully")
        
        # Set Iriun-friendly resolution (usually 640x480 works best)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        # Set buffer size to reduce latency
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
        print("Testing camera feed...")
        print("Press 'q' to quit")
        
        frame_count = 0
        while True:
            ret, frame = cap.read()
            frame_count += 1
            
            if not ret:
                print(f"✗ Cannot read frame {frame_count}")
                break
            
            # Check if frame is valid (not all black)
            if frame.mean() > 5:  # Not completely black
                print(f"✓ Frame {frame_count}: Valid (mean: {frame.mean():.2f})")
            else:
                print(f"⚠ Frame {frame_count}: Black (mean: {frame.mean():.2f})")
            
            # Show the frame
            cv2.imshow('Iriun Camera Test', frame)
            
            # Handle key press
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_iriun_with_overlay():
    """Test camera overlay with Iriun"""
    print("\n=== Testing Camera Overlay with Iriun ===")
    
    try:
        # Import camera overlay
        from camera_overlay import OMRCameraOverlay
        
        # Create overlay
        overlay = OMRCameraOverlay("inputs/dxuian/template.json")
        
        # Try to capture with Iriun
        print("Testing camera overlay with Iriun...")
        captured_path = overlay.capture_and_save("test_iriun_capture.jpg")
        
        if captured_path:
            print(f"✓ Successfully captured: {captured_path}")
            return True
        else:
            print("✗ Could not capture with Iriun")
            return False
            
    except Exception as e:
        print(f"✗ Error testing overlay: {e}")
        return False

def iriun_troubleshooting():
    """Iriun-specific troubleshooting tips"""
    print("\n=== Iriun Troubleshooting ===")
    print()
    print("If Iriun is not working properly:")
    print()
    print("1. CHECK IRUIN APP:")
    print("   - Make sure Iriun app is running on your phone")
    print("   - Check that 'Start Server' is pressed")
    print("   - Verify phone and laptop are on same WiFi")
    print()
    print("2. CHECK IRUIN SETTINGS:")
    print("   - In Iriun app: Settings → Resolution → Try 640x480")
    print("   - In Iriun app: Settings → Quality → Try 'High' or 'Medium'")
    print("   - In Iriun app: Settings → FPS → Try 30 FPS")
    print()
    print("3. CHECK LAPTOP SETTINGS:")
    print("   - Windows Settings → Privacy → Camera → Allow apps to access")
    print("   - Close any other camera applications")
    print("   - Try restarting Iriun app")
    print()
    print("4. ALTERNATIVE SOLUTIONS:")
    print("   - Use demo mode: python camera_overlay.py --demo")
    print("   - Take photo with phone and process it")
    print("   - Try different camera index (0, 2, 3)")

def main():
    """Main function"""
    print("Iriun Webcam Fix Tool")
    print("This will help get your Iriun-connected phone camera working")
    print()
    
    # Test raw camera feed
    if test_iriun_camera():
        print("\n✓ Iriun camera feed is working!")
        
        # Test with overlay
        if test_iriun_with_overlay():
            print("✓ Camera overlay works with Iriun!")
            print("\nYou can now use:")
            print("  python camera_overlay.py")
            print("  python simple_omr_workflow.py")
        else:
            print("✗ Camera overlay has issues with Iriun")
            iriun_troubleshooting()
    else:
        print("\n✗ Iriun camera feed is not working")
        iriun_troubleshooting()

if __name__ == "__main__":
    main()
