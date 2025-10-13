#!/usr/bin/env python3
"""
Fix Blue Camo Camera Feed
"""

import cv2
import numpy as np

def fix_blue_camo():
    """Fix blue camera feed issue with Camo"""
    print("=== Fixing Blue Camo Camera Feed ===")
    
    # Try different approaches to fix blue feed
    approaches = [
        ("Default", lambda: cv2.VideoCapture(3)),
        ("DirectShow", lambda: cv2.VideoCapture(3, cv2.CAP_DSHOW)),
        ("MSMF", lambda: cv2.VideoCapture(3, cv2.CAP_MSMF)),
        ("Any", lambda: cv2.VideoCapture(3, cv2.CAP_ANY)),
    ]
    
    for name, create_cap in approaches:
        print(f"\nTrying {name} backend...")
        
        cap = create_cap()
        if not cap.isOpened():
            print(f"✗ {name}: Cannot open")
            continue
        
        print(f"✓ {name}: Opened")
        
        # Try different resolutions
        resolutions = [
            (640, 480),
            (1280, 720),
            (1920, 1080),
            (800, 600),
        ]
        
        for width, height in resolutions:
            print(f"  Testing {width}x{height}...")
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
            
            # Test a few frames
            for i in range(5):
                ret, frame = cap.read()
                if ret and frame is not None:
                    mean_val = frame.mean()
                    print(f"    Frame {i+1}: Mean = {mean_val:.2f}")
                    
                    # Check if it's not blue (blue would have high blue channel)
                    if len(frame.shape) == 3:
                        b, g, r = cv2.split(frame)
                        blue_ratio = b.mean() / (g.mean() + r.mean() + 1)
                        print(f"    Blue ratio: {blue_ratio:.2f}")
                        
                        if blue_ratio < 1.5:  # Not too blue
                            print(f"    ✓ Looks like real video!")
                            
                            # Show the frame
                            cv2.imshow(f'Camo Fix - {name} {width}x{height}', frame)
                            print("    Press any key to continue...")
                            cv2.waitKey(0)
                            cv2.destroyAllWindows()
                            
                            cap.release()
                            return True
                        else:
                            print(f"    ✗ Still too blue")
                    else:
                        print(f"    ✗ Grayscale frame")
                else:
                    print(f"    ✗ Cannot read frame {i+1}")
        
        cap.release()
    
    print("\n✗ Could not fix blue feed")
    return False

def test_camo_settings():
    """Test different Camo app settings"""
    print("\n=== Camo App Settings to Try ===")
    print()
    print("In your Camo app, try these settings:")
    print()
    print("1. RESOLUTION:")
    print("   - Try 640x480 (VGA)")
    print("   - Try 1280x720 (HD)")
    print("   - Try 800x600")
    print()
    print("2. QUALITY:")
    print("   - Try 'High' quality")
    print("   - Try 'Medium' quality")
    print("   - Try 'Low' quality")
    print()
    print("3. CAMERA:")
    print("   - Switch between front/back camera")
    print("   - Try different camera modes")
    print()
    print("4. CONNECTION:")
    print("   - Disconnect and reconnect")
    print("   - Restart Camo app")
    print("   - Check WiFi connection")
    print()
    print("5. ALTERNATIVE:")
    print("   - Use demo mode: python camera_overlay.py --demo")
    print("   - Take photo with phone and process it")

def main():
    """Main function"""
    print("Blue Camo Camera Fix")
    print("This will try to fix the blue camera feed issue")
    print()
    
    if fix_blue_camo():
        print("\n✓ Camera feed fixed!")
        print("You can now use: python camera_overlay.py")
    else:
        print("\n✗ Could not fix blue feed automatically")
        test_camo_settings()

if __name__ == "__main__":
    main()


