# 📷 Camera Permission Troubleshooting Guide

## 🔍 Issue: Stuck on "Requesting camera permission..."

### **Quick Fixes**

#### **1. Check Your Platform**

**Are you running on:**
- ✅ **Physical Device with Expo Go** - Camera should work
- ❌ **Web Browser** - Camera won't work (use physical device)
- ❌ **iOS Simulator** - No camera access
- ⚠️ **Android Emulator** - Limited camera support

#### **2. Restart the App**

```bash
# Stop the server (Ctrl+C)
# Clear cache and restart
npx expo start -c
```

#### **3. Check Console Logs**

Look for these messages in your terminal:
```
Requesting camera permissions...
Camera permission status: granted
Media library permission status: granted
Permissions granted!
```

If you see `denied` or `undetermined`, follow the steps below.

---

## 🛠️ **Solutions by Platform**

### **📱 Physical Device (Recommended)**

1. **Install Expo Go** from App Store or Play Store
2. **Run the app:**
   ```bash
   npm start
   ```
3. **Scan QR code** with Expo Go
4. **Allow permissions** when prompted

**If permissions are denied:**

**iOS:**
```
Settings → Expo Go → Camera → Enable
Settings → Expo Go → Photos → Enable
```

**Android:**
```
Settings → Apps → Expo Go → Permissions → Camera → Allow
Settings → Apps → Expo Go → Permissions → Storage → Allow
```

---

### **🌐 Web Browser (Not Supported)**

Camera overlay requires native camera access. **Use a physical device instead.**

---

### **💻 iOS Simulator (Limited Support)**

iOS Simulator doesn't have camera access. **Use a physical iPhone instead.**

---

### **🤖 Android Emulator**

1. **Enable virtual camera:**
   - Open AVD Manager
   - Edit your emulator
   - Advanced Settings → Camera → Webcam0

2. **Grant permissions manually:**
   - Settings → Apps → Expo Go → Permissions
   - Enable Camera and Storage

---

## 🔧 **Code-Level Debugging**

### **Check Permission Status**

Add this to see what's happening:

```javascript
// In CameraOverlayScreen.js
const getPermissions = async () => {
  console.log('=== PERMISSION CHECK START ===');
  
  const cameraPermission = await Camera.requestCameraPermissionsAsync();
  console.log('Camera:', cameraPermission);
  
  const mediaPermission = await MediaLibrary.requestPermissionsAsync();
  console.log('Media:', mediaPermission);
  
  console.log('=== PERMISSION CHECK END ===');
};
```

### **Expected Output (Success):**
```
=== PERMISSION CHECK START ===
Camera: { status: 'granted', expires: 'never', canAskAgain: true }
Media: { status: 'granted', expires: 'never', canAskAgain: true }
=== PERMISSION CHECK END ===
Permissions granted!
```

### **If Status is 'denied':**
```javascript
// User denied permissions
// Solution: Go to device settings and enable manually
```

### **If Status is 'undetermined':**
```javascript
// Permission prompt didn't show
// Solution: Restart app and try again
```

---

## 🚨 **Common Issues**

### **Issue 1: Permission Prompt Never Appears**

**Cause:** App doesn't have permission to request permissions

**Solution:**
```bash
# Rebuild the app
expo prebuild --clean
npm run android  # or npm run ios
```

---

### **Issue 2: "Camera not available"**

**Cause:** Running on unsupported platform

**Solution:** Use physical device with Expo Go

---

### **Issue 3: Black Screen After Permission**

**Cause:** Camera not initializing

**Solution:**
1. Check if `cameraReady` state is true
2. Verify `Camera` component is rendering
3. Check console for errors

---

### **Issue 4: App Crashes on Camera Screen**

**Cause:** Missing dependencies

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Make sure these are installed:
npx expo install expo-camera
npx expo install expo-media-library
```

---

## ✅ **Verification Checklist**

Before reporting issues, verify:

- [ ] Running on **physical device** (not web/simulator)
- [ ] **Expo Go** app is installed
- [ ] **Permissions granted** in device settings
- [ ] App **restarted** after permission changes
- [ ] **Console logs** show "Permissions granted!"
- [ ] **No errors** in terminal
- [ ] **Template loaded** successfully

---

## 🎯 **Best Practice: Use Physical Device**

For the best experience:

1. ✅ **Use physical Android or iOS device**
2. ✅ **Install Expo Go app**
3. ✅ **Connect to same WiFi as development machine**
4. ✅ **Scan QR code from terminal**
5. ✅ **Allow all permissions when prompted**

---

## 📞 **Still Having Issues?**

### **Check These:**

1. **Expo Go Version**
   ```bash
   # Update Expo Go app from App Store/Play Store
   ```

2. **Expo SDK Version**
   ```bash
   # Check package.json
   "expo": "^54.0.0"  # Should match
   ```

3. **Camera Package Version**
   ```bash
   # Check package.json
   "expo-camera": "~17.0.8"
   ```

4. **Clear Metro Cache**
   ```bash
   npx expo start -c
   ```

5. **Reinstall Expo Go**
   - Uninstall Expo Go from device
   - Reinstall from App Store/Play Store
   - Try again

---

## 🎉 **Success Indicators**

You'll know it's working when you see:

1. ✅ **Console:** "Permissions granted!"
2. ✅ **Screen:** Live camera feed
3. ✅ **Overlay:** Green frame with bubbles
4. ✅ **No errors** in terminal

---

## 📱 **Quick Test**

Run this to verify camera works:

```bash
# 1. Start app
npm start

# 2. Open Expo Go on phone
# 3. Scan QR code
# 4. Navigate: Home → Template → Camera
# 5. Should see: Live camera feed with green overlay

# If stuck on "Requesting permission":
# - Check device settings
# - Restart app
# - Use physical device (not web/simulator)
```

---

## 🔄 **Reset Everything**

If nothing works, try a complete reset:

```bash
# 1. Stop server
Ctrl+C

# 2. Clear cache
npx expo start -c

# 3. Clear node modules
rm -rf node_modules
npm install

# 4. Restart
npm start

# 5. On device:
# - Close Expo Go completely
# - Reopen and scan QR code
# - Allow permissions when prompted
```

---

## ✨ **Expected Behavior**

When working correctly:

```
1. Tap "Use Template"
   ↓
2. See "Requesting camera permission..." (1-2 seconds)
   ↓
3. Permission prompt appears
   ↓
4. User taps "Allow"
   ↓
5. Camera feed appears with green overlay
   ↓
6. Ready to scan!
```

**Total time:** 2-3 seconds from tap to camera view

---

## 🎯 **Remember**

- ✅ **Always use physical device for camera features**
- ✅ **Grant permissions when prompted**
- ✅ **Check console logs for debugging**
- ✅ **Restart app if stuck**

**Your camera should work now!** 📸✨
