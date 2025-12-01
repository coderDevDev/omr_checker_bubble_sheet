import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
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
import { TemplateLoader } from '../utils/templateLoader';
import { getAllAnswerKeys } from '../services/database';

export default function TemplateScreen({ navigation, route }) {
  const [templates, setTemplates] = useState([]);
  const [answerKeys, setAnswerKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedAnswerKey, setSelectedAnswerKey] = useState(null);

  useEffect(() => {
    loadTemplates();
    
    // Pre-select answer key if passed from AnswerKeysScreen
    if (route.params?.answerKey) {
      setSelectedAnswerKey(route.params.answerKey);
    }
  }, []);

  const loadTemplates = async () => {
    try {
      // Load default templates from TemplateLoader
      const defaultTemplates = TemplateLoader.getDefaultTemplates();
      
      // Load actual template data for each
      const templatesWithData = await Promise.all(
        defaultTemplates.map(async (templateInfo) => {
          try {
            const templateData = await TemplateLoader.loadBundledTemplate(templateInfo.id);
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
    if (!selectedTemplate) {
      Alert.alert('Error', 'Please select a template');
      return;
    }
    
    if (!selectedAnswerKey) {
      Alert.alert('Answer Key Required', 'Please select an answer key to grade the exam');
      return;
    }
    
    try {
      // Ensure template data is loaded
      let templateData = selectedTemplate.data;
      if (!templateData) {
        templateData = await TemplateLoader.loadBundledTemplate(selectedTemplate.id);
      }
      
      // Check if user uploaded an image
      const { uploadedImageUri, isUpload } = route.params || {};
      
      if (isUpload && uploadedImageUri) {
        // User uploaded an image - go directly to RectanglePreview
        console.log('🖼️ Uploaded image detected, skipping camera');
        navigation.navigate('RectanglePreview', {
          imageUri: uploadedImageUri,
          originalUri: uploadedImageUri,
          template: templateData,
          templateInfo: selectedTemplate,
          assetId: null,
          preCropEnabled: false,
          answerKey: selectedAnswerKey
        });
      } else {
        // Normal flow - Navigate to camera
        navigation.navigate('Camera', { 
          template: templateData,
          templateInfo: selectedTemplate,
          answerKey: selectedAnswerKey  // Can be null if no answer key selected
        });
      }
    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Error', 'Failed to load template data');
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
            <Title style={styles.headerTitle}>📋 Select OMR Template</Title>
            <Paragraph style={styles.headerText}>
              Choose the template that matches your OMR sheet layout
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Template List */}
        {templates.map(template => (
          <Card
            key={template.id}
            style={[
              styles.templateCard,
              selectedTemplate?.id === template.id && styles.selectedCard
            ]}
            onPress={() => setSelectedTemplate(template)}>
            <Card.Content>
              {/* Template Preview Image */}
              {template.image && (
                <Image 
                  source={template.image} 
                  style={styles.templateImage}
                  resizeMode="contain"
                />
              )}
              
              <View style={styles.templateHeader}>
                <View style={styles.templateInfo}>
                  <Title style={styles.templateName}>{template.name}</Title>
                  <Paragraph style={styles.templateDesc}>
                    {template.description}
                  </Paragraph>
                </View>
                <View style={styles.templateStats}>
                  <Paragraph style={styles.statText}>
                    {template.questions} Questions
                  </Paragraph>
                  <Paragraph style={styles.statText}>
                    {template.options.join(', ')} Options
                  </Paragraph>
                </View>
              </View>

            </Card.Content>
          </Card>
        ))}

        {/* Answer Key Selection (Required) */}
        {selectedTemplate && (
          <Card style={styles.answerKeyCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>🔑 Answer Key (Required)</Title>
              <Paragraph style={styles.sectionText}>
                Select an answer key to grade and check the exam
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
                  onValueChange={value => setSelectedAnswerKey(answerKeys.find(k => k.id === value))}
                  value={selectedAnswerKey?.id || ''}>
                  <List.Item
                    title="None (No Grading)"
                    left={() => <RadioButton.Android value="" />}
                  />
                  {answerKeys.map(key => (
                    <List.Item
                      key={key.id}
                      title={key.name}
                      description={`${key.subject || 'No subject'} • ${key.totalQuestions} questions`}
                      left={() => <RadioButton.Android value={key.id} />}
                    />
                  ))}
                </RadioButton.Group>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Start Scanning Button */}
        {selectedTemplate && (
          <Button
            mode="contained"
            style={styles.startButton}
            onPress={handleStartScanning}
            icon="camera">
            Start Scanning
          </Button>
        )}

        {/* Instructions */}
        <Card style={styles.instructionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>💡 Template Tips</Title>
            <Paragraph style={styles.instructionText}>
              • Make sure your OMR sheet matches the selected template{'\n'}•
              Template defines bubble positions and question layout{'\n'}•
              Camera overlay will guide you for perfect alignment{'\n'}• You can
              create custom templates in the desktop version
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
  startButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    marginBottom: 16
  }
});
