# 🚀 Panduan Deploy Sumber Jaya App ke Vercel

## Persiapan

Pastikan Anda sudah:
- ✅ Deploy backend dan dapatkan URL-nya
- ✅ Buat table database
- ✅ Install Vercel CLI: `npm install -g vercel`

---

## Step 1: Login ke Vercel

```bash
vercel login
```

Pilih metode login (GitHub, GitLab, Email, dll) dan ikuti instruksinya.

---

## Step 2: Setup Environment Variable

Sebelum deploy, Anda perlu set URL backend. Ada 2 cara:

### Cara A: Buat file `.env.production` di folder `frontend/`

```bash
cd frontend
echo "REACT_APP_API_URL=https://your-backend-url.vercel.app/api" > .env.production
```

**Ganti** `https://your-backend-url.vercel.app/api` dengan URL backend Anda yang sebenarnya!

### Cara B: Set di Vercel Dashboard (Setelah deploy pertama)

Nanti bisa di-set via Vercel Dashboard → Project Settings → Environment Variables

---

## Step 3: Deploy ke Vercel

Dari root project:

```bash
cd /Users/macbookairi52019/Desktop/sumber-jaya-app
vercel --prod --yes
```

Atau jika pertama kali, jalankan step-by-step:

```bash
vercel
```

Ikuti prompt:
- **Set up and deploy?** → Yes
- **Which scope?** → Pilih account Anda
- **Link to existing project?** → No
- **What's your project's name?** → `sumber-jaya-app` (atau nama lain)
- **In which directory is your code located?** → `./`
- **Want to override settings?** → Yes
  - **Build Command:** `cd frontend && npm install && npm run build`
  - **Output Directory:** `frontend/build`
  - **Development Command:** `cd frontend && npm start`

Setelah itu, deploy production:

```bash
vercel --prod
```

---

## Step 4: Set Environment Variables (Jika belum)

1. Buka [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Pilih project `sumber-jaya-app`
3. Klik **Settings** → **Environment Variables**
4. Tambahkan:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://your-backend-url.vercel.app/api`
   - **Environment:** Production
5. Klik **Save**
6. **Re-deploy** project: `vercel --prod`

---

## Step 5: Test Aplikasi

1. Buka URL yang diberikan Vercel (contoh: `https://sumber-jaya-app.vercel.app`)
2. Login dengan:
   - **Username:** `hengky`
   - **Password:** `hengky123`
3. Test semua fitur!

---

## 🔧 Troubleshooting

### Error: API tidak konek
- Pastikan environment variable `REACT_APP_API_URL` sudah benar
- Pastikan backend sudah running
- Cek CORS settings di backend

### Error: Build failed
- Cek error message di Vercel dashboard
- Pastikan semua dependencies terinstall
- Cek `package.json` di folder frontend

### Perlu update?

Setiap kali ada perubahan, jalankan:

```bash
vercel --prod
```

---

## 📝 Informasi Penting

### URL Backend
Ganti placeholder di `.env.production`:
```
REACT_APP_API_URL=https://YOUR_ACTUAL_BACKEND_URL/api
```

### Login Credentials
**Master User:**
- Username: `hengky`
- Password: `hengky123`

⚠️ **Segera ganti password setelah deploy!**

---

## 🎉 Selesai!

Aplikasi Anda sekarang sudah live di production!

**Tips:**
- Setup custom domain di Vercel (opsional)
- Enable HTTPS (otomatis by Vercel)
- Monitor analytics di Vercel dashboard
- Setup Vercel Preview untuk testing sebelum production

---

**Support:** Jika ada masalah, cek logs di Vercel Dashboard → Deployments → klik deployment → View Function Logs

