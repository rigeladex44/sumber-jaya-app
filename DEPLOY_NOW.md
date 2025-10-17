# 🚀 DEPLOY FRONTEND - READY TO GO!

## Backend URL Confirmed ✅
```
https://sumber-jaya-app-production.up.railway.app/api
```

---

## 📝 DEPLOY STEPS (Buka Terminal Baru)

### Step 1: Login to Vercel
```bash
vercel login
```

Pilih metode login Anda (GitHub, GitLab, Email, dll) dan ikuti instruksinya.

---

### Step 2: Deploy Frontend
```bash
cd /Users/macbookairi52019/Desktop/sumber-jaya-app
vercel --prod --yes
```

Tunggu proses deploy selesai. Vercel akan memberikan URL production seperti:
```
https://sumber-jaya-app.vercel.app
```

---

### Step 3: Set Environment Variable (PENTING!)

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project **sumber-jaya-app**
3. Klik **Settings** → **Environment Variables**
4. Klik **Add New**
5. Isi:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://sumber-jaya-app-production.up.railway.app/api`
   - **Environment:** ✅ Production (check box)
6. Klik **Save**

---

### Step 4: Redeploy (Apply Environment Variable)

```bash
vercel --prod
```

Atau via Dashboard:
1. Klik tab **Deployments**
2. Pilih deployment terakhir
3. Klik **...** (3 dots)
4. Klik **Redeploy**

---

## ✅ Verification Checklist

### 1. Test Backend
```bash
curl https://sumber-jaya-app-production.up.railway.app/api/health
```

Expected response:
```json
{"status":"OK","message":"Sumber Jaya API is running"}
```

### 2. Test Frontend
Buka: `https://sumber-jaya-app.vercel.app`

### 3. Test Login
- Username: `hengky`
- Password: `hengky123`

Jika berhasil login → **DEPLOYMENT SUCCESS!** ✅

---

## 🐛 Troubleshooting

### Error: API Connection Failed

**Penyebab:** Environment variable belum di-set atau salah

**Cek:**
```bash
# Test backend langsung
curl https://sumber-jaya-app-production.up.railway.app/api/health
```

Harus return: `{"status":"OK",...}`

**Fix:**
1. Pastikan environment variable sudah di-set di Vercel
2. Pastikan format URL benar (ada `/api` di akhir)
3. Redeploy setelah set environment variable

---

### Error: CORS Policy

**Jika ada error CORS di browser console:**

Update backend `server.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://sumber-jaya-app.vercel.app',
    'https://sumber-jaya-app-*.vercel.app' // For preview deployments
  ],
  credentials: true
}));
```

Redeploy backend:
```bash
cd backend
railway up
```

---

## 🎉 DONE!

Setelah semua steps selesai, aplikasi Anda sudah LIVE!

**Production URLs:**
- 🌐 Frontend: `https://sumber-jaya-app.vercel.app`
- 🔌 Backend: `https://sumber-jaya-app-production.up.railway.app/api`

**Login Credentials:**
- 👤 Username: `hengky`
- 🔑 Password: `hengky123`

---

## 📊 Post-Deployment Tasks

- [ ] Test semua fitur aplikasi
- [ ] Ganti password master user
- [ ] Tambah user baru sesuai kebutuhan
- [ ] Setup custom domain (opsional)
- [ ] Enable analytics di Vercel (opsional)
- [ ] Setup monitoring & alerts

---

**Made with ❤️ by Rigeel for Sumber Jaya Grup Official**

