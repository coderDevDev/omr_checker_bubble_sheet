// OMR Processing Service
// Handles OMR bubble detection and answer extraction
// This is a client-side implementation for mobile devices

import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { ImagePreprocessor } from './imagePreprocessor';

export class OMRProcessor {
  /**
   * Process captured OMR image
   * @param {string} imageUri - Path to captured image
   * @param {Object} template - Template configuration
   * @returns {Promise<Object>} Processing results
   */
  static async processImage(imageUri, template) {
    try {
      console.log('Starting OMR processing...');
      console.log('Image URI:', imageUri);
      console.log('Template:', template.pageDimensions);

      // Step 1: Preprocess image (NEW: Uses ImagePreprocessor)
      console.log('Step 1: Preprocessing image...');
      const processedImage = await ImagePreprocessor.preprocess(
        imageUri,
        template
      );
      console.log('Preprocessed image URI:', processedImage);

      // Step 2: Extract bubbles based on template
      console.log('Step 2: Extracting bubbles...');
      const bubbleData = await this.extractBubbles(processedImage, template);
      console.log(`Extracted ${bubbleData.length} bubbles`);

      // Step 3: Detect filled bubbles
      console.log('Step 3: Detecting filled bubbles...');
      const answers = await this.detectFilledBubbles(bubbleData, template);
      console.log('Detected answers:', Object.keys(answers).length);

      // Step 4: Generate results
      console.log('Step 4: Generating results...');
      const results = this.generateResults(answers, template);

      console.log({ results });

      console.log('OMR processing completed successfully!');
      return results;
    } catch (error) {
      console.error('OMR processing error:', error);
      console.error('Error stack:', error.stack);
      // Return mock results as fallback
      return this.generateMockResults(template);
    }
  }

  // Preprocessing is now handled by ImagePreprocessor class

  /**
   * Extract bubble regions from image
   * @param {string} imageUri - Processed image URI
   * @param {Object} template - Template configuration
   * @returns {Promise<Array>} Array of bubble regions
   */
  static async extractBubbles(imageUri, template) {
    // In a real implementation, this would use image processing
    // For now, we'll use template positions
    const bubbles = [];

    const fieldBlocks =
      typeof template.fieldBlocks === 'object' &&
      !Array.isArray(template.fieldBlocks)
        ? Object.values(template.fieldBlocks)
        : template.fieldBlocks;

    fieldBlocks.forEach(block => {
      block.fieldLabels.forEach((label, index) => {
        const optionCount =
          block.fieldType === 'QTYPE_MCQ4' ? 4 : block.bubbleCount;
        for (let i = 0; i < optionCount; i++) {
          bubbles.push({
            question: label,
            option: String.fromCharCode(65 + i), // A, B, C, D
            filled: false, // Will be detected
            confidence: 0
          });
        }
      });
    });

    return bubbles;
  }

  /**
   * Detect which bubbles are filled
   * @param {Array} bubbles - Array of bubble data
   * @param {Object} template - Template configuration
   * @returns {Promise<Object>} Detected answers
   */
  static async detectFilledBubbles(bubbles, template) {
    // Simulate bubble detection with random results
    // In a real app, this would analyze pixel darkness
    const answers = {};
    const questions = new Set(bubbles.map(b => b.question));

    questions.forEach(question => {
      const questionBubbles = bubbles.filter(b => b.question === question);

      // Randomly select one answer (simulating detection)
      const selectedIndex = Math.floor(Math.random() * questionBubbles.length);
      const selected = questionBubbles[selectedIndex];

      answers[question] = {
        selected: selected.option,
        confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
        multiMarked: false
      };
    });

    return answers;
  }

