# 🚀 Quick Start Guide - OMR Scanner Mobile App

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd omr-scanner-app
npm install
```

### Step 2: Start Development Server
```bash
npm start
```

### Step 3: Run on Your Device

**Option A: Using Expo Go (Easiest)**
1. Install **Expo Go** app on your phone
2. Scan the QR code from terminal
3. App loads automatically!

**Option B: Using Emulator**
```bash
# Android
npm run android

# iOS (Mac only)
npm run ios
```

## 📱 How to Use the App

### 1. **Home Screen**
- Tap **"Start Camera Overlay"** button

### 2. **Template Selection**
- Select **"College OMR Sheet (100 Questions)"**
- Tap **"Use Template"**

### 3. **Camera Overlay**
- Point camera at your OMR bubble sheet
- Align sheet within the **green frame**
- Use **crosshair** for perfect centering
- See **bubble guides** overlay on camera
- Tap **capture button** (white circle)

### 4. **Results**
- Wait 2-3 seconds for processing
- View all 100 answers with confidence scores
- Tap **"Export CSV"** to save results
- Tap **"New Scan"** to scan another sheet

## 🎯 What Makes This App Work

### ✅ Real Template Integration
Your app now uses the **actual template.json** from `inputs/dxuian/`:
- 100 questions (Q1-Q100)
- 5 columns × 20 questions each
- 4 options per question (A, B, C, D)
- Exact bubble positions from template

### ✅ Camera Overlay Features
- **Green frame** - Shows sheet boundary
- **Crosshair** - Perfect centering guide
- **Bubble circles** - Shows exact A, B, C, D positions
- **Question labels** - Q1, Q2, Q3... Q100
- **Column blocks** - Shows 5 column layout

### ✅ OMR Processing
- **Client-side** - No internet needed
- **Fast** - Results in 2-3 seconds
- **Accurate** - Confidence scores for each answer
- **Export** - Save as CSV file

## 📊 Understanding Results

### Processing Summary
```
Total Questions: 100
Answered: 100
Unanswered: 0
Multi-Marked: 0
```

### Answer Table
```
Question | Answer | Confidence | Status
---------|--------|------------|-------
Q1       | A      | 92%        | ✓
Q2       | C      | 88%        | ✓
Q3       | B      | 95%        | ✓
...
```

### CSV Export Format
```csv
Question,Selected Answer,Confidence,Multi-Marked
Q1,A,92.0%,No
Q2,C,88.0%,No
Q3,B,95.0%,No
...
```

## 🔧 Troubleshooting

### Camera Permission Denied
```
Settings → Apps → OMR Scanner → Permissions → Enable Camera
```

### Overlay Not Showing
```
1. Check template.json exists in assets/templates/dxuian/
2. Restart the app
3. Clear cache: expo start -c
```

### Processing Fails
```
1. Ensure good lighting
2. Hold camera steady
3. Align sheet properly within green frame
```

## 📁 Project Files

```
omr-scanner-app/
├── assets/templates/dxuian/
│   ├── template.json          ← Your template configuration
│   └── omrcollegesheet.jpg    ← Sample bubble sheet
├── src/
│   ├── screens/               ← All app screens
│   ├── services/              ← OMR processing logic
│   └── utils/                 ← Template utilities
└── App.js                     ← Main entry point
```

## 🎨 Key Features

### 1. Template Loading
- ✅ Loads `dxuian/template.json`
- ✅ Parses 5 field blocks (Column1-Column5)
- ✅ Extracts 100 question labels
- ✅ Calculates bubble positions

### 2. Camera Overlay
- ✅ Scales template to fit screen
- ✅ Draws 500 bubbles (100 questions × 4 options + labels)
- ✅ Shows field block borders
- ✅ Real-time preview

### 3. Image Processing
- ✅ Captures high-quality photo
- ✅ Preprocesses image
- ✅ Detects filled bubbles
- ✅ Generates confidence scores

### 4. Results Display
- ✅ Shows all 100 answers
- ✅ Confidence percentages
- ✅ Multi-mark detection
- ✅ CSV export

## 🚀 Next Steps

### To Test the App:
1. Print the sample sheet: `assets/templates/dxuian/omrcollegesheet.jpg`
2. Fill in some bubbles with pencil
3. Scan using the app
4. View results!

### To Customize:
1. **Change colors**: Edit StyleSheet in each screen
2. **Add templates**: Create new folder in `assets/templates/`
3. **Improve processing**: Edit `src/services/omrProcessor.js`

### To Deploy:
```bash
# Build APK for Android
eas build --platform android

# Build IPA for iOS
eas build --platform ios
```

## 📞 Need Help?

Check these files:
- `MOBILE_APP_GUIDE.md` - Complete documentation
- `README.md` - Project overview
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

## 🎉 You're Ready!

Your mobile OMR scanner app is **fully functional** and ready to scan bubble sheets!

**Features Working:**
- ✅ Real template from `inputs/dxuian/template.json`
- ✅ 100-question support
- ✅ Camera overlay with exact bubble positions
- ✅ OMR processing and results
- ✅ CSV export

**Start scanning now!** 📱✨
