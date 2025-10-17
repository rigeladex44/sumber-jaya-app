# 🚀 Deploy Frontend ke Vercel - PRODUCTION READY

## ✅ Pre-Deployment Checklist

- ✅ Backend API running on Railway
- ✅ Database populated with master user
- ✅ All API integrations completed:
  - ✅ Authentication (Login/Logout)
  - ✅ Kas Kecil CRUD
  - ✅ Penjualan CRUD
  - ✅ Dashboard Stats
  - ✅ Approval/Reject Kas
- ✅ Loading states implemented
- ✅ Error handling implemented
- ✅ Session management (auto-logout)
- ✅ No linter errors

---

## 🎯 Deployment Steps

### Option A: Vercel CLI (Recommended)

#### 1. Install & Login
```bash
# Make sure you're in project root
cd /Users/macbookairi52019/Desktop/sumber-jaya-app

# Login to Vercel (if not already)
vercel login
```

#### 2. Deploy Frontend
```bash
# Clean up previous deploy data (if any)
rm -rf .vercel

# Deploy to production
vercel --prod --cwd frontend
```

#### 3. Set Environment Variable
After deployment, Vercel will give you a URL. Then:

**Via Web Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://sumber-jaya-app-production.up.railway.app/api`
   - **Environment:** Production

**Or via CLI:**
```bash
vercel env add REACT_APP_API_URL production
# When prompted, enter: https://sumber-jaya-app-production.up.railway.app/api
```

#### 4. Redeploy (to apply env var)
```bash
vercel --prod --cwd frontend
```

---

### Option B: Vercel Web Dashboard

#### 1. Push to GitHub
```bash
cd /Users/macbookairi52019/Desktop/sumber-jaya-app

# Add all changes
git add .
git commit -m "feat: Full backend integration with API, loading states, error handling"
git push origin main
```

#### 2. Import to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. **Framework Preset:** Create React App
4. **Root Directory:** `frontend`
5. **Build Command:** `npm run build`
6. **Output Directory:** `build`
7. **Environment Variables:**
   - Add `REACT_APP_API_URL` = `https://sumber-jaya-app-production.up.railway.app/api`
8. Click "Deploy"

---

## 🔐 Master User Credentials

**For Production Login:**
- **Username:** `hengky`
- **Password:** `hengky123`

⚠️ **IMPORTANT:** Change this password in production database!

---

## 🧪 Post-Deployment Testing

After deployment, test at your Vercel URL (e.g., `https://sumber-jaya-app.vercel.app`):

### Quick Test Checklist:
1. ✅ Login works
2. ✅ Dashboard shows real stats
3. ✅ Kas Kecil: Add/View/Approve works
4. ✅ Penjualan: Add/View works
5. ✅ Laporan: Export PDF works
6. ✅ Logout works
7. ✅ Session persists on refresh
8. ✅ Auto-logout on tab close works

---

## 🐛 Troubleshooting

### Error: "Network Error" or "401 Unauthorized"
**Solution:**
- Check environment variable is set correctly
- Verify Railway backend is running: `curl https://sumber-jaya-app-production.up.railway.app/api/health`
- Clear browser cache and try again

### Error: "Username atau password salah"
**Solution:**
- Verify master user exists in Railway database
- Check username: `hengky`, password: `hengky123`

### Dashboard shows 0
**Solution:**
- Check backend `/api/dashboard/stats` endpoint
- Verify JWT token is being sent (check Network tab)
- Add some data first (Kas Kecil or Penjualan)

### Build fails
**Solution:**
```bash
# Test build locally first
cd /Users/macbookairi52019/Desktop/sumber-jaya-app/frontend
npm run build
```

---

## 📊 Production Architecture

```
┌─────────────────────┐
│   Vercel Frontend   │  ← https://sumber-jaya-app.vercel.app
│   (React SPA)       │
└──────────┬──────────┘
           │ HTTPS API Calls
           │ + JWT Token
           ▼
┌─────────────────────┐
│  Railway Backend    │  ← https://sumber-jaya-app-production.up.railway.app
│  (Node.js + Express)│
└──────────┬──────────┘
           │ MySQL
           ▼
┌─────────────────────┐
│  Railway MySQL DB   │
│  (Production Data)  │
└─────────────────────┘
```

---

## ✅ Deployment Success Indicators

- ✅ Vercel deployment shows "Ready" status
- ✅ Environment variable configured
- ✅ Login page loads without errors
- ✅ Can login and see dashboard
- ✅ API calls successful (check Network tab)
- ✅ No console errors

---

## 🎉 You're Live!

Once deployed, share the URL with your team:
- **Production URL:** `https://[your-project].vercel.app`
- **Backend API:** `https://sumber-jaya-app-production.up.railway.app`
- **Health Check:** `https://sumber-jaya-app-production.up.railway.app/api/health`

---

## 📝 Notes

### Features Working:
- ✅ Authentication with JWT
- ✅ Dashboard with real-time stats
- ✅ Kas Kecil CRUD + Approval
- ✅ Penjualan CRUD
- ✅ Laporan PDF Export
- ✅ Session management
- ✅ Role-based access control

### Features Pending Backend:
- ⏳ User Management (Add/Edit/Delete users)
- ⏳ Edit Profile
- ⏳ Change Password

These can be added later when backend endpoints are ready.

---

## 🔄 Future Updates

To deploy updates:
```bash
cd /Users/macbookairi52019/Desktop/sumber-jaya-app
git add .
git commit -m "Your update message"
git push origin main
# Vercel will auto-deploy if connected to GitHub

# Or manual deploy:
vercel --prod --cwd frontend
```

---

**Ready to deploy? Run:**
```bash
vercel --prod --cwd frontend
```

