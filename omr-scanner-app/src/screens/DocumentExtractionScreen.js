import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
// Use legacy FileSystem API for compatibility
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function DocumentExtractionScreen({ navigation, route }) {
  const { imageUri, template, templateInfo, answerKey } = route.params;
  const webViewRef = useRef(null);
  const [extracting, setExtracting] = useState(true);
  const [extractedImageUri, setExtractedImageUri] = useState(null);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(
    'Loading libraries...'
  );
  const timeoutRef = useRef(null);

  // Convert image to base64 for WebView
  const [imageBase64, setImageBase64] = useState(null);

  useEffect(() => {
    loadImageForWebView();

    // Set timeout to fallback to backend API if jscanify takes too long (15 seconds)
    timeoutRef.current = setTimeout(() => {
      console.log('⏱️ jscanify timeout - falling back to backend API');
      fallbackToBackend();
    }, 15000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const loadImageForWebView = async () => {
    try {
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64'
      });
      setImageBase64(base64);
    } catch (err) {
      console.error('Error loading image:', err);
      setError('Failed to load image for processing');
      setExtracting(false);
    }
  };

  // Generate HTML content with jscanify (inject base64 image)
  const getHtmlContent = () => {
    const base64Data = imageBase64 || '';
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      overflow: hidden;
    }
    #container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    #status {
      color: #fff;
      font-family: Arial, sans-serif;
      font-size: 16px;
      margin-top: 20px;
      text-align: center;
    }
    canvas {
      max-width: 100%;
      max-height: 80%;
      border: 2px solid #2E7D32;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="status">Loading jscanify...</div>
    <canvas id="resultCanvas"></canvas>
  </div>

  <script src="https://cdn.jsdelivr.net/gh/ColonelParrot/jscanify@master/src/jscanify.min.js"></script>
  <script src="https://docs.opencv.org/4.7.0/opencv.js"></script>
  <script>
    let scanner = null;
    let imageLoaded = false;
    let openCvLoaded = false;

    const statusEl = document.getElementById('status');
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    const imageBase64Data = '${base64Data}';

    // Send status updates to React Native
    function updateStatus(message) {
      statusEl.textContent = message;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'status',
        message: message
      }));
    }

    // Check if OpenCV is loaded
    function checkOpenCV() {
      if (typeof cv !== 'undefined') {
        openCvLoaded = true;
        updateStatus('OpenCV loaded. Initializing jscanify...');
        initJScanify();
      } else {
        setTimeout(checkOpenCV, 100);
      }
    }

    // Initialize jscanify
    function initJScanify() {
      try {
        scanner = new jscanify();
        updateStatus('jscanify ready. Processing image...');
        
        if (imageLoaded) {
          processImage();
        }
      } catch (err) {
        updateStatus('Error initializing jscanify: ' + err.message);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: 'Failed to initialize jscanify: ' + err.message
        }));
      }
    }

    // Process image with jscanify
    function processImage() {
      if (!scanner || !openCvLoaded) {
        updateStatus('Waiting for libraries to load...');
        return;
      }

      try {
        updateStatus('Loading image...');
        
        // Create image element
        const img = new Image();
        img.onload = function() {
          try {
            updateStatus('Detecting document edges...');
            
            // Extract paper using jscanify (similar to extractPaper method)
            // jscanify extracts document and returns a canvas
            // Using optimized dimensions for faster processing
            updateStatus('Extracting document...');
            const resultCanvas = scanner.extractPaper(img, 386, 500);
            
            updateStatus('Finalizing extraction...');
            
            // Set canvas dimensions
            canvas.width = resultCanvas.width;
            canvas.height = resultCanvas.height;
            ctx.drawImage(resultCanvas, 0, 0);
            
            // Convert canvas to base64
            const extractedBase64 = canvas.toDataURL('image/jpeg', 0.9);
            
            updateStatus('Document extracted successfully!');
            
            // Send result back to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'success',
              imageBase64: extractedBase64.split(',')[1] // Remove data:image/jpeg;base64, prefix
            }));
          } catch (err) {
            updateStatus('Error extracting document: ' + err.message);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Failed to extract document: ' + err.message
            }));
          }
        };
        
        img.onerror = function() {
          updateStatus('Error loading image');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: 'Failed to load image'
          }));
        };
        
        // Load image from base64
        img.src = 'data:image/jpeg;base64,' + imageBase64Data;
        imageLoaded = true;
      } catch (err) {
        updateStatus('Error: ' + err.message);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: err.message
        }));
      }
    }

    // Start loading OpenCV
    checkOpenCV();

    // Listen for image data from React Native
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'processImage') {
        processImage();
      }
    });
  </script>
</body>
</html>
    `;
  };

  const handleWebViewMessage = async event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      // Update status from WebView
      if (data.type === 'status') {
        setProcessingStatus(data.message);
        return;
      }

      if (data.type === 'success') {
        // Save extracted image
        const base64Data = data.imageBase64;
        const fileUri = `${
          FileSystem.cacheDirectory
        }extracted_document_${Date.now()}.jpg`;

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: 'base64'
        });

        console.log('✅ Document extracted with jscanify:', fileUri);
        setExtractedImageUri(fileUri);
        setExtracting(false);

        // Navigate to RectanglePreview with extracted document
        navigation.replace('RectanglePreview', {
          imageUri: fileUri,
          originalUri: imageUri,
          template,
          templateInfo,
          assetId: null,
          preCropEnabled: false,
          answerKey: answerKey,
          isDocumentScanned: true,
          detectionInfo: {
            rectanglesFound: 1,
            selectedRectangle: null,
            imageQuality: {
              resolution: 'Extracted by jscanify',
              brightness: 'Good',
              sharpness: 'Good'
            },
            warnings: []
          }
        });
      } else if (data.type === 'error') {
        setError(data.message || 'Failed to extract document');
        setExtracting(false);
      }
    } catch (err) {
      console.error('Error handling WebView message:', err);
      setError('Failed to process extraction result');
      setExtracting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Extraction', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => navigation.goBack()
      }
    ]);
  };

  if (!imageBase64) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📄 Extracting Document</Text>
        <Text style={styles.subtitle}>{processingStatus}</Text>
      </View>

      {extracting && !error && (
        <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: getHtmlContent() }}
            onMessage={handleWebViewMessage}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={styles.loadingText}>Loading jscanify...</Text>
              </View>
            )}
          />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.button}>
            Go Back
          </Button>
        </View>
      )}

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handleCancel}
          style={styles.cancelButton}>
          Cancel
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  header: {
    padding: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center'
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 14
  },
  webViewContainer: {
    flex: 1
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000'
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  footer: {
    padding: 20,
    backgroundColor: '#1A1A1A'
  },
  button: {
    marginTop: 10
  },
  cancelButton: {
    borderColor: '#666666'
  }
});
