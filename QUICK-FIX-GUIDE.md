# 🚀 Quick Fix: Connect Your Deployed Frontend to Local Backend

## ✅ **Status Confirmed:**

- ✅ **Frontend:** Successfully deployed at https://omr-checker-3t2v.vercel.app/
- ✅ **Backend:** Running locally on http://192.168.8.116:5000
- ❌ **Connection:** Blocked by mixed content policy (HTTPS → HTTP)

## 🔧 **Quick Fix with ngrok (5 minutes):**

### **Step 1: Install ngrok**

```bash
# Option 1: Download from https://ngrok.com/download
# Option 2: Use npm (if you have Node.js)
npm install -g ngrok
```

### **Step 2: Expose Your Backend**

```bash
# Make sure your backend is running first
cd web_backend
python app.py

# In a new terminal, expose it with ngrok
ngrok http 5000
```

### **Step 3: Get the HTTPS URL**

ngrok will show you something like:

```
Session Status                online
Account                       your-account
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def.ngrok.io -> http://localhost:5000
```

**Copy the HTTPS URL:** `https://abc123def.ngrok.io`

### **Step 4: Update Frontend**

Update your `services/api.ts`:

```typescript
const API_BASE_URL = 'https://your-ngrok-url.ngrok.io/api';
```

### **Step 5: Redeploy Frontend**

```bash
cd web_frontend_nextjs
git add .
git commit -m "Update API URL to ngrok"
git push
```

## 🎯 **Alternative: Use Environment Variable (Faster)**

### **In Vercel Dashboard:**

1. Go to your project settings
2. Go to "Environment Variables"
3. Add: `NEXT_PUBLIC_API_URL` = `https://your-ngrok-url.ngrok.io/api`
4. Redeploy

## 🧪 **Test the Connection:**

### **Test Backend Directly:**

Visit: `https://your-ngrok-url.ngrok.io/api/health`
Should show: `{"message": "OMR API is running", "status": "healthy"}`

### **Test Frontend:**

Visit: https://omr-checker-3t2v.vercel.app/
Should now show: "Backend Status: Online" ✅

## 🎉 **Expected Result:**

After the fix, your deployed OMR Scanner will:

- ✅ Show "Backend Status: Online"
- ✅ Allow template upload
- ✅ Process OMR images
- ✅ Display results
- ✅ Work on mobile with camera capture

## 📱 **Mobile Features Ready:**

- ✅ Camera capture with template overlay
- ✅ Real-time OMR processing
- ✅ Results organized by columns
- ✅ Export to CSV
- ✅ Works in portrait/landscape

**Your OMR Web Scanner will be fully functional in 5 minutes!** 🚀


