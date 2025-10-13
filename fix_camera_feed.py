#!/usr/bin/env python3
"""
Fix Camera Feed - Try different methods to get camera working
"""

import cv2
import numpy as np

def test_different_camera_settings():
    """Test different camera settings and backends"""
    print("=== Camera Feed Fix ===")
    print("Trying different methods to get camera feed working")
    print()
    
    # Method 1: Try different backends
    backends = [
        (cv2.CAP_DSHOW, "DirectShow"),
        (cv2.CAP_MSMF, "Media Foundation"), 
        (cv2.CAP_ANY, "Any Available"),
    ]
    
    for backend, name in backends:
        print(f"\n=== Trying {name} Backend ===")
        try:
            cap = cv2.VideoCapture(1, backend)
            if cap.isOpened():
                print(f"✓ {name}: Camera opened")
                
                # Try different resolutions
                resolutions = [(640, 480), (320, 240), (1280, 720)]
                for width, height in resolutions:
                    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
                    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
                    
                    ret, frame = cap.read()
                    if ret and frame is not None:
                        # Check if frame is not all black
                        if frame.mean() > 10:  # Not completely black
                            print(f"✓ {name}: Working at {width}x{height}")
                            print(f"  Frame mean: {frame.mean():.2f}")
                            
                            # Show the working feed
                            print("  Press 'q' to quit, 's' to save this setting")
                            while True:
                                ret, frame = cap.read()
                                if ret:
                                    cv2.imshow(f'{name} Camera Feed', frame)
                                
                                key = cv2.waitKey(1) & 0xFF
                                if key == ord('q'):
                                    cv2.destroyAllWindows()
                                    cap.release()
                                    return f"{name}_{width}_{height}"
                                elif key == ord('s'):
                                    cv2.destroyAllWindows()
                                    cap.release()
                                    return f"{name}_{width}_{height}"
                        else:
                            print(f"✗ {name}: Black frame at {width}x{height}")
                    else:
                        print(f"✗ {name}: Cannot read frame at {width}x{height}")
                
                cap.release()
            else:
                print(f"✗ {name}: Cannot open camera")
        except Exception as e:
            print(f"✗ {name}: Error - {e}")
    
    return None

def test_camera_properties():
    """Test camera properties to understand the issue"""
    print("\n=== Camera Properties ===")
    
    cap = cv2.VideoCapture(1)
    if cap.isOpened():
        print("Camera properties:")
        print(f"  Width: {cap.get(cv2.CAP_PROP_FRAME_WIDTH)}")
        print(f"  Height: {cap.get(cv2.CAP_PROP_FRAME_HEIGHT)}")
        print(f"  FPS: {cap.get(cv2.CAP_PROP_FPS)}")
        print(f"  Brightness: {cap.get(cv2.CAP_PROP_BRIGHTNESS)}")
        print(f"  Contrast: {cap.get(cv2.CAP_PROP_CONTRAST)}")
        print(f"  Backend: {cap.get(cv2.CAP_PROP_BACKEND)}")
        
        # Try to set some properties
        cap.set(cv2.CAP_PROP_BRIGHTNESS, 0.5)
        cap.set(cv2.CAP_PROP_CONTRAST, 0.5)
        
        ret, frame = cap.read()
        if ret:
            print(f"  Frame shape: {frame.shape}")
            print(f"  Frame mean: {frame.mean():.2f}")
            print(f"  Frame min/max: {frame.min()}/{frame.max()}")
        
        cap.release()

def main():
    """Main function"""
    print("Camera Feed Fix Tool")
    print("This will help identify why your camera shows black screen")
    print()
    
    # Test camera properties first
    test_camera_properties()
    
    # Try different settings
    working_setting = test_different_camera_settings()
    
    if working_setting:
        print(f"\n✓ Found working camera setting: {working_setting}")
        print("The camera overlay can be updated to use this setting.")
    else:
        print("\n✗ Could not get camera feed working")
        print("\nPossible solutions:")
        print("1. Camera is being used by another application")
        print("2. Camera drivers need updating")
        print("3. Try using a different camera (USB camera)")
        print("4. Use demo mode instead: python camera_overlay.py --demo")

if __name__ == "__main__":
    main()
