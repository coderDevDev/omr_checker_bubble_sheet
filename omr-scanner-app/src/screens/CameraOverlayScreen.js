import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  Animated,
  Modal,
  Image,
  ScrollView
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import apiService from '../services/apiService';

export default function CameraOverlayScreen({ navigation, route }) {
  const { template, templateInfo, answerKey } = route.params;
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [livePreviewActive, setLivePreviewActive] = useState(false);
  const livePreviewActiveRef = useRef(false); // Ref to track state immediately
  const [previewDetection, setPreviewDetection] = useState(null);
  const [previewImageBase64, setPreviewImageBase64] = useState(null);
  const previewIntervalRef = useRef(null);
  const lastPreviewTimeRef = useRef(0);
  const previewWebViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [debugMode, setDebugMode] = useState(false); // Temporary debug mode
  const [extractionModalVisible, setExtractionModalVisible] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState(
    'Waiting for capture...'
  );
  const [extractionInputBase64, setExtractionInputBase64] = useState(null);
  const [extractionInputUri, setExtractionInputUri] = useState(null);
  const [extractedImageBase64, setExtractedImageBase64] = useState(null);
  const [extractedImageUri, setExtractedImageUri] = useState(null);
  const [extractionHtmlKey, setExtractionHtmlKey] = useState(0);
  const extractionWebViewRef = useRef(null);
  const originalDisplayUri =
    extractionInputUri ||
    (extractionInputBase64
      ? `data:image/jpeg;base64,${extractionInputBase64}`
      : null);
  const extractedDisplayUri =
    extractedImageUri ||
    (extractedImageBase64
      ? `data:image/jpeg;base64,${extractedImageBase64}`
      : null);

  useEffect(() => {
    getPermissions();

    // Cleanup on unmount
    return () => {
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
      }
    };
  }, []);

  // Animate detection frame when document is detected
  useEffect(() => {
    if (previewDetection?.detected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [previewDetection?.detected]);

  const getPermissions = async () => {
    try {
      const { status: cameraStatus } =
        await Camera.requestCameraPermissionsAsync();

      try {
        await MediaLibrary.requestPermissionsAsync();
      } catch (mediaError) {
        console.log('Media library permission not available');
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

      setHasPermission(true);
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to get camera permissions');
      setHasPermission(false);
      navigation.goBack();
    }
  };

  // Generate HTML for jscanify preview processing
  // Based on jscanify documentation: draw image to canvas, then use highlightPaper(canvas)
  const getPreviewHtmlContent = base64Data => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: transparent; }
    canvas { display: none; }
  </style>
</head>
<body>
  <canvas id="sourceCanvas"></canvas>
  <canvas id="resultCanvas"></canvas>
  <script src="https://docs.opencv.org/4.7.0/opencv.js" onload="console.log('OpenCV script loaded')"></script>
  <script src="https://cdn.jsdelivr.net/gh/ColonelParrot/jscanify@master/src/jscanify.min.js" onload="console.log('jscanify script loaded')"></script>
  <script>
    let scanner = null;
    let openCvLoaded = false;
    let imageBase64Data = '${base64Data || ''}';
    window.imageBase64Data = imageBase64Data;
    
    const sourceCanvas = document.getElementById('sourceCanvas');
    const sourceCtx = sourceCanvas.getContext('2d');
    const resultCanvas = document.getElementById('resultCanvas');

    function checkOpenCV() {
      if (typeof cv !== 'undefined' && cv.Mat) {
        console.log('✅ OpenCV loaded and cv.Mat available!');
        // Wait a bit more to ensure OpenCV is fully ready
        setTimeout(function() {
          openCvLoaded = true;
          try {
            // Test if cv.Mat works
            if (typeof cv.Mat === 'function') {
              console.log('✅ cv.Mat is a constructor, initializing jscanify...');
              scanner = new jscanify();
              console.log('✅ jscanify initialized!');
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'status',
                message: 'jscanify ready'
              }));
              if (window.imageBase64Data && window.imageBase64Data.length > 0) {
                console.log('📸 Image data available, processing...');
                processPreview();
              } else {
                console.log('⏳ No image data yet, waiting...');
              }
            } else {
              console.error('❌ cv.Mat is not a constructor');
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: 'cv.Mat is not a constructor'
              }));
            }
          } catch (err) {
            console.error('❌ jscanify init error:', err);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Failed to initialize jscanify: ' + err.message
            }));
          }
        }, 500); // Wait 500ms for OpenCV to be fully ready
      } else {
        setTimeout(checkOpenCV, 100);
      }
    }

    function processPreview() {
      // Check if OpenCV is fully ready
      if (!scanner || !openCvLoaded) {
        console.log('⏳ Waiting for libraries... scanner:', !!scanner, 'openCvLoaded:', openCvLoaded, 'cv.Mat:', typeof cv !== 'undefined' && typeof cv.Mat);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'status',
          message: 'Waiting for libraries...'
        }));
        return;
      }
      
      // Double-check cv.Mat is available
      if (typeof cv === 'undefined' || typeof cv.Mat !== 'function') {
        console.error('❌ cv.Mat is not available');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: 'cv.Mat is not a constructor - OpenCV not fully loaded'
        }));
        return;
      }
      
      const currentImageData = window.imageBase64Data || imageBase64Data;
      
      if (!currentImageData || currentImageData.length === 0) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'status',
          message: 'No image data'
        }));
        return;
      }

      try {
        const img = new Image();
        img.onload = function() {
          try {
            console.log('🖼️ Image loaded, drawing to canvas...');
            
            // Step 1: Draw image to source canvas (like the documentation example)
            sourceCanvas.width = img.width;
            sourceCanvas.height = img.height;
            sourceCtx.drawImage(img, 0, 0);
            
            console.log('✅ Image drawn to canvas, calling highlightPaper...');
            
            // Verify cv.Mat is still available before calling highlightPaper
            if (typeof cv === 'undefined' || typeof cv.Mat !== 'function') {
              throw new Error('cv.Mat is not available when calling highlightPaper');
            }
            
            // Step 2: Use highlightPaper on the canvas (as per documentation)
            // highlightPaper works on canvas or image element
            const highlighted = scanner.highlightPaper(sourceCanvas);
            
            console.log('✅ highlightPaper result:', highlighted ? 'Got canvas' : 'No canvas');
            
            let detected = false;
            
            if (highlighted && highlighted.width > 0 && highlighted.height > 0) {
              console.log('📐 Highlighted canvas dimensions:', highlighted.width, 'x', highlighted.height);
              
              // Step 3: Analyze the highlighted canvas to detect if paper is found
              const ctx = highlighted.getContext('2d');
              const imageData = ctx.getImageData(0, 0, highlighted.width, highlighted.height);
              const data = imageData.data;
              
              // Count non-zero pixels (highlighted areas indicate paper edges)
              let nonZeroPixels = 0;
              let totalPixels = data.length / 4;
              
              // Sample pixels for performance (every 4th pixel)
              for (let i = 0; i < data.length; i += 16) {
                // Check if any RGB channel has significant value (paper edges are highlighted)
                if (data[i] > 50 || data[i + 1] > 50 || data[i + 2] > 50) {
                  nonZeroPixels++;
                }
              }
              
              const sampledPixels = totalPixels / 4;
              // Lower threshold: if more than 0.3% of sampled pixels are highlighted, paper is detected
              const threshold = sampledPixels * 0.003;
              detected = nonZeroPixels > threshold;
              
              console.log('🔍 Detection analysis:', {
                nonZeroPixels: nonZeroPixels,
                sampledPixels: sampledPixels,
                threshold: threshold.toFixed(2),
                percentage: ((nonZeroPixels / sampledPixels) * 100).toFixed(2) + '%',
                detected: detected
              });
            } else {
              console.log('⚠️ No valid highlighted canvas returned');
            }
            
            console.log('📤 Sending detection result:', detected);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'detected',
              detected: detected
            }));
          } catch (err) {
            console.error('❌ Detection error:', err);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: err.message || 'Detection failed'
            }));
          }
        };
        img.onerror = function() {
          console.error('❌ Failed to load image');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: 'Failed to load image'
          }));
        };
        img.src = 'data:image/jpeg;base64,' + currentImageData;
      } catch (err) {
        console.error('❌ Process error:', err);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: err.message || 'Processing failed'
        }));
      }
    }

    checkOpenCV();
    window.processPreview = processPreview;
  </script>
