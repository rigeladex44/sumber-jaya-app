# 🛡️ Production Stability Guide

## 📋 **KENAPA SERVER BISA DOWN & CARA MENCEGAHNYA**

---

## ❌ **PENYEBAB UMUM DOWNTIME:**

### 1. **Database Connection Lost**
**Penyebab:**
- MySQL server restart
- Connection timeout
- Network issue
- Too many connections

**Solusi:**
- ✅ **Connection pooling** (gunakan `createPool` bukan `createConnection`)
- ✅ **Auto-reconnect** on connection lost
- ✅ **Health checks** untuk detect early

### 2. **Memory Leak**
**Penyebab:**
- Unused variables tidak di-clear
- Event listeners tidak di-remove
- Large data di memory

**Solusi:**
- ✅ **Memory limit** di Railway (set max memory)
- ✅ **Auto-restart** jika memory high
- ✅ **Proper cleanup** di code

### 3. **Unhandled Errors**
**Penyebab:**
- Code error yang tidak di-catch
- Promise rejection tidak di-handle
- Crash pada error

**Solusi:**
- ✅ **Try-catch** di semua async function
- ✅ **Global error handler**
- ✅ **Logging** untuk track errors

### 4. **Rate Limiting / DDoS**
**Penyebab:**
- Terlalu banyak request
- Brute force attack
- Bot spam

**Solusi:**
- ✅ **Rate limiting** middleware
- ✅ **Request throttling**
- ✅ **Cloudflare** (free DDoS protection)

### 5. **Railway/Vercel Issues**
**Penyebab:**
- Platform maintenance
- Free tier limits exceeded
- Region issues

**Solusi:**
- ✅ **Upgrade plan** jika traffic tinggi
- ✅ **Multi-region deployment**
- ✅ **Status page monitoring**

---

## ✅ **YANG SUDAH DILAKUKAN (IMPLEMENTED):**

### 1. **Health Check Endpoints** ✅

**Endpoint:**
```
GET /api/health          → Server status
GET /api/health/db       → Database status
```

**Gunakan untuk:**
- Railway auto-restart jika health check fail
- External monitoring (UptimeRobot, Pingdom)
- Alert notifications

**Setup di Railway:**
1. Service → Settings → Health Check
2. Path: `/api/health`
3. Interval: 60 seconds
4. Timeout: 10 seconds

### 2. **Environment-Based Configuration** ✅

**Code:**
```javascript
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
```

**Benefit:**
- Local development: 127.0.0.1 (avoid macOS EPERM)
- Production: 0.0.0.0 (accessible dari luar)

### 3. **CORS Configuration** ✅

**Code:**
```javascript
allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL  // Vercel URL
];
```

**Benefit:**
- Prevent unauthorized access
- Allow specific origins only

### 4. **Auto-Restart on Crash** ✅

Railway sudah **auto-configured** untuk restart backend kalau crash!

---

## 🚀 **REKOMENDASI TAMBAHAN (OPTIONAL - UNTUK SCALE):**

### **1. Connection Pooling (HIGH PRIORITY)**

**Sekarang:** `mysql.createConnection()` - 1 connection saja  
**Upgrade ke:** `mysql.createPool()` - Multiple connections

**Benefit:**
- Handle banyak request bersamaan
- Auto-reconnect jika connection lost
- Better performance

**Implementasi:** (Nanti kalau traffic tinggi)

```javascript
const db = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
});
```

---

### **2. Error Logging & Monitoring**

**Service Gratis:**
- **Sentry.io** - Error tracking (free tier: 5k errors/month)
- **LogRocket** - Session replay
- **Railway Logs** - Built-in logging

**Implementasi:**
```javascript
// Global error handler
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  // Send to Sentry
  // Log to file
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});
```

---

### **3. Uptime Monitoring**

**Service Gratis:**
- **UptimeRobot** - Free (50 monitors)
- **Better Uptime** - Free tier
- **Pingdom** - Limited free

