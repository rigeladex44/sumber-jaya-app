# 🚀 Deploy Frontend ke Vercel - Quick Guide

## ⚡ Super Quick Deploy

```bash
cd /Users/macbookairi52019/Desktop/sumber-jaya-app

# Login to Vercel (jika belum)
vercel login

# Deploy production
vercel --prod --yes
```

---

## ⚙️ Setelah Deploy - WAJIB!

### Step 1: Set Environment Variable

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project **sumber-jaya-app**
3. Klik **Settings** → **Environment Variables**
4. Tambah variable baru:

```
Name:  REACT_APP_API_URL
Value: https://YOUR-BACKEND-RAILWAY-URL.up.railway.app/api
Environment: Production ✅
```

**⚠️ PENTING:** Ganti `YOUR-BACKEND-RAILWAY-URL` dengan URL Railway backend Anda!

5. Klik **Save**

---

### Step 2: Redeploy (untuk apply environment variable)

```bash
vercel --prod
```

Atau via Dashboard: **Deployments** → **...** → **Redeploy**

---

## 🧪 Test Deployment

### 1. Test Frontend
```
https://sumber-jaya-app.vercel.app
```

### 2. Test Backend Connection
Login dengan:
- Username: `hengky`
- Password: `hengky123`

Jika berhasil login → **Connection OK!** ✅

---

## 🐛 Troubleshooting

### Error: API Connection Failed

**Penyebab:** Environment variable belum di-set atau salah

**Solution:**
1. Check `REACT_APP_API_URL` di Vercel Dashboard
2. Pastikan format: `https://your-backend.up.railway.app/api` (ada `/api`)
3. Test backend URL di browser: `https://your-backend.up.railway.app/api/health`
4. Harus return: `{"status":"OK","message":"Sumber Jaya API is running"}`

---

### Error: CORS

**Penyebab:** Backend belum allow frontend domain

**Solution:**
Update `server.js` di backend:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://sumber-jaya-app.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true
}));
```

Lalu redeploy backend:
```bash
cd backend
railway up
```

---

## 📝 Checklist

- [ ] Backend Railway sudah running
- [ ] Dapat URL backend Railway
- [ ] Frontend berhasil deploy
- [ ] Environment variable REACT_APP_API_URL sudah di-set
- [ ] Redeploy frontend setelah set env var
- [ ] Test login berhasil
- [ ] Test semua fitur aplikasi

---

## 🎉 Done!

Aplikasi Anda sekarang sudah LIVE di production!

**URLs:**
- Frontend: `https://sumber-jaya-app.vercel.app`
- Backend: `https://your-backend.up.railway.app`

**Login:**
- Username: `hengky`
- Password: `hengky123`

---

**Made with ❤️ by Rigeel for Sumber Jaya Grup Official**