</body>
</html>
    `;
  };

  const getExtractionHtmlContent = base64Data => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body { margin: 0; padding: 0; background: #000; color: #fff; font-family: Arial, sans-serif; }
    #status { text-align: center; margin-top: 20px; }
    canvas { max-width: 100%; border: 2px solid #4CAF50; }
  </style>
</head>
<body>
  <div id="status">Loading OpenCV...</div>
  <canvas id="resultCanvas"></canvas>
  <!-- Load OpenCV FIRST, then jscanify (jscanify depends on OpenCV) -->
  <script src="https://docs.opencv.org/4.7.0/opencv.js" onload="console.log('OpenCV script loaded')"></script>
  <script src="https://cdn.jsdelivr.net/gh/ColonelParrot/jscanify@master/src/jscanify.min.js" onload="console.log('jscanify script loaded')"></script>
  <script>
    let scanner = null;
    let openCvLoaded = false;
    const statusEl = document.getElementById('status');
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    const imageBase64Data = '${base64Data || ''}';

    function updateStatus(message) {
      statusEl.textContent = message;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'status', message }));
    }

    function checkOpenCV() {
      // Check if OpenCV is loaded AND cv.Mat is available
      if (typeof cv !== 'undefined' && typeof cv.Mat === 'function') {
        console.log('✅ OpenCV loaded and cv.Mat available!');
        openCvLoaded = true;
        // Wait a bit more to ensure OpenCV is fully ready
        setTimeout(function() {
          updateStatus('OpenCV loaded. Initializing jscanify...');
          initScanner();
        }, 500);
      } else {
        setTimeout(checkOpenCV, 100);
      }
    }

    function initScanner() {
      try {
        // Check if jscanify is available
        if (typeof jscanify === 'undefined') {
          updateStatus('jscanify library not loaded. Waiting...');
          setTimeout(initScanner, 200);
          return;
        }
        
        // Verify cv.Mat is still available
        if (typeof cv === 'undefined' || typeof cv.Mat !== 'function') {
          throw new Error('cv.Mat is not available');
        }
        
        console.log('✅ Initializing jscanify...');
        scanner = new jscanify();
        console.log('✅ jscanify initialized!');
        
        if (!imageBase64Data || imageBase64Data.length === 0) {
          updateStatus('No image data to process.');
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'No image data provided.' }));
          return;
        }
        
        extractDocument();
      } catch (err) {
        console.error('❌ jscanify init error:', err);
        updateStatus('Failed to initialize jscanify: ' + err.message);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
      }
    }

    function extractDocument() {
      updateStatus('Extracting document...');
      const img = new Image();
      img.onload = function() {
        try {
          // Verify cv.Mat is still available before extraction
          if (typeof cv === 'undefined' || typeof cv.Mat !== 'function') {
            throw new Error('cv.Mat is not available during extraction');
          }
          
          console.log('🖼️ Extracting document with jscanify...');
          const resultCanvas = scanner.extractPaper(img, 1080, 1920);
          
          if (!resultCanvas || resultCanvas.width === 0 || resultCanvas.height === 0) {
            throw new Error('Extraction returned empty canvas');
          }
          
          canvas.width = resultCanvas.width;
          canvas.height = resultCanvas.height;
          ctx.drawImage(resultCanvas, 0, 0);
          const extractedBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
          
          console.log('✅ Document extracted successfully!');
          updateStatus('Document extracted successfully!');
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', imageBase64: extractedBase64 }));
        } catch (err) {
          console.error('❌ Extraction error:', err);
          updateStatus('Extraction failed: ' + err.message);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
        }
      };
      img.onerror = function() {
        console.error('❌ Failed to load image');
        updateStatus('Failed to load image');
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Failed to load image' }));
      };
      img.src = 'data:image/jpeg;base64,' + imageBase64Data;
    }

    // Start checking for OpenCV
    checkOpenCV();
  </script>
</body>
</html>
    `;
  };

  const handleExtractionWebViewMessage = async event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'status') {
        setExtractionStatus(data.message);
      } else if (data.type === 'success') {
        setExtractionStatus('Document extracted!');
        setExtractedImageBase64(data.imageBase64 || null);
        if (data.imageBase64) {
          try {
            const fileUri = `${
              FileSystem.cacheDirectory || FileSystem.documentDirectory
            }extracted_${Date.now()}.jpg`;

            console.log({ fileUri });
            await FileSystem.writeAsStringAsync(fileUri, data.imageBase64, {
              encoding: FileSystem.EncodingType.Base64
            });
            setExtractedImageUri(fileUri);
          } catch (fileError) {
            console.log('❌ Failed to save extracted image:', fileError);
            setExtractionStatus(
              'Document extracted, but failed to save preview locally.'
            );
            setExtractedImageUri(null);
          }
        }
      } else if (data.type === 'error') {
        setExtractionStatus(`Error: ${data.message}`);
      }
    } catch (error) {
      console.log('❌ Extraction message parse error:', error);
    }
  };

  const closeExtractionModal = () => {
    setExtractionModalVisible(false);
    setExtractionInputBase64(null);
    setExtractionInputUri(null);
    setExtractedImageBase64(null);
    setExtractedImageUri(null);
    setExtractionStatus('Waiting for capture...');
  };

  // Handle WebView messages from jscanify preview
  const handlePreviewWebViewMessage = event => {
    try {
      const rawData = event.nativeEvent.data;
      console.log(
        '📨 Raw WebView message received, length:',
        rawData ? rawData.length : 0
      );

      if (!rawData || rawData.length === 0) {
        console.log('⚠️ Empty message received');
        return;
      }

      console.log(
        '📨 Raw WebView message (first 200 chars):',
        rawData.substring(0, 200)
      );
      const data = JSON.parse(rawData);
      console.log('📨 Parsed WebView message:', data);

      if (data.type === 'detected') {
        console.log('🎯 Detection result:', data.detected);
        setPreviewDetection({
          active: true,
          detected: data.detected,
          processing: false
        });
        console.log('✅ State updated! New detected value:', data.detected);
      } else if (data.type === 'error') {
        console.log('❌ Detection error:', data.message);
        setPreviewDetection({
          active: true,
          detected: false,
          processing: false
        });
      } else if (data.type === 'status') {
        console.log('📊 Status:', data.message);
      }
    } catch (err) {
      console.log('❌ Message parse error:', err);
      console.log(
        '❌ Raw message was:',
        event.nativeEvent.data
          ? event.nativeEvent.data.substring(0, 200)
          : 'null'
      );
    }
  };

  // Capture preview frame for live detection
  const capturePreviewFrame = async () => {
    // Use ref instead of state for immediate check
    const isLivePreviewActive = livePreviewActiveRef.current;

    console.log('📸 capturePreviewFrame called', {
      hasCamera: !!cameraRef.current,
      livePreviewActive: isLivePreviewActive,
      capturing
    });

    if (!cameraRef.current || !isLivePreviewActive || capturing) {
      console.log('❌ Skipping capture - conditions not met', {
        hasCamera: !!cameraRef.current,
        isLivePreviewActive,
        capturing
      });
      return;
    }

    const now = Date.now();
    if (now - lastPreviewTimeRef.current < 2000) {
      console.log('⏭️ Skipping - too soon since last capture');
      return;
    }
    lastPreviewTimeRef.current = now;

    try {
      console.log('📸 Starting preview frame capture...');
      setPreviewDetection({ active: true, detected: false, processing: true });

      // Capture very low quality preview frame
      const preview = await cameraRef.current.takePictureAsync({
        quality: 0.8, // Very low quality for faster processing
        base64: false,
        skipProcessing: true
      });

      // Resize image to reduce size significantly (max 800px width for preview)
      const resized = await manipulateAsync(
        preview.uri,
        [
          {
            resize: {
              width: 1080, // Much smaller for preview
              height: 1920
            }
          }
        ],
        {
          compress: 1.0, // Heavy compression for preview
          format: SaveFormat.JPEG
        }
      );

      const base64 = await FileSystem.readAsStringAsync(resized.uri, {
        encoding: 'base64'
      });

      console.log('💾 Base64 length:', base64.length, 'bytes');
      setPreviewImageBase64(base64);

      // Inject new image data into WebView (don't reload, just update)
      setTimeout(() => {
        if (previewWebViewRef.current && base64) {
          console.log('💉 Injecting JavaScript to process image...');
          // Escape base64 for JavaScript injection (handle all special chars)
          const escapedBase64 = base64
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\$/g, '\\$'); // Escape $ for template literals

          const injectScript = `
            (function() {
              try {
                console.log('🔄 Updating image data in WebView...');
                window.imageBase64Data = '${escapedBase64}';
                console.log('✅ Image data updated, length:', window.imageBase64Data ? window.imageBase64Data.length : 0);
                
                // Wait for libraries to be ready, then process
                function tryProcess() {
                  if (typeof cv === 'undefined' || typeof cv.Mat !== 'function') {
                    console.log('⏳ OpenCV not ready yet, waiting...');
                    setTimeout(tryProcess, 200);
                    return;
                  }
                  
                  if (typeof scanner === 'undefined' || scanner === null) {
                    console.log('⏳ Scanner not ready yet, waiting...');
                    setTimeout(tryProcess, 200);
                    return;
                  }
                  
                  if (typeof processPreview === 'function') {
                    console.log('✅ All ready, calling processPreview...');
                    processPreview();
                  } else {
                    console.log('❌ processPreview function not found');
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'error',
                      message: 'processPreview function not found'
                    }));
                  }
                }
                
                // Start trying to process
                setTimeout(tryProcess, 300);
              } catch (err) {
                console.error('❌ Injection error:', err);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: 'Injection error: ' + err.message
                }));
              }
            })();
            true; // Required for injectJavaScript
          `;

          try {
            previewWebViewRef.current.injectJavaScript(injectScript);
            console.log('✅ JavaScript injected successfully');
          } catch (err) {
            console.log('❌ Failed to inject JavaScript:', err);
          }
        } else {
          console.log('❌ WebView ref or base64 missing', {
            hasRef: !!previewWebViewRef.current,
            hasBase64: !!base64
          });
        }
      }, 1000); // Wait for WebView to be ready
    } catch (error) {
      console.log('❌ Preview capture error:', error);
      setPreviewDetection({ active: true, detected: false, processing: false });

      // If error is "Failed to capture image", camera might be busy
      // Wait a bit longer before next attempt
      if (error.message && error.message.includes('Failed to capture')) {
        lastPreviewTimeRef.current = Date.now() + 1000; // Add extra delay
      }
    }
  };

  const stopLivePreview = () => {
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
    livePreviewActiveRef.current = false;
    setLivePreviewActive(false);
    setPreviewDetection(null);
    lastPreviewTimeRef.current = 0;
  };

  const toggleLivePreview = () => {
    console.log('👁️ Toggle live preview - current state:', livePreviewActive);
    if (livePreviewActive) {
      console.log('🛑 Stopping live preview...');
      stopLivePreview();
    } else {
      console.log('▶️ Starting live preview...');
      // Update ref immediately (before state update) so capturePreviewFrame can use it
      livePreviewActiveRef.current = true;
      setLivePreviewActive(true);
      setPreviewDetection({ active: true, detected: false });

      console.log('📊 Camera state:', {
        cameraReady,
        hasInterval: !!previewIntervalRef.current
      });

      if (cameraReady && !previewIntervalRef.current) {
        console.log('✅ Camera ready, starting capture interval...');
        // Small delay to ensure everything is set up
        setTimeout(() => {
          capturePreviewFrame();
          previewIntervalRef.current = setInterval(() => {
            console.log('⏰ Interval tick - capturing frame...');
            capturePreviewFrame();
          }, 2000);
        }, 100);
      } else {
        console.log(
          '⏳ Waiting for camera to be ready or interval already exists'
        );
      }
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || capturing) return;

    if (livePreviewActive) {
      stopLivePreview();
    }

    setCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false
      });

      console.log('📸 Photo captured:', photo.uri);

      const optimizedImage = await manipulateAsync(
        photo.uri,
        [
          {
            resize: {
              width: 1920,
              height: undefined
            }
          }
        ],
        {
          compress: 0.85,
          format: SaveFormat.JPEG
        }
      );

      const base64 = await FileSystem.readAsStringAsync(optimizedImage.uri, {
        encoding: 'base64'
      });

      setExtractedImageBase64(null);
      setExtractedImageUri(null);
      setExtractionStatus('Preparing document extraction...');
      setExtractionInputUri(optimizedImage.uri);
      setExtractionInputBase64(base64);
      setExtractionModalVisible(true);
      setExtractionHtmlKey(prev => prev + 1);
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
        onCameraReady={() => {
          console.log('📷 Camera ready!');
          setCameraReady(true);
          // Use ref to check immediately
          if (livePreviewActiveRef.current && !previewIntervalRef.current) {
            console.log(
              '✅ Camera ready + live preview active, starting capture...'
            );
            setTimeout(() => {
              capturePreviewFrame();
              previewIntervalRef.current = setInterval(() => {
                console.log('⏰ Interval tick - capturing frame...');
                capturePreviewFrame();
              }, 2000);
            }, 100);
          } else {
            console.log('⏳ Camera ready but:', {
              livePreviewActive: livePreviewActiveRef.current,
              hasInterval: !!previewIntervalRef.current
            });
          }
        }}>
        {cameraReady && (
          <View style={styles.overlayContainer}>
            {/* Top Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.headerButtonText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>📄 OMR Scanner</Text>
                {livePreviewActive && (
                  <View style={styles.liveBadge}>
                    <View
                      style={[
                        styles.liveDot,
                        previewDetection?.detected && styles.liveDotActive
                      ]}
                    />
                    <Text style={styles.liveText}>
                      {previewDetection?.processing
                        ? 'Detecting...'
                        : previewDetection?.detected
                        ? 'Document Found!'
                        : 'Live Preview'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={toggleFlash}>
                  <Text style={styles.headerButtonText}>
                    {flashMode === 'off' ? '⚡' : '⚡️'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    livePreviewActive && styles.headerButtonActive
                  ]}
                  onPress={toggleLivePreview}>
                  <Text style={styles.headerButtonText}>👁️</Text>
                </TouchableOpacity>
                {/* DEBUG: Long press to toggle debug mode */}
                <TouchableOpacity
                  style={styles.headerButton}
                  onLongPress={() => {
                    setDebugMode(!debugMode);
                    console.log('🐛 Debug mode:', !debugMode);
                    if (!debugMode) {
                      // Simulate detection for testing
                      setPreviewDetection({
                        active: true,
                        detected: true,
                        processing: false
                      });
                    }
                  }}>
                  <Text style={styles.headerButtonText}>🐛</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Detection Overlay - Very Visible */}
            {/* DEBUG: Show overlay if detected OR in debug mode */}
            {livePreviewActive && (previewDetection?.detected || debugMode) && (
              <Animated.View
                style={[
                  styles.detectionOverlay,
                  { transform: [{ scale: pulseAnim }] }
                ]}
                pointerEvents="none">
                <View style={styles.detectionFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <View style={styles.detectionLabel}>
                  <Text style={styles.detectionLabelText}>
                    ✓ Document Detected
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Processing Indicator */}
            {livePreviewActive && previewDetection?.processing && (
              <View style={styles.processingIndicator}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.processingText}>Analyzing...</Text>
              </View>
            )}

            {/* Bottom Controls */}
            <View style={styles.bottomSection}>
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>💡 Tips</Text>
                <Text style={styles.instructionItem}>• Good lighting</Text>
                <Text style={styles.instructionItem}>• Flat surface</Text>
                <Text style={styles.instructionItem}>• Keep steady</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.captureButton,
                  (capturing || !cameraReady) && styles.captureButtonDisabled
                ]}
                onPress={capturePhoto}
                disabled={capturing || !cameraReady}>
                {capturing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>

            {/* Hidden WebView for jscanify */}
            {livePreviewActive && (
              <View style={styles.hiddenWebView}>
                <WebView
                  key="preview-webview" // Fixed key - don't reload WebView, just update content
                  ref={previewWebViewRef}
                  source={{
                    html: getPreviewHtmlContent('') // Start with empty, update via injection
                  }}
                  onMessage={handlePreviewWebViewMessage}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  onError={syntheticEvent => {
                    const { nativeEvent } = syntheticEvent;
                    console.log('❌ WebView error:', nativeEvent);
                  }}
                  onLoadEnd={() => {
                    console.log('✅ WebView loaded');
                  }}
                  onConsoleMessage={event => {
                    const message = event.nativeEvent.message;
                    console.log('🌐 WebView console:', message);
                  }}
                  style={{ opacity: 0, height: 1, width: 1 }}
                />
              </View>
            )}
          </View>
        )}
      </CameraView>
      <Modal
        visible={extractionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeExtractionModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Document Extraction Preview:</Text>
            <Text style={styles.modalStatus}>{extractionStatus}</Text>

            {console.log({ extractionInputUri })}
            <View style={{ width: '100%', padding: 0, margin: 0 }}>
              <Image
                source={{ uri: extractedDisplayUri }}
                style={{
                  width: '100%',
                  height: 280,
                  margin: 0,
                  padding: 0,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#4CAF50'
                }}
                resizeMode="cover"
              />
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeExtractionModal}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>

            {!!extractionInputBase64 && (
              <WebView
                key={`extraction-${extractionHtmlKey}`}
                ref={extractionWebViewRef}
                source={{
                  html: getExtractionHtmlContent(extractionInputBase64)
                }}
                onMessage={handleExtractionWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                onError={syntheticEvent => {
                  const { nativeEvent } = syntheticEvent;
                  console.log('❌ Extraction WebView error:', nativeEvent);
                  setExtractionStatus('WebView error occurred');
                }}
                onConsoleMessage={event => {
                  const message = event.nativeEvent.message;
                  console.log('🌐 Extraction WebView console:', message);
                }}
                onLoadEnd={() => {
                  console.log('✅ Extraction WebView loaded');
                }}
                style={{ width: 1, height: 1, opacity: 0 }}
              />
            )}
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerButtonActive: {
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold'
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFC107',
    marginRight: 6
  },
  liveDotActive: {
    backgroundColor: '#4CAF50'
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600'
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8
  },
  detectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  detectionFrame: {
    width: '85%',
    height: '65%',
    borderWidth: 4,
    borderColor: '#4CAF50',
    borderRadius: 12,
    position: 'relative',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
    borderWidth: 4
  },
  cornerTL: {
    top: -4,
    left: -4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12
  },
  cornerTR: {
    top: -4,
    right: -4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12
  },
  cornerBL: {
    bottom: -4,
    left: -4,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12
  },
  cornerBR: {
    bottom: -4,
    right: -4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12
  },
  detectionLabel: {
    position: 'absolute',
    top: '65%',
    alignSelf: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16
  },
  detectionLabelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  processingIndicator: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  processingText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    alignItems: 'center'
  },
  instructionsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    width: '90%'
  },
  instructionsTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6
  },
  instructionItem: {
    color: '#CCCCCC',
    fontSize: 11,
    marginVertical: 2
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  captureButtonDisabled: {
    opacity: 0.5
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50'
  },
  hiddenWebView: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
    overflow: 'hidden'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 16
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  modalStatus: {
    color: '#A5D6A7',
    textAlign: 'center',
    marginBottom: 16
  },
  extractedImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#000'
  },
  modalImageSection: {
    marginBottom: 16
  },
  modalSectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },
  modalImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#000'
  },
  modalLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20
  },
  modalLoaderText: {
    color: '#A5D6A7',
    marginTop: 12,
    fontSize: 12,
    textAlign: 'center'
  },
  modalCarousel: {
    flexGrow: 0,
    maxHeight: 360,
    marginVertical: 12
  },
  modalSlide: {
    width: '100%',
    paddingHorizontal: 4
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12
  },
  modalCloseText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold'
  }
});
