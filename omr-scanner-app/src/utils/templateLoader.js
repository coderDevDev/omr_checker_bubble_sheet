// Template Loader Utility
// Handles loading and parsing of OMR templates

import * as FileSystem from 'expo-file-system';

export class TemplateLoader {
  /**
   * Load template from bundled assets
   * @param {string} templateId - Template identifier
   * @returns {Promise<Object>} Template configuration
   */
  static async loadBundledTemplate(templateId) {
    try {
      // Static require mapping (React Native doesn't support dynamic require)
      const templateMap = {
        'dxuian': require('../../assets/templates/dxuian/template.json')
      };

      const template = templateMap[templateId];
      
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Validate template
      if (!this.validateTemplate(template)) {
        throw new Error('Invalid template format');
      }

      return {
        ...template,
        id: templateId,
        source: 'bundled'
      };
    } catch (error) {
      console.error(`Failed to load bundled template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Load template from remote URL
   * @param {string} templateUrl - URL to template JSON
   * @returns {Promise<Object>} Template configuration
   */
  static async loadRemoteTemplate(templateUrl) {
    try {
      const response = await fetch(templateUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const template = await response.json();

      // Validate template
      if (!this.validateTemplate(template)) {
        throw new Error('Invalid template format');
      }

      return {
        ...template,
        source: 'remote',
        url: templateUrl
      };
    } catch (error) {
      console.error(`Failed to load remote template:`, error);
      throw new Error('Failed to load template from URL');
    }
  }

  /**
   * Load template from device storage
   * @param {string} templatePath - Path to template file
   * @returns {Promise<Object>} Template configuration
   */
  static async loadLocalTemplate(templatePath) {
    try {
      const templateContent = await FileSystem.readAsStringAsync(templatePath);
      const template = JSON.parse(templateContent);

      // Validate template
      if (!this.validateTemplate(template)) {
        throw new Error('Invalid template format');
      }

      return {
        ...template,
        source: 'local',
        path: templatePath
      };
    } catch (error) {
      console.error(`Failed to load local template:`, error);
      throw new Error('Failed to load template from device');
    }
  }

  /**
   * Validate template structure
   * @param {Object} template - Template to validate
   * @returns {boolean} Validation result
   */
  static validateTemplate(template) {
    // Check required top-level properties
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

    // Validate page dimensions (can be array [width, height] or object {width, height})
    const pageDim = Array.isArray(template.pageDimensions)
      ? { width: template.pageDimensions[0], height: template.pageDimensions[1] }
      : template.pageDimensions;

    if (
      typeof pageDim.width !== 'number' ||
      typeof pageDim.height !== 'number'
    ) {
      console.error(
        'Invalid page dimensions: width and height must be numbers'
      );
      return false;
    }

    if (pageDim.width <= 0 || pageDim.height <= 0) {
      console.error(
        'Invalid page dimensions: width and height must be positive'
      );
      return false;
    }

    // Validate bubble dimensions (can be array [width, height] or object {width, height})
    const bubbleDim = Array.isArray(template.bubbleDimensions)
      ? { width: template.bubbleDimensions[0], height: template.bubbleDimensions[1] }
      : template.bubbleDimensions;

    if (
      typeof bubbleDim.width !== 'number' ||
      typeof bubbleDim.height !== 'number'
    ) {
      console.error(
        'Invalid bubble dimensions: width and height must be numbers'
      );
      return false;
    }

    if (bubbleDim.width <= 0 || bubbleDim.height <= 0) {
      console.error(
        'Invalid bubble dimensions: width and height must be positive'
      );
      return false;
    }

    // Validate field blocks (can be object or array)
    const fieldBlocks = typeof template.fieldBlocks === 'object' && !Array.isArray(template.fieldBlocks)
      ? Object.values(template.fieldBlocks)
      : template.fieldBlocks;

    if (!Array.isArray(fieldBlocks)) {
      console.error('Invalid field blocks: must be an array or object');
      return false;
    }

    if (fieldBlocks.length === 0) {
      console.error('Invalid field blocks: cannot be empty');
      return false;
    }

    return true;
  }

  /**
   * Validate individual field block
   * @param {Object} block - Field block to validate
   * @param {number} index - Block index for error reporting
   * @returns {boolean} Validation result
   */
  static validateFieldBlock(block, index) {
    // Required fields for field block
    const requiredFields = [
      'origin',
      'labelsGap',
      'bubblesGap',
      'fieldLabels',
      'bubbleCount',
      'fieldType'
    ];

    for (const field of requiredFields) {
      if (block[field] === undefined) {
        console.error(`Field block ${index} missing required field: ${field}`);
        return false;
      }
    }

    // Validate origin (can be array [x, y] or object {x, y})
    const origin = Array.isArray(block.origin)
      ? { x: block.origin[0], y: block.origin[1] }
      : block.origin;

    if (typeof origin.x !== 'number' || typeof origin.y !== 'number') {
      console.error(`Field block ${index}: invalid origin coordinates`);
      return false;
    }

    // Validate gaps
    if (typeof block.labelsGap !== 'number' || block.labelsGap < 0) {
      console.error(`Field block ${index}: invalid labelsGap`);
      return false;
    }

    if (typeof block.bubblesGap !== 'number' || block.bubblesGap < 0) {
      console.error(`Field block ${index}: invalid bubblesGap`);
      return false;
    }

    // Validate field labels
    if (!Array.isArray(block.fieldLabels)) {
      console.error(`Field block ${index}: fieldLabels must be an array`);
      return false;
    }

    // Validate bubble count
    if (typeof block.bubbleCount !== 'number' || block.bubbleCount <= 0) {
      console.error(`Field block ${index}: invalid bubbleCount`);
      return false;
    }

    return true;
  }

  /**
   * Get default templates list
   * @returns {Array} List of available templates
   */
  static getDefaultTemplates() {
    return [
      {
        id: 'dxuian',
        name: 'College OMR Sheet (100 Questions)',
        description: 'Standard college examination OMR sheet with 100 questions in 5 columns',
        file: 'dxuian/template.json',
        questions: 100,
        options: ['A', 'B', 'C', 'D'],
        category: 'education',
        difficulty: 'medium',
        image: require('../../assets/templates/dxuian/omrcollegesheet.jpg')
      }
    ];
  }

  /**
   * Calculate template statistics
   * @param {Object} template - Template configuration
   * @returns {Object} Template statistics
   */
  static calculateTemplateStats(template) {
    const stats = {
      totalQuestions: 0,
      totalBubbles: 0,
      fieldBlockCount: template.fieldBlocks.length,
      pageArea: template.pageDimensions.width * template.pageDimensions.height,
      bubbleArea:
        template.bubbleDimensions.width * template.bubbleDimensions.height
    };

    // Count questions and bubbles
    template.fieldBlocks.forEach(block => {
      if (block.fieldType === 'QT') {
        stats.totalQuestions += block.bubbleCount;
      }
      stats.totalBubbles += block.bubbleCount;
    });

    // Calculate density
    stats.bubbleDensity = stats.totalBubbles / stats.pageArea;

    return stats;
  }

  /**
   * Get template preview information
   * @param {Object} template - Template configuration
   * @returns {Object} Preview information
   */
  static getTemplatePreview(template) {
    const stats = this.calculateTemplateStats(template);

    return {
      name: template.name || 'Unnamed Template',
      description: template.description || 'No description available',
      questions: stats.totalQuestions,
      bubbles: stats.totalBubbles,
      fieldBlocks: stats.fieldBlockCount,
      pageSize: `${template.pageDimensions.width}x${template.pageDimensions.height}`,
      bubbleSize: `${template.bubbleDimensions.width}x${template.bubbleDimensions.height}`,
      category: template.category || 'general',
      difficulty: template.difficulty || 'medium'
    };
  }
}

export default TemplateLoader;
