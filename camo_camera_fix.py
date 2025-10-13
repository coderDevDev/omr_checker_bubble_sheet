#!/usr/bin/env python3
"""
Camo Camera Fix - Optimized for Camo app
"""

import cv2
import numpy as np

def test_camo_camera():
    """Test Camo Camera specifically"""
    print("=== Camo Camera Test ===")
    print("Testing camera with Camo-specific settings")
    print()
    
    # Camo typically works well with default OpenCV settings
    print("Testing Camo Camera...")
    
    try:
        # Try different camera indices for Camo
        camera_indices = [0, 1, 2, 3]
        
        for camera_idx in camera_indices:
            print(f"\nTrying camera {camera_idx}...")
            
            # Camo usually works with default backend
            cap = cv2.VideoCapture(camera_idx)
            
            if cap.isOpened():
                print(f"✓ Camera {camera_idx}: Opened successfully")
                
                # Set Camo-friendly resolution
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                
                # Test reading frames
                frame_count = 0
                valid_frames = 0
                
                for i in range(10):  # Test 10 frames
                    ret, frame = cap.read()
                    frame_count += 1
                    
                    if ret and frame is not None:
                        # Check if frame is valid (not all black)
                        if frame.mean() > 10:  # Not completely black
                            valid_frames += 1
                            print(f"✓ Frame {frame_count}: Valid (mean: {frame.mean():.2f})")
                            
                            # Show the frame
                            cv2.imshow('Camo Camera Test', frame)
                            
                            # Handle key press
                            key = cv2.waitKey(1) & 0xFF
                            if key == ord('q'):
                                cv2.destroyAllWindows()
                                cap.release()
                                return camera_idx
                        else:
                            print(f"⚠ Frame {frame_count}: Black (mean: {frame.mean():.2f})")
                    else:
                        print(f"✗ Frame {frame_count}: Cannot read")
                
                print(f"Valid frames: {valid_frames}/10")
                
                if valid_frames >= 5:  # If more than half frames are valid
                    print(f"✓ Camera {camera_idx} working well with Camo!")
                    cv2.destroyAllWindows()
                    cap.release()
                    return camera_idx
                else:
                    print(f"✗ Camera {camera_idx}: Too many black frames")
                    cv2.destroyAllWindows()
                    cap.release()
            else:
                print(f"✗ Camera {camera_idx}: Cannot open")
        
        return None
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_camo_with_overlay():
    """Test camera overlay with Camo"""
    print("\n=== Testing Camera Overlay with Camo ===")
    
    try:
        # Import camera overlay
        from camera_overlay import OMRCameraOverlay
        
        # Create overlay
        overlay = OMRCameraOverlay("inputs/dxuian/template.json")
        
        # Try to capture with Camo
        print("Testing camera overlay with Camo...")
        captured_path = overlay.capture_and_save("test_camo_capture.jpg")
        
        if captured_path:
            print(f"✓ Successfully captured: {captured_path}")
            return True
        else:
            print("✗ Could not capture with Camo")
            return False
            
    except Exception as e:
        print(f"✗ Error testing overlay: {e}")
        return False

def camo_troubleshooting():
    """Camo-specific troubleshooting tips"""
    print("\n=== Camo Troubleshooting ===")
    print()
    print("If Camo is not working properly:")
    print()
    print("1. CHECK CAMO APP:")
    print("   - Make sure Camo app is running on your phone")
    print("   - Check that camera is connected (green indicator)")
    print("   - Verify phone and laptop are on same WiFi")
    print("   - Try disconnecting and reconnecting")
    print()
    print("2. CHECK CAMO SETTINGS:")
    print("   - In Camo app: Try different resolution (1080p, 720p)")
    print("   - In Camo app: Check if 'HD Mode' is enabled")
    print("   - In Camo app: Try different quality settings")
    print()
    print("3. CHECK LAPTOP SETTINGS:")
    print("   - Windows Settings → Privacy → Camera → Allow apps to access")
    print("   - Close any other camera applications")
    print("   - Try restarting Camo app")
    print()
    print("4. CAMO-SPECIFIC ISSUES:")
    print("   - Camo sometimes shows as camera 0, 1, or 2")
    print("   - Try switching between front/back camera in Camo app")
    print("   - Restart Camo connection")
    print()
    print("5. ALTERNATIVE SOLUTIONS:")
    print("   - Use demo mode: python camera_overlay.py --demo")
    print("   - Take photo with phone and process it")
    print("   - Try different camera index")

def test_camo_resolution():
    """Test different resolutions for Camo"""
    print("\n=== Testing Camo Resolutions ===")
    
    resolutions = [
        (1280, 720),   # HD
        (1920, 1080),  # Full HD
        (640, 480),    # VGA
        (1280, 960),   # 4:3 HD
    ]
    
    for width, height in resolutions:
        print(f"\nTesting {width}x{height}...")
        
        try:
            cap = cv2.VideoCapture(1)  # Try camera 1 first
            if cap.isOpened():
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
                
                ret, frame = cap.read()
                if ret and frame is not None and frame.mean() > 10:
                    print(f"✓ {width}x{height}: Working")
                    cap.release()
                    return (width, height)
                else:
                    print(f"✗ {width}x{height}: Not working")
                cap.release()
        except:
            print(f"✗ {width}x{height}: Error")
    
    return None

def main():
    """Main function"""
    print("Camo Camera Fix Tool")
    print("This will help get your Camo-connected phone camera working")
    print()
    
    # Test raw camera feed
    working_camera = test_camo_camera()
    
    if working_camera is not None:
        print(f"\n✓ Camo camera working on index {working_camera}!")
        
        # Test resolution
        best_resolution = test_camo_resolution()
        if best_resolution:
            print(f"✓ Best resolution: {best_resolution[0]}x{best_resolution[1]}")
        
        # Test with overlay
        if test_camo_with_overlay():
            print("✓ Camera overlay works with Camo!")
            print("\nYou can now use:")
            print("  python camera_overlay.py")
            print("  python simple_omr_workflow.py")
        else:
            print("✗ Camera overlay has issues with Camo")
            camo_troubleshooting()
    else:
        print("\n✗ Camo camera feed is not working")
        camo_troubleshooting()

if __name__ == "__main__":
    main()
