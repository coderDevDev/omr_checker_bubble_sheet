# 📄 Document Scanner Integration Guide

## Overview

The app now includes automatic document detection using `react-native-document-scanner-plugin`. This allows the camera to automatically detect and crop documents when capturing OMR sheets.

## ⚠️ Important: Expo Compatibility

**Note:** `react-native-document-scanner-plugin` is a native module that requires native code compilation. It **will NOT work with Expo Go**.

### Options:

1. **Use EAS Build (Recommended)**
   - Create a custom development build using EAS Build
   - Run: `eas build --profile development --platform android/ios`
   - Install the custom build on your device

2. **Use Expo Development Build**
   - Run: `npx expo run:android` or `npx expo run:ios`
   - This creates a development build with native modules

3. **Alternative: Use Expo-Compatible Solution**
   - Consider using `expo-document-scanner` or similar Expo-compatible packages
   - These work with Expo Go but may have different features

## 📦 Installation

The package has been added to `package.json`. To install:

```bash
npm install
```

For native modules, you may also need to:

```bash
cd ios && pod install  # iOS only
```

## 🎯 Features

### Automatic Document Detection
- When you tap the capture button, the document scanner automatically:
  - Detects document edges
  - Crops to the document
  - Applies perspective correction
  - Returns a processed image

### Toggle Between Modes
- **Auto-Detect Mode** (Default): Uses document scanner for automatic detection
- **Manual Mode**: Uses the green overlay frame for manual alignment

### Fallback Handling
- If document detection fails, the app automatically falls back to manual capture
- User can choose to retry or use manual mode

## 🔧 Implementation Details

### Camera Screen Changes

1. **New State**: `useDocumentScanner` - Controls which capture method to use
2. **New Function**: `capturePhotoWithDocumentScanner()` - Handles document scanning
3. **Toggle Button**: Allows switching between auto-detect and manual modes
4. **Fallback**: If scanner fails, automatically offers manual capture option

### Code Flow

```
User taps capture button
    ↓
Check useDocumentScanner flag
    ↓
If true: Use DocumentScanner.scan()
    ↓
Auto-detect document edges
    ↓
Crop and process image
    ↓
Navigate to Rectangle Preview
```

## 📱 Usage

1. **Open Camera**: Navigate to camera screen
2. **Position Document**: Place OMR sheet in view
3. **Capture**: Tap the capture button
4. **Auto-Detection**: Document scanner automatically detects edges
5. **Review**: Image is automatically cropped and processed

### Toggle Modes

- Tap the "📄 Auto-Detect" / "📸 Manual" button below the capture button
- Switch between automatic detection and manual overlay mode

## 🐛 Troubleshooting

### Issue: "Module not found" or "Native module not linked"

**Solution**: This means you're using Expo Go. You need to:
1. Create a custom development build (see options above)
2. Or use an Expo-compatible alternative

### Issue: Document not detected

**Solution**: 
- Ensure good lighting
- Place document on contrasting background
- Try manual mode as fallback
- Check that document edges are clearly visible

### Issue: App crashes on capture

**Solution**:
- Check that native modules are properly linked
- Rebuild the app after installing the package
- Check device logs for specific errors

## 🔄 Alternative: Expo-Compatible Solution

If you need to use Expo Go, consider these alternatives:

1. **expo-document-scanner** (if available)
2. **Manual cropping** with the existing overlay system
3. **Backend processing** - Send image to backend for document detection

## 📝 Configuration

The document scanner can be configured in `CameraOverlayScreen.js`:

```javascript
const scannedDocument = await DocumentScanner.scan({
  croppedImageQuality: 100,        // Image quality (0-100)
  letUserAdjustCrop: false,         // Allow user to adjust crop
  maxNumDocuments: 1                // Maximum documents to scan
});
```

## ✅ Testing

1. Test on physical device (not simulator)
2. Test with different lighting conditions
3. Test with various document sizes
4. Test fallback to manual mode
5. Verify image quality after scanning

## 🚀 Next Steps

1. Install dependencies: `npm install`
2. Create development build (if using Expo)
3. Test document detection
4. Adjust settings as needed
5. Deploy to production

