# 💼 Sumber Jaya Grup - Sistem Manajemen Keuangan

Aplikasi web untuk mengelola kas kecil, penjualan gas LPG 3kg, dan laporan keuangan untuk grup perusahaan Sumber Jaya.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)
![Node](https://img.shields.io/badge/Node.js-16+-339933.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1.svg)

---

## 🚀 Quick Deploy (Production)

### ⚡ Deployment Stack
- **Frontend**: Vercel (Free)
- **Backend**: Railway (Free tier: $5 credit)
- **Database**: Railway MySQL (Included)

### 📝 Step-by-Step Guide

#### 1️⃣ Push to GitHub
```bash
cd /Users/macbookairi52019/Desktop/sumber-jaya-app
git init
git add .
git commit -m "Initial commit - Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sumber-jaya-app.git
git push -u origin main
```

#### 2️⃣ Deploy Backend + Database ke Railway

1. **Login** ke [Railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. **Add MySQL**:
   - Click "New" → "Database" → "Add MySQL"
   - Railway auto-generates credentials
4. **Add Backend**:
   - Click "New" → "GitHub Repo" → Select `sumber-jaya-app`
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. **Environment Variables** (Backend service):
   ```
   NODE_ENV=production
   JWT_SECRET=ganti_dengan_random_string_panjang
   PORT=5555
   ```
   *Note: MySQL credentials auto-injected*
6. **Import Database**:
   - Click MySQL service → Connect
   - Execute `backend/database.sql`
7. **Generate Domain**:
   - Backend → Settings → Generate Domain
   - Copy URL: `https://xxx.railway.app`

#### 3️⃣ Deploy Frontend ke Vercel

1. **Login** ke [Vercel.com](https://vercel.com)
2. **Import Project** → Select `sumber-jaya-app`
3. **Configure**:
   - **Root Directory**: `frontend`
   - **Framework**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-railway-backend.railway.app/api
   ```
5. **Deploy!**
6. **Copy Frontend URL**: `https://xxx.vercel.app`

#### 4️⃣ Update CORS (Railway Backend)

Update Railway backend environment variable:
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

Railway will auto-redeploy!

### 🔑 Default Login
```
Username: hengky
Password: hengky123
```

### ✅ Done!
Visit your Vercel URL and login!

📚 **Detailed guide**: See `DEPLOYMENT.md`

---

## 🌟 Fitur Utama

### ✅ Manajemen Kas Kecil
- Input transaksi kas masuk/keluar
- Approval otomatis untuk transaksi ≤ Rp 300.000
- Tracking saldo real-time per PT
- Filter berdasarkan PT, tanggal, dan status

### ✅ Entri Penjualan Gas LPG
- Input penjualan dengan kalkulasi otomatis
- PPN 11% otomatis
- Metode pembayaran: Cash & Cashless
- Cash langsung masuk ke kas kecil

### ✅ Laporan & Dashboard
- Dashboard real-time dengan statistik
- Laporan laba rugi per PT
- Export PDF dengan format professional
- Filter multi-parameter

### ✅ Multi-User & Role
- Login dengan JWT authentication
- Role-based access control
- Multi PT access per user
- Audit trail untuk setiap transaksi

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Framework
- **Lucide React** - Icon Library
- **Axios** - HTTP Client
- **TailwindCSS** - Styling (via className)

### Backend
- **Node.js + Express** - REST API
- **MySQL 8** - Database
- **JWT** - Authentication
- **bcrypt** - Password Hashing

---

## 📦 Cara Download & Setup

### Option 1: Manual Download

1. **Copy semua files** dari artifacts di atas
2. **Buat struktur folder:**

```
sumber-jaya-app/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── backend/
    ├── server.js
    ├── database.sql
    ├── .env
    └── package.json
```

### Option 2: Git Clone (Jika sudah di GitHub)

```bash
git clone https://github.com/yourusername/sumber-jaya-app.git
cd sumber-jaya-app
```

---

## 🚀 Quick Start

### 1. Setup Database

```bash
# Login ke MySQL
mysql -u root -p

# Import database
mysql -u root -p < backend/database.sql
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env  # Edit sesuai konfigurasi MySQL Anda
npm run dev
```

Backend running di: `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend
npm install
npm start
```

Frontend running di: `http://localhost:3000`

### 4. Login

```
Username: hengky
Password: hengky123
```

---

## 📊 Database Schema

### Tables

1. **users** - Data user dan authentication
2. **pt_list** - Daftar PT (5 PT)
3. **pt_access** - Akses user ke PT
4. **kas_kecil** - Transaksi kas kecil
5. **penjualan** - Data penjualan gas LPG
6. **pangkalan** - Master data pangkalan

### ER Diagram

```
users ──┬── pt_access ── pt_list
        │
        ├── kas_kecil
        │
        └── penjualan
```

---

## 🔐 API Endpoints

### Auth
```
POST   /api/auth/login          # Login
GET    /api/auth/profile        # Get user info
```

### Kas Kecil
```
GET    /api/kas-kecil           # List kas
POST   /api/kas-kecil           # Create kas
PATCH  /api/kas-kecil/:id/status # Approve/Reject
GET    /api/kas-kecil/saldo     # Get saldo
```

### Penjualan
```
GET    /api/penjualan           # List penjualan
POST   /api/penjualan           # Create penjualan
GET    /api/pangkalan           # List pangkalan
```

### Dashboard
```
GET    /api/dashboard/stats     # Dashboard statistics
```

**Semua endpoint (kecuali login) memerlukan Bearer Token!**

---

## 🎨 Screenshots

### Login Page
- Clean & modern design
- Error handling
- Responsive layout

### Dashboard
- Real-time statistics
- Quick access menu
- Multi-card layout

### Kas Kecil
- Transaction history
- Auto-approval system
- PDF export

### Penjualan
- Quick entry form
- Auto calculation
- Integration with kas kecil

---

## 🔧 Configuration

### Frontend Environment (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Backend Environment (.env)

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sumber_jaya_db
PORT=5000
JWT_SECRET=your_secret_key
NODE_ENV=development
```

---

## 📱 Responsive Design

- ✅ Desktop (1920px+)
- ✅ Laptop (1366px+)
- ✅ Tablet (768px+)
- ✅ Mobile (375px+)

### Desktop
- Icon menu di header
- Full width layout
- Sidebar untuk info tambahan

### Mobile
- Bottom navigation
- Stacked cards
- Touch-optimized buttons

---

## 🚀 Deployment

### Frontend (Vercel - Recommended)

```bash
cd frontend
npm run build
vercel --prod
```

### Backend (Railway - Recommended)

```bash
cd backend
railway login
railway init
railway up
```

### Database (PlanetScale/Railway)

1. Create MySQL database
2. Import schema
3. Update connection string di `.env`

---

## 🔒 Security Features

- ✅ JWT Authentication
- ✅ Password hashing (bcrypt)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS protection
- ✅ Token expiration (24 hours)
- ✅ Role-based authorization

---

## 📈 Future Enhancements

- [ ] Excel export (XLSX)
- [ ] Email notifications
- [ ] Advanced reporting
- [ ] Mobile app (React Native)
- [ ] Real-time updates (WebSocket)
- [ ] Backup & restore database
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced filtering
- [ ] Chart & graphs

---

## 🐛 Known Issues

- Export PDF masih menggunakan window.print()
- Belum ada pagination untuk data besar
- Belum ada confirm dialog untuk delete

---

## 📝 License

Private - © 2025 Rigeel Sumber Jaya Grup

---

## 👨‍💻 Development Team

- **Developer**: Rigeel
- **Client**: Sumber Jaya Grup
- **Version**: 1.0.0
- **Last Update**: October 2025

---

## 📞 Support

Untuk bantuan atau pertanyaan:
- Email: support@sumberjaya.com
- Phone: +62 xxx xxxx xxxx
- WhatsApp: +62 xxx xxxx xxxx

---

## 🙏 Acknowledgments

- React Team for amazing framework
- Lucide for beautiful icons
- MySQL for reliable database
- Express.js for simple backend

---

**Made Rigeel For Sumber Jaya Grup**