import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  ScrollView
} from 'react-native';
import {
  Button,
  Text,
  Card,
  ActivityIndicator,
  IconButton,
  Surface
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiService from '../services/apiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RectanglePreviewScreen({ navigation, route }) {
  const {
    imageUri,
    originalUri,
    template,
    templateInfo,
    assetId,
    preCropEnabled,
    answerKey,
    skipToResults
  } = route.params;
  const [detecting, setDetecting] = useState(true);
  const [detectedImageUri, setDetectedImageUri] = useState(null);
  const [croppedImageUri, setCroppedImageUri] = useState(null);
  const [detectionInfo, setDetectionInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    detectRectangles();
  }, []);

  // Auto-proceed to Results if skipToResults is true
  useEffect(() => {
    if (skipToResults && croppedImageUri && !detecting && !error) {
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        handleProceed();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [skipToResults, croppedImageUri, detecting, error]);

  const detectRectangles = async () => {
    try {
      setDetecting(true);
      setError(null);

      console.log('Detecting rectangles in image:', imageUri);

      // Call Python backend to detect rectangles
      const response = await apiService.detectRectangles(imageUri);

      if (!response.success) {
        throw new Error(response.error || 'Failed to detect rectangles');
      }

      const data = response.data;

      setDetectionInfo({
        rectanglesFound: data.rectangles_found || 0,
        selectedRectangle: data.selected_rectangle || null,
        imageQuality: {
          resolution: data.image_dimensions || 'Unknown',
          brightness: data.brightness_status || 'Unknown',
          sharpness: data.sharpness_status || 'Unknown'
        },
        warnings: data.warnings || []
      });

      // Set the images from backend
      setDetectedImageUri(data.detected_image_uri); // rectangles_detected_fixed.jpg
      setCroppedImageUri(data.cropped_image_uri); // answer_section.jpg

      setDetecting(false);
    } catch (err) {
      console.error('Detection error:', err);
      setError(err.message || 'Failed to detect rectangles');
      setDetecting(false);
    }
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  const handleProceed = () => {
    if (!croppedImageUri) {
      Alert.alert('Error', 'No cropped image available');
      return;
    }

    navigation.navigate('Results', {
      imageUri: croppedImageUri,
      template,
      templateInfo,
      assetId,
      answerKey,
      detectionInfo
    });
  };

  if (detecting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Detecting Answer Section...</Text>
          <Text style={styles.loadingSubtext}>✓ Analyzing image quality</Text>
          <Text style={styles.loadingSubtext}>✓ Finding rectangles</Text>
          <Text style={styles.loadingSubtext}>✓ Identifying answer area</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconButton icon="alert-circle" size={60} iconColor="#D32F2F" />
          <Text style={styles.errorTitle}>Detection Failed</Text>
          <Text style={styles.errorText}>{error}</Text>

          <Card style={styles.tipsCard}>
            <Card.Content>
              <Text style={styles.tipsTitle}>
                💡 Tips to Improve Detection:
              </Text>
              <Text style={styles.tipText}>
                • Ensure better lighting (avoid shadows)
              </Text>
              <Text style={styles.tipText}>• Use higher resolution camera</Text>
              <Text style={styles.tipText}>
                • Make sure answer section has clear borders
              </Text>
              <Text style={styles.tipText}>
                • Place paper on contrasting background
              </Text>
              <Text style={styles.tipText}>
                • Hold camera 30-40cm above paper
              </Text>
            </Card.Content>
          </Card>

          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Home')}
              style={styles.button}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleRetake}
              style={styles.button}
              buttonColor="#2E7D32">
              Retake Photo
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.header}>
          <Text style={styles.headerTitle}>✅ Detection Successful!</Text>
          <Text style={styles.headerSubtitle}>
            Verify the detected answer section below
          </Text>
        </Surface>

        {/* Captured Image */}
        {imageUri && (
          <Card style={styles.imageCard}>
            <Card.Content>
              <Text style={styles.imageTitle}>
                {preCropEnabled ? '📐 Pre-Cropped Image' : '📸 Captured Image'}
              </Text>
              <Text style={styles.imageSubtitle}>
                {preCropEnabled
                  ? 'Image cropped to green frame area'
                  : 'Original captured image (full frame)'}
              </Text>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              {preCropEnabled && originalUri && (
                <Text style={styles.imageNote}>
                  ✂️ Cropped from original capture
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {detectionInfo && (
          <>
            {detectionInfo.warnings && detectionInfo.warnings.length > 0 && (
              <Card style={styles.warningCard}>
                <Card.Content>
                  <Text style={styles.warningTitle}>⚠️ Warnings:</Text>
                  {detectionInfo.warnings.map((warning, index) => (
                    <Text key={index} style={styles.warningText}>
                      • {warning}
                    </Text>
                  ))}
                </Card.Content>
              </Card>
            )}

            <Card style={styles.infoCard}>
              <Card.Content>
                <Text style={styles.infoTitle}>📊 Detection Results</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Rectangles Found:</Text>
                  <Text style={styles.infoValue}>
                    {detectionInfo.rectanglesFound}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Image Resolution:</Text>
                  <Text style={styles.infoValue}>
                    {detectionInfo.imageQuality.resolution}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Brightness:</Text>
                  <Text style={styles.infoValue}>
                    {detectionInfo.imageQuality.brightness}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Sharpness:</Text>
                  <Text style={styles.infoValue}>
                    {detectionInfo.imageQuality.sharpness}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </>
        )}

        {detectedImageUri && (
          <Card style={styles.imageCard}>
            <Card.Content>
              <Text style={styles.imageTitle}>🔍 Detected Rectangles</Text>
              <Text style={styles.imageSubtitle}>
                Green box shows detected answer section
              </Text>
              <Image
                source={{ uri: detectedImageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </Card.Content>
          </Card>
        )}

        {croppedImageUri && (
          <Card style={styles.imageCard}>
            <Card.Content>
              <Text style={styles.imageTitle}>✂️ Cropped Answer Section</Text>
              <Text style={styles.imageSubtitle}>
                This will be processed for OMR scanning
              </Text>
              <Image
                source={{ uri: croppedImageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </Card.Content>
          </Card>
        )}

        <View style={styles.actionContainer}>
          <Text style={styles.actionText}>
            Does the detection look correct?
          </Text>
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleRetake}
              style={styles.button}
              icon="camera">
              Retake
            </Button>
            <Button
              mode="contained"
              onPress={handleProceed}
              style={styles.button}
              buttonColor="#2E7D32"
              icon="check">
              Proceed
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  scrollContent: {
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 20,
    marginBottom: 10
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 10
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  tipsCard: {
    marginVertical: 20,
    width: '100%'
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4
  },
  header: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#FFFFFF'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666'
  },
  warningCard: {
    marginBottom: 16,
    backgroundColor: '#FFF3E0'
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 8
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    marginVertical: 2
  },
  infoCard: {
    marginBottom: 16
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  infoLabel: {
    fontSize: 14,
    color: '#666'
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  imageCard: {
    marginBottom: 16
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  imageSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12
  },
  imageNote: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#E0E0E0'
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 20
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12
  },
  button: {
    flex: 1
  }
});
