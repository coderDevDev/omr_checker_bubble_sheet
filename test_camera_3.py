#!/usr/bin/env python3
"""
Test Camera 3 specifically for Camo
"""

import cv2
import numpy as np

def test_camera_3():
    """Test camera 3 specifically"""
    print("=== Testing Camera 3 (Camo) ===")
    
    # Open camera 3
    cap = cv2.VideoCapture(3)
    
    if not cap.isOpened():
        print("✗ Cannot open camera 3")
        return False
    
    print("✓ Camera 3 opened successfully")
    
    # Set resolution to what you reported (480x640)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    # Get actual resolution
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"✓ Resolution: {width}x{height}")
    
    # Test reading frames
    print("\nTesting frame reading...")
    print("Press 'q' to quit, 's' to save a frame")
    
    frame_count = 0
    while True:
        ret, frame = cap.read()
        frame_count += 1
        
        if not ret:
            print(f"✗ Cannot read frame {frame_count}")
            break
        
        # Check if frame is valid
        if frame.mean() > 10:
            print(f"✓ Frame {frame_count}: Valid (mean: {frame.mean():.2f})")
        else:
            print(f"⚠ Frame {frame_count}: Black (mean: {frame.mean():.2f})")
        
        # Show the frame
        cv2.imshow('Camera 3 Test', frame)
        
        # Handle key press
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('s'):
            cv2.imwrite(f'test_frame_{frame_count}.jpg', frame)
            print(f"✓ Saved frame {frame_count}")
    
    cap.release()
    cv2.destroyAllWindows()
    
    if frame_count > 0:
        print(f"\n✓ Camera 3 working! Read {frame_count} frames")
        return True
    else:
        print("\n✗ Camera 3 not working")
        return False

if __name__ == "__main__":
    test_camera_3()