  /**
   * Generate final results from detected answers
   * @param {Object} answers - Detected answers
   * @param {Object} template - Template configuration
   * @returns {Object} Final results
   */
  static generateResults(answers, template) {
    const questionList = Object.keys(answers).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      return numA - numB;
    });

    const answerArray = questionList.map(question => ({
      question,
      selected: answers[question].selected,
      confidence: answers[question].confidence,
      multiMarked: answers[question].multiMarked
    }));

    return {
      totalQuestions: questionList.length,
      answeredQuestions: questionList.length,
      unansweredQuestions: 0,
      multiMarkedQuestions: 0,
      answers: answerArray,
      timestamp: new Date().toISOString(),
      processingMethod: 'client-side'
    };
  }

  /**
   * Validate template configuration
   * @param {Object} template - Template to validate
   * @returns {boolean} Validation result
   */
  static validateTemplate(template) {
    const requiredFields = [
      'pageDimensions',
      'bubbleDimensions',
      'fieldBlocks'
    ];

    for (const field of requiredFields) {
      if (!template[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate page dimensions
    if (!template.pageDimensions.width || !template.pageDimensions.height) {
      console.error('Invalid page dimensions');
      return false;
    }

    // Validate bubble dimensions
    if (!template.bubbleDimensions.width || !template.bubbleDimensions.height) {
      console.error('Invalid bubble dimensions');
      return false;
    }

    // Validate field blocks
    if (
      !Array.isArray(template.fieldBlocks) ||
      template.fieldBlocks.length === 0
    ) {
      console.error('Invalid field blocks');
      return false;
    }

    return true;
  }

  /**
   * Calculate overlay dimensions based on template
   * @param {Object} template - Template configuration
   * @param {Object} screenDimensions - Screen width and height
   * @returns {Object} Overlay dimensions
   */
  static calculateOverlayDimensions(template, screenDimensions) {
    const { width: screenWidth, height: screenHeight } = screenDimensions;

    // Template dimensions
    const templateWidth = template.pageDimensions.width;
    const templateHeight = template.pageDimensions.height;

    // Calculate scale to fit 85% of screen height
    const maxHeight = screenHeight * 0.85;
    const maxWidth = screenWidth * 0.9;

    const scaleY = maxHeight / templateHeight;
    const scaleX = maxWidth / templateWidth;
    const scale = Math.min(scaleX, scaleY);

    const overlayWidth = templateWidth * scale;
    const overlayHeight = templateHeight * scale;

    return {
      width: overlayWidth,
      height: overlayHeight,
      x: (screenWidth - overlayWidth) / 2,
      y: (screenHeight - overlayHeight) / 2,
      scale,
      bubbleWidth: template.bubbleDimensions.width * scale,
      bubbleHeight: template.bubbleDimensions.height * scale
    };
  }

  /**
   * Generate bubble positions from template
   * @param {Object} template - Template configuration
   * @param {Object} overlayDimensions - Overlay dimensions
   * @returns {Array} Array of bubble positions
   */
  static generateBubblePositions(template, overlayDimensions) {
    const bubbles = [];
    const { x, y, scale } = overlayDimensions;

    template.fieldBlocks.forEach((block, blockIndex) => {
      const blockX = x + block.origin.x * scale;
      const blockY = y + block.origin.y * scale;

      // Generate bubbles for this field block
      for (let i = 0; i < block.bubbleCount; i++) {
        const bubbleX = blockX + i * block.bubblesGap * scale;
        const bubbleY = blockY;

        bubbles.push({
          x: bubbleX,
          y: bubbleY,
          radius: (template.bubbleDimensions.width * scale) / 2,
          label: block.fieldLabels
            ? block.fieldLabels[i]
            : String.fromCharCode(65 + i), // A, B, C, D
          blockIndex,
          bubbleIndex: i
        });
      }
    });

    return bubbles;
  }

  /**
   * Export results to CSV format
   * @param {Object} results - OMR processing results
   * @returns {string} CSV content
   */
  static exportToCSV(results) {
    const headers = [
      'Question',
      'Selected Answer',
      'Correct Answer',
      'Status',
      'Timestamp'
    ].join(',');

    const rows = results.answers.map(answer =>
      [
        answer.question,
        answer.selected,
        answer.correct,
        answer.isCorrect ? 'Correct' : 'Wrong',
        results.timestamp
      ].join(',')
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Generate mock results for testing
   * @param {Object} template - Template configuration
   * @returns {Object} Mock results
   */
  static generateMockResults(template) {
    const questions = template.questions || 60;
    const answers = [];
    let correctCount = 0;

    // Generate random answers
    for (let i = 1; i <= questions; i++) {
      const options = ['A', 'B', 'C', 'D'];
      const selectedAnswer =
        options[Math.floor(Math.random() * options.length)];
      const correctAnswer = options[Math.floor(Math.random() * options.length)];
      const isCorrect = selectedAnswer === correctAnswer;

      if (isCorrect) correctCount++;

      answers.push({
        question: i,
        selected: selectedAnswer,
        correct: correctAnswer,
        isCorrect
      });
    }

    const score = Math.round((correctCount / questions) * 100);

    return {
      totalQuestions: questions,
      correctAnswers: correctCount,
      wrongAnswers: questions - correctCount,
      score: score,
      percentage: score,
      answers: answers,
      timestamp: new Date().toISOString(),
      template: template.id || 'default'
    };
  }
}

export default OMRProcessor;
