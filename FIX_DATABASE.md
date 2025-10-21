# 🔧 FIX DATABASE - Setup Tables & Master User

## ⚠️ **Problem:**
- Backend deployed successfully ✅
- Database connected ✅  
- But login fails because database is empty ❌

## ✅ **Solution: Import Database Schema**

### Option 1: Via Railway Dashboard (EASIEST)

1. **Go to Railway Dashboard:**
   ```
   https://railway.app/dashboard
   ```

2. **Select MySQL Service:**
   - Find your project "sumber-jaya-backend"
   - Click on **MySQL** service (not the Node.js one)

3. **Open MySQL Console:**
   - Click "Data" tab
   - Or look for "Connect" section
   - Click "MySQL Console" or "Query"

4. **Run This SQL:**

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create PT list table
CREATE TABLE IF NOT EXISTS pt_list (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL
);

-- Create PT access table
CREATE TABLE IF NOT EXISTS pt_access (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  pt_code VARCHAR(10) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create kas_kecil table
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

-- Create penjualan table
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

-- Create pangkalan table
CREATE TABLE IF NOT EXISTS pangkalan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pt VARCHAR(10) NOT NULL,
  nama VARCHAR(100) NOT NULL
);

-- Insert master user (password: hengky123)
INSERT INTO users (username, password, name, role, status) 
VALUES ('hengky', '$2a$10$YourHashedPasswordHere', 'Hengky Master User', 'Master User', 'aktif')
ON DUPLICATE KEY UPDATE username=username;

-- Insert PT list
INSERT INTO pt_list (code, name) VALUES
('KSS', 'PT KHALISA SALMA SEJAHTERA'),
('SJE', 'PT SUMBER JAYA ELPIJI'),
('FAB', 'PT FADILLAH AMANAH BERSAMA'),
('KBS', 'PT KHABITSA INDOGAS'),
('SJS', 'PT SUMBER JAYA SEJAHTERA')
ON DUPLICATE KEY UPDATE code=code;

-- Grant master user access to all PTs
INSERT INTO pt_access (user_id, pt_code) 
SELECT 1, code FROM pt_list
ON DUPLICATE KEY UPDATE user_id=user_id;
```

**WAIT!** Password needs to be hashed. Let me create the correct SQL...

---

### Option 2: Via Railway CLI

Run this command to generate hashed password and insert:

```bash
cd /Users/macbookairi52019/Desktop/sumber-jaya-app/backend
railway run node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('hengky123', 10).then(hash => console.log(hash))"
```

Copy the hash output, then run SQL with that hash.

---

### Option 3: Use Prepared SQL File

I'll create a complete SQL file with proper password hash:


