# ⚡ Quick Deploy to Render.com - 5 Minutes

## 🚀 Fastest Way to Deploy

### **1. Push to GitHub**
```bash
git add .
git commit -m "Add Render.com deployment files"
git push origin main
```

### **2. Deploy on Render.com**

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your repository
4. **Auto-detect settings** (Render will use `render.yaml`)

**OR Manual Settings:**
- **Build Command:** `pip install -r requirements_production.txt`
- **Start Command:** `gunicorn api_server:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
- **Plan:** Free (or Starter for always-on)

5. Click **"Create Web Service"**

### **3. Wait 5-10 Minutes**
Watch the build logs. When done, you'll get:
```
✅ https://your-app.onrender.com
```

### **4. Test It**
```bash
curl https://your-app.onrender.com/api/health
```

### **5. Update Mobile App**
Change `BASE_URL` in `omr-scanner-app/src/services/apiService.js`:
```javascript
BASE_URL: 'https://your-app.onrender.com/api'
```

---

## 📋 Files You Need

✅ `api_server.py` - Your Flask server  
✅ `requirements_production.txt` - Dependencies  
✅ `render.yaml` - Configuration (optional)  
✅ `inputs/template.json` - Must be in Git!  

---

## ⚠️ Important Notes

1. **Free tier spins down** after 15 min inactivity (first request slow)
2. **Starter plan ($7/month)** = Always on
3. **Make sure `inputs/template.json` is committed** to Git

---

## 🔧 Troubleshooting

**Build fails?**
- Check `requirements_production.txt` has all dependencies
- Check build logs in Render dashboard

**API not working?**
- Test health endpoint first
- Check CORS settings if frontend can't connect

**Need more help?**
- See full guide: `DEPLOY_RENDER.md`

---

**That's it! Your API is live! 🎉**