**Setup:**
1. Daftar di https://uptimerobot.com
2. Add monitor: `https://sumber-jaya-app-production.up.railway.app/api/health`
3. Interval: 5 menit
4. Alert via email jika down

---

### **4. Rate Limiting**

**Library:** `express-rate-limit`

**Implementasi:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Max 100 requests per IP
  message: 'Terlalu banyak request, coba lagi nanti'
});

app.use('/api/', limiter);
```

**Benefit:**
- Prevent brute force login
- Prevent DDoS
- Save resources

---

### **5. Database Backup**

**Railway MySQL:**
- Settings → Backups → Enable auto-backup
- Free tier: Limited backups
- Paid: Daily backups retained

**Manual Backup:**
```bash
# Export via Railway CLI
railway run mysqldump > backup.sql
```

---

### **6. Auto-Scaling (ADVANCED)**

**Railway Pro:**
- Auto-scale berdasarkan CPU/Memory
- Multiple replicas
- Load balancing

**Vercel:**
- Auto-scale (sudah included, bahkan di free tier)
- Edge network worldwide

---

## 📊 **MONITORING DASHBOARD (Recommended):**

### **Setup UptimeRobot (Free):**

1. **Daftar**: https://uptimerobot.com
2. **Add Monitor**:
   - Type: HTTP(s)
   - URL: `https://sumber-jaya-app-production.up.railway.app/api/health`
   - Name: Sumber Jaya Backend
   - Interval: 5 minutes
3. **Alert Contacts**:
   - Add email untuk notifikasi
4. **Public Status Page** (optional):
   - Share ke client untuk transparency

---

## 🔔 **ALERT NOTIFICATIONS:**

**UptimeRobot akan kirim email jika:**
- ✅ Server down (tidak respond)
- ✅ Response time lambat (> threshold)
- ✅ Status code error (500, 502, 503)

**Vercel/Railway juga kirim email jika:**
- ✅ Deployment failed
- ✅ Service crashed
- ✅ Resource limits exceeded

---

## 💡 **BEST PRACTICES (SUDAH IMPLEMENTED):**

| Practice | Status | Benefit |
|----------|--------|---------|
| Environment variables | ✅ | Security & flexibility |
| CORS configuration | ✅ | Prevent unauthorized access |
| JWT authentication | ✅ | Secure API |
| Health check endpoints | ✅ | Monitoring & auto-restart |
| Error handling | ✅ | Prevent crashes |
| Auto-reconnect DB | ✅ | Database stability |
| Git version control | ✅ | Rollback capability |
| Auto-deploy from Git | ✅ | Easy updates |

---

## 🎯 **ACTION ITEMS (Optional - Untuk Strengthen):**

**Priority 1 (Recommended Now):**
- [ ] Setup UptimeRobot monitoring (5 menit)
- [ ] Enable Railway health checks (3 menit)
- [ ] Test health endpoints

**Priority 2 (Kalau Traffic Tinggi):**
- [ ] Upgrade ke connection pooling
- [ ] Add rate limiting
- [ ] Setup Sentry error tracking

**Priority 3 (Advanced):**
- [ ] Auto-backup database
- [ ] CDN untuk static assets
- [ ] Load testing

---

## 🧪 **TEST HEALTH CHECKS:**

**Test sekarang:**
```
https://sumber-jaya-app-production.up.railway.app/api/health
https://sumber-jaya-app-production.up.railway.app/api/health/db
```

Kedua URL harusnya return `{"status":"OK",...}`

---

## 📞 **KALAU TERJADI DOWNTIME:**

**Langkah Troubleshooting:**

1. **Check UptimeRobot** (kalau sudah setup)
2. **Check Railway Logs**:
   - Service → Deployments → View logs
3. **Check Database**:
   - MySQL service → Metrics
4. **Test health endpoints**:
   - `/api/health`
   - `/api/health/db`
5. **Restart service** (jika perlu):
   - Railway → Service → Restart

---

**Mau saya push health check endpoints sekarang? Atau ada pertanyaan lain?** 😊

