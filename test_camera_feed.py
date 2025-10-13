#!/usr/bin/env python3
"""
Simple camera feed test - Just shows the raw camera feed
"""

import cv2

def test_camera_feed():
    """Test raw camera feed display"""
    print("=== Camera Feed Test ===")
    print("This will show the raw camera feed without overlay")
    print("Press 'q' to quit")
    print()
    
    # Try camera 1 (your working camera)
    cap = cv2.VideoCapture(1)
    
    if not cap.isOpened():
        print("Error: Could not open camera 1")
        return
    
    print("✓ Camera 1 opened successfully")
    print("Showing raw camera feed...")
    
    while True:
        ret, frame = cap.read()
        
        if not ret:
            print("Error: Could not read frame")
            break
        
        # Show raw camera feed
        cv2.imshow('Raw Camera Feed', frame)
        
        # Handle key press
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    print("Camera feed test completed")

if __name__ == "__main__":
    test_camera_feed()
