/**
 * Database Service
 * 
 * Handles local storage for answer keys, students, results, and classes
 * Uses AsyncStorage for persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const KEYS = {
  ANSWER_KEYS: '@omr_answer_keys',
  STUDENTS: '@omr_students',
  CLASSES: '@omr_classes',
  RESULTS: '@omr_results',
  SETTINGS: '@omr_settings'
};

// ==================== Answer Keys ====================

/**
 * Save an answer key
 */
export const saveAnswerKey = async (answerKey) => {
  try {
    const existing = await getAllAnswerKeys();
    const updated = [...existing.filter(k => k.id !== answerKey.id), answerKey];
    await AsyncStorage.setItem(KEYS.ANSWER_KEYS, JSON.stringify(updated));
    return { success: true, data: answerKey };
  } catch (error) {
    console.error('Error saving answer key:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all answer keys
 */
export const getAllAnswerKeys = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ANSWER_KEYS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting answer keys:', error);
    return [];
  }
};

/**
 * Get answer key by ID
 */
export const getAnswerKeyById = async (id) => {
  try {
    const keys = await getAllAnswerKeys();
    return keys.find(k => k.id === id) || null;
  } catch (error) {
    console.error('Error getting answer key:', error);
    return null;
  }
};

/**
 * Delete answer key
 */
export const deleteAnswerKey = async (id) => {
  try {
    const existing = await getAllAnswerKeys();
    const updated = existing.filter(k => k.id !== id);
    await AsyncStorage.setItem(KEYS.ANSWER_KEYS, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Error deleting answer key:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Students ====================

/**
 * Save a student
 */
export const saveStudent = async (student) => {
  try {
    const existing = await getAllStudents();
    const updated = [...existing.filter(s => s.id !== student.id), student];
    await AsyncStorage.setItem(KEYS.STUDENTS, JSON.stringify(updated));
    return { success: true, data: student };
  } catch (error) {
    console.error('Error saving student:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all students
 */
export const getAllStudents = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.STUDENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting students:', error);
    return [];
  }
};

/**
 * Get student by ID
 */
export const getStudentById = async (id) => {
  try {
    const students = await getAllStudents();
    return students.find(s => s.id === id) || null;
  } catch (error) {
    console.error('Error getting student:', error);
    return null;
  }
};

/**
 * Get students by class
 */
export const getStudentsByClass = async (classId) => {
  try {
    const students = await getAllStudents();
    return students.filter(s => s.classId === classId);
  } catch (error) {
    console.error('Error getting students by class:', error);
    return [];
  }
};

/**
 * Delete student
 */
export const deleteStudent = async (id) => {
  try {
    const existing = await getAllStudents();
    const updated = existing.filter(s => s.id !== id);
    await AsyncStorage.setItem(KEYS.STUDENTS, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Classes ====================

/**
 * Save a class
 */
export const saveClass = async (classData) => {
  try {
    const existing = await getAllClasses();
    const updated = [...existing.filter(c => c.id !== classData.id), classData];
    await AsyncStorage.setItem(KEYS.CLASSES, JSON.stringify(updated));
    return { success: true, data: classData };
  } catch (error) {
    console.error('Error saving class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all classes
 */
export const getAllClasses = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.CLASSES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting classes:', error);
    return [];
  }
};

/**
 * Get class by ID
 */
export const getClassById = async (id) => {
  try {
    const classes = await getAllClasses();
    return classes.find(c => c.id === id) || null;
  } catch (error) {
    console.error('Error getting class:', error);
    return null;
  }
};

/**
 * Delete class
 */
export const deleteClass = async (id) => {
  try {
    const existing = await getAllClasses();
    const updated = existing.filter(c => c.id !== id);
    await AsyncStorage.setItem(KEYS.CLASSES, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Error deleting class:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Results ====================

/**
 * Save exam result
 */
export const saveResult = async (result) => {
  try {
    const existing = await getAllResults();
    const updated = [...existing.filter(r => r.id !== result.id), result];
    await AsyncStorage.setItem(KEYS.RESULTS, JSON.stringify(updated));
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving result:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all results
 */
export const getAllResults = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.RESULTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting results:', error);
    return [];
  }
};

/**
 * Get results by student ID
 */
export const getResultsByStudent = async (studentId) => {
  try {
    const results = await getAllResults();
    return results.filter(r => r.studentId === studentId);
  } catch (error) {
    console.error('Error getting results by student:', error);
    return [];
  }
};

/**
 * Get results by answer key ID
 */
export const getResultsByAnswerKey = async (answerKeyId) => {
  try {
    const results = await getAllResults();
    return results.filter(r => r.answerKeyId === answerKeyId);
  } catch (error) {
    console.error('Error getting results by answer key:', error);
    return [];
  }
};

/**
 * Get results by class ID
 */
export const getResultsByClass = async (classId) => {
  try {
    const students = await getStudentsByClass(classId);
    const studentIds = students.map(s => s.id);
    const results = await getAllResults();
    return results.filter(r => studentIds.includes(r.studentId));
  } catch (error) {
    console.error('Error getting results by class:', error);
    return [];
  }
};

/**
 * Delete result
 */
export const deleteResult = async (id) => {
  try {
    const existing = await getAllResults();
    const updated = existing.filter(r => r.id !== id);
    await AsyncStorage.setItem(KEYS.RESULTS, JSON.stringify(updated));
    return { success: true };
  } catch (error) {
    console.error('Error deleting result:', error);
    return { success: false, error: error.message };
  }
};

// ==================== Settings ====================

/**
 * Save settings
 */
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get settings
 */
export const getSettings = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : getDefaultSettings();
  } catch (error) {
    console.error('Error getting settings:', error);
    return getDefaultSettings();
  }
};

/**
 * Get default settings
 */
const getDefaultSettings = () => ({
  negativeMarking: false,
  negativeMarkValue: 0.25,
  passingPercentage: 40,
  gradingScale: {
    A: 90,
    B: 80,
    C: 70,
    D: 60,
    F: 0
  }
});

// ==================== Utility Functions ====================

/**
 * Clear all data (use with caution!)
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.ANSWER_KEYS,
      KEYS.STUDENTS,
      KEYS.CLASSES,
      KEYS.RESULTS
    ]);
    return { success: true };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export all data
 */
export const exportAllData = async () => {
  try {
    const [answerKeys, students, classes, results, settings] = await Promise.all([
      getAllAnswerKeys(),
      getAllStudents(),
      getAllClasses(),
      getAllResults(),
      getSettings()
    ]);
    
    return {
      success: true,
      data: {
        answerKeys,
        students,
        classes,
        results,
        settings,
        exportDate: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Import all data
 */
export const importAllData = async (data) => {
  try {
    if (data.answerKeys) {
      await AsyncStorage.setItem(KEYS.ANSWER_KEYS, JSON.stringify(data.answerKeys));
    }
    if (data.students) {
      await AsyncStorage.setItem(KEYS.STUDENTS, JSON.stringify(data.students));
    }
    if (data.classes) {
      await AsyncStorage.setItem(KEYS.CLASSES, JSON.stringify(data.classes));
    }
    if (data.results) {
      await AsyncStorage.setItem(KEYS.RESULTS, JSON.stringify(data.results));
    }
    if (data.settings) {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
};

export default {
  // Answer Keys
  saveAnswerKey,
  getAllAnswerKeys,
  getAnswerKeyById,
  deleteAnswerKey,
  
  // Students
  saveStudent,
  getAllStudents,
  getStudentById,
  getStudentsByClass,
  deleteStudent,
  
  // Classes
  saveClass,
  getAllClasses,
  getClassById,
  deleteClass,
  
  // Results
  saveResult,
  getAllResults,
  getResultsByStudent,
  getResultsByAnswerKey,
  getResultsByClass,
  deleteResult,
  
  // Settings
  saveSettings,
  getSettings,
  
  // Utility
  clearAllData,
  exportAllData,
  importAllData
};
