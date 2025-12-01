import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Text } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  ActivityIndicator,
  Chip,
  RadioButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { TemplateLoader } from '../utils/templateLoader';
import { getAllAnswerKeys, getSettings } from '../services/database';
import apiService from '../services/apiService';

export default function TemplateScreen({ navigation, route }) {
  const [templates, setTemplates] = useState([]);
  const [answerKeys, setAnswerKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedAnswerKey, setSelectedAnswerKey] = useState(null);
  const [skipVerifyDetection, setSkipVerifyDetection] = useState(true);

  useEffect(() => {
    loadTemplates();
    loadSettings();

    // Pre-select answer key if passed from AnswerKeysScreen
    if (route.params?.answerKey) {
      setSelectedAnswerKey(route.params.answerKey);
    }
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setSkipVerifyDetection(settings.skipVerifyDetection !== false); // Default to true
    } catch (error) {
      console.error('Error loading settings:', error);
      // Default to true if error
      setSkipVerifyDetection(true);
    }
  };

  // Handle uploaded image from Home Screen (after template is loaded)
  useEffect(() => {
    if (
      selectedTemplate &&
      route.params?.uploadedImageUri &&
      route.params?.isUpload
    ) {
      // Image was uploaded from Home Screen, proceed directly to processing
      handleUploadedImage(route.params.uploadedImageUri);
    }
  }, [selectedTemplate, route.params]);

  const loadTemplates = async () => {
    try {
      // Load default templates from TemplateLoader
      const defaultTemplates = TemplateLoader.getDefaultTemplates();

      // Load actual template data for each
      const templatesWithData = await Promise.all(
        defaultTemplates.map(async templateInfo => {
          try {
            const templateData = await TemplateLoader.loadBundledTemplate(
              templateInfo.id
            );
            return {
              ...templateInfo,
              data: templateData
            };
          } catch (error) {
            console.error(`Failed to load template ${templateInfo.id}:`, error);
            return templateInfo;
          }
        })
      );

      setTemplates(templatesWithData);

      // Auto-select the first/default template (usually 'dxuian')
      if (templatesWithData.length > 0) {
        setSelectedTemplate(templatesWithData[0]);
        console.log(
          '✅ Auto-selected default template:',
          templatesWithData[0].name
        );
      }

      // Load answer keys
      const keys = await getAllAnswerKeys();
      setAnswerKeys(keys);
    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleStartScanning = async () => {
    // Template should always be selected (auto-selected by default)
    if (!selectedTemplate) {
      Alert.alert('Error', 'Template not loaded. Please try again.');
      return;
    }

    // Answer key is optional - allow scanning without grading
    // But show a warning if no answer key is selected
    if (!selectedAnswerKey) {
      Alert.alert(
        'No Answer Key Selected',
        'You can scan without an answer key, but grading will not be available. Continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => proceedWithScanning() }
        ]
      );
      return;
    }

    proceedWithScanning();
  };

  const proceedWithScanning = async () => {
    try {
      // Ensure template data is loaded
      let templateData = selectedTemplate.data;
      if (!templateData) {
        templateData = await TemplateLoader.loadBundledTemplate(
          selectedTemplate.id
        );
      }

      // Check if user uploaded an image
      const { uploadedImageUri, isUpload } = route.params || {};

      if (isUpload && uploadedImageUri) {
        // User uploaded an image - go directly to RectanglePreview
        console.log('🖼️ Uploaded image detected, skipping camera');
        navigateToRectanglePreview(uploadedImageUri, templateData);
      } else {
        // Normal flow - Navigate to camera
        navigation.navigate('Camera', {
          template: templateData,
          templateInfo: selectedTemplate,
          answerKey: selectedAnswerKey // Can be null if no answer key selected
        });
      }
    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Error', 'Failed to load template data');
    }
  };

  const navigateToRectanglePreview = async (imageUri, templateData) => {
    navigation.navigate('RectanglePreview', {
      imageUri: imageUri,
      originalUri: imageUri,
      template: templateData,
      templateInfo: selectedTemplate,
      assetId: null,
      preCropEnabled: false,
      answerKey: selectedAnswerKey,
      skipToResults: skipVerifyDetection // Pass flag to auto-proceed
    });
  };

  const navigateDirectlyToResults = async (imageUri, templateData) => {
    // Do rectangle detection in background, then go to Results
    try {
      // Call rectangle detection API
      const detectionResponse = await apiService.detectRectangles(imageUri);

      if (
        detectionResponse.success &&
        detectionResponse.data.cropped_image_uri
      ) {
        // Use cropped image for processing
        const croppedUri = detectionResponse.data.cropped_image_uri;

        navigation.navigate('Results', {
          imageUri: croppedUri,
          template: templateData,
          templateInfo: selectedTemplate,
          assetId: null,
          answerKey: selectedAnswerKey,
          detectionInfo: {
            rectanglesFound: detectionResponse.data.rectangles_found || 0,
            selectedRectangle:
              detectionResponse.data.selected_rectangle || null,
            imageQuality: {
              resolution: detectionResponse.data.image_dimensions || 'Unknown',
              brightness: detectionResponse.data.brightness_status || 'Unknown',
              sharpness: detectionResponse.data.sharpness_status || 'Unknown'
            },
            warnings: detectionResponse.data.warnings || []
          }
        });
      } else {
        // If detection fails, use original image
        console.warn('Rectangle detection failed, using original image');
        navigation.navigate('Results', {
          imageUri: imageUri,
          template: templateData,
          templateInfo: selectedTemplate,
          assetId: null,
          answerKey: selectedAnswerKey
        });
      }
    } catch (error) {
      console.error('Error in rectangle detection:', error);
      // On error, use original image and proceed
      navigation.navigate('Results', {
        imageUri: imageUri,
        template: templateData,
        templateInfo: selectedTemplate,
        assetId: null,
        answerKey: selectedAnswerKey
      });
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
        console.log('🖼️ Image selected from Template Screen:', imageUri);

        // Ensure template is selected
        if (!selectedTemplate) {
          Alert.alert('Error', 'Template not loaded. Please try again.');
          setUploading(false);
          return;
        }

        // Ensure template data is loaded
        let templateData = selectedTemplate.data;
        if (!templateData) {
          templateData = await TemplateLoader.loadBundledTemplate(
            selectedTemplate.id
          );
        }

        // Navigate based on settings
        if (skipVerifyDetection) {
          // Skip Verify Detection screen, go directly to Results
          navigateDirectlyToResults(imageUri, templateData);
        } else {
          // Show Verify Detection screen
          navigateToRectanglePreview(imageUri, templateData);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadedImage = async imageUri => {
    // Handle image uploaded from Home Screen
    if (!selectedTemplate) {
      // Wait for template to load
      return;
    }

    try {
      // Ensure template data is loaded
      let templateData = selectedTemplate.data;
      if (!templateData) {
        templateData = await TemplateLoader.loadBundledTemplate(
          selectedTemplate.id
        );
      }

      // Navigate based on settings
      if (skipVerifyDetection) {
        // Skip Verify Detection screen, go directly to Results
        navigateDirectlyToResults(imageUri, templateData);
      } else {
        // Show Verify Detection screen
        navigateToRectanglePreview(imageUri, templateData);
      }
    } catch (error) {
      console.error('Error processing uploaded image:', error);
      Alert.alert('Error', 'Failed to process uploaded image');
    }
  };

  const validateTemplate = async template => {
    try {
      // In a real app, you would validate the template file exists
      // For now, we'll assume all default templates are valid
      return true;
    } catch (error) {
      Alert.alert('Invalid Template', 'Template file is corrupted or missing');
      return false;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Paragraph style={styles.loadingText}>Loading templates...</Paragraph>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.headerTitle}>🔑 Select Answer Key</Title>
            <Paragraph style={styles.headerText}>
              Choose an answer key to grade the exam. The template is already
              configured.
            </Paragraph>
            {selectedTemplate && (
              <View style={styles.templateInfoBadge}>
                <Paragraph style={styles.templateInfoText}>
                  📋 Template:{' '}
                  <Text style={styles.templateInfoBold}>
                    {selectedTemplate.name}
                  </Text>
                </Paragraph>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Template Info (Collapsed/Read-only) - Only show if multiple templates exist */}
        {templates.length > 1 && (
          <Card style={styles.templateInfoCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>
                📋 Template (Click to Change)
              </Title>
              {templates.map(template => (
                <Card
                  key={template.id}
                  style={[
                    styles.templateCardCompact,
                    selectedTemplate?.id === template.id && styles.selectedCard
                  ]}
                  onPress={() => setSelectedTemplate(template)}>
                  <Card.Content>
                    <View style={styles.templateHeaderCompact}>
                      <View style={styles.templateInfo}>
                        <Title style={styles.templateName}>
                          {template.name}
                        </Title>
                        <Paragraph style={styles.templateDesc}>
                          {template.questions} Questions •{' '}
                          {template.options.join(', ')} Options
                        </Paragraph>
                      </View>
                      {selectedTemplate?.id === template.id && (
                        <Chip icon="check" style={styles.selectedChip}>
                          Selected
                        </Chip>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Answer Key Selection (Primary Focus) */}
        {selectedTemplate && (
          <Card style={styles.answerKeyCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>🔑 Answer Key Selection</Title>
              <Paragraph style={styles.sectionText}>
                Select an answer key to automatically grade the exam. You can
                also scan without an answer key.
              </Paragraph>

              {answerKeys.length === 0 ? (
                <View style={styles.noAnswerKeys}>
                  <Paragraph style={styles.noAnswerKeysText}>
                    ⚠️ No answer keys available. You must create one to proceed.
                  </Paragraph>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('AnswerKeys')}
                    buttonColor="#FF9800"
                    icon="plus">
                    Create Answer Key
                  </Button>
                </View>
              ) : (
                <RadioButton.Group
                  onValueChange={value => {
                    if (value === '') {
                      setSelectedAnswerKey(null);
                    } else {
                      setSelectedAnswerKey(
                        answerKeys.find(k => k.id === value)
                      );
                    }
                  }}
                  value={selectedAnswerKey?.id || ''}>
                  <List.Item
                    title="None (No Grading)"
                    description="Scan without automatic grading"
                    left={() => <RadioButton.Android value="" />}
                    style={!selectedAnswerKey && styles.selectedListItem}
                  />
                  {answerKeys.map(key => (
                    <List.Item
                      key={key.id}
                      title={key.name}
                      description={`${key.subject || 'No subject'} • ${
                        key.totalQuestions
                      } questions`}
                      left={() => <RadioButton.Android value={key.id} />}
                      style={
                        selectedAnswerKey?.id === key.id &&
                        styles.selectedListItem
                      }
                    />
                  ))}
                </RadioButton.Group>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        {selectedTemplate && (
          <View style={styles.actionButtonsContainer}>
            <Button
              mode="outlined"
              style={styles.uploadButton}
              onPress={handleUploadImage}
              icon="upload"
              loading={uploading}
              disabled={uploading}>
              Upload Image
            </Button>
            <Button
              mode="contained"
              style={styles.startButton}
              onPress={handleStartScanning}
              icon="camera">
              {selectedAnswerKey
                ? 'Start Camera with Grading'
                : 'Start Camera (No Grading)'}
            </Button>
          </View>
        )}

        {/* Instructions */}
        <Card style={styles.instructionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>💡 Quick Tips</Title>
            <Paragraph style={styles.instructionText}>
              • Answer key is optional - you can scan without grading{'\n'}• If
              you select an answer key, the exam will be automatically graded
              {'\n'}• Create answer keys in Teacher Tools section{'\n'}•
              Template is pre-configured and ready to use
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  headerCard: {
    marginBottom: 16,
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  headerText: {
    fontSize: 14,
    color: '#4A4A4A',
    marginTop: 4
  },
  templateCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8E9'
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  templateInfo: {
    flex: 1
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  templateDesc: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2
  },
  templateStats: {
    alignItems: 'flex-end'
  },
  statText: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '500'
  },
  templateActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  previewButton: {
    borderColor: '#2E7D32',
    borderWidth: 1
  },
  selectButton: {
    backgroundColor: '#2E7D32',
    marginLeft: 12
  },
  instructionCard: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  instructionText: {
    fontSize: 12,
    color: '#4A4A4A',
    lineHeight: 18,
    marginTop: 4
  },
  templateImage: {
    width: '100%',
    height: 150,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5'
  },
  answerKeyCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2
  },
  sectionText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12
  },
  noAnswerKeys: {
    padding: 16,
    alignItems: 'center'
  },
  noAnswerKeysText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  uploadButton: {
    flex: 1,
    borderColor: '#2E7D32',
    borderWidth: 2,
    paddingVertical: 8
  },
  startButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 8
  },
  templateInfoBadge: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D32'
  },
  templateInfoText: {
    fontSize: 13,
    color: '#4A4A4A'
  },
  templateInfoBold: {
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  templateInfoCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 1
  },
  templateCardCompact: {
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
    elevation: 1
  },
  templateHeaderCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  selectedChip: {
    backgroundColor: '#E8F5E8'
  },
  selectedListItem: {
    backgroundColor: '#F1F8E9'
  }
});
