# 🚀 CORS Error Fix Guide - Production Deployment

## ❌ **The Problem:**

You're getting CORS errors after deploying your frontend to Vercel because:

1. Your frontend is deployed on `https://your-vercel-domain.vercel.app`
2. Your backend is running on `http://192.168.8.116:5000` (local IP)
3. Browsers block HTTP requests from HTTPS sites (mixed content policy)

## ✅ **Solutions (Choose One):**

### **Option 1: Deploy Backend to Production (Recommended)**

#### **Deploy Flask Backend to Railway/Render/Heroku:**

1. **Railway (Recommended):**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   railway login
   cd web_backend
   railway init
   railway up
   ```

2. **Render:**

   - Go to render.com
   - Create new Web Service
   - Connect your GitHub repo
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `python app.py`

3. **Heroku:**

   ```bash
   # Install Heroku CLI
   # Create Procfile in web_backend directory:
   echo "web: python app.py" > Procfile

   # Deploy
   heroku create your-backend-name
   git push heroku main
   ```

#### **Update Frontend API URL:**

Replace `https://your-backend-domain.com/api` in `services/api.ts` with your actual deployed backend URL.

### **Option 2: Use ngrok for Local Backend (Quick Fix)**

1. **Install ngrok:**

   ```bash
   # Download from https://ngrok.com/download
   # Or use npm
   npm install -g ngrok
   ```

2. **Expose your local backend:**

   ```bash
   cd web_backend
   ngrok http 5000
   ```

3. **Update frontend with ngrok URL:**
   - Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)
   - Update `services/api.ts`:
   ```typescript
   const API_BASE_URL = 'https://your-ngrok-url.ngrok.io/api';
   ```

### **Option 3: Configure Local Network (Development Only)**

If you want to keep using your local IP for development:

1. **Update CORS in backend** (already done):

   ```python
   CORS(app, origins=["*"], supports_credentials=True)
   ```

2. **Access your deployed frontend from same network:**
   - Make sure your deployed frontend can access your local backend
   - This only works if both are on the same network

## 🔧 **Backend CORS Configuration (Already Fixed):**

Your `web_backend/app.py` now includes:

```python
CORS(app, origins=[
    "http://localhost:3000",  # Local development
    "https://*.vercel.app",   # Vercel deployments
    "https://*.netlify.app",  # Netlify deployments
    "*"  # Allow all origins (remove in production)
], supports_credentials=True)
```

## 📱 **Frontend API Configuration (Updated):**

Your `services/api.ts` now includes:

```typescript
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://192.168.8.116:5000/api' // Local development
    : 'https://your-backend-domain.com/api'); // Production - UPDATE THIS
```

## 🎯 **Quick Fix Steps:**

### **For Immediate Fix (ngrok):**

1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 5000`
3. Copy HTTPS URL from ngrok
4. Update `services/api.ts` with ngrok URL
5. Redeploy frontend

### **For Production Fix (Railway):**

1. Go to railway.app
2. Connect GitHub repo
3. Deploy `web_backend` folder
4. Copy deployed URL
5. Update `services/api.ts` with Railway URL
6. Redeploy frontend

## 🚨 **Important Notes:**

- ✅ **HTTPS Required:** Production backends must use HTTPS
- ✅ **Mixed Content Policy:** HTTPS sites can't call HTTP APIs
- ✅ **CORS Headers:** Backend must allow your frontend domain
- ✅ **Environment Variables:** Use `NEXT_PUBLIC_API_URL` for production

## 🎉 **After Fixing:**

Your deployed OMR Scanner will work with:

- ✅ **Camera capture** on mobile devices
- ✅ **Template upload** and processing
- ✅ **Real-time OMR detection**
- ✅ **Results display** and export
- ✅ **No CORS errors**

**Choose the solution that works best for your setup!** 🚀


