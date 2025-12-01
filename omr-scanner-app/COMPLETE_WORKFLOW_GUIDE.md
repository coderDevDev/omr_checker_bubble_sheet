# 📱 Complete OMR Scanner App Workflow & Features Guide

## 🎯 Overview

This document provides a comprehensive guide to the OMR Scanner mobile app workflow, from the initial screen to final scanning results, including all features and capabilities.

---

## 📋 Table of Contents

1. [App Navigation Structure](#app-navigation-structure)
2. [Complete Workflow](#complete-workflow)
3. [Screen-by-Screen Features](#screen-by-screen-features)
4. [Teacher Features](#teacher-features)
5. [Technical Features](#technical-features)
6. [Backend Integration](#backend-integration)

---

## 🗺️ App Navigation Structure

```
Home Screen
├── Template Screen (Template Selection)
│   ├── Camera Overlay Screen
│   │   └── Rectangle Preview Screen
│   │       └── Results Screen
│   └── Rectangle Preview Screen (if image uploaded)
│       └── Results Screen
└── Answer Keys Screen
    ├── Create Answer Key Screen
    └── Template Screen (with pre-selected answer key)
```

---

## 🔄 Complete Workflow

### **Path 1: Camera Scanning (Primary Flow)**

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: HOME SCREEN                                      │
│ ─────────────────────────────────────────────────────── │
│ Features:                                                │
│ • Welcome card with app branding                         │
│ • Quick Scan section                                     │
│   - "Start Camera Overlay" button                        │
│   - "Upload Image from Gallery" button                  │
│ • Teacher Tools section                                  │
│   - "Manage Answer Keys" button                          │
│                                                          │
│ User Action: Tap "Start Camera Overlay"                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: TEMPLATE SCREEN                                 │
│ ─────────────────────────────────────────────────────── │
│ Features:                                                │
│ • Template Selection:                                    │
│   - Loads templates from assets/templates/              │
│   - Displays template preview images                    │
│   - Shows template info (questions, options)            │
│   - Visual selection with green border                  │
│                                                          │
│ • Answer Key Selection (REQUIRED):                      │
│   - Radio button selection                              │
│   - Shows answer key name, subject, questions          │
│   - Option: "None (No Grading)"                         │
│   - If no answer keys: prompts to create one           │
│                                                          │
│ • Template Info Display:                                 │
│   - Template name (e.g., "College OMR Sheet")           │
│   - Description                                         │
│   - Number of questions (e.g., 100)                    │
│   - Options (A, B, C, D)                                │
│                                                          │
│ User Action:                                             │
│ 1. Select a template (tap on template card)             │
│ 2. Select an answer key (required for grading)         │
│ 3. Tap "Start Scanning" button                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: CAMERA OVERLAY SCREEN                           │
│ ─────────────────────────────────────────────────────── │
│ Features:                                                │
│                                                          │
│ • Camera Permissions:                                    │
│   - Requests camera permission on first use            │
│   - Shows permission denied screen if rejected          │
│                                                          │
│ • Camera View:                                           │
│   - Full-screen camera preview                          │
│   - Back camera (rear-facing)                          │
│   - Flash toggle (⚡ button)                           │
│                                                          │
│ • Green Overlay Frame:                                   │
│   - Calculated from template dimensions                │
│   - Scaled to fit screen (maintains aspect ratio)      │
│   - Green border (4px width)                           │
│   - Corner markers (L-shaped guides)                   │
│   - Center crosshair (horizontal + vertical)            │
│                                                          │
│ • Visual Guides:                                         │
│   - "📄 ALIGN SHEET TO FRAME" text at top              │
│   - Capture guidelines box at bottom                   │
│     • Good lighting (no shadows)                        │
│     • Hold 30-40cm above paper                        │
│     • Keep camera parallel to sheet                    │
│     • All 4 corners visible in frame                   │
│                                                          │
│ • Controls:                                              │
│   - Close button (✕) - top left                        │
│   - Flash toggle (⚡) - top right                      │
│   - Capture button (large white circle) - bottom       │
│                                                          │
│ • Image Processing:                                      │
│   - Captures high-quality image (quality: 1.0)         │
│   - Automatically crops to green frame area            │
│   - Saves to device gallery (if permissions allow)    │
│                                                          │
│ User Action:                                            │
│ 1. Align OMR sheet within green frame                  │
│ 2. Ensure all corners visible                          │
│ 3. Tap capture button (white circle)                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: RECTANGLE PREVIEW SCREEN                       │
│ ─────────────────────────────────────────────────────── │
│ Features:                                                │
│                                                          │
│ • Automatic Detection:                                   │
│   - Sends image to Python backend                      │
│   - Detects rectangles in image                         │
│   - Identifies answer section                          │
│   - Analyzes image quality                              │
│                                                          │
│ • Loading States:                                        │
│   - "Detecting Answer Section..."                       │
│   - Progress indicators:                                │
│     ✓ Analyzing image quality                          │
│     ✓ Finding rectangles                               │
│     ✓ Identifying answer area                          │
│                                                          │
│ • Detection Results Display:                             │
│   - Success header with checkmark                      │
│   - Detection statistics:                              │
│     • Rectangles found (count)                         │
│     • Image resolution                                 │
│     • Brightness status                               │
│     • Sharpness status                                │
│   - Warnings (if any)                                 │
│                                                          │
│ • Image Previews:                                        │
│   1. Captured Image:                                    │
│      - Shows original captured image                   │
│      - Note: "Pre-Cropped" if from camera             │
│   2. Detected Rectangles:                               │
│      - Shows detected rectangles with green boxes      │
│      - Highlights answer section                       │
│   3. Cropped Answer Section:                            │
│      - Final cropped image for processing              │
│      - This is what will be scanned                   │
│                                                          │
│ • Actions:                                               │
│   - "Retake" button - go back to camera               │
│   - "Proceed" button - continue to processing          │
│                                                          │
│ User Action:                                             │
│ 1. Review detection results                             │
│ 2. Verify cropped answer section looks correct         │
│ 3. Tap "Proceed" to continue                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 5: RESULTS SCREEN                                 │
│ ─────────────────────────────────────────────────────── │
│ Features:                                                │
│                                                          │
│ • Processing States:                                      │
│   - "Processing OMR Sheet" loading screen              │
│   - Real-time status updates:                         │
│     • "Connecting to server..."                       │
│     • "Uploading image..."                            │
│     • "Processing with Python backend..."             │
│     • "Analyzing answers..."                          │
│     • "Grading answers..." (if answer key provided)   │
│                                                          │
│ • Image Display:                                         │
│   - Captured image (tap to zoom)                       │
│   - Marked image from backend (if available)           │
│     • Shows detected bubbles marked by backend         │
│                                                          │
│ • Grading Results (if answer key used):                 │
│   - Exam Results Card:                                 │
│     • Exam name                                        │
│     • Grade (A, B, C, D, F) in large circle          │
│     • Score (e.g., 85/100)                            │
│     • Percentage (e.g., 85%)                          │
│     • Pass/Fail chip (green/red)                      │
│     • Performance category (Excellent, Good, etc.)    │
│     • Correct count (green)                            │
│     • Incorrect count (red)                            │
│                                                          │
│ • Processing Summary:                                   │
│   - Total questions (e.g., 100)                        │
│   - Answered questions                                 │
│   - Unanswered questions                               │
│   - Multi-marked questions                             │
│   - Processing method used                             │
│                                                          │
│ • Answer Details:                                        │
│   - Scrollable list of all answers                    │
│   - Shows first 20 by default                         │
│   - "Show All" button to expand                       │
│   - For each answer:                                   │
│     • Question number (Q1, Q2, etc.)                  │
│     • Selected answer (A, B, C, D, or -)             │
│     • Correct answer (if graded)                     │
│     • Status badge:                                    │
│       ✓ Correct (green)                               │
│       ✗ Incorrect (red)                               │
│       ○ Unanswered (gray)                             │
│                                                          │
│ • Actions:                                               │
│   - "Export CSV" - Export results to CSV file          │
│   - "Retake Photo" - Go back to camera                │
│   - "New Scan" - Return to home screen                 │
│                                                          │
│ User Action:                                             │
│ 1. Review results and grading (if applicable)           │
│ 2. Export CSV if needed                                │
│ 3. Start new scan or retake photo                      │
└─────────────────────────────────────────────────────────┘
```

### **Path 2: Image Upload Flow**

```
Home Screen
  ↓ (User taps "Upload Image from Gallery")
Image Picker (System)
  ↓ (User selects image)
Template Screen (with uploadedImageUri parameter)
  ↓ (User selects template + answer key, taps "Start Scanning")
Rectangle Preview Screen (skips camera, uses uploaded image)
  ↓ (User taps "Proceed")
Results Screen
```

---

## 📱 Screen-by-Screen Features

### **1. Home Screen (`HomeScreen.js`)**

#### Visual Elements:

- **Welcome Card**: Green-themed card with app title "🎯 OMR Scanner"
- **Quick Scan Card**:
  - Primary button: "Start Camera Overlay" (green, camera icon)
  - Secondary button: "Upload Image from Gallery" (outlined, upload icon)
- **Teacher Tools Card**:
  - "Manage Answer Keys" button (blue, key icon)

#### Functionality:

- ✅ Navigation to Template Screen
- ✅ Image picker integration (gallery access)
- ✅ Permission handling for media library
- ✅ Loading states during image selection

#### User Interactions:

- Tap "Start Camera Overlay" → Navigate to Template Screen
- Tap "Upload Image from Gallery" → Open image picker → Navigate to Template Screen with image
- Tap "Manage Answer Keys" → Navigate to Answer Keys Screen

---

### **2. Template Screen (`TemplateScreen.js`)**

#### Visual Elements:

- **Header Card**: Instructions for template selection
- **Template Cards**:
  - Template preview image (if available)
  - Template name (e.g., "College OMR Sheet (100 Questions)")
  - Description
  - Question count and options
  - Green border when selected
- **Answer Key Card** (appears after template selection):
  - Radio button list of answer keys
  - Answer key details (name, subject, questions)
  - "Create Answer Key" button if none exist
- **Start Scanning Button**: Appears after template + answer key selected

#### Functionality:

- ✅ Loads templates from `TemplateLoader`
- ✅ Loads answer keys from local database
- ✅ Template validation
- ✅ Answer key selection (required for grading)
- ✅ Handles uploaded images vs camera flow
- ✅ Pre-selects answer key if navigated from Answer Keys screen

#### Data Flow:

```javascript
// Loads template data
const templateData = await TemplateLoader.loadBundledTemplate(templateId);

// Template structure:
{
  pageDimensions: [707, 484],
  bubbleDimensions: [15, 10],
  fieldBlocks: {
    Column1: { origin: [82, 35], fieldLabels: ["Q1", "Q2", ...], ... },
    Column2: { origin: [205, 35], fieldLabels: ["Q21", "Q22", ...], ... },
    // ... 5 columns total
  }
}
```

#### User Interactions:

- Tap template card → Select template (green border appears)
- Select answer key → Radio button selection
- Tap "Start Scanning" → Navigate to Camera or Rectangle Preview

---

### **3. Camera Overlay Screen (`CameraOverlayScreen.js`)**

#### Visual Elements:

- **Full-Screen Camera**: Expo CameraView component
- **Green Overlay Frame**:
  - Calculated from template `pageDimensions`
  - Scaled to fit screen while maintaining aspect ratio
  - 4px green border (#00FF00)
  - Corner markers (L-shaped, 40x40px)
  - Center crosshair (20px horizontal + vertical lines)
- **Top Controls**:
  - Close button (✕) - top left
  - Flash toggle (⚡) - top right
- **Bottom Controls**:
  - Capture button (80x80px white circle with green inner circle)
- **Guidelines Text**:
  - Top: "📄 ALIGN SHEET TO FRAME"
  - Bottom: Capture instructions box

#### Functionality:

- ✅ Camera permission handling
- ✅ Dynamic overlay calculation based on template dimensions
- ✅ Screen rotation handling (landscape/portrait)
- ✅ Flash toggle
- ✅ High-quality image capture (quality: 1.0)
- ✅ Automatic image cropping to green frame area
- ✅ Gallery save (if permissions allow)

#### Overlay Calculation:

```javascript
// Calculates overlay from template dimensions
const pageWidth = template.pageDimensions[0]; // e.g., 707
const pageHeight = template.pageDimensions[1]; // e.g., 484

// Scales to fit screen with padding
const scale = Math.min(
  (screenWidth - padding * 2) / pageWidth,
  (screenHeight - padding * 2) / pageHeight
);

// Centers on screen
const overlayX = (screenWidth - scaledWidth) / 2;
const overlayY = (screenHeight - scaledHeight) / 2;
```

#### Image Cropping:

- Captures full camera image
- Calculates crop region based on overlay position
- Accounts for camera preview aspect ratio vs screen aspect ratio
- Crops to exact green frame area
- Uses `expo-image-manipulator` for cropping

#### User Interactions:

- Tap close (✕) → Go back to Template Screen
- Tap flash (⚡) → Toggle flash on/off
- Tap capture button → Capture image → Navigate to Rectangle Preview

---

### **4. Rectangle Preview Screen (`RectanglePreviewScreen.js`)**

#### Visual Elements:

- **Loading State**:
  - Large spinner
  - "Detecting Answer Section..." title
  - Progress checklist
- **Success State**:
  - Success header with checkmark
  - Detection statistics card
  - Three image previews:
    1. Captured Image
    2. Detected Rectangles (with green boxes)
    3. Cropped Answer Section
- **Error State**:
  - Error icon and message
  - Tips card for improving detection
  - Retry/Cancel buttons

#### Functionality:

- ✅ Sends image to Python backend for rectangle detection
- ✅ Receives detection results:
  - Number of rectangles found
  - Selected rectangle (answer section)
  - Image quality metrics (resolution, brightness, sharpness)
  - Warnings (if any)
- ✅ Saves detected and cropped images locally
- ✅ Displays all three image stages
- ✅ Error handling with helpful tips

#### Backend Integration:

```javascript
// Calls Python backend endpoint
const response = await apiService.detectRectangles(imageUri);

// Response includes:
{
  rectangles_found: 3,
  selected_rectangle: {...},
  image_dimensions: "3024x4032",
  brightness_status: "Good",
  sharpness_status: "Good",
  detected_image: "base64...",  // Image with rectangles drawn
  cropped_image: "base64..."     // Final answer section
}
```

#### User Interactions:

- Automatic detection on screen load
- Review detection results
- Tap "Retake" → Go back to Camera
- Tap "Proceed" → Navigate to Results Screen

---

### **5. Results Screen (`ResultsScreen.js`)**

#### Visual Elements:

- **Processing State**:
  - Large spinner
  - "Processing OMR Sheet" title
  - Real-time status text
- **Results Display**:
  - Image cards (captured + marked images)
  - Grading card (if answer key used)
  - Processing summary card
  - Answer details list
  - Action buttons

#### Functionality:

- ✅ Sends cropped image to Python backend for OMR processing
- ✅ Receives processing results:
  - All 100 answers (Q1-Q100)
  - Confidence scores
  - Multi-marked questions
  - Marked image (with detected bubbles)
- ✅ Grading (if answer key provided):
  - Compares student answers with answer key
  - Calculates score, percentage, grade
  - Determines pass/fail status
  - Shows correct/incorrect counts
- ✅ Saves results to local database
- ✅ CSV export functionality
- ✅ Image zoom modal

#### Processing Flow:

```javascript
// 1. Health check
await apiService.checkServerHealth();

// 2. Process image
const response = await apiService.processImage(imageUri, 'dxuian');

// 3. Grade answers (if answer key provided)
if (answerKey) {
  const gradingResults = gradeAnswers(apiData.answers, answerKey, {
    negativeMarking: answerKey.negativeMarking,
    negativeMarkValue: answerKey.negativeMarkValue,
    pointsPerQuestion: answerKey.pointsPerQuestion
  });
}

// 4. Save to database
await saveResult({
  studentId: 'manual',
  answerKeyId: answerKey.id,
  answers: apiData.answers,
  grading: gradingResults.results,
  ...gradingResults.summary
});
```

#### Grading Features:

- **Score Calculation**:
  - Points per question (configurable)
  - Negative marking (optional)
  - Negative mark value (configurable, e.g., -0.25)
- **Grade Assignment**:
  - A: 90-100%
  - B: 80-89%
  - C: 70-79%
  - D: 60-69%
  - F: 0-59%
- **Performance Categories**:
  - Excellent (90%+)
  - Very Good (80%+)
  - Good (70%+)
  - Satisfactory (60%+)
  - Pass (40%+)
  - Needs Improvement (<40%)

#### CSV Export:

```csv
Question,Selected Answer,Confidence,Multi-Marked
Q1,A,90.0%,No
Q2,C,88.0%,No
...
```

#### User Interactions:

- Automatic processing on screen load
- Tap image → Zoom modal
- Tap "Export CSV" → Share CSV file
- Tap "Retake Photo" → Go back to Camera
- Tap "New Scan" → Return to Home Screen

---

## 👨‍🏫 Teacher Features

### **Answer Keys Management (`AnswerKeysScreen.js`)**

#### Features:

- ✅ List all answer keys
- ✅ Search/filter answer keys
- ✅ Create new answer key
- ✅ Edit existing answer key
- ✅ Delete answer key
- ✅ Use answer key for scanning

#### Visual Elements:

- **Header**: Title and subtitle
- **Search Bar**: Filter answer keys by name or subject
- **Answer Key Cards**:
  - Answer key name
  - Subject chip
  - Question count
  - Points per question
  - Created date
  - Negative marking indicator (if enabled)
  - Edit/Delete icons
  - "Use for Scanning" button
- **FAB**: Floating action button to create new answer key
- **Empty State**: Message and button if no answer keys exist

#### Functionality:

- Loads answer keys from local database (AsyncStorage)
- Real-time search filtering
- Navigation to Create/Edit screen
- Delete confirmation dialog
- Auto-refresh on screen focus

---

### **Create/Edit Answer Key (`CreateAnswerKeyScreen.js`)**

#### Features:

- ✅ Basic information:
  - Answer key name (required)
  - Subject (optional)
  - Points per question
- ✅ Negative marking settings:
  - Enable/disable toggle
  - Negative mark value (if enabled)
- ✅ Quick fill:
  - Fill range of questions (e.g., Q1-Q20) with same answer
  - Buttons for A, B, C, D
- ✅ Answer grid:
  - All 100 questions (Q1-Q100)
  - Radio buttons for A, B, C, D
  - Organized in 5 columns (20 questions each)
  - Progress counter (e.g., "45/100")
  - Clear all button

#### Visual Elements:

- **Basic Info Card**: Name, subject, points inputs
- **Negative Marking Card**: Toggle + value input
- **Quick Fill Card**: Range inputs + option buttons
- **Answer Grid Card**: All 100 questions with radio buttons
- **Save Button**: Create or update answer key

#### Functionality:

- Validates required fields
- Saves to local database
- Supports editing existing answer keys
- Quick fill for bulk answer entry

---

## 🔧 Technical Features

### **Template System**

#### Template Structure:

```json
{
  "pageDimensions": [707, 484],
  "bubbleDimensions": [15, 10],
  "fieldBlocks": {
    "Column1": {
      "origin": [82, 35],
      "fieldLabels": ["Q1", "Q2", ..., "Q20"],
      "bubblesGap": 20,
      "labelsGap": 15
    },
    // ... 5 columns total
  }
}
```

#### Template Loading:

- Loads from `assets/templates/{templateId}/template.json`
- Validates structure
- Supports array and object formats for dimensions
- Handles fieldBlocks as object (not array)

---

### **Image Processing**

#### Preprocessing:

- Image resizing (if needed)
- Quality optimization
- Format conversion

#### Detection:

- Rectangle detection (Python backend)
- Answer section identification
- Image quality analysis

#### OMR Processing:

- Bubble detection
- Answer extraction
- Confidence scoring
- Multi-mark detection

---

### **Backend Integration**

#### API Endpoints:

- `GET /api/health` - Server health check
- `POST /api/detect-rectangles` - Rectangle detection
- `POST /api/process-base64` - OMR processing
- `GET /api/templates` - Available templates

#### Communication:

- Base64 image encoding
- JSON request/response
- Error handling and retries
- Timeout management (60s for processing, 30s for detection)

---

### **Local Storage**

#### Database (AsyncStorage):

- Answer keys storage
- Results storage
- Settings (future)

#### File System:

- Image caching
- CSV export files
- Marked images

---

## 📊 Data Flow Summary

```
User Action
    ↓
Home Screen
    ↓
Template Selection + Answer Key Selection
    ↓
Camera Capture / Image Upload
    ↓
Image Cropping (if from camera)
    ↓
Rectangle Detection (Python Backend)
    ↓
OMR Processing (Python Backend)
    ↓
Answer Extraction
    ↓
Grading (if answer key provided)
    ↓
Results Display
    ↓
CSV Export / Save Results
```

---

## 🎨 UI/UX Features

### **Design System:**

- Material Design (React Native Paper)
- Green theme (#2E7D32)
- Consistent card-based layout
- Loading states for all async operations
- Error states with helpful messages
- Success confirmations

### **Accessibility:**

- Clear button labels
- Icon + text combinations
- High contrast colors
- Large touch targets
- Loading indicators

### **Responsive:**

- Adapts to screen sizes
- Handles rotation (landscape/portrait)
- Scales overlay to fit any device

---

## 🔐 Permissions

### **Required Permissions:**

1. **Camera** - For capturing OMR sheets
2. **Media Library** - For saving images and accessing gallery
3. **Storage** - For saving CSV files and cached images

### **Permission Handling:**

- Requests permissions on first use
- Shows permission denied screens with instructions
- Graceful fallbacks if permissions denied

---

## 🚀 Performance Features

- **Image Optimization**: Automatic cropping and compression
- **Lazy Loading**: Templates and images loaded on demand
- **Caching**: Images and results cached locally
- **Async Operations**: All network calls are non-blocking
- **Progress Indicators**: Real-time status updates

---

## 📝 Summary

The OMR Scanner app provides a complete workflow from template selection to final results, with:

✅ **5 Main Screens**: Home, Template, Camera, Preview, Results  
✅ **Teacher Tools**: Answer key management and creation  
✅ **Backend Integration**: Python Flask API for processing  
✅ **Grading System**: Automatic scoring with answer keys  
✅ **Export Features**: CSV export functionality  
✅ **Professional UI**: Material Design with smooth navigation

The app handles both camera capture and image upload workflows, provides real-time feedback, and delivers comprehensive results with grading capabilities.
