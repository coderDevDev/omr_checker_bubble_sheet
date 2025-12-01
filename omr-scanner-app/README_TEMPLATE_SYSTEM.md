# 🎯 Template System - Quick Start

## ✨ What Changed

Your OMR Scanner now uses **`inputs/template.json`** as the **single source of truth** for both:
- 🐍 **Python Backend** (main.py)
- 📱 **Mobile Camera App** (React Native)

---

## 🚀 Quick Start

### **1. Start the Mobile App**

```bash
cd omr-scanner-app
npm start
```

✅ Template automatically syncs from `inputs/template.json`  
✅ Camera overlay matches your template exactly  
✅ Works on any device size (responsive)  

### **2. Update Template (if needed)**

Edit only ONE file:
```bash
inputs/template.json
```

Then run:
```bash
npm run sync-template
```

That's it! Both backend and mobile app now use the updated template.

---

## 📱 How the Camera Overlay Works

### **Responsive & Device-Independent**

The camera overlay is **fully responsive** using:

1. **Dynamic Scaling**
   ```
   Template: 707×484 pixels
   ↓ Scales automatically to fit
   Phone: 360×640 → Scale 0.43
   Tablet: 1024×768 → Scale 1.35
   ```

2. **Relative Positioning**
   ```
   All bubbles positioned relative to:
   • Template origin coordinates
   • Calculated scale factor
   • Device screen dimensions
   ```

3. **Works on ANY Device**
   - ✅ Small phones (360px)
   - ✅ Large phones (414px)
   - ✅ Tablets (768px+)
   - ✅ Portrait or Landscape

### **Based on Template Data**

Every bubble position comes from `template.json`:

```json
"Column1": {
  "origin": [62, 187],      ← Starting point
  "bubblesGap": 21,         ← Horizontal spacing
  "labelsGap": 13.8,        ← Vertical spacing
  "fieldLabels": ["Q1"...]  ← Question names
}
```

Camera calculates: `bubbleX = origin.x + (index × bubblesGap) × scale`

---

## 🔄 Automatic Sync

Templates sync automatically when you:

```bash
npm start           # Auto-syncs before starting
npm run sync-template    # Manual sync
```

Or on Windows:
```bash
sync-template.bat   # Double-click to sync
```

---

## 📂 File Structure

```
OMRChecker/
├── inputs/
│   └── template.json  ← SINGLE SOURCE OF TRUTH ⭐
│
├── main.py            ← Backend reads inputs/template.json
│
└── omr-scanner-app/
    ├── sync-template.js           ← Sync script
    ├── sync-template.bat          ← Windows batch
    │
    ├── assets/templates/dxuian/
    │   └── template.json          ← Auto-synced copy
    │
    └── src/screens/
        └── CameraOverlayScreen.js ← Renders overlay
```

---

## 🎨 Template Structure

```json
{
  "pageDimensions": [707, 484],    // Template size
  "bubbleDimensions": [15, 10],    // Bubble size
  
  "fieldBlocks": {
    "Column1": {
      "fieldType": "QTYPE_MCQ4",   // 4 options (A,B,C,D)
      "origin": [62, 187],         // Start position
      "bubblesGap": 21,            // Horizontal space
      "labelsGap": 13.8,           // Vertical space
      "bubbleCount": 20,           // Questions in column
      "fieldLabels": ["Q1", "Q2", ..., "Q20"]
    },
    "Column2": { ... },
    "Column3": { ... },
    "Column4": { ... },
    "Column5": { ... }
  }
}
```

---

## 🔧 How to Modify Template

### **Option 1: Change Bubble Positions**

Edit `inputs/template.json`:

```json
"Column1": {
  "origin": [62, 187],  // ← Change X or Y
}
```

Then sync:
```bash
npm run sync-template
```

### **Option 2: Change Spacing**

```json
"bubblesGap": 21,   // ← Horizontal spacing
"labelsGap": 13.8,  // ← Vertical spacing
```

### **Option 3: Add/Remove Questions**

```json
"fieldLabels": [
  "Q1", "Q2", "Q3"  // ← Add or remove
],
"bubbleCount": 3    // ← Update count
```

---

## ✅ Verification

After syncing, check:

```bash
# Backend template
cat inputs/template.json

# Mobile template (should match)
cat omr-scanner-app/assets/templates/dxuian/template.json

# Test backend
python main.py -i inputs

# Test mobile
npm start → open on phone
```

---

## 📱 Camera Overlay Features

### **What You See**

```
┌────────────────────────────────┐
│  📱 Camera View                │
│  ┌──────────────────────────┐  │ ← Green frame
│  │ Column1 Column2 Column3  │  │   (template outline)
│  │ Q1 ●●●● Q21●●●● Q41●●●● │  │
│  │ Q2 ●●●● Q22●●●● Q42●●●● │  │ ← Bubble overlay
│  │ ...                      │  │   (100 questions)
│  └──────────────────────────┘  │
│                                │
│  📱 Landscape Mode - Perfect!  │ ← Orientation hint
│                                │
│  [✕]                    [⚡]   │ ← Close / Flash
│           [  ●  ]              │ ← Capture
└────────────────────────────────┘
```

### **Features**

✅ Green frame - Shows template boundaries  
✅ Corner markers - Help with alignment  
✅ Center crosshair - Perfect centering  
✅ Bubble guides - 100 questions × 4 options  
✅ Option labels - A, B, C, D inside bubbles  
✅ Question labels - Q1, Q2, etc.  
✅ Column borders - Visual grouping  
✅ Flash toggle - For low light  
✅ Orientation detection - Landscape recommended  

---

## 🎯 Why This is Better

### **Before:**

❌ Two separate templates (backend & mobile)  
❌ Manual copying between files  
❌ Risk of mismatch  
❌ Hard to keep in sync  

### **Now:**

✅ Single source of truth (`inputs/template.json`)  
✅ Automatic synchronization  
✅ Always in sync  
✅ Responsive overlay (any device)  
✅ Template-driven positioning  
✅ Easy to modify (one file)  

---

## 📚 Documentation

- **TEMPLATE_SYNC_GUIDE.md** - Complete sync system guide
- **RESPONSIVE_OVERLAY_EXPLAINED.md** - Technical deep dive
- **TEMPLATE_OVERLAY_MAPPING.md** - Original mapping docs

---

## ⚡ Commands Reference

| Command | Description |
|---------|-------------|
| `npm start` | Start app (auto-sync) |
| `npm run sync-template` | Manual sync |
| `python main.py -i inputs` | Test backend |
| Edit `inputs/template.json` | Modify template |

---

## 🎉 Summary

Your OMR Scanner now has:

1. ✅ **Single source of truth** - One template file
2. ✅ **Automatic sync** - No manual work
3. ✅ **Responsive overlay** - Any device size
4. ✅ **Template-driven** - All settings from JSON
5. ✅ **Easy to modify** - Edit one file
6. ✅ **Production ready** - Professional system

**Everything works together perfectly!** 🚀✨

---

## 🆘 Need Help?

- Check `TEMPLATE_SYNC_GUIDE.md` for detailed instructions
- Check `RESPONSIVE_OVERLAY_EXPLAINED.md` for technical details
- Verify sync: `npm run sync-template`
- Test backend: `python main.py -i inputs`
- Test mobile: `npm start`

**The system is ready to use!** 🎯
