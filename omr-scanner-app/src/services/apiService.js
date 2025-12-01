/**
 * API Service for OMR Scanner
 *
 * Handles communication with Python Flask backend server
 * Sends captured images for processing and retrieves results
 */

// Use legacy FileSystem API for compatibility with existing code
import * as FileSystem from 'expo-file-system/legacy';

// Configuration
const API_CONFIG = {
  // Change this to your computer's local IP address
  // Find your IP: Windows (ipconfig), Mac/Linux (ifconfig)
  BASE_URL: 'http://192.168.0.192:5000/api', // UPDATE THIS!

  // Endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    PROCESS: '/process',
    PROCESS_BASE64: '/process-base64',
    TEMPLATES: '/templates',
    MARKED_IMAGE: '/marked-image',
    DETECT_RECTANGLES: '/detect-rectangles'
  },

  // Timeout settings
  TIMEOUT: 60000 // 60 seconds for image processing
};

/**
 * Set the API base URL (e.g., when user configures it)
 */
export const setApiBaseUrl = url => {
  API_CONFIG.BASE_URL = url;
};

/**
 * Get current API base URL
 */
export const getApiBaseUrl = () => {
  return API_CONFIG.BASE_URL;
};

/**
 * Check if API server is reachable
 */
export const checkServerHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`,
      {
        method: 'GET',
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to server'
    };
  }
};

/**
 * Process OMR image using base64 encoding
 *
 * @param {string} imageUri - Local file URI of the captured image
 * @param {string} templateId - Template ID to use (default: 'dxuian')
 * @returns {Promise<Object>} Processing results
 */
export const processImage = async (imageUri, templateId = 'dxuian') => {
  try {
    console.log('Processing image:', imageUri);

    // Read image as base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64'
    });

    console.log('Image encoded to base64, length:', base64Image.length);

    // Get filename from URI
    const filename = imageUri.split('/').pop() || 'capture.jpg';

    // Prepare request body
    const requestBody = {
      image: base64Image,
      filename: filename,
      template: templateId
    };

    console.log(
      'Sending request to:',
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROCESS_BASE64}`
    );

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    // Send request to API
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROCESS_BASE64}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    console.log('Response status:', response.status);

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    console.log('Processing successful:', data.success);
    console.log('Total questions:', data.total_questions);

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Process image error:', error);

    let errorMessage = 'Failed to process image';

    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out. Processing took too long.';
    } else if (error.message.includes('Network request failed')) {
      errorMessage =
        'Cannot connect to server. Check if server is running and URL is correct.';
    } else {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      details: error
    };
  }
};

/**
 * Process OMR image using multipart/form-data
 * (Alternative method if base64 is too large)
 *
 * @param {string} imageUri - Local file URI of the captured image
 * @param {string} templateId - Template ID to use
 * @returns {Promise<Object>} Processing results
 */
export const processImageMultipart = async (
  imageUri,
  templateId = 'dxuian'
) => {
  try {
    console.log('Processing image (multipart):', imageUri);

    // Create form data
    const formData = new FormData();

    // Add image file
    const filename = imageUri.split('/').pop() || 'capture.jpg';
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename
    });

    // Add template ID
    formData.append('template', templateId);

    console.log('Sending multipart request...');

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    // Send request
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROCESS}`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    clearTimeout(timeoutId);

    console.log('Response status:', response.status);

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    console.log('Processing successful');

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Process image (multipart) error:', error);

    let errorMessage = 'Failed to process image';

    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out. Processing took too long.';
    } else if (error.message.includes('Network request failed')) {
      errorMessage = 'Cannot connect to server. Check if server is running.';
    } else {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      details: error
    };
  }
};

/**
 * Get list of available templates from server
 */
export const getAvailableTemplates = async () => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATES}`,
      {
        method: 'GET'
      }
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      templates: data.templates
    };
  } catch (error) {
    console.error('Get templates error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Save marked image to device
 *
 * @param {string} base64Image - Base64 encoded marked image
 * @param {string} filename - Filename to save as
 * @returns {Promise<string>} Local URI of saved image
 */
export const saveMarkedImage = async (base64Image, filename = 'marked.jpg') => {
  try {
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    // Remove data URI prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: 'base64'
    });

    console.log('Image saved to:', fileUri);
    return fileUri;
  } catch (error) {
    console.error('Save image error:', error);
    throw error;
  }
};

