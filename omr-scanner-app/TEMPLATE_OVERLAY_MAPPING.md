# 📐 Template.json to Camera Overlay Mapping

## ✅ Yes! The overlay follows your template.json exactly!

The camera overlay reads your `template.json` and draws the bubble positions **exactly** where they are defined in the template.

---

## 🎯 **How It Works**

### **Step 1: Template is Loaded**

```javascript
// From templateLoader.js
const template = require('../../assets/templates/dxuian/template.json');
```

### **Step 2: Overlay Dimensions Calculated**

```javascript
// From CameraOverlayScreen.js - calculateOverlayDimensions()

// Template dimensions from template.json
pageDimensions: [707, 484]; // Width x Height in pixels
bubbleDimensions: [15, 10]; // Bubble width x height

// Scale to fit phone screen
const scale = Math.min(
  (screenWidth * 0.9) / 707, // Scale to fit width
  (screenHeight * 0.85) / 484 // Scale to fit height
);

// Result: Overlay sized to match template proportions
overlayWidth = 707 * scale;
overlayHeight = 484 * scale;
```

### **Step 3: Bubble Positions Calculated**

```javascript
// From CameraOverlayScreen.js - calculateBubblePositions()

// For each field block in template.json:
fieldBlocks: {
  "Column1": {
    origin: [82, 35],        // Starting position (x, y)
    bubblesGap: 21,          // Horizontal spacing between bubbles
    labelsGap: 22.7,         // Vertical spacing between questions
    bubbleCount: 20,         // 20 questions in this column
    fieldLabels: ["Q1", "Q2", ..., "Q20"]
  },
  "Column2": {
    origin: [205, 35],       // Next column starts here
    ...
  },
  ...
}

// Calculate actual screen position:
bubbleX = overlayX + (origin.x + bubbleIndex * bubblesGap) * scale
bubbleY = overlayY + (origin.y + questionIndex * labelsGap) * scale
```

---

## 📊 **Your Template Layout**

### **Template.json Structure:**

```json
{
  "pageDimensions": [707, 484],     // Page size
  "bubbleDimensions": [15, 10],     // Bubble size

  "fieldBlocks": {
    "Column1": { origin: [82, 35],   bubblesGap: 21, labelsGap: 22.7, questions: Q1-Q20 },
    "Column2": { origin: [205, 35],  bubblesGap: 21, labelsGap: 22.7, questions: Q21-Q40 },
    "Column3": { origin: [327, 35],  bubblesGap: 21, labelsGap: 22.7, questions: Q41-Q60 },
    "Column4": { origin: [450, 35],  bubblesGap: 21, labelsGap: 22.7, questions: Q61-Q80 },
    "Column5": { origin: [573, 35],  bubblesGap: 21, labelsGap: 22.7, questions: Q81-Q100 }
  }
}
```

### **Visual Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Template: 707 x 484 pixels                                     │
│                                                                 │
│  Origin (0,0)                                                   │
│  ↓                                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Col1    Col2    Col3    Col4    Col5                   │  │
│  │  (82,35) (205,35)(327,35)(450,35)(573,35)              │  │
│  │  ↓       ↓       ↓       ↓       ↓                      │  │
│  │  Q1 ●●●● Q21●●●● Q41●●●● Q61●●●● Q81●●●●              │  │
│  │  Q2 ●●●● Q22●●●● Q42●●●● Q62●●●● Q82●●●●              │  │
│  │  Q3 ●●●● Q23●●●● Q43●●●● Q63●●●● Q83●●●●              │  │
│  │  ...     ...     ...     ...     ...                    │  │
│  │  Q20●●●● Q40●●●● Q60●●●● Q80●●●● Q100●●●●             │  │
│  │                                                          │  │
│  │  Each ● = bubble (15x10 pixels)                         │  │
│  │  Gap between bubbles = 21 pixels                        │  │
│  │  Gap between questions = 22.7 pixels                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 **Camera Overlay Rendering**

### **What Gets Drawn:**

