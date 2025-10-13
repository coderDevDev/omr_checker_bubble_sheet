#!/usr/bin/env python3
"""
Camera Diagnostic Tool - Helps identify camera detection issues
"""

import cv2
import sys

def test_camera_detection():
    """Test camera detection and provide detailed diagnostics"""
    print("=== Camera Diagnostic Tool ===")
    print("Testing camera detection and providing troubleshooting info")
    print()
    
    # Test multiple camera indices
    print("Testing camera indices 0-5...")
    working_cameras = []
    
    for camera_idx in range(6):
        print(f"\nTesting camera {camera_idx}...")
        
        try:
            cap = cv2.VideoCapture(camera_idx)
            
            if cap.isOpened():
                print(f"  ✓ Camera {camera_idx}: Opened successfully")
                
                # Try to read a frame
                ret, frame = cap.read()
                if ret and frame is not None:
                    print(f"  ✓ Camera {camera_idx}: Can read frames ({frame.shape})")
                    working_cameras.append(camera_idx)
                else:
                    print(f"  ✗ Camera {camera_idx}: Opened but cannot read frames")
                    
                cap.release()
            else:
                print(f"  ✗ Camera {camera_idx}: Cannot open")
                
        except Exception as e:
            print(f"  ✗ Camera {camera_idx}: Error - {e}")
    
    print(f"\n=== Results ===")
    if working_cameras:
        print(f"✓ Working cameras: {working_cameras}")
        print(f"✓ Recommended camera index: {working_cameras[0]}")
    else:
        print("✗ No working cameras found")
        print_camera_troubleshooting()
    
    return working_cameras

def print_camera_troubleshooting():
    """Print detailed troubleshooting information"""
    print("\n=== Camera Troubleshooting ===")
    print()
    print("Common causes and solutions:")
    print()
    print("1. CAMERA IN USE BY ANOTHER APPLICATION:")
    print("   - Close Skype, Teams, Zoom, Discord, etc.")
    print("   - Close any camera apps")
    print("   - Try again")
    print()
    print("2. CAMERA PERMISSIONS:")
    print("   - Windows Settings → Privacy → Camera")
    print("   - Make sure 'Allow apps to access your camera' is ON")
    print("   - Make sure 'Allow desktop apps to access your camera' is ON")
    print()
    print("3. CAMERA DRIVERS:")
    print("   - Device Manager → Cameras")
    print("   - Right-click your camera → Update driver")
    print("   - Restart computer after updating")
    print()
    print("4. CAMERA HARDWARE:")
    print("   - Try unplugging and reconnecting USB camera")
    print("   - Check if camera works in other apps (Camera app, Skype, etc.)")
    print("   - Try a different USB port")
    print()
    print("5. WINDOWS CAMERA SERVICE:")
    print("   - Press Win+R, type 'services.msc'")
    print("   - Find 'Windows Camera Frame Server'")
    print("   - Right-click → Restart")
    print()
    print("6. ANTIVIRUS/SECURITY SOFTWARE:")
    print("   - Temporarily disable antivirus")
    print("   - Check if security software blocks camera access")
    print()

def test_opencv_backends():
    """Test different OpenCV backends"""
    print("\n=== Testing OpenCV Backends ===")
    
    backends = [
        (cv2.CAP_DSHOW, "DirectShow"),
        (cv2.CAP_MSMF, "Media Foundation"),
        (cv2.CAP_ANY, "Any Available"),
    ]
    
    for backend, name in backends:
        print(f"\nTesting {name} backend...")
        try:
            cap = cv2.VideoCapture(0, backend)
            if cap.isOpened():
                ret, frame = cap.read()
                if ret and frame is not None:
                    print(f"  ✓ {name}: Working")
                else:
                    print(f"  ✗ {name}: Opened but no frames")
            else:
                print(f"  ✗ {name}: Cannot open")
            cap.release()
        except Exception as e:
            print(f"  ✗ {name}: Error - {e}")

def suggest_solutions(working_cameras):
    """Suggest solutions based on diagnostic results"""
    print("\n=== Recommended Solutions ===")
    
    if working_cameras:
        print(f"✓ Camera detected! Use camera index {working_cameras[0]}")
        print()
        print("To use with camera overlay:")
        print(f"1. The camera overlay will automatically use camera {working_cameras[0]}")
        print("2. If it still fails, try closing other camera applications")
        print("3. Restart the camera overlay application")
        
    else:
        print("✗ No cameras detected")
        print()
        print("Try these solutions in order:")
        print("1. Close all camera applications (Skype, Teams, etc.)")
        print("2. Check camera permissions in Windows Settings")
        print("3. Update camera drivers")
        print("4. Restart computer")
        print("5. Use demo mode instead: python camera_overlay.py --demo")

def main():
    """Main diagnostic function"""
    print("Camera Diagnostic Tool")
    print("This will help identify why your camera isn't working")
    print()
    
    # Test camera detection
    working_cameras = test_camera_detection()
    
    # Test OpenCV backends
    test_opencv_backends()
    
    # Suggest solutions
    suggest_solutions(working_cameras)
    
    print("\n=== Next Steps ===")
    if working_cameras:
        print("✓ Camera detected! Try running the camera overlay:")
        print("  python camera_overlay.py")
        print("  python simple_omr_workflow.py")
    else:
        print("✗ Camera not working. Use demo mode:")
        print("  python camera_overlay.py --demo")
        print("  python simple_omr_workflow.py (choose demo mode)")

if __name__ == "__main__":
    main()
