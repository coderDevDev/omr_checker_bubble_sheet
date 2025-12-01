import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Switch,
  RadioButton,
  Chip,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveAnswerKey } from '../services/database';

export default function CreateAnswerKeyScreen({ navigation, route }) {
  const editMode = route.params?.answerKey;
  
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [pointsPerQuestion, setPointsPerQuestion] = useState('1');
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkValue, setNegativeMarkValue] = useState('0.25');
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editMode) {
      setName(editMode.name);
      setSubject(editMode.subject || '');
      setPointsPerQuestion(String(editMode.pointsPerQuestion || 1));
      setNegativeMarking(editMode.negativeMarking || false);
      setNegativeMarkValue(String(editMode.negativeMarkValue || 0.25));
      setAnswers(editMode.answers || {});
    }
  }, []);

  const setAnswer = (questionNum, answer) => {
    setAnswers(prev => ({
      ...prev,
      [`Q${questionNum}`]: answer
    }));
  };

  const setAnswersForRange = (start, end, answer) => {
    const newAnswers = { ...answers };
    for (let i = start; i <= end; i++) {
      newAnswers[`Q${i}`] = answer;
    }
    setAnswers(newAnswers);
  };

  const clearAnswers = () => {
    Alert.alert(
      'Clear All Answers',
      'Are you sure you want to clear all answers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setAnswers({})
        }
      ]
    );
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for this answer key');
      return;
    }

    const filledAnswers = Object.keys(answers).filter(k => answers[k]).length;
    if (filledAnswers === 0) {
      Alert.alert('Error', 'Please fill in at least one answer');
      return;
    }

    setSaving(true);

    const answerKey = {
      id: editMode?.id || `key_${Date.now()}`,
      name: name.trim(),
      subject: subject.trim(),
      totalQuestions: 100,
      pointsPerQuestion: parseFloat(pointsPerQuestion) || 1,
      negativeMarking,
      negativeMarkValue: negativeMarking ? parseFloat(negativeMarkValue) : 0,
      answers,
      createdAt: editMode?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await saveAnswerKey(answerKey);
    setSaving(false);

    if (result.success) {
      Alert.alert(
        'Success',
        editMode ? 'Answer key updated successfully!' : 'Answer key created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', 'Failed to save answer key');
    }
  };

  const QuickFillSection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>⚡ Quick Fill</Title>
        <Paragraph style={styles.sectionSubtitle}>
          Fill multiple questions at once
        </Paragraph>

        <View style={styles.quickFillRow}>
          <TextInput
            label="From Q"
            mode="outlined"
            value={quickFillStart}
            onChangeText={setQuickFillStart}
            keyboardType="numeric"
            style={styles.quickFillInput}
          />
          <TextInput
            label="To Q"
            mode="outlined"
            value={quickFillEnd}
            onChangeText={setQuickFillEnd}
            keyboardType="numeric"
            style={styles.quickFillInput}
          />
        </View>

        <View style={styles.optionButtons}>
          {['A', 'B', 'C', 'D'].map(option => (
            <Button
              key={option}
              mode="contained"
              onPress={() => {
                const start = parseInt(quickFillStart) || 1;
                const end = parseInt(quickFillEnd) || 100;
                if (start > 0 && end <= 100 && start <= end) {
                  setAnswersForRange(start, end, option);
                  Alert.alert('Success', `Questions ${start}-${end} filled with ${option}`);
                } else {
                  Alert.alert('Error', 'Invalid question range');
                }
              }}
              style={styles.optionButton}>
              {option}
            </Button>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const [quickFillStart, setQuickFillStart] = useState('1');
  const [quickFillEnd, setQuickFillEnd] = useState('20');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Basic Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>📝 Basic Information</Title>
            
            <TextInput
              label="Answer Key Name *"
              mode="outlined"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Math Midterm 2025"
              style={styles.input}
            />

            <TextInput
              label="Subject (Optional)"
              mode="outlined"
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g., Mathematics"
              style={styles.input}
            />

            <TextInput
              label="Points Per Question"
              mode="outlined"
              value={pointsPerQuestion}
              onChangeText={setPointsPerQuestion}
              keyboardType="numeric"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Negative Marking */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.switchRow}>
              <View>
                <Title style={styles.switchTitle}>Negative Marking</Title>
                <Paragraph style={styles.switchSubtitle}>
                  Deduct points for wrong answers
                </Paragraph>
              </View>
              <Switch
                value={negativeMarking}
                onValueChange={setNegativeMarking}
                color="#2E7D32"
              />
            </View>

            {negativeMarking && (
              <TextInput
                label="Negative Mark Value"
                mode="outlined"
                value={negativeMarkValue}
                onChangeText={setNegativeMarkValue}
                keyboardType="numeric"
                placeholder="e.g., 0.25"
                style={styles.input}
              />
            )}
          </Card.Content>
        </Card>

        {/* Quick Fill */}
        <QuickFillSection />

        {/* Answer Grid */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.answerHeader}>
              <Title style={styles.sectionTitle}>✍️ Answers ({Object.keys(answers).filter(k => answers[k]).length}/100)</Title>
              <Button
                mode="text"
                onPress={clearAnswers}
                textColor="#D32F2F">
                Clear All
              </Button>
            </View>

            <Paragraph style={styles.sectionSubtitle}>
              Select the correct answer for each question
            </Paragraph>

            {[...Array(5)].map((_, columnIndex) => (
              <View key={columnIndex}>
                <Divider style={styles.divider} />
                <Paragraph style={styles.columnTitle}>
                  Questions {columnIndex * 20 + 1} - {(columnIndex + 1) * 20}
                </Paragraph>
                
                {[...Array(20)].map((_, rowIndex) => {
                  const questionNum = columnIndex * 20 + rowIndex + 1;
                  const questionId = `Q${questionNum}`;
                  const currentAnswer = answers[questionId];

                  return (
                    <View key={questionNum} style={styles.questionRow}>
                      <Paragraph style={styles.questionLabel}>{questionId}</Paragraph>
                      <RadioButton.Group
                        onValueChange={value => setAnswer(questionNum, value)}
                        value={currentAnswer || ''}>
                        <View style={styles.optionsRow}>
                          {['A', 'B', 'C', 'D'].map(option => (
                            <View key={option} style={styles.radioOption}>
                              <RadioButton.Android
                                value={option}
                                color="#2E7D32"
                              />
                              <Paragraph style={styles.optionLabel}>{option}</Paragraph>
                            </View>
                          ))}
                        </View>
                      </RadioButton.Group>
                    </View>
                  );
                })}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          icon="content-save">
          {editMode ? 'Update Answer Key' : 'Create Answer Key'}
        </Button>
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
  card: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 16
  },
  input: {
    marginBottom: 12
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#666666'
  },
  quickFillRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12
  },
  quickFillInput: {
    flex: 1
  },
  optionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#2E7D32'
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  divider: {
    marginVertical: 16
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    width: 50
  },
  optionsRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around'
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  optionLabel: {
    fontSize: 14,
    color: '#666666',
    marginLeft: -8
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8
  }
});
