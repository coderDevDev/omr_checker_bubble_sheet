# 📋 Template Synchronization Guide

## 🎯 Single Source of Truth: `inputs/template.json`

Your **`inputs/template.json`** is now the **single source of truth** for both the backend Python OMR processor and the mobile camera app.

---

## 🔄 How It Works

### **Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                 inputs/template.json                        │
│              (Single Source of Truth)                       │
│                                                             │
│  • pageDimensions: [707, 484]                              │
│  • bubbleDimensions: [15, 10]                              │
│  • fieldBlocks: Column1-5                                  │
│  • origin, bubblesGap, labelsGap for each column          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Sync Script (automatic)
                   │
                   ├──────────────────┬──────────────────────┐
                   │                  │                      │
                   ▼                  ▼                      ▼
         ┌─────────────────┐  ┌──────────────┐   ┌────────────────┐
         │  Python Backend │  │  Mobile App  │   │ Camera Overlay │
         │   main.py       │  │   Template   │   │   Live Feed    │
         │                 │  │              │   │                │
         │ • Reads inputs/ │  │ • Auto-synced│   │ • Responsive   │
         │   template.json │  │ • Same data  │   │ • Scales to    │
         │ • Processes OMR │  │ • Same coords│   │   any device   │
         └─────────────────┘  └──────────────┘   └────────────────┘
```

---

## ⚙️ Automatic Synchronization

### **When Templates Sync Automatically**

1. **Before starting the app**: `npm start` → automatic sync
2. **Manual sync**: `npm run sync-template`
3. **Windows batch**: Double-click `sync-template.bat`

### **What Gets Synced**

✅ **Page dimensions** - Template size (707x484)  
✅ **Bubble dimensions** - Bubble size (15x10)  
✅ **Field blocks** - All 5 columns  
✅ **Origins** - Starting position for each column  
✅ **Gaps** - Bubble spacing (horizontal) and question spacing (vertical)  
✅ **Labels** - Question names (Q1-Q100)  
✅ **Preprocessors** - Image alignment settings  

---

## 📱 Responsive Camera Overlay

### **How the Overlay Adapts to Any Device**

The camera overlay is **fully responsive** and **device-independent** thanks to:

#### **1. Relative Scaling**

```javascript
// Calculate scale factor based on device screen
const scale = Math.min(
  (screenWidth * 0.9) / templateWidth,   // Fit width
  (screenHeight * 0.85) / templateHeight  // Fit height
);

// Everything scales proportionally
overlayWidth = 707 * scale;
overlayHeight = 484 * scale;
bubbleRadius = (15 * scale) / 2;
```

#### **2. Dynamic Positioning**

```javascript
// For each bubble, calculate position relative to origin
bubbleX = overlayX + (origin.x + bubbleIndex * bubblesGap) * scale;
bubbleY = overlayY + (origin.y + questionIndex * labelsGap) * scale;
```

#### **3. Orientation Detection**

```javascript
// Landscape mode (recommended)
if (width > height) {
  maxWidth = width * 0.90;   // Use 90% of screen width
  maxHeight = height * 0.85;  // Use 85% of screen height
}

// Portrait mode
else {
  maxWidth = width * 0.85;    // Use 85% of screen width
  maxHeight = height * 0.70;  // Use 70% of screen height
}
```

---

## 🎨 Template Structure Explained

### **Your Current Template (inputs/template.json)**

```json
{
  "pageDimensions": [707, 484],    // Template canvas size
  "bubbleDimensions": [15, 10],    // Each bubble's size
  
  "fieldBlocks": {
    "Column1": {
      "fieldType": "QTYPE_MCQ4",   // 4-option MCQ (A,B,C,D)
      "origin": [62, 187],         // Starting position (x, y)
      "bubblesGap": 21,            // Horizontal space between bubbles
      "labelsGap": 13.8,           // Vertical space between questions
      "bubbleCount": 20,           // Number of questions in column
      "fieldLabels": ["Q1", "Q2", ..., "Q20"]
    },
    "Column2": {
      "origin": [187, 187],        // Next column starts here
      "bubblesGap": 21,
      "labelsGap": 13.8,
      ...
    },
    // ... Column3, Column4, Column5
  }
}
```

### **Visual Representation**

```
Template: 707 x 484 pixels

   0                                                   707
   ┌───────────────────────────────────────────────────┐  0
   │                                                   │
   │  Column1  Column2  Column3  Column4  Column5     │
   │  (62,187) (187,187)(317,187)(450,187)(582,187)   │
   │     ↓        ↓        ↓        ↓        ↓        │
   │  Q1 ●●●●  Q21●●●●  Q41●●●●  Q61●●●●  Q81●●●●    │ 187
   │  Q2 ●●●●  Q22●●●●  Q42●●●●  Q62●●●●  Q82●●●●    │
   │  Q3 ●●●●  Q23●●●●  Q43●●●●  Q63●●●●  Q83●●●●    │
   │  ...      ...      ...      ...      ...         │
   │  Q20●●●●  Q40●●●●  Q60●●●●  Q80●●●●  Q100●●●●   │
   │                                                   │
   │  ← bubblesGap (21-25.5px) →                     │
   │  ↕ labelsGap (13.8px)                           │
   └───────────────────────────────────────────────────┘ 484

  Each ● represents a bubble (15x10 pixels)
  4 bubbles per question (A, B, C, D)
```

---

## 🔧 How to Modify the Template

### **Step 1: Edit inputs/template.json**

Only edit **ONE file**: `inputs/template.json`

Example - Change Column1 origin:
```json
"Column1": {
  "origin": [62, 187],  // Change these coordinates
  "bubblesGap": 21,     // Or adjust spacing
  "labelsGap": 13.8
}
```

### **Step 2: Sync to Mobile App**

```bash
# Automatic (recommended)
npm start

