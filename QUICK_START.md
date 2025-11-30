# 🚀 OMR Scanner - Quick Start Guide

## Get Started in 5 Minutes!

---

## 📋 Prerequisites Check

```bash
# Check Python
python --version
# Should show: Python 3.8+

# Check Node.js
node --version
# Should show: v14+

# Check npm
npm --version
# Should show: 6+
```

---

## ⚡ Quick Start (3 Steps)

### **Step 1: Start Python Backend**

**Option A: Windows Batch File** (Easiest)
```bash
# Double-click or run:
start_api_server.bat
```

**Option B: Manual**
```bash
# Install dependencies (first time only)
pip install -r requirements.txt
pip install -r requirements_api.txt

# Start server
python api_server.py
```

**You should see:**
```
============================================================
OMR Scanner API Server
============================================================
 * Running on http://0.0.0.0:5000
============================================================
```

**✅ Keep this terminal open!**

---

### **Step 2: Configure Mobile App**

**Find your computer's IP address:**

```bash
# Windows
ipconfig
```

Look for `IPv4 Address`: e.g., `192.168.1.100`

**Edit the mobile app config:**

File: `omr-scanner-app/src/services/apiService.js`

```javascript
const API_CONFIG = {
  BASE_URL: 'http://192.168.1.100:5000/api', // <- CHANGE THIS!
  //            ^^^^^^^^^^^^^^^ Your IP here
};
```

---

### **Step 3: Start Mobile App**

```bash
cd omr-scanner-app

# First time only
npm install

# Start app
npm start
```

**Scan QR code with Expo Go app on your phone!**

---

## 📱 Using the App

1. **Open app on phone** (Expo Go)
2. **Tap "Start Camera"**
3. **Align OMR sheet** with green overlay
4. **Capture photo**
5. **Wait 7-18 seconds** for processing
6. **View results!**
   - All 100 answers
   - Marked image
   - Statistics

---

## 🔍 Testing

### **Test 1: Backend Health**

```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "OMR Scanner API"
}
```

### **Test 2: From Phone Browser**

Open on phone: `http://192.168.1.100:5000/api/health`

Should see JSON response.

### **Test 3: Capture Photo**

1. Open app
2. Start camera
3. Capture test photo
4. Check terminal for processing logs

---

## 🐛 Common Issues

### **Issue: "Cannot connect to server"**

**Fix:**
- Check server is running (green text)
- Check IP in `apiService.js`
- Both devices on same WiFi
- Test from phone browser

### **Issue: "Module not found"**

**Fix:**
```bash
# Backend
pip install -r requirements_api.txt

# Mobile
cd omr-scanner-app
npm install
```

### **Issue: "Port already in use"**

**Fix:**
```bash
# Kill existing process
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in api_server.py
app.run(port=5001)  # Use different port
```

---

## 📁 File Structure

```
OMRChecker/
├── api_server.py              ← Backend API server
├── start_api_server.bat       ← Windows launcher
├── main.py                    ← Original CLI (still works!)
├── inputs/
│   └── template.json          ← Single source of truth
│
├── omr-scanner-app/
│   ├── src/
│   │   ├── services/
│   │   │   └── apiService.js  ← API client
│   │   └── screens/
│   │       ├── CameraOverlayScreen.js  ← Camera
│   │       └── ResultsScreen.js        ← Results
│   └── package.json
│
└── Documentation:
    ├── API_SERVER_GUIDE.md
    ├── BACKEND_INTEGRATION.md
    ├── MOBILE_BACKEND_INTEGRATION_COMPLETE.md
    └── QUICK_START.md (this file)
```

---

## 💡 Tips

### **For Best Results:**

✅ **Use landscape mode** on phone  
✅ **Good lighting** (bright, even)  
✅ **Align carefully** (use green overlay)  
✅ **Mark bubbles clearly** (fill completely)  
✅ **Keep server running** (faster processing)  

### **Performance:**

- First request: 15-20 seconds (loading models)
- Subsequent: 6-14 seconds
- Same network = faster upload

---

## 📝 Example Session

```bash
# Terminal 1: Backend
C:\...\OMRChecker> python api_server.py
============================================================
 * Running on http://0.0.0.0:5000
============================================================

# Terminal 2: Mobile App
C:\...\omr-scanner-app> npm start
Starting Metro Bundler...
QR Code displayed
Scan with Expo Go!

# Phone: Scan QR code
# Phone: Open app
# Phone: Tap "Start Camera"
# Phone: Capture photo
# Terminal 1 shows: "Processing image..."
# Phone shows: Results + marked image!
```

---

## ✅ Success Checklist

After setup, you should have:

- [ ] Python server running (green text)
- [ ] Mobile app started (QR code shown)
- [ ] App opened on phone (Expo Go)
- [ ] Both on same WiFi
- [ ] Health check works from phone
- [ ] Can capture photo
- [ ] Results displayed
- [ ] Marked image shown

---

## 🎯 What Each Component Does

```
┌─────────────────┐
│  Mobile App     │  Captures photos
│  (Phone)        │  Shows results
└────────┬────────┘
         │
         │ WiFi
         │
┌────────▼────────┐
│  Flask Server   │  Receives images
│  (Computer)     │  Returns results
└────────┬────────┘
         │
         │ Calls
         │
┌────────▼────────┐
│  main.py Logic  │  Processes OMR
│  (CV2, Pandas)  │  Detects bubbles
└─────────────────┘
```

---

## 📚 Next Steps

### **After Getting It Working:**

1. Read **API_SERVER_GUIDE.md** for details
2. Read **BACKEND_INTEGRATION.md** for mobile config
3. Explore **TEMPLATE_SYNC_GUIDE.md** for customization
4. Try different templates
5. Scan real OMR sheets!

### **For Production:**

- Deploy to cloud (AWS, Azure)
- Add authentication
- Set up database
- Enable answer key comparison
- Add score calculation

---

## 🆘 Getting Help

### **Documentation:**

- **API_SERVER_GUIDE.md** - Complete backend guide
- **BACKEND_INTEGRATION.md** - Mobile app setup
- **MOBILE_BACKEND_INTEGRATION_COMPLETE.md** - Full system overview
- **TEMPLATE_SYNC_GUIDE.md** - Template system
- **RESPONSIVE_OVERLAY_EXPLAINED.md** - Camera overlay details

### **Debugging:**

```bash
# Backend logs
# Look at Python terminal

# Mobile logs
# Press 'd' in Metro Bundler
# Or check Expo Go app logs

# Network test
curl http://localhost:5000/api/health
ping 192.168.1.100
```

---

## 🎉 You're Ready!

Your OMR Scanner system is complete:

✅ Python backend server  
✅ Mobile camera app  
✅ Real-time processing  
✅ Professional results  
✅ Production quality  

**Start scanning OMR sheets now!** 📝✨

---

## 📞 Quick Commands Reference

```bash
# Start backend
python api_server.py

# Start mobile app
cd omr-scanner-app && npm start

# Test health
curl http://localhost:5000/api/health

# Find IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Install dependencies
pip install -r requirements_api.txt
npm install

# Check versions
python --version
node --version
npm --version
```

---

**Happy Scanning!** 🚀
