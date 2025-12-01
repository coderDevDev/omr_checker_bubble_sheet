import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Share,
  Modal,
  TouchableOpacity,
  Dimensions,
  FlatList
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  DataTable,
  Chip,
  ActivityIndicator,
  Surface,
  Text as PaperText
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import apiService from '../services/apiService';
import { gradeAnswers, calculateGrade, getPerformanceCategory } from '../services/gradingService';
import { saveResult } from '../services/database';

export default function ResultsScreen({ navigation, route }) {
  const { imageUri, template, templateInfo, assetId, answerKey } = route.params;
  const [processing, setProcessing] = useState(true);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('Initializing...');
  const [markedImageUri, setMarkedImageUri] = useState(null);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    processOMR();
  }, []);

  const processOMR = async () => {
    try {
      setProcessing(true);
      setProcessingStatus('Connecting to server...');
      
      // Check server health first
      const healthCheck = await apiService.checkServerHealth();
      if (!healthCheck.success) {
        throw new Error('Cannot connect to processing server. Make sure the Python server is running.');
      }

      setProcessingStatus('Uploading image...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setProcessingStatus('Processing with Python backend...');
      
      // Send image to Python backend for processing
      const response = await apiService.processImage(imageUri, 'dxuian');
      
      if (!response.success) {
        throw new Error(response.error || 'Processing failed');
      }
      
      const apiData = response.data;
      
      setProcessingStatus('Analyzing answers...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Save marked image if available
      let savedMarkedImageUri = null;
      if (apiData.marked_image) {
        try {
          savedMarkedImageUri = await apiService.saveMarkedImage(
            apiData.marked_image,
            `marked_${Date.now()}.jpg`
          );
          setMarkedImageUri(savedMarkedImageUri);
        } catch (saveError) {
          console.warn('Could not save marked image:', saveError);
        }
      }

      // Convert API response to display format
      const answers = [];
      const answersDict = apiData.answers || {};
      
      // Extract question answers
      for (let i = 1; i <= apiData.total_questions; i++) {
        const questionKey = `Q${i}`;
        const answer = answersDict[questionKey];
        
        answers.push({
          question: questionKey,
          selected: answer || '-',
          confidence: answer && answer !== '-' ? 0.9 : 0.0, // API doesn't provide confidence, using placeholder
          multiMarked: false // API provides multi_marked_count but not per-question data
        });
      }
      
      // Calculate statistics
      const answeredCount = answers.filter(a => a.selected !== '-').length;
      const unansweredCount = answers.filter(a => a.selected === '-').length;

      // Check if answer key is provided for grading
      let gradingResults = null;
      let grade = null;
      let performance = null;

      if (answerKey) {
        setProcessingStatus('Grading answers...');
        
        // Grade the answers
        gradingResults = gradeAnswers(
          answersDict,
          answerKey,
          {
            negativeMarking: answerKey.negativeMarking || false,
            negativeMarkValue: answerKey.negativeMarkValue || 0.25,
            pointsPerQuestion: answerKey.pointsPerQuestion || 1
          }
        );
        
        // Calculate grade
        grade = calculateGrade(gradingResults.summary.percentage);
        performance = getPerformanceCategory(gradingResults.summary.percentage);
        
        // Update answers array with grading info
        answers.forEach((answer, index) => {
          const gradingResult = gradingResults.results[index];
          if (gradingResult) {
            answer.correctAnswer = gradingResult.correctAnswer;
            answer.isCorrect = gradingResult.isCorrect;
            answer.status = gradingResult.status;
          }
        });
        
        // Save result to database
        try {
          await saveResult({
            id: `result_${Date.now()}`,
            studentId: 'manual', // TODO: Add student selection
            studentName: 'Unknown',
            answerKeyId: answerKey.id,
            examName: answerKey.name,
            examDate: new Date().toISOString(),
            answers: answersDict,
            grading: gradingResults.results,
            ...gradingResults.summary,
            grade,
            passed: gradingResults.summary.percentage >= 40,
            markedImageUri: savedMarkedImageUri
          });
        } catch (saveError) {
          console.warn('Could not save result:', saveError);
        }
      }

      // Format results for display
      const formattedResults = {
        totalQuestions: apiData.total_questions,
        answeredQuestions: answeredCount,
        unansweredQuestions: unansweredCount,
        multiMarkedQuestions: apiData.multi_marked_count || 0,
        answers: answers,
        timestamp: apiData.timestamp,
        processingMethod: 'Python Backend (Feature-Based Alignment)',
        sessionId: apiData.session_id,
        fileName: apiData.file_name,
        // Grading info (if answer key provided)
        hasGrading: !!answerKey,
        answerKeyName: answerKey?.name,
        score: gradingResults?.summary.totalScore,
        maxScore: gradingResults?.summary.maxPossibleScore,
        percentage: gradingResults?.summary.percentage,
        grade,
        performance,
        correctCount: gradingResults?.summary.correctCount,
        incorrectCount: gradingResults?.summary.incorrectCount
      };

      setResults(formattedResults);
      
      // Show success message with or without grading
      if (answerKey) {
        Alert.alert(
          '✅ Grading Complete!',
          `Score: ${formattedResults.score}/${formattedResults.maxScore} (${formattedResults.percentage}%)\nGrade: ${grade}\nStatus: ${formattedResults.percentage >= 40 ? 'PASS' : 'FAIL'}`,
          [{ text: 'View Results' }]
        );
      } else {
        Alert.alert(
          'Success!',
          `Processed ${apiData.total_questions} questions successfully.`,
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Processing error:', error);
      setError(error.message || 'Failed to process OMR sheet');
      
      Alert.alert(
        'Processing Failed',
        error.message || 'An error occurred while processing the OMR sheet.',
        [
          { text: 'Retry', onPress: () => processOMR() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setProcessing(false);
    }
  };


  const exportResults = async () => {
    try {
      if (!results) return;

      // Create CSV content
      const csvHeader = 'Question,Selected Answer,Confidence,Multi-Marked\n';
      const csvRows = results.answers
        .map(
          answer =>
            `${answer.question},${answer.selected},${(answer.confidence * 100).toFixed(1)}%,${
              answer.multiMarked ? 'Yes' : 'No'
            }`
        )
        .join('\n');

      const csvContent = csvHeader + csvRows;

      // Save to file
      const fileName = `OMR_Results_${
        new Date().toISOString().split('T')[0]
      }.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      // Share the file
      await Share.share({
        url: fileUri,
        title: 'OMR Results',
        message: `OMR Scanning Results - ${results.totalQuestions} questions processed`
      });
      
      Alert.alert('Success', 'Results exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Failed to export results');
    }
  };

  const retakePhoto = () => {
    navigation.navigate('Camera', { template, templateInfo });
  };

  if (processing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <PaperText style={styles.loadingTitle}>Processing OMR Sheet</PaperText>
          <PaperText style={styles.loadingText}>
            {processingStatus}
          </PaperText>
          <PaperText style={styles.loadingSubtext}>
            This may take a few seconds...
          </PaperText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <PaperText style={styles.errorTitle}>Processing Failed</PaperText>
          <PaperText style={styles.errorText}>{error}</PaperText>
          <Button
            mode="contained"
            onPress={retakePhoto}
            style={styles.retryButton}>
            Retake Photo
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Modal Viewer */}
        <Modal
          visible={modalImage !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalImage(null)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1}
              onPress={() => setModalImage(null)}>
              <View style={styles.modalContent}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalImage(null)}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                {modalImage && (
                  <Image 
                    source={{ uri: modalImage }} 
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.modalHint}>Tap outside to close</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Captured Image */}
        <Card style={styles.imageCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>📸 Captured Image</Title>
            <TouchableOpacity onPress={() => setModalImage(imageUri)}>
              <Image source={{ uri: imageUri }} style={styles.capturedImage} />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageOverlayText}>🔍 Tap to zoom</Text>
              </View>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Marked Image (if available) */}
        {markedImageUri && (
          <Card style={styles.imageCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>✅ Marked Image (From Backend)</Title>
              <Paragraph style={styles.markedImageNote}>
                This image shows detected bubbles marked by the Python backend
              </Paragraph>
              <TouchableOpacity onPress={() => setModalImage(markedImageUri)}>
                <Image source={{ uri: markedImageUri }} style={styles.capturedImage} />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageOverlayText}>🔍 Tap to zoom</Text>
                </View>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        )}

        {/* Grading Results (if answer key was used) */}
        {results.hasGrading && (
          <Card style={styles.gradingCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>🎓 Exam Results</Title>
              <Paragraph style={styles.examName}>
                {results.answerKeyName}
              </Paragraph>

              <View style={styles.gradeContainer}>
                <Surface style={[styles.gradeSurface, { backgroundColor: results.performance.color + '20' }]}>
                  <Title style={[styles.gradeText, { color: results.performance.color }]}>
                    {results.grade}
                  </Title>
                  <Paragraph style={styles.gradeLabel}>Grade</Paragraph>
                </Surface>

                <View style={styles.gradeStats}>
                  <View style={styles.gradeStatItem}>
                    <Title style={styles.gradeStatNumber}>{results.score}/{results.maxScore}</Title>
                    <Paragraph style={styles.gradeStatLabel}>Score</Paragraph>
                  </View>
                  <View style={styles.gradeStatItem}>
                    <Title style={styles.gradeStatNumber}>{results.percentage}%</Title>
                    <Paragraph style={styles.gradeStatLabel}>Percentage</Paragraph>
                  </View>
                </View>
              </View>

              <View style={styles.passFailContainer}>
                <Chip
                  style={[
                    styles.passFailChip,
                    { backgroundColor: results.percentage >= 40 ? '#4CAF50' : '#F44336' }
                  ]}
                  textStyle={styles.passFailText}>
                  {results.percentage >= 40 ? '✓ PASS' : '✗ FAIL'}
                </Chip>
                <Chip
                  style={styles.performanceChip}
                  textStyle={styles.performanceText}>
                  {results.performance.emoji} {results.performance.category}
                </Chip>
              </View>

              <View style={styles.correctIncorrectStats}>
                <View style={styles.correctIncorrectItem}>
                  <Title style={[styles.correctIncorrectNumber, { color: '#4CAF50' }]}>
                    {results.correctCount}
                  </Title>
                  <Paragraph style={styles.correctIncorrectLabel}>✓ Correct</Paragraph>
                </View>
                <View style={styles.correctIncorrectItem}>
                  <Title style={[styles.correctIncorrectNumber, { color: '#F44336' }]}>
                    {results.incorrectCount}
                  </Title>
                  <Paragraph style={styles.correctIncorrectLabel}>✗ Incorrect</Paragraph>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Processing Summary */}
        <Card style={styles.scoreCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>📊 Processing Summary</Title>
            <View style={styles.scoreContainer}>
              <Surface style={styles.scoreSurface}>
                <Title style={styles.scoreText}>{results.totalQuestions}</Title>
                <Paragraph style={styles.scoreLabel}>Questions</Paragraph>
              </Surface>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Title style={styles.statNumber}>
                    {results.answeredQuestions}
                  </Title>
                  <Paragraph style={styles.statLabel}>Answered</Paragraph>
                </View>
                <View style={styles.statItem}>
                  <Title style={styles.statNumber}>
                    {results.unansweredQuestions}
                  </Title>
                  <Paragraph style={styles.statLabel}>Unanswered</Paragraph>
                </View>
                <View style={styles.statItem}>
                  <Title style={styles.statNumber}>
                    {results.multiMarkedQuestions}
                  </Title>
                  <Paragraph style={styles.statLabel}>Multi-Marked</Paragraph>
                </View>
              </View>
            </View>
            <Paragraph style={styles.processingInfo}>
              Processing Method: {results.processingMethod}
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Answer Details */}
        <Card style={styles.answersCard}>
          <Card.Content>
            <View style={styles.answerDetailsHeader}>
              <Title style={styles.sectionTitle}>📝 Answer Details</Title>
              <Paragraph style={styles.answerDetailsSubtitle}>
                {showAllAnswers ? `All ${results.answers.length} questions` : `First 20 of ${results.answers.length} questions`}
              </Paragraph>
            </View>
          </Card.Content>
          
          <View style={styles.answerListContainer}>
            <FlatList
              data={showAllAnswers ? results.answers : results.answers.slice(0, 20)}
              keyExtractor={(item) => item.question}
              scrollEnabled={false}
              renderItem={({ item: answer }) => (
                <View
                  style={[
                    styles.answerItem,
                    results.hasGrading && answer.status === 'correct' && styles.answerItemCorrect,
                    results.hasGrading && answer.status === 'incorrect' && styles.answerItemWrong
                  ]}>
                  <View style={styles.answerItemLeft}>
                    <Text style={styles.questionNumber}>{answer.question.replace('Q', '')}</Text>
                  </View>
                  
                  <View style={styles.answerItemCenter}>
                    <View style={styles.answerRow}>
                      <Text style={styles.answerLabel}>Your Answer:</Text>
                      <Chip style={styles.answerChip} textStyle={styles.answerChipText}>
                        {answer.selected}
                      </Chip>
                    </View>
                    
                    {results.hasGrading && (
                      <View style={styles.answerRow}>
                        <Text style={styles.answerLabel}>Correct Answer:</Text>
                        <Chip style={styles.correctAnswerChip} textStyle={styles.correctAnswerChipText}>
                          {answer.correctAnswer}
                        </Chip>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.answerItemRight}>
                    {results.hasGrading ? (
                      <View style={[
                        styles.statusBadge,
                        answer.status === 'correct' ? styles.statusBadgeCorrect :
                        answer.status === 'incorrect' ? styles.statusBadgeWrong :
                        styles.statusBadgeUnanswered
                      ]}>
                        <Text style={styles.statusBadgeText}>
                          {answer.status === 'correct' ? '✓' :
                           answer.status === 'incorrect' ? '✗' : '○'}
                        </Text>
                      </View>
                    ) : (
                      <View style={[
                        styles.statusBadge,
                        answer.multiMarked ? styles.statusBadgeWrong : styles.statusBadgeCorrect
                      ]}>
                        <Text style={styles.statusBadgeText}>
                          {answer.multiMarked ? '⚠' : '✓'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
          
          <Card.Content>
            {results.answers.length > 20 && (
              <Button
                mode="contained"
                style={styles.showAllButton}
                buttonColor="#2E7D32"
                onPress={() => setShowAllAnswers(!showAllAnswers)}
                icon={showAllAnswers ? "chevron-up" : "chevron-down"}>
                {showAllAnswers ? 'Show Less' : `Show All ${results.answers.length} Answers`}
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>🔧 Actions</Title>

            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                style={styles.actionButton}
                onPress={exportResults}
                icon="download">
                Export CSV
              </Button>

              <Button
                mode="outlined"
                style={styles.actionButton}
                onPress={retakePhoto}
                icon="camera">
                Retake Photo
              </Button>

              <Button
                mode="contained"
                style={styles.actionButton}
                onPress={() => navigation.navigate('Home')}
                icon="home">
                New Scan
              </Button>
            </View>
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
    alignItems: 'center',
    padding: 20
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 16
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
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
    marginBottom: 16
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  imageCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover'
  },
  markedImageNote: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    fontStyle: 'italic'
  },
  scoreCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  scoreSurface: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666666'
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  statLabel: {
    fontSize: 12,
    color: '#666666'
  },
  answersCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2
  },
  statusChip: {
    minWidth: 30,
    height: 28
  },
  correctChip: {
    backgroundColor: '#C8E6C9'
  },
  wrongChip: {
    backgroundColor: '#FFCDD2'
  },
  chipText: {
    fontSize: 12,
    color: '#2E7D32'
  },
  moreAnswers: {
    alignItems: 'center'
  },
  moreText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic'
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    elevation: 2
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 4
  },
  retryButton: {
    backgroundColor: '#2E7D32'
  },
  processingInfo: {
    fontSize: 11,
    color: '#888888',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  unansweredChip: {
    backgroundColor: '#E0E0E0'
  },
  // Grading styles
  gradingCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32'
  },
  examName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    fontStyle: 'italic'
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  gradeSurface: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20
  },
  gradeText: {
    fontSize: 36,
    fontWeight: 'bold'
  },
  gradeLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4
  },
  gradeStats: {
    flex: 1
  },
  gradeStatItem: {
    marginBottom: 12
  },
  gradeStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  gradeStatLabel: {
    fontSize: 12,
    color: '#666666'
  },
  passFailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16
  },
  passFailChip: {
    paddingHorizontal: 16
  },
  passFailText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  performanceChip: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16
  },
  performanceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  correctIncorrectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  correctIncorrectItem: {
    alignItems: 'center'
  },
  correctIncorrectNumber: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  correctIncorrectLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4
  },
  answerDetailsHeader: {
    marginBottom: 12
  },
  answerDetailsSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4
  },
  answerChip: {
    backgroundColor: '#2196F3',
    height: 28
  },
  answerChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  correctAnswerChip: {
    backgroundColor: '#4CAF50',
    height: 28
  },
  correctAnswerChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  showAllButton: {
    marginTop: 16
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '95%',
    height: '90%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalImage: {
    width: '100%',
    height: '100%'
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000'
  },
  modalHint: {
    position: 'absolute',
    bottom: 20,
    color: '#FFFFFF',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    alignItems: 'center'
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  // Answer list styles
  answerListContainer: {
    paddingHorizontal: 8
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  answerItemCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50'
  },
  answerItemWrong: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336'
  },
  answerItemLeft: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  answerItemCenter: {
    flex: 1,
    paddingHorizontal: 12
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  answerLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    width: 100
  },
  answerItemRight: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusBadgeCorrect: {
    backgroundColor: '#4CAF50'
  },
  statusBadgeWrong: {
    backgroundColor: '#F44336'
  },
  statusBadgeUnanswered: {
    backgroundColor: '#9E9E9E'
  },
  statusBadgeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF'
  }
});
