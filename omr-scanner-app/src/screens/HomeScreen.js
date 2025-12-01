import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
  Switch,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getSettings, saveSettings } from '../services/database';

export default function HomeScreen({ navigation }) {
  const [uploading, setUploading] = useState(false);
  const [skipVerifyDetection, setSkipVerifyDetection] = useState(true);
  const [showDevSettings, setShowDevSettings] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setSkipVerifyDetection(settings.skipVerifyDetection !== false);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleToggleSkipVerify = async value => {
    setSkipVerifyDetection(value);
    try {
      const settings = await getSettings();
      await saveSettings({
        ...settings,
        skipVerifyDetection: value
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleUploadImage = async () => {
    try {
      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photos to upload an image.'
        );
        return;
      }

      setUploading(true);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('🖼️ Image selected:', imageUri);

        // Navigate to Template selection first
        navigation.navigate('Template', {
          uploadedImageUri: imageUri,
          isUpload: true
        });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title style={styles.welcomeTitle}>🎯 OMR Scanner</Title>
            {/* <Paragraph style={styles.welcomeText}>
              Professional Optical Mark Recognition
            </Paragraph> */}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>📸 Quick Scan</Title>
            <Paragraph style={styles.sectionText}>
              Start scanning OMR sheets with camera or upload existing image
            </Paragraph>
            <Button
              mode="contained"
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Template')}
              icon="camera">
              Start Camera Overlay
            </Button>
            {/* <Button
              mode="outlined"
              style={styles.uploadButton}
              onPress={handleUploadImage}
              icon="upload"
              loading={uploading}
              disabled={uploading}>
              Upload Image from Gallery
            </Button> */}
          </Card.Content>
        </Card>

        {/* Teacher Tools */}
        <Card style={styles.actionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>👨‍🏫 Teacher Tools</Title>
            <Paragraph style={styles.sectionText}>
              Manage answer keys and grade student exams automatically
            </Paragraph>
            <Button
              mode="contained"
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('AnswerKeys')}
              icon="key">
              Manage Answer Keys
            </Button>
          </Card.Content>
        </Card>

        {/* Developer Settings (Collapsible) */}
        <Card style={styles.devSettingsCard}>
          <Card.Content>
            <View style={styles.devSettingsHeader}>
              <View>
                <Title style={styles.devSettingsTitle}>
                  ⚙️ Developer Settings
                </Title>
                <Paragraph style={styles.devSettingsSubtitle}>
                  Advanced options for development and testing
                </Paragraph>
              </View>
              <IconButton
                icon={showDevSettings ? 'chevron-up' : 'chevron-down'}
                size={24}
                onPress={() => setShowDevSettings(!showDevSettings)}
              />
            </View>

            {showDevSettings && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Paragraph style={styles.settingTitle}>
                      Skip Verify Detection Screen
                    </Paragraph>
                    <Paragraph style={styles.settingDescription}>
                      When enabled, uploaded images go directly to Results
                      screen. Disable to show Verify Detection screen for
                      debugging.
                    </Paragraph>
                  </View>
                  <Switch
                    value={skipVerifyDetection}
                    onValueChange={handleToggleSkipVerify}
                    color="#2E7D32"
                  />
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Features */}
        {/* <Card style={styles.featureCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>✨ Features</Title>

            <View style={styles.featureItem}>
              <IconButton icon="camera-control" size={24} iconColor="#2E7D32" />
              <View style={styles.featureText}>
                <Paragraph style={styles.featureTitle}>
                  Camera Overlay
                </Paragraph>
                <Paragraph style={styles.featureDesc}>
                  Green frame guide with crosshair alignment
                </Paragraph>
              </View>
            </View>

            <View style={styles.featureItem}>
              <IconButton
                icon="format-list-checks"
                size={24}
                iconColor="#2E7D32"
              />
              <View style={styles.featureText}>
                <Paragraph style={styles.featureTitle}>
                  Template Matching
                </Paragraph>
                <Paragraph style={styles.featureDesc}>
                  Dynamic template loading from JSON
                </Paragraph>
              </View>
            </View>

            <View style={styles.featureItem}>
              <IconButton icon="chart-line" size={24} iconColor="#2E7D32" />
              <View style={styles.featureText}>
                <Paragraph style={styles.featureTitle}>
                  Instant Results
                </Paragraph>
                <Paragraph style={styles.featureDesc}>
                  Real-time OMR processing and scoring
                </Paragraph>
              </View>
            </View>

            <View style={styles.featureItem}>
              <IconButton icon="download" size={24} iconColor="#2E7D32" />
              <View style={styles.featureText}>
                <Paragraph style={styles.featureTitle}>
                  Export Results
                </Paragraph>
                <Paragraph style={styles.featureDesc}>
                  CSV export with detailed analysis
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card> */}

        {/* Instructions */}
        {/* <Card style={styles.instructionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>📋 How to Use</Title>
            <Paragraph style={styles.instructionText}>
              1. Select your OMR template{'\n'}
              2. Position sheet within green frame{'\n'}
              3. Align using crosshair guide{'\n'}
              4. Capture high-quality image{'\n'}
              5. View instant results
            </Paragraph>
          </Card.Content>
        </Card> */}
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
    padding: 16,
    paddingBottom: 32
  },
  welcomeCard: {
    marginBottom: 16,
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32'
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center'
  },
  welcomeText: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    marginTop: 8
  },
  actionCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 4
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8
  },
  sectionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8
  },
  uploadButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderColor: '#2E7D32',
    borderWidth: 2
  },
  secondaryButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 8
  },
  featureCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  featureText: {
    flex: 1,
    marginLeft: 8
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  featureDesc: {
    fontSize: 12,
    color: '#666666'
  },
  instructionCard: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800'
  },
  instructionText: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20
  },
  devSettingsCard: {
    marginTop: 16,
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#9E9E9E'
  },
  devSettingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  devSettingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666'
  },
  devSettingsSubtitle: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4
  },
  divider: {
    marginVertical: 12
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  settingInfo: {
    flex: 1,
    marginRight: 16
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4
  },
  settingDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16
  }
});
