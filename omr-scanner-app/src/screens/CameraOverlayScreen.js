import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Conditionally import document scanner (may not be available in all builds)
let DocumentScanner = null;
try {
  DocumentScanner = require('react-native-document-scanner-plugin');
} catch (error) {
  console.warn('Document scanner plugin not available:', error.message);
}

const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

export default function CameraOverlayScreen({ navigation, route }) {
  const { template, templateInfo, answerKey } = route.params;
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [overlayDimensions, setOverlayDimensions] = useState(null);
  const [flashMode, setFlashMode] = useState('off');
  const [useDocumentScanner, setUseDocumentScanner] = useState(
    DocumentScanner !== null
  ); // Enable only if available
  const [screenDimensions, setScreenDimensions] = useState(
    getScreenDimensions()
  );

  useEffect(() => {
    getPermissions();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height } = window;
      setScreenDimensions({ width, height });
      calculateOverlayDimensions();
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (hasPermission === true) {
      calculateOverlayDimensions();
    }
  }, [hasPermission, screenDimensions]);

  const getPermissions = async () => {
    try {
      console.log('Requesting camera permissions...');
      const { status: cameraStatus } =
        await Camera.requestCameraPermissionsAsync();
      console.log('Camera permission status:', cameraStatus);

      try {
        const mediaPermission = await MediaLibrary.requestPermissionsAsync();
        console.log('Media library permission status:', mediaPermission.status);
      } catch (mediaError) {
        console.log(
          'Media library permission not available in Expo Go (this is OK)'
        );
      }

      if (cameraStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to scan OMR sheets',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'Open Settings', onPress: () => navigation.goBack() }
          ]
        );
        setHasPermission(false);
        return;
      }

      console.log('Camera permission granted!');
      setHasPermission(true);
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to get camera permissions');
      setHasPermission(false);
      navigation.goBack();
    }
  };

  const calculateOverlayDimensions = () => {
    if (!template) return;

    const { width: screenWidth, height: screenHeight } = screenDimensions;
    const isLandscape = screenWidth > screenHeight;

    const pageDim = Array.isArray(template.pageDimensions)
      ? {
          width: template.pageDimensions[0],
          height: template.pageDimensions[1]
        }
      : template.pageDimensions;

    const pageWidth = pageDim.width || 1200;
    const pageHeight = pageDim.height || 1700;

    const padding = 40;
    const availableWidth = screenWidth - padding * 2;
    const availableHeight = screenHeight - padding * 2;

    const scaleX = availableWidth / pageWidth;
    const scaleY = availableHeight / pageHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = pageWidth * scale;
    const scaledHeight = pageHeight * scale;

    const x = (screenWidth - scaledWidth) / 2;
    const y = (screenHeight - scaledHeight) / 2;

    const dimensions = {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
      scale
    };

    console.log('Overlay dimensions:', dimensions);
    setOverlayDimensions(dimensions);
  };

  const cropImageToOverlay = async imageUri => {
    try {
      if (!overlayDimensions) {
        console.log('⚠️ No overlay dimensions, skipping crop');
        return imageUri;
      }

      // Get the actual image dimensions using React Native Image.getSize
      const { width: imageWidth, height: imageHeight } = await new Promise(
        resolve => {
          Image.getSize(
            imageUri,
            (width, height) => resolve({ width, height }),
            error => {
              console.warn('Could not get image size:', error);
              // Fallback: assume high-res camera (most phones)
              resolve({ width: 3024, height: 4032 });
            }
          );
        }
      );

      const { x, y, width, height } = overlayDimensions;
      const { width: screenWidth, height: screenHeight } = screenDimensions;

      // Calculate camera preview aspect ratio vs screen aspect ratio
      const imageAspect = imageWidth / imageHeight;
      const screenAspect = screenWidth / screenHeight;

      let previewWidth, previewHeight, previewX, previewY;

      if (imageAspect > screenAspect) {
        // Image is wider - letterboxed on top/bottom
        previewWidth = screenWidth;
        previewHeight = screenWidth / imageAspect;
        previewX = 0;
        previewY = (screenHeight - previewHeight) / 2;
      } else {
        // Image is taller - letterboxed on left/right
        previewHeight = screenHeight;
        previewWidth = screenHeight * imageAspect;
        previewX = (screenWidth - previewWidth) / 2;
        previewY = 0;
      }

      // Calculate overlay position relative to preview area (not screen)
      const overlayRelX = x - previewX;
      const overlayRelY = y - previewY;

      // Calculate scale from preview to actual image
      const scaleX = imageWidth / previewWidth;
      const scaleY = imageHeight / previewHeight;

      // Convert overlay coordinates to image coordinates
      const cropX = Math.max(0, Math.round(overlayRelX * scaleX));
      const cropY = Math.max(0, Math.round(overlayRelY * scaleY));
      const cropWidth = Math.min(
        imageWidth - cropX,
        Math.round(width * scaleX)
      );
      const cropHeight = Math.min(
        imageHeight - cropY,
        Math.round(height * scaleY)
      );

      console.log('✂️ Cropping to green frame:');
      console.log(
        `  Screen: ${screenWidth}x${screenHeight} (aspect: ${screenAspect.toFixed(
          2
        )})`
      );
      console.log(
        `  Image: ${imageWidth}x${imageHeight} (aspect: ${imageAspect.toFixed(
          2
        )})`
      );
      console.log(
        `  Preview area: ${previewWidth.toFixed(0)}x${previewHeight.toFixed(
          0
        )} at (${previewX.toFixed(0)}, ${previewY.toFixed(0)})`
      );
      console.log(
        `  Overlay on screen: x=${x}, y=${y}, w=${width}, h=${height}`
      );
      console.log(
        `  Overlay relative to preview: x=${overlayRelX.toFixed(
          0
        )}, y=${overlayRelY.toFixed(0)}`
      );
      console.log(`  Scale: x=${scaleX.toFixed(2)}, y=${scaleY.toFixed(2)}`);
      console.log(
        `  Crop region: x=${cropX}, y=${cropY}, w=${cropWidth}, h=${cropHeight}`
      );

      // Validate crop dimensions
      if (cropWidth <= 0 || cropHeight <= 0 || cropX < 0 || cropY < 0) {
        console.warn('⚠️ Invalid crop dimensions, using original image');
        return imageUri;
      }

      // Crop the image using expo-image-manipulator
      const croppedImage = await manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: cropX,
              originY: cropY,
              width: cropWidth,
              height: cropHeight
            }
          }
        ],
        { compress: 1, format: SaveFormat.JPEG }
      );

      console.log(`✅ Cropped: ${croppedImage.width}x${croppedImage.height}`);
      return croppedImage.uri;
    } catch (error) {
      console.error('❌ Crop error:', error);
      // Return original image if crop fails
      return imageUri;
    }
  };

  const capturePhotoWithDocumentScanner = async () => {
    // Check if document scanner is available
    if (!DocumentScanner) {
      Alert.alert(
        'Document Scanner Not Available',
        'Document scanner is not available in this build. Using manual capture instead.',
        [{ text: 'OK', onPress: () => capturePhoto() }]
      );
      return;
    }

    try {
      setCapturing(true);
      console.log('📄 Starting document scanner...');

      // Use document scanner plugin for automatic detection
      const scannedDocument = await DocumentScanner.scan({
        croppedImageQuality: 100,
        letUserAdjustCrop: false, // Auto-crop without user adjustment
        maxNumDocuments: 1
      });

      if (
        scannedDocument &&
        scannedDocument.scannedImages &&
        scannedDocument.scannedImages.length > 0
      ) {
        const scannedImageUri = scannedDocument.scannedImages[0];
        console.log('✅ Document scanned:', scannedImageUri);

        let assetId = null;
        try {
          const asset = await MediaLibrary.createAssetAsync(scannedImageUri);
          assetId = asset.id;
          console.log('💾 Saved to gallery');
        } catch (saveError) {
          console.log('Could not save to gallery (Expo Go limitation)');
        }

        // Navigate to Rectangle Preview with scanned document
        navigation.navigate('RectanglePreview', {
          imageUri: scannedImageUri,
          originalUri: scannedImageUri,
          template,
          templateInfo,
          assetId: assetId,
          preCropEnabled: true,
          answerKey: answerKey,
          isDocumentScanned: true // Flag to indicate document scanner was used
        });
      } else {
        throw new Error('No document detected');
      }
    } catch (error) {
      console.error('Document scanner error:', error);

      // Fallback to regular camera capture
      Alert.alert(
        'Document Detection Failed',
        'Could not detect document automatically. Falling back to manual capture.',
        [
          {
            text: 'Use Manual Capture',
            onPress: () => {
              setUseDocumentScanner(false);
              capturePhoto();
            }
          },
          {
            text: 'Try Again',
            onPress: () => capturePhotoWithDocumentScanner()
          }
        ]
      );
    } finally {
      setCapturing(false);
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || capturing) return;

    setCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0,
        base64: false,
        skipProcessing: false
      });

      console.log('📸 Photo captured:', photo.uri);

      // Crop image to green overlay frame
      const croppedUri = await cropImageToOverlay(photo.uri);

      let assetId = null;
      try {
        const asset = await MediaLibrary.createAssetAsync(croppedUri);
        assetId = asset.id;
        console.log('💾 Saved to gallery');
      } catch (saveError) {
        console.log('Could not save to gallery (Expo Go limitation)');
      }

      const answerKey = route.params.answerKey;
      navigation.navigate('RectanglePreview', {
        imageUri: croppedUri,
        originalUri: photo.uri,
        template,
        templateInfo,
        assetId: assetId,
        preCropEnabled: true,
        answerKey: answerKey
      });
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert(
        'Capture Failed',
        'Failed to capture image. Please try again.'
      );
    } finally {
      setCapturing(false);
    }
  };

  const handleCapture = () => {
    if (useDocumentScanner) {
      capturePhotoWithDocumentScanner();
    } else {
      capturePhoto();
    }
  };

  const toggleFlash = () => {
    setFlashMode(flashMode === 'off' ? 'torch' : 'off');
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.permissionText}>
          Requesting camera permission...
        </Text>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20 }}>
          Cancel
        </Button>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          This app needs camera access to scan OMR sheets.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20 }}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashMode}
        onCameraReady={() => setCameraReady(true)}>
        {overlayDimensions && cameraReady && (
          <View style={styles.overlayContainer}>
            {/* Green Frame */}
            <View
              style={[
                styles.overlayFrame,
                {
                  left: overlayDimensions.x,
                  top: overlayDimensions.y,
                  width: overlayDimensions.width,
                  height: overlayDimensions.height
                }
              ]}>
              {/* Corner Markers */}
              <View style={[styles.cornerMarker, styles.topLeft]} />
              <View style={[styles.cornerMarker, styles.topRight]} />
              <View style={[styles.cornerMarker, styles.bottomLeft]} />
              <View style={[styles.cornerMarker, styles.bottomRight]} />

              {/* Center Crosshair */}
              <View style={[styles.crosshair, styles.horizontal]} />
              <View style={[styles.crosshair, styles.vertical]} />
            </View>

            {/* Capture Guidelines */}
            <View style={styles.guideTextContainer}>
              <Text style={styles.guideText}>📄 ALIGN SHEET TO FRAME</Text>
              <Text style={styles.guideSubtext}>
                Follow guidelines for best results
              </Text>
            </View>

            {/* Capture Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionText}>💡 Capture Guidelines</Text>
              <Text style={styles.instructionSubtext}>
                ✓ Good lighting (no shadows)
              </Text>
              <Text style={styles.instructionSubtext}>
                ✓ Hold 30-40cm above paper
              </Text>
              <Text style={styles.instructionSubtext}>
                ✓ Keep camera parallel to sheet
              </Text>
              <Text style={styles.instructionSubtext}>
                ✓ All 4 corners visible in frame
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
              {/* Top Controls */}
              <View style={styles.topControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => navigation.goBack()}>
                  <Text style={styles.controlText}>✕</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleFlash}>
                  <Text style={styles.controlText}>
                    {flashMode === 'off' ? '⚡' : '⚡️'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                <View style={styles.captureButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.captureButton,
                      capturing && styles.captureButtonDisabled
                    ]}
                    onPress={handleCapture}
                    disabled={capturing || !cameraReady}>
                    {capturing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.captureButtonInner} />
                    )}
                  </TouchableOpacity>

                  {/* Toggle between document scanner and manual capture - Only show if scanner is available */}
                  {DocumentScanner && (
                    <TouchableOpacity
                      style={styles.scannerToggle}
                      onPress={() =>
                        setUseDocumentScanner(!useDocumentScanner)
                      }>
                      <Text style={styles.scannerToggleText}>
                        {useDocumentScanner ? '📄 Auto-Detect' : '📸 Manual'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  camera: {
    flex: 1
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
    textAlign: 'center'
  },
  permissionText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center'
  },
  overlayContainer: {
    flex: 1,
    position: 'relative'
  },
  overlayFrame: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#00FF00',
    backgroundColor: 'transparent'
  },
  cornerMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#00FF00',
    borderWidth: 4
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  crosshair: {
    position: 'absolute',
    backgroundColor: '#00FF00'
  },
  horizontal: {
    width: 20,
    height: 2,
    top: '50%',
    left: '50%',
    marginLeft: -10,
    marginTop: -1
  },
  vertical: {
    width: 2,
    height: 20,
    top: '50%',
    left: '50%',
    marginLeft: -1,
    marginTop: -10
  },
  guideTextContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 80 : 60,
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  guideText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    overflow: 'hidden'
  },
  guideSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 6
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 15,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(46, 125, 50, 0.6)'
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  instructionSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'left',
    paddingVertical: 2
  },
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between'
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    alignItems: 'center'
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold'
  },
  captureButtonContainer: {
    alignItems: 'center'
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#2E7D32'
  },
  captureButtonDisabled: {
    opacity: 0.6
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E7D32'
  },
  scannerToggle: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    alignSelf: 'center'
  },
  scannerToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  }
});