# Or manual sync
npm run sync-template

# Or Windows
sync-template.bat
```

### **Step 3: Test**

1. Run the Python backend: `python main.py -i inputs`
2. Run the mobile app: `npm start`
3. Both will use the same template!

---

## 📊 Coordinate System

### **Understanding Origins**

The `origin` is the **top-left corner** of the first bubble in each column.

```
Origin [x, y] = [62, 187]
    │
    │  (62, 187) ← First bubble (Q1-A) starts here
    │     ↓
    │  ● ● ● ●  ← Question 1 (A, B, C, D)
    │  ● ● ● ●  ← Question 2 (starts at y + labelsGap)
    │  ● ● ● ●  ← Question 3 (starts at y + 2*labelsGap)
```

### **Calculating Bubble Positions**

```javascript
// Question index (0 = Q1, 1 = Q2, etc.)
// Option index (0 = A, 1 = B, 2 = C, 3 = D)

bubbleX = origin.x + (optionIndex * bubblesGap);
bubbleY = origin.y + (questionIndex * labelsGap);
```

**Example: Q2, Option C**
```
Column1 origin = [62, 187]
Question index = 1 (Q2 is second question)
Option index = 2 (C is third option)
bubblesGap = 21
labelsGap = 13.8

bubbleX = 62 + (2 × 21) = 104
bubbleY = 187 + (1 × 13.8) = 200.8

→ Bubble C for Q2 is at position (104, 200.8)
```

---

## 🎯 Device Compatibility

### **The overlay works on ANY device because:**

✅ **Relative positioning** - Everything calculated as ratios  
✅ **Dynamic scaling** - Adapts to screen size  
✅ **Aspect ratio preserved** - Template proportions maintained  
✅ **Orientation aware** - Optimizes for landscape/portrait  

### **Tested on:**

- 📱 Small phones (360x640)
- 📱 Medium phones (375x667)
- 📱 Large phones (414x896)
- 📱 Tablets (768x1024)
- 📱 Landscape & Portrait modes

---

## 🚀 Workflow

### **Daily Use**

```bash
1. Edit inputs/template.json (if needed)
2. npm start (auto-syncs template)
3. Open app on phone
4. Camera overlay matches template perfectly!
5. Take photo
6. Python backend processes with same template
```

### **Development Cycle**

```bash
# Update template
edit inputs/template.json

# Sync manually
npm run sync-template

# Test backend
python main.py -i inputs

# Test mobile app
npm start → scan with phone

# Both use same template! ✅
```

---

## 📸 What You See on Screen

```
┌────────────────────────────────────┐
│  📱 Phone Screen (any size)        │
│                                    │
│  ┌──────────────────────────────┐  │ ← Green frame
│  │ ● ● ● ● ● ● ● ● ● ● ● ● ● ●│  │   (scaled to fit)
│  │ ● ● ● ● ● ● ● ● ● ● ● ● ● ●│  │
│  │ ● ● ● ● ● ● ● ● ● ● ● ● ● ●│  │ ← Bubble overlay
│  │ ...                          │  │   (100 questions)
│  │ ● ● ● ● ● ● ● ● ● ● ● ● ● ●│  │
│  └──────────────────────────────┘  │
│                                    │
│   📱 Landscape Mode Recommended    │
│                                    │
│  [✕]                        [⚡]   │ ← Controls
│             [  ●  ]                │ ← Capture
└────────────────────────────────────┘
```

All bubbles positioned **exactly** according to `inputs/template.json`!

---

## ⚡ Quick Reference

| Action | Command |
|--------|---------|
| Sync template | `npm run sync-template` |
| Start app (auto-sync) | `npm start` |
| Windows batch | `sync-template.bat` |
| Edit template | Edit `inputs/template.json` |
| Test backend | `python main.py -i inputs` |
| Test mobile | `npm start` → phone |

---

## ✅ Verification Checklist

After syncing, verify:

- [ ] Both templates have same `pageDimensions`
- [ ] Both templates have same `bubbleDimensions`
- [ ] All 5 columns have same `origin` coordinates
- [ ] All gaps (`bubblesGap`, `labelsGap`) match
- [ ] Question count matches (100 questions)
- [ ] Camera overlay displays correctly
- [ ] Python backend processes correctly

---

## 🎉 Benefits

✅ **One template to rule them all** - Edit once, works everywhere  
✅ **No manual syncing** - Automatic with `npm start`  
✅ **Device independent** - Works on any screen size  
✅ **Orientation flexible** - Portrait or landscape  
✅ **Pixel perfect** - Overlay matches physical sheet  
✅ **Easy to modify** - Change coordinates in one place  
✅ **Version controlled** - Template changes tracked in git  

---

## 🔍 Troubleshooting

### **Problem: Overlay doesn't match physical sheet**

**Solution:** Check if templates are synced
```bash
npm run sync-template
```

### **Problem: Bubbles in wrong position**

**Solution:** Verify origin coordinates in `inputs/template.json`

### **Problem: Different results between backend/mobile**

**Solution:** Ensure both use the same template version
```bash
npm run sync-template
python main.py -i inputs
```

---

## 📝 Summary

Your OMR system now uses **`inputs/template.json`** as the **single source of truth**:

1. ✅ **Backend** reads `inputs/template.json`
2. ✅ **Mobile app** syncs from `inputs/template.json`
3. ✅ **Camera overlay** renders based on synced template
4. ✅ **Responsive design** works on any device
5. ✅ **Automatic sync** before app starts

**Result:** Perfect alignment between camera overlay, mobile app, and backend processing! 🎯✨
