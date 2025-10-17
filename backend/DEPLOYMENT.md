# 🚀 Backend Deployment Guide

## 📋 Pre-Deployment Checklist

✅ Database sudah di-setup  
✅ Environment variables sudah dikonfigurasi  
✅ Dependencies sudah diinstall  
✅ API sudah di-test lokal  

---

## 🎯 Deployment Options

### Option 1: Vercel (Serverless - Recommended for Quick Deploy)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login
```bash
vercel login
```

#### Step 3: Deploy
```bash
cd backend
vercel --prod
```

#### Step 4: Set Environment Variables
Di Vercel Dashboard → Settings → Environment Variables:

**Required:**
- `DB_HOST` = Your MySQL host
- `DB_USER` = Your MySQL username
- `DB_PASSWORD` = Your MySQL password
- `DB_NAME` = sumber_jaya_db
- `JWT_SECRET` = Your secret key (strong password)
- `NODE_ENV` = production

**Optional (untuk Railway MySQL):**
- `MYSQLHOST` = Auto-set by Railway
- `MYSQLPORT` = 3306
- `MYSQLUSER` = Auto-set by Railway
- `MYSQLPASSWORD` = Auto-set by Railway
- `MYSQLDATABASE` = railway

---

### Option 2: Railway (Full Server - Recommended for Production)

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

#### Step 2: Login
```bash
railway login
```

#### Step 3: Initialize Project
```bash
cd backend
railway init
```

#### Step 4: Create MySQL Database
```bash
railway add mysql
```

Atau di Railway Dashboard:
1. New Project → Deploy MySQL
2. Copy connection details

#### Step 5: Set Environment Variables
```bash
railway variables set DB_HOST=your_host
railway variables set DB_USER=your_user
railway variables set DB_PASSWORD=your_password
railway variables set DB_NAME=sumber_jaya_db
railway variables set JWT_SECRET=your_secret_key
railway variables set NODE_ENV=production
```

#### Step 6: Import Database
```bash
# Connect ke MySQL Railway
railway connect mysql

# Import schema
mysql -h <host> -u <user> -p<password> <database> < database-production.sql
```

#### Step 7: Deploy
```bash
railway up
```

---

### Option 3: DigitalOcean/VPS (Traditional Hosting)

#### Step 1: SSH ke Server
```bash
ssh root@your-server-ip
```

#### Step 2: Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server

# Install PM2 (Process Manager)
npm install -g pm2
```

#### Step 3: Upload Code
```bash
# Clone dari Git (jika sudah di GitHub)
git clone https://github.com/yourusername/sumber-jaya-app.git
cd sumber-jaya-app/backend

# Atau upload manual via SCP/FTP
```

#### Step 4: Setup Database
```bash
# Login ke MySQL
mysql -u root -p

# Import database
mysql -u root -p < database-production.sql
```

#### Step 5: Configure Environment
```bash
# Copy env template
cp env.example.txt .env

# Edit .env
nano .env
# Isi dengan konfigurasi MySQL Anda
```

#### Step 6: Install & Start
```bash
# Install dependencies
npm install --production

# Start dengan PM2
pm2 start server.js --name sumber-jaya-api

# Set auto-restart on reboot
pm2 startup
pm2 save
```

#### Step 7: Setup Nginx (Reverse Proxy)
```bash
# Install Nginx
apt install -y nginx

# Configure
nano /etc/nginx/sites-available/sumber-jaya-api
```

Isi dengan:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/sumber-jaya-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 8: Setup SSL (Let's Encrypt)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

---

## 🔧 Database Setup

### Import Database Production
```bash
mysql -u username -p database_name < database-production.sql
```

### Verify Tables
```sql
USE sumber_jaya_db;
SHOW TABLES;
-- Should show: users, pt_list, pt_access, kas_kecil, penjualan, pangkalan

SELECT * FROM users;
-- Should show 1 user: hengky

SELECT * FROM pt_list;
-- Should show 5 PT
```

---

## 🧪 Testing

### Health Check
```bash
curl https://your-api-url/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Sumber Jaya API is running"
}
```

### Login Test
```bash
curl -X POST https://your-api-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hengky","password":"hengky123"}'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "hengky",
    "name": "Hengky",
    "role": "Master User",
    "accessPT": ["KSS", "SJE", "FAB", "KBS", "SJS"]
  }
}
```

---

## ⚠️ Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Enable CORS only for your frontend domain
- [ ] Use HTTPS (SSL/TLS)
- [ ] Set strong MySQL password
- [ ] Limit database access to backend server only
- [ ] Enable firewall (ufw/iptables)
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity

---

## 📊 Monitoring & Logs

### Vercel
- View logs di Dashboard → Deployments → View Function Logs

### Railway
```bash
railway logs
```

### VPS dengan PM2
```bash
# View logs
pm2 logs sumber-jaya-api

# Monitor status
pm2 monit

# Restart if needed
pm2 restart sumber-jaya-api
```

---

## 🔄 Update & Redeploy

### Vercel/Railway
```bash
# Just push changes
vercel --prod
# or
railway up
```

### VPS
```bash
# Pull latest code
git pull origin main

# Install new dependencies (if any)
npm install

# Restart server
pm2 restart sumber-jaya-api
```

---

## 🐛 Troubleshooting

### Error: Database connection failed
- Check DB credentials di environment variables
- Pastikan database server running
- Verify network/firewall rules

### Error: Token tidak valid
- Check JWT_SECRET consistency
- Pastikan token belum expired (24h)

### Error: CORS
Update CORS config di `server.js`:
```javascript
app.use(cors({
  origin: 'https://your-frontend-url.vercel.app',
  credentials: true
}));
```

---

## 📝 Environment Variables Summary

| Variable | Description | Example |
|----------|-------------|---------|
| DB_HOST | MySQL host | localhost / railway.app |
| DB_USER | MySQL user | root |
| DB_PASSWORD | MySQL password | your_password |
| DB_NAME | Database name | sumber_jaya_db |
| PORT | Server port | 5000 |
| JWT_SECRET | Secret key | random_strong_string |
| NODE_ENV | Environment | production |

---

## ✅ Post-Deployment

1. **Test semua endpoints** menggunakan Postman/Insomnia
2. **Connect frontend** dengan backend URL
3. **Login dan test** semua fitur
4. **Change default password** master user
5. **Setup monitoring** dan alerts
6. **Create database backup** routine

---

## 🎉 Deployment Complete!

API URL: `https://your-backend-url.vercel.app/api`

**Next Steps:**
1. Update frontend `REACT_APP_API_URL` dengan URL backend ini
2. Test koneksi frontend-backend
3. Monitor performance & logs

---

**Need Help?**
- Check server logs
- Verify environment variables
- Test database connection
- Review API endpoints

**Made with ❤️ by Rigeel for Sumber Jaya Grup**

