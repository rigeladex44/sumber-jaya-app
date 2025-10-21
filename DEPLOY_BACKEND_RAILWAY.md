# 🚂 Deploy Backend ke Railway (Updated)

## ✅ Backend Changes That Need to be Deployed:

### New Endpoints Added:
1. **User Management:**
   - `GET /api/users` - Get all users
   - `POST /api/users` - Create new user
   - `PUT /api/users/:id` - Update user
   - `DELETE /api/users/:id` - Delete user

2. **Profile Management:**
   - `PUT /api/auth/profile` - Update own profile
   - `PUT /api/auth/password` - Change password

---

## 🚀 Deployment Options

### Option A: Manual Deploy via Railway Dashboard

1. **Login to Railway:**
   ```
   https://railway.app/
   ```

2. **Find Your Project:**
   - Go to Dashboard
   - Find "sumber-jaya-app" project

3. **Redeploy:**
   - Click on your backend service
   - Click "Deployments" tab
   - Click "Deploy" or "Redeploy"
   - Wait for build to complete (~2-3 minutes)

---

### Option B: Push to Git (Auto-Deploy)

If your Railway is connected to GitHub:

```bash
cd /Users/macbookairi52019/Desktop/sumber-jaya-app

# Push the committed changes
git push origin main
```

Railway will automatically detect the changes and redeploy.

---

### Option C: Railway CLI

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
cd backend
railway up
```

---

## 🧪 Verify Backend Deployment

After deployment, test the new endpoints:

### 1. Health Check (Should Still Work):
```bash
curl https://sumber-jaya-app-production.up.railway.app/api/health
```

### 2. Test New User Management Endpoint:
```bash
# Get users (requires JWT token from login)
curl -X GET https://sumber-jaya-app-production.up.railway.app/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 3. Test Profile Update:
```bash
curl -X PUT https://sumber-jaya-app-production.up.railway.app/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "role": "Admin"}'
```

---

## 🔍 If You Get Errors:

### Error: "502 Bad Gateway"
- Backend is still deploying, wait 1-2 minutes
- Check Railway logs for build errors

### Error: "500 Internal Server Error"
- Check Railway logs for database connection issues
- Verify environment variables are set correctly

### How to Check Logs:
1. Go to Railway Dashboard
2. Click on backend service
3. Click "Deployments"
4. Click on latest deployment
5. View logs

---

## 📝 Expected Behavior After Deploy:

### Frontend (Already Deployed):
✅ URL: `https://sumber-jaya-8n871iamz-rigeels-projects.vercel.app`

### Backend (Needs Deploy):
⏳ URL: `https://sumber-jaya-app-production.up.railway.app`

### New Features Working:
1. ✅ Add User (Master Admin)
2. ✅ Edit User (Master Admin)
3. ✅ Delete User (Master Admin)
4. ✅ Edit Profile (All Users)
5. ✅ Change Password (All Users)

---

## 🎯 Quick Test After Deploy:

1. **Login** to frontend
2. **Go to Master Admin** page
3. **Try Add User:**
   - Click "Tambah User"
   - Fill all fields
   - Submit
   - Should save to database

4. **Try Edit Profile:**
   - Click profile icon (top right)
   - Click "Edit Profil"
   - Change name/role
   - Save
   - Should update immediately

5. **Try Change Password:**
   - Click profile icon
   - Click "Ganti Password"
   - Enter old & new password
   - Save
   - Try login with new password

---

## ⚠️ Important Notes:

1. **Backend MUST be deployed** for new features to work
2. **Frontend is already updated** and live
3. **Both need to be in sync** for full functionality
4. **Test thoroughly** after backend deployment

---

## 🆘 Need Help?

If deployment fails:
1. Check Railway logs
2. Verify `backend/server.js` has no syntax errors
3. Ensure all dependencies are in `backend/package.json`
4. Check database connection is still working

---

**After backend deploys successfully, all features will work end-to-end!** 🚀