1. **Green Frame** (outer rectangle)

   - Position: Centered on screen
   - Size: 707 × 484 (scaled to fit screen)
   - Color: Green (#00FF00)

2. **Corner Markers** (4 corners)

   - Position: At each corner of green frame
   - Size: 40 × 40 pixels
   - Purpose: Help with alignment

3. **Crosshair** (center)

   - Position: Center of green frame
   - Purpose: Perfect centering guide

4. **Bubble Circles** (500 bubbles total)

   - **Column 1:** Q1-Q20 at origin [82, 35]
   - **Column 2:** Q21-Q40 at origin [205, 35]
   - **Column 3:** Q41-Q60 at origin [327, 35]
   - **Column 4:** Q61-Q80 at origin [450, 35]
   - **Column 5:** Q81-Q100 at origin [573, 35]
   - Each question has 4 bubbles (A, B, C, D)
   - Total: 100 questions × 4 options = **400 bubbles**

5. **Option Labels** (A, B, C, D)
   - Drawn inside each bubble
   - Font size: Scaled to fit

---

## 🔍 **Exact Position Calculation**

### **Example: Q1, Option A (First Bubble)**

**From template.json:**

```json
"Column1": {
  "origin": [82, 35],        // Starting position
  "bubblesGap": 21,          // Space between bubbles
  "labelsGap": 22.7,         // Space between questions
  "fieldLabels": ["Q1", ...]
}
```

**Calculation:**

```javascript
// Template coordinates
templateX = 82; // Column1 origin X
templateY = 35; // Column1 origin Y
questionIndex = 0; // Q1 is first question
bubbleIndex = 0; // Option A is first bubble

// Calculate position in template space
bubbleTemplateX = templateX + bubbleIndex * 21; // 82 + 0 = 82
bubbleTemplateY = templateY + questionIndex * 22.7; // 35 + 0 = 35

// Scale to screen space
scale = 1.5; // Example scale factor
overlayX = 50; // Example overlay X position
overlayY = 100; // Example overlay Y position

// Final screen position
bubbleScreenX = overlayX + bubbleTemplateX * scale; // 50 + (82 * 1.5) = 173
bubbleScreenY = overlayY + bubbleTemplateY * scale; // 100 + (35 * 1.5) = 152.5

// Draw bubble at (173, 152.5) with radius (15 * 1.5 / 2) = 11.25 pixels
```

---

## 📱 **Responsive Scaling**

### **Portrait vs Landscape:**

**Portrait Mode:**

```
Screen: 360 × 800 pixels
Scale: min(360*0.85/707, 800*0.70/484) = min(0.43, 1.16) = 0.43
Overlay: 707*0.43 = 304 × 484*0.43 = 208 pixels
```

**Landscape Mode:**

```
Screen: 800 × 360 pixels
Scale: min(800*0.90/707, 360*0.85/484) = min(1.02, 0.63) = 0.63
Overlay: 707*0.63 = 445 × 484*0.63 = 305 pixels
```

**Result:** Landscape mode gives you **46% larger overlay!** 🎉

---

## ✅ **Verification**

### **How to Verify Overlay Matches Template:**

1. **Check Console Logs:**

   ```
   Overlay calculated for LANDSCAPE: 445x305
   ```

2. **Visual Inspection:**

   - Green frame should cover entire bubble sheet
   - All 5 columns visible
   - 20 questions per column
   - 4 bubbles per question
   - Bubbles evenly spaced

3. **Test Scan:**
   - Take a photo
   - Check if bubbles are detected correctly
   - Verify all 100 questions are recognized

---

## 🎯 **Key Points**

### **✅ YES, the overlay follows template.json exactly:**

1. ✅ **Page dimensions** - Green frame matches `pageDimensions: [707, 484]`
2. ✅ **Bubble size** - Circles match `bubbleDimensions: [15, 10]`
3. ✅ **Column positions** - Each column starts at its `origin` coordinate
4. ✅ **Bubble spacing** - Horizontal gaps match `bubblesGap: 21`
5. ✅ **Question spacing** - Vertical gaps match `labelsGap: 22.7`
6. ✅ **Question count** - 100 questions total (20 per column)
7. ✅ **Options** - 4 bubbles per question (A, B, C, D)
8. ✅ **Scaling** - Everything scales proportionally

---

## 🔧 **Code Flow**

```
1. App loads template.json
   ↓
2. User taps "Use Template"
   ↓
3. CameraOverlayScreen receives template
   ↓
4. calculateOverlayDimensions() runs
   - Reads pageDimensions [707, 484]
   - Reads bubbleDimensions [15, 10]
   - Calculates scale to fit screen
   ↓
5. calculateBubblePositions() runs
   - Loops through fieldBlocks (Column1-5)
   - For each column:
     - Read origin [x, y]
     - Read bubblesGap, labelsGap
     - For each question (Q1-Q100):
       - Calculate Y position: origin.y + index * labelsGap
       - For each option (A, B, C, D):
         - Calculate X position: origin.x + index * bubblesGap
         - Store bubble position
   ↓
6. renderBubbleGuides() draws bubbles
   - Uses SVG to draw circles
   - Positions match calculated coordinates
   - Scaled to screen size
   ↓
7. User sees overlay matching template! ✅
```

---

## 📸 **What You See on Screen**

```
┌────────────────────────────────────────┐
│  📱 Camera View                        │
│  ┌──────────────────────────────────┐  │
│  │ ┌──────────────────────────────┐ │  │ ← Green frame (707×484 scaled)
│  │ │ Q1  ●●●● Q21●●●● Q41●●●●... │ │  │ ← Bubble overlay
│  │ │ Q2  ●●●● Q22●●●● Q42●●●●... │ │  │
│  │ │ Q3  ●●●● Q23●●●● Q43●●●●... │ │  │
│  │ │ ...                          │ │  │
│  │ │ Q20 ●●●● Q40●●●● Q60●●●●... │ │  │
│  │ └──────────────────────────────┘ │  │
│  └──────────────────────────────────┘  │
│                                        │
│  "📱 Landscape Mode - Perfect!"        │
│                                        │
│  [✕]                            [⚡]   │ ← Controls
│                                        │
│              [  ●  ]                   │ ← Capture button
└────────────────────────────────────────┘
```

---

## 🎉 **Summary**

**The camera overlay is a perfect visual representation of your template.json!**

- ✅ Every coordinate from template.json is used
- ✅ Every spacing value is applied
- ✅ Every bubble is drawn at the correct position
- ✅ Everything scales proportionally
- ✅ Works in both portrait and landscape

**When you align your physical bubble sheet with the green overlay, the bubbles on the sheet will match the circles on the screen!** 🎯✨

---

## 🔍 **To Modify the Overlay**

If you want to change the overlay layout, just edit `template.json`:

```json
{
  "pageDimensions": [707, 484], // Change page size
  "bubbleDimensions": [15, 10], // Change bubble size
  "fieldBlocks": {
    "Column1": {
      "origin": [82, 35], // Change column position
      "bubblesGap": 21, // Change horizontal spacing
      "labelsGap": 22.7, // Change vertical spacing
      "bubbleCount": 20 // Change number of questions
    }
  }
}
```

**The overlay will automatically update to match!** 🚀
