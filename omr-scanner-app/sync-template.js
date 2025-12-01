#!/usr/bin/env node

/**
 * Template Synchronization Script
 * 
 * This script synchronizes the backend template (inputs/template.json) 
 * with the mobile app template (assets/templates/dxuian/template.json)
 * 
 * Usage: node sync-template.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const BACKEND_TEMPLATE = path.join(__dirname, '..', 'inputs', 'template.json');
const MOBILE_TEMPLATE = path.join(__dirname, 'assets', 'templates', 'dxuian', 'template.json');

console.log('🔄 Template Synchronization Script');
console.log('================================\n');

// Check if backend template exists
if (!fs.existsSync(BACKEND_TEMPLATE)) {
  console.error('❌ Error: Backend template not found at:', BACKEND_TEMPLATE);
  process.exit(1);
}

// Read backend template
console.log('📖 Reading backend template...');
let backendTemplate;
try {
  const backendContent = fs.readFileSync(BACKEND_TEMPLATE, 'utf8');
  backendTemplate = JSON.parse(backendContent);
  console.log('✅ Backend template loaded successfully');
} catch (error) {
  console.error('❌ Error reading backend template:', error.message);
  process.exit(1);
}

// Validate template structure
console.log('\n🔍 Validating template structure...');
const requiredFields = ['pageDimensions', 'bubbleDimensions', 'fieldBlocks'];
const missingFields = requiredFields.filter(field => !backendTemplate[field]);

if (missingFields.length > 0) {
  console.error('❌ Invalid template structure. Missing fields:', missingFields.join(', '));
  process.exit(1);
}

console.log('✅ Template structure is valid');

// Check field blocks
const fieldBlocks = backendTemplate.fieldBlocks;
const blockCount = Object.keys(fieldBlocks).length;
console.log(`   - Field blocks: ${blockCount}`);
console.log(`   - Page dimensions: ${backendTemplate.pageDimensions.join('x')}`);
console.log(`   - Bubble dimensions: ${backendTemplate.bubbleDimensions.join('x')}`);

// Count total questions
let totalQuestions = 0;
Object.values(fieldBlocks).forEach(block => {
  if (block.fieldLabels) {
    totalQuestions += block.fieldLabels.length;
  }
});
console.log(`   - Total questions: ${totalQuestions}`);

// Create mobile app directory if it doesn't exist
const mobileDir = path.dirname(MOBILE_TEMPLATE);
if (!fs.existsSync(mobileDir)) {
  console.log('\n📁 Creating mobile app template directory...');
  fs.mkdirSync(mobileDir, { recursive: true });
  console.log('✅ Directory created');
}

// Write to mobile template
console.log('\n💾 Writing to mobile app template...');
try {
  // Format the JSON with proper indentation
  const formattedTemplate = JSON.stringify(backendTemplate, null, 2);
  fs.writeFileSync(MOBILE_TEMPLATE, formattedTemplate + '\n', 'utf8');
  console.log('✅ Mobile app template updated successfully');
} catch (error) {
  console.error('❌ Error writing mobile template:', error.message);
  process.exit(1);
}

// Verify the sync
console.log('\n🔍 Verifying synchronization...');
try {
  const mobileContent = fs.readFileSync(MOBILE_TEMPLATE, 'utf8');
  const mobileTemplate = JSON.parse(mobileContent);
  
  // Compare key fields
  const pageMatch = JSON.stringify(backendTemplate.pageDimensions) === 
                    JSON.stringify(mobileTemplate.pageDimensions);
  const bubbleMatch = JSON.stringify(backendTemplate.bubbleDimensions) === 
                      JSON.stringify(mobileTemplate.bubbleDimensions);
  const blocksMatch = Object.keys(backendTemplate.fieldBlocks).length === 
                      Object.keys(mobileTemplate.fieldBlocks).length;
  
  if (pageMatch && bubbleMatch && blocksMatch) {
    console.log('✅ Templates are synchronized!');
  } else {
    console.warn('⚠️  Warning: Templates may not be fully synchronized');
    if (!pageMatch) console.log('   - Page dimensions mismatch');
    if (!bubbleMatch) console.log('   - Bubble dimensions mismatch');
    if (!blocksMatch) console.log('   - Field blocks count mismatch');
  }
} catch (error) {
  console.error('❌ Error verifying sync:', error.message);
}

console.log('\n✨ Synchronization complete!\n');
console.log('📱 Mobile app will now use the updated template.');
console.log('🔄 Run this script whenever you update inputs/template.json\n');
