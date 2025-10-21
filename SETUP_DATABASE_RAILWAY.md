# 🔧 SETUP DATABASE DI RAILWAY - SIMPLE STEPS

## 🎯 **Current Status:**
- ✅ Backend deployed & running
- ✅ Database connected  
- ❌ Database empty (no tables/data)

## ✅ **Quick Fix (5 Minutes):**

### **Step 1: Open Railway Dashboard**

1. Buka browser: https://railway.app/dashboard
2. Find project: **"sumber-jaya-backend"**
3. Click project

### **Step 2: Open MySQL Data Tab**

1. Click pada **MySQL** service (database icon)
2. Click tab **"Data"**
3. You'll see MySQL Query interface

### **Step 3: Run Setup SQL**

Copy & paste SQL ini ke Query box, then click "Run" atau "Execute":

```sql
-- Create Tables
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pt_list (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS pt_access (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  pt_code VARCHAR(10) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kas_kecil (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tanggal DATE NOT NULL,
  pt VARCHAR(10) NOT NULL,
  jenis VARCHAR(10) NOT NULL,
  jumlah DECIMAL(15,2) NOT NULL,
  keterangan TEXT,
  status VARCHAR(20) DEFAULT 'approved',
  approved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS penjualan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tanggal DATE NOT NULL,
  pt VARCHAR(10) NOT NULL,
  pangkalan VARCHAR(100) NOT NULL,
  qty INT NOT NULL,
  harga DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  ppn DECIMAL(15,2) NOT NULL,
  metode_bayar VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pangkalan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pt VARCHAR(10) NOT NULL,
  nama VARCHAR(100) NOT NULL
);

-- Insert PT List
INSERT INTO pt_list (code, name) VALUES
('KSS', 'PT KHALISA SALMA SEJAHTERA'),
('SJE', 'PT SUMBER JAYA ELPIJI'),
('FAB', 'PT FADILLAH AMANAH BERSAMA'),
('KBS', 'PT KHABITSA INDOGAS'),
('SJS', 'PT SUMBER JAYA SEJAHTERA');

-- Insert Master User (username: hengky, password: hengky123)
INSERT INTO users (username, password, name, role, status) 
VALUES ('hengky', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGQeL8hE9zqT.XPvBGIJeOa', 'Hengky Master User', 'Master User', 'aktif');

-- Grant PT Access to Master User
INSERT INTO pt_access (user_id, pt_code) VALUES
(1, 'KSS'), (1, 'SJE'), (1, 'FAB'), (1, 'KBS'), (1, 'SJS');

-- Insert Sample Pangkalan
INSERT INTO pangkalan (pt, nama) VALUES
('KSS', 'Pangkalan A'), ('KSS', 'Pangkalan B'),
('SJE', 'Pangkalan C'), ('FAB', 'Pangkalan D'),
('KBS', 'Pangkalan E'), ('SJS', 'Pangkalan F');
```

### **Step 4: Verify Setup**

Run this query to check:

```sql
SELECT 'Users' as Table_Name, COUNT(*) as Count FROM users
UNION ALL SELECT 'PT List', COUNT(*) FROM pt_list
UNION ALL SELECT 'PT Access', COUNT(*) FROM pt_access;
```

Should show:
- Users: 1
- PT List: 5
- PT Access: 5

---

## 🧪 **Test After Setup:**

### Test 1: Backend Health Check
```bash
curl https://sumber-jaya-app-production.up.railway.app/api/health
```
Expected: `{"status":"OK"}`

### Test 2: Login
```bash
curl -X POST https://sumber-jaya-app-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hengky","password":"hengky123"}'
```
Expected: Returns JWT token

### Test 3: Frontend
1. Go to: https://sumber-jaya-8n871iamz-rigeels-projects.vercel.app
2. Login: hengky / hengky123
3. Should work! ✅

---

## 🔄 **Alternative Method: Use MySQL Client**

If Railway Data tab doesn't work:

### Via Railway Connect Info:

1. In Railway MySQL service, click "Connect"
2. Copy connection details:
   - Host
   - Port
   - Username
   - Password  
   - Database

3. Use MySQL client:
```bash
mysql -h [HOST] -P [PORT] -u [USER] -p[PASSWORD] [DATABASE] < backend/setup-database.sql
```

---

## 📝 **Complete SQL File:**

File lengkap ada di:
```
/Users/macbookairi52019/Desktop/sumber-jaya-app/backend/setup-database.sql
```

---

## ✅ **Success Indicators:**

After running SQL:
- ✅ Can login to frontend
- ✅ Can see dashboard stats
- ✅ Can add/edit/delete users
- ✅ All features work

---

## ⏱️ **Estimated Time:**
- Setup database: 3-5 minutes
- Test: 2 minutes
- **Total: 5-7 minutes**

---

**Let's setup the database now! Go to Railway Dashboard → MySQL → Data tab!** 🚀

**Master User Credentials:**
- Username: `hengky`
- Password: `hengky123`

