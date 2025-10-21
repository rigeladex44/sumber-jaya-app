# 🚀 Deployment Guide - Sumber Jaya App

## 📋 Prerequisites

1. **Railway Account**: https://railway.app (Free tier available)
2. **Vercel Account**: https://vercel.com (Free tier available)
3. **GitHub Account**: Push your code to GitHub first

---

## 🗄️ STEP 1: Deploy Database + Backend ke Railway

### 1.1 Push Code ke GitHub
```bash
cd /Users/macbookairi52019/Desktop/sumber-jaya-app
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 1.2 Deploy ke Railway

1. **Login ke Railway**: https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Select** repository: `sumber-jaya-app`
4. **Add MySQL Database**:
   - Klik "**New**" → "**Database**" → "**Add MySQL**"
   - Railway akan auto-generate credentials

5. **Configure Backend Service**:
   - Klik "**New**" → "**GitHub Repo**" → Select `sumber-jaya-app`
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

6. **Set Environment Variables** (di Backend service):
   ```
   NODE_ENV=production
   JWT_SECRET=sumber_jaya_secret_key_2025_GANTI_INI
   PORT=5555
   ```
   
   **Note**: Railway akan **otomatis inject** MySQL credentials:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

7. **Setup Database Schema**:
   - Setelah MySQL service running, klik MySQL service
   - Buka **"Query"** tab atau connect via MySQL client
   - Copy paste isi file `backend/database.sql` dan execute

8. **Get Backend URL**:
   - Klik backend service → **Settings** → **Generate Domain**
   - Copy URL (contoh: `https://sumber-jaya-backend.up.railway.app`)

---

## 🌐 STEP 2: Deploy Frontend ke Vercel

### 2.1 Update API URL

Edit file `frontend/.env.production`:
```
REACT_APP_API_URL=https://YOUR-BACKEND-URL.railway.app/api
```

**Ganti** `YOUR-BACKEND-URL` dengan URL Railway backend Anda!

### 2.2 Commit Changes
```bash
git add frontend/.env.production
git commit -m "Update production API URL"
git push origin main
```

### 2.3 Deploy ke Vercel

1. **Login ke Vercel**: https://vercel.com
2. **Import Project** → **Import Git Repository**
3. **Select** repository: `sumber-jaya-app`
4. **Configure Project**:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

5. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app/api
   ```

6. **Deploy!**

7. **Get Frontend URL**:
   - Vercel akan generate URL (contoh: `https://sumber-jaya-app.vercel.app`)

---

## 🔐 STEP 3: Update CORS di Backend

Setelah dapat Frontend URL dari Vercel, update CORS:

1. **Edit** file `backend/server.js` di GitHub atau local:

```javascript
// Update CORS origin
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://sumber-jaya-app.vercel.app',  // Ganti dengan URL Vercel Anda
    'https://your-custom-domain.com'       // Jika pakai custom domain
  ],
  credentials: true
}));
```

2. **Commit** and **push**:
```bash
git add backend/server.js
git commit -m "Update CORS for production"
git push origin main
```

Railway akan auto-deploy ulang backend.

---

## ✅ STEP 4: Test Production

1. Buka **Frontend URL** di browser
2. **Login** dengan:
   - Username: `hengky`
   - Password: `hengky123`

3. Test semua fitur!

---

## 🔧 Troubleshooting

### Backend Error 500
- Cek Railway logs: Backend service → **Deployments** → Latest → **View Logs**
- Pastikan MySQL credentials ter-inject dengan benar

### Frontend "Server Error"
- Cek browser console (F12)
- Pastikan `REACT_APP_API_URL` benar di Vercel environment variables
- Test backend API langsung di browser: `https://your-backend-url.railway.app/api/auth/login`

### CORS Error
- Update `app.use(cors())` di `backend/server.js` dengan frontend URL yang benar
- Redeploy backend

---

## 💰 Cost

**FREE TIER**:
- **Railway**: 500 hours/month, $5 credit
- **Vercel**: Unlimited deployments
- **Total**: $0/month (cukup untuk development & testing)

---

## 📞 Support

Jika ada masalah saat deployment, screenshot error message dan consult with developer!

Good luck! 🚀