/**
 * Test API connection with detailed diagnostics
 */
export const testApiConnection = async () => {
  console.log('Testing API connection...');
  console.log('API Base URL:', API_CONFIG.BASE_URL);

  const results = {
    baseUrl: API_CONFIG.BASE_URL,
    tests: []
  };

  // Test 1: Health check
  try {
    const healthResult = await checkServerHealth();
    results.tests.push({
      name: 'Health Check',
      success: healthResult.success,
      message: healthResult.success
        ? `Server is healthy: ${healthResult.data.service}`
        : `Failed: ${healthResult.error}`
    });
  } catch (error) {
    results.tests.push({
      name: 'Health Check',
      success: false,
      message: `Error: ${error.message}`
    });
  }

  // Test 2: Get templates
  try {
    const templatesResult = await getAvailableTemplates();
    results.tests.push({
      name: 'Get Templates',
      success: templatesResult.success,
      message: templatesResult.success
        ? `Found ${templatesResult.templates.length} template(s)`
        : `Failed: ${templatesResult.error}`
    });
  } catch (error) {
    results.tests.push({
      name: 'Get Templates',
      success: false,
      message: `Error: ${error.message}`
    });
  }

  results.allPassed = results.tests.every(test => test.success);

  return results;
};

/**
 * Detect rectangles in image using crop_answer_area.py
 * 
 * @param {string} imageUri - Local file URI of the captured image
 * @returns {Promise<Object>} Detection results with images
 */
export const detectRectangles = async (imageUri) => {
  try {
    console.log('Detecting rectangles in image:', imageUri);

    // Read image as base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64'
    });

    console.log('Image encoded to base64, length:', base64Image.length);

    // Get filename from URI
    const filename = imageUri.split('/').pop() || 'capture.jpg';

    // Prepare request body
    const requestBody = {
      image: base64Image,
      filename: filename
    };

    console.log(
      'Sending detection request to:',
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DETECT_RECTANGLES}`
    );

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

    // Send request to API
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DETECT_RECTANGLES}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    console.log('Detection response status:', response.status);

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    console.log('Detection successful:', data.success);
    console.log('Rectangles found:', data.rectangles_found);

    // Save the detected and cropped images locally
    let detectedImageUri = null;
    let croppedImageUri = null;

    if (data.detected_image) {
      detectedImageUri = await saveMarkedImage(
        data.detected_image,
        `detected_${Date.now()}.jpg`
      );
      console.log('Detected image saved:', detectedImageUri);
    }

    if (data.cropped_image) {
      croppedImageUri = await saveMarkedImage(
        data.cropped_image,
        `cropped_${Date.now()}.jpg`
      );
      console.log('Cropped image saved:', croppedImageUri);
    }

    return {
      success: true,
      data: {
        ...data,
        detected_image_uri: detectedImageUri,
        cropped_image_uri: croppedImageUri
      }
    };
  } catch (error) {
    console.error('Detect rectangles error:', error);

    let errorMessage = 'Failed to detect rectangles';

    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out. Detection took too long.';
    } else if (error.message.includes('Network request failed')) {
      errorMessage =
        'Cannot connect to server. Check if server is running and URL is correct.';
    } else {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      details: error
    };
  }
};

export default {
  setApiBaseUrl,
  getApiBaseUrl,
  checkServerHealth,
  processImage,
  processImageMultipart,
  getAvailableTemplates,
  saveMarkedImage,
  testApiConnection,
  detectRectangles
};
