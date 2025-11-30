# 🚀 Deploy OMR Scanner API to Render.com

Complete guide for deploying your Flask API server to Render.com cloud hosting.

---

## 📋 Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Render.com Account** - Sign up at [render.com](https://render.com) (free tier available)
3. **GitHub Repository** - Your OMR Scanner project pushed to GitHub

---

## 🎯 Quick Deployment (5 Steps)

### **Step 1: Prepare Your Repository**

Make sure these files exist in your repository root:

- ✅ `api_server.py` - Your Flask API server
- ✅ `requirements_production.txt` - Production dependencies
- ✅ `render.yaml` - Render.com configuration (optional but recommended)
- ✅ `inputs/template.json` - Your OMR template file

**Important:** Ensure your `inputs/template.json` file is committed to Git (not in `.gitignore`)

---

### **Step 2: Sign Up / Login to Render.com**

1. Go to [render.com](https://render.com)
2. Click **"Get Started"** or **"Sign Up"**
3. Choose **"Sign up with GitHub"** (recommended)
4. Authorize Render.com to access your GitHub account

---

### **Step 3: Create New Web Service**

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:

   - Select the repository containing your OMR Scanner code
   - Click **"Connect"**

3. **Configure the service:**

   **Basic Settings:**

   - **Name:** `omr-scanner-api` (or your preferred name)
   - **Region:** Choose closest to you (e.g., `Oregon (US West)`)
   - **Branch:** `main` (or `master`)
   - **Root Directory:** Leave empty (or set if your code is in a subfolder)

   **Build & Deploy:**

   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements_production.txt`
   - **Start Command:** `gunicorn api_server:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

   **Environment Variables (Optional but Recommended):**

   - `FLASK_ENV` = `production`
   - `PYTHON_VERSION` = `3.11.0`
   - `ALLOWED_ORIGINS` = `https://your-frontend-domain.com,https://another-domain.com` (comma-separated)

4. **Select Plan:**

   - **Free:** Limited resources, spins down after inactivity
   - **Starter ($7/month):** Always on, better performance
   - Choose based on your needs (start with Free for testing)

5. Click **"Create Web Service"**

---

### **Step 4: Wait for Deployment**

Render will:

1. Clone your repository
2. Install dependencies from `requirements_production.txt`
3. Build your application
4. Start the server with gunicorn

**First deployment takes 5-10 minutes.**

Watch the build logs for any errors. If successful, you'll see:

```
[INFO] Application started successfully
[INFO] Listening on port 10000
```

---

### **Step 5: Get Your API URL**

Once deployed, Render provides:

- **URL:** `https://omr-scanner-api.onrender.com` (or your custom name)
- **Health Check:** `https://omr-scanner-api.onrender.com/api/health`

**Test it:**

```bash
curl https://omr-scanner-api.onrender.com/api/health
```

Should return:

```json
{
  "status": "healthy",
  "service": "OMR Scanner API",
  "version": "1.0.0"
}
```

---

## 🔧 Configuration Options

### **Using render.yaml (Recommended)**

If you created `render.yaml`, Render will automatically use it. Just:

1. Make sure `render.yaml` is in your repository root
2. When creating the service, Render will detect it
3. Settings from `render.yaml` will be applied automatically

**Benefits:**

- ✅ Version-controlled configuration
- ✅ Easy to reproduce
- ✅ Consistent deployments

### **Manual Configuration**

If not using `render.yaml`, configure manually in Render dashboard:

**Environment Variables:**

```
FLASK_ENV=production
PYTHON_VERSION=3.11.0
ALLOWED_ORIGINS=https://your-frontend.com
MAX_CONTENT_LENGTH=16777216  # 16MB
```

**Advanced Settings:**

- **Auto-Deploy:** `Yes` (deploy on every Git push)
- **Health Check Path:** `/api/health`
- **Dockerfile Path:** (leave empty, using Python buildpack)

---

## 🌐 Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click **"Settings"** → **"Custom Domains"**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Follow DNS instructions to point your domain to Render

---

## 📱 Update Mobile App Configuration

Update your mobile app to use the deployed API:

**File:** `omr-scanner-app/src/services/apiService.js`

```javascript
const API_CONFIG = {
  BASE_URL: 'https://omr-scanner-api.onrender.com/api', // Your Render URL
  TIMEOUT: 60000
  // ... rest of config
};
```

---

## 🔍 Troubleshooting

### **Problem: Build Fails**

**Check:**

1. ✅ All dependencies in `requirements_production.txt`
2. ✅ Python version compatibility
3. ✅ Build logs for specific error messages

**Common fixes:**

```bash
# If opencv-python fails, try:
opencv-python-headless==4.8.1.78  # Instead of opencv-python
```

### **Problem: Server Starts But Requests Fail**

**Check:**

1. ✅ Health endpoint: `https://your-app.onrender.com/api/health`
2. ✅ Server logs in Render dashboard
3. ✅ CORS configuration for your frontend domain

**Fix CORS:**
Add environment variable:

```
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### **Problem: Free Tier Spins Down**

**Symptoms:**

- First request after inactivity takes 30-60 seconds
- Subsequent requests are fast

**Solutions:**

1. **Upgrade to Starter plan** ($7/month) - Always on
2. **Keep-alive service** - Use a cron job to ping your API every 5 minutes
3. **Accept the delay** - Free tier limitation

### **Problem: Timeout Errors**

**Symptoms:**

- Requests fail after 30 seconds
- Processing takes longer than expected

**Solutions:**

1. **Increase timeout in gunicorn:**

   ```bash
   gunicorn api_server:app --bind 0.0.0.0:$PORT --workers 2 --timeout 300
   ```

2. **Optimize image processing:**
   - Reduce image resolution before upload
   - Compress images on mobile app

### **Problem: Memory Issues**

**Symptoms:**

- Service crashes during processing
- Out of memory errors

**Solutions:**

1. **Upgrade plan** - Free tier has limited memory
2. **Reduce workers:**

   ```bash
   gunicorn api_server:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
   ```

3. **Clean up temp files faster:**
   - Set cleanup to run immediately after processing

---

## 🔒 Security Considerations

### **Production Checklist:**

- ✅ **HTTPS:** Automatically enabled by Render
- ✅ **CORS:** Configure `ALLOWED_ORIGINS` environment variable
- ⚠️ **Rate Limiting:** Consider adding Flask-Limiter for production
- ⚠️ **Authentication:** Add API keys or JWT if needed
- ⚠️ **Input Validation:** Already implemented, but review
- ⚠️ **Error Messages:** Don't expose internal errors to clients

### **Add Rate Limiting (Optional):**

```python
# Add to api_server.py
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/api/process-base64', methods=['POST'])
@limiter.limit("10 per minute")  # 10 requests per minute
def process_image_base64():
    # ... existing code
```

---

## 📊 Monitoring

### **Render Dashboard:**

- **Metrics:** CPU, Memory, Request count
- **Logs:** Real-time and historical logs
- **Events:** Deployments, scaling events
- **Alerts:** Email notifications for failures

### **Health Checks:**

Render automatically pings `/api/health` to verify service is running.

---

## 🔄 Continuous Deployment

**Auto-Deploy is enabled by default:**

1. Push to your GitHub repository:

   ```bash
   git add .
   git commit -m "Update API"
   git push origin main
   ```

2. Render automatically:
   - Detects the push
   - Runs build command
   - Deploys new version
   - Shows deployment status

**Manual Deploy:**

- In Render dashboard → **"Manual Deploy"** → **"Deploy latest commit"**

---

## 💰 Pricing

### **Free Tier:**

- ✅ 750 hours/month (enough for always-on if optimized)
- ✅ 512 MB RAM
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold starts can take 30-60 seconds

### **Starter Plan ($7/month):**

- ✅ Always on (no spin-down)
- ✅ 512 MB RAM
- ✅ Unlimited hours
- ✅ Better performance

### **Standard Plan ($25/month):**

- ✅ 2 GB RAM
- ✅ Better CPU
- ✅ For high-traffic apps

---

## ✅ Deployment Checklist

Before deploying:

- [ ] Code pushed to GitHub
- [ ] `requirements_production.txt` includes all dependencies
- [ ] `inputs/template.json` exists and is committed
- [ ] Tested locally with `python api_server.py`
- [ ] Environment variables configured (if needed)
- [ ] CORS origins set for your frontend domain

After deploying:

- [ ] Health check endpoint works
- [ ] Can process test images
- [ ] Mobile app can connect
- [ ] Logs show no errors
- [ ] Performance is acceptable

---

## 🎉 Success!

Your OMR Scanner API is now live on Render.com!

**Your API URL:** `https://your-service-name.onrender.com`

**Endpoints:**

- Health: `https://your-service-name.onrender.com/api/health`
- Process: `https://your-service-name.onrender.com/api/process-base64`
- Templates: `https://your-service-name.onrender.com/api/templates`

**Next Steps:**

1. Update mobile app with new API URL
2. Test end-to-end workflow
3. Monitor logs and performance
4. Set up custom domain (optional)
5. Add authentication if needed (optional)

---

## 📚 Additional Resources

- [Render.com Documentation](https://render.com/docs)
- [Gunicorn Configuration](https://docs.gunicorn.org/en/stable/settings.html)
- [Flask Production Best Practices](https://flask.palletsprojects.com/en/2.3.x/deploying/)

---

**Need Help?**

- Check Render logs for detailed error messages
- Review Flask server logs in Render dashboard
- Test locally first to catch issues early
