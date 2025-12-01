/**
 * Grading Service
 * 
 * Handles grading logic, score calculation, and grade assignment
 */

/**
 * Grade student answers against answer key
 * 
 * @param {Object} studentAnswers - Student's answers {Q1: "A", Q2: "B", ...}
 * @param {Object} answerKey - Correct answers {Q1: "A", Q2: "C", ...}
 * @param {Object} settings - Grading settings
 * @returns {Object} Grading results
 */
export const gradeAnswers = (studentAnswers, answerKey, settings = {}) => {
  const {
    negativeMarking = false,
    negativeMarkValue = 0.25,
    pointsPerQuestion = 1
  } = settings;
  
  const results = [];
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalScore = 0;
  
  // Get all questions from answer key
  const questions = Object.keys(answerKey.answers || {});
  const totalQuestions = questions.length;
  
  // Grade each question
  questions.forEach(questionId => {
    const correctAnswer = answerKey.answers[questionId];
    const studentAnswer = studentAnswers[questionId] || '-';
    
    let isCorrect = false;
    let points = 0;
    let status = 'unanswered';
    
    if (studentAnswer === '-' || studentAnswer === '' || !studentAnswer) {
      // Unanswered
      status = 'unanswered';
      unansweredCount++;
      points = 0;
    } else if (studentAnswer === correctAnswer) {
      // Correct
      status = 'correct';
      isCorrect = true;
      correctCount++;
      points = pointsPerQuestion;
    } else {
      // Incorrect
      status = 'incorrect';
      incorrectCount++;
      points = negativeMarking ? -negativeMarkValue : 0;
    }
    
    totalScore += points;
    
    results.push({
      question: questionId,
      correctAnswer,
      studentAnswer,
      isCorrect,
      status,
      points
    });
  });
  
  // Ensure minimum score is 0
  totalScore = Math.max(0, totalScore);
  
  // Calculate percentage
  const maxPossibleScore = totalQuestions * pointsPerQuestion;
  const percentage = (totalScore / maxPossibleScore) * 100;
  
  return {
    results,
    summary: {
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalScore,
      maxPossibleScore,
      percentage: parseFloat(percentage.toFixed(2))
    }
  };
};

/**
 * Calculate grade based on percentage
 * 
 * @param {number} percentage - Score percentage (0-100)
 * @param {Object} gradingScale - Grading scale configuration
 * @returns {string} Grade (A, B, C, D, F)
 */
export const calculateGrade = (percentage, gradingScale = null) => {
  const defaultScale = {
    A: 90,
    B: 80,
    C: 70,
    D: 60,
    F: 0
  };
  
  const scale = gradingScale || defaultScale;
  
  if (percentage >= scale.A) return 'A';
  if (percentage >= scale.B) return 'B';
  if (percentage >= scale.C) return 'C';
  if (percentage >= scale.D) return 'D';
  return 'F';
};

/**
 * Check if student passed
 * 
 * @param {number} percentage - Score percentage
 * @param {number} passingPercentage - Minimum passing percentage
 * @returns {boolean} Whether student passed
 */
export const hasPassed = (percentage, passingPercentage = 40) => {
  return percentage >= passingPercentage;
};

/**
 * Analyze question difficulty
 * 
 * @param {Array} results - Array of all student results for an exam
 * @returns {Object} Question analysis
 */
export const analyzeQuestionDifficulty = (results) => {
  if (!results || results.length === 0) {
    return {};
  }
  
  const questionStats = {};
  const totalStudents = results.length;
  
  // Aggregate data for each question
  results.forEach(result => {
    result.results.forEach(questionResult => {
      const { question, isCorrect } = questionResult;
      
      if (!questionStats[question]) {
        questionStats[question] = {
          question,
          totalAttempts: 0,
          correctCount: 0,
          incorrectCount: 0,
          unansweredCount: 0
        };
      }
      
      questionStats[question].totalAttempts++;
      
      if (questionResult.status === 'correct') {
        questionStats[question].correctCount++;
      } else if (questionResult.status === 'incorrect') {
        questionStats[question].incorrectCount++;
      } else {
        questionStats[question].unansweredCount++;
      }
    });
  });
  
  // Calculate percentages and difficulty
  Object.keys(questionStats).forEach(question => {
    const stats = questionStats[question];
    stats.correctPercentage = (stats.correctCount / totalStudents) * 100;
    stats.incorrectPercentage = (stats.incorrectCount / totalStudents) * 100;
    
    // Determine difficulty level
    if (stats.correctPercentage >= 80) {
      stats.difficulty = 'Easy';
    } else if (stats.correctPercentage >= 50) {
      stats.difficulty = 'Medium';
    } else {
      stats.difficulty = 'Hard';
    }
  });
  
  return questionStats;
};

/**
 * Calculate class statistics
 * 
 * @param {Array} results - Array of all student results
 * @returns {Object} Class statistics
 */
export const calculateClassStatistics = (results) => {
  if (!results || results.length === 0) {
    return {
      totalStudents: 0,
      averageScore: 0,
      averagePercentage: 0,
      highestScore: 0,
      lowestScore: 0,
      passCount: 0,
      failCount: 0,
      passPercentage: 0
    };
  }
  
  const scores = results.map(r => r.summary.totalScore);
  const percentages = results.map(r => r.summary.percentage);
  const passCount = results.filter(r => r.summary.percentage >= 40).length;
  
  return {
    totalStudents: results.length,
    averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    averagePercentage: percentages.reduce((a, b) => a + b, 0) / percentages.length,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    passCount,
    failCount: results.length - passCount,
    passPercentage: (passCount / results.length) * 100
  };
};

/**
 * Get performance category
 * 
 * @param {number} percentage - Score percentage
 * @returns {Object} Performance category info
 */
export const getPerformanceCategory = (percentage) => {
  if (percentage >= 90) {
    return { category: 'Excellent', color: '#4CAF50', emoji: '🌟' };
  } else if (percentage >= 80) {
    return { category: 'Very Good', color: '#8BC34A', emoji: '✨' };
  } else if (percentage >= 70) {
    return { category: 'Good', color: '#FFC107', emoji: '👍' };
  } else if (percentage >= 60) {
    return { category: 'Satisfactory', color: '#FF9800', emoji: '📝' };
  } else if (percentage >= 40) {
    return { category: 'Pass', color: '#FF5722', emoji: '✓' };
  } else {
    return { category: 'Needs Improvement', color: '#F44336', emoji: '📚' };
  }
};

/**
 * Compare student performance with class average
 * 
 * @param {number} studentPercentage - Student's percentage
 * @param {number} classAverage - Class average percentage
 * @returns {Object} Comparison result
 */
export const compareWithClass = (studentPercentage, classAverage) => {
  const difference = studentPercentage - classAverage;
  
  return {
    difference: parseFloat(difference.toFixed(2)),
    status: difference > 0 ? 'above' : difference < 0 ? 'below' : 'equal',
    message: difference > 0 
      ? `${difference.toFixed(1)}% above class average`
      : difference < 0
      ? `${Math.abs(difference).toFixed(1)}% below class average`
      : 'Equal to class average'
  };
};

export default {
  gradeAnswers,
  calculateGrade,
  hasPassed,
  analyzeQuestionDifficulty,
  calculateClassStatistics,
  getPerformanceCategory,
  compareWithClass
};
