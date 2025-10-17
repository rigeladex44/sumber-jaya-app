-- ========================================
-- SUMBER JAYA GRUP - PRODUCTION DATABASE
-- Version: 1.0.0
-- ========================================

-- Tabel: users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel: pt_access (akses user ke PT)
CREATE TABLE IF NOT EXISTS pt_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pt_code VARCHAR(10) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_access (user_id, pt_code)
);

-- Tabel: pt_list (daftar PT)
CREATE TABLE IF NOT EXISTS pt_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel: kas_kecil
CREATE TABLE IF NOT EXISTS kas_kecil (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  pt_code VARCHAR(10) NOT NULL,
  jenis ENUM('masuk', 'keluar') NOT NULL,
  jumlah DECIMAL(15, 2) NOT NULL,
  keterangan TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_by INT NOT NULL,
  approved_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Tabel: penjualan
CREATE TABLE IF NOT EXISTS penjualan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  pt_code VARCHAR(10) NOT NULL,
  pangkalan VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  harga DECIMAL(15, 2) NOT NULL DEFAULT 16000,
  total DECIMAL(15, 2) NOT NULL,
  ppn DECIMAL(15, 2) NOT NULL,
  ppn_percent DECIMAL(5, 2) NOT NULL DEFAULT 11,
  metode_bayar ENUM('cash', 'cashless') NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabel: pangkalan (daftar pangkalan)
CREATE TABLE IF NOT EXISTS pangkalan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pt_code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  alamat TEXT,
  kontak VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- DATA MASTER (WAJIB)
-- ========================================

-- Insert Data PT (5 PT)
INSERT INTO pt_list (code, name) VALUES
('KSS', 'PT KHALISA SALMA SEJAHTERA'),
('SJE', 'PT SUMBER JAYA ELPIJI'),
('FAB', 'PT FADILLAH AMANAH BERSAMA'),
('KBS', 'PT KHABITSA INDOGAS'),
('SJS', 'PT SRI JOYO SHAKTI')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert Master User (username: hengky, password: hengky123)
-- Password sudah di-hash menggunakan bcrypt
INSERT INTO users (username, password, name, role) VALUES
('hengky', '$2a$10$rKJ5VgHZ3YvBpZ4QNkYjeuH0HvLUQqZXhLzD1H8K9yVnZ2eXqUZZu', 'Hengky', 'Master User')
ON DUPLICATE KEY UPDATE name = 'Hengky';

-- Insert Akses PT untuk master user (semua PT)
INSERT INTO pt_access (user_id, pt_code) VALUES
(1, 'KSS'),
(1, 'SJE'),
(1, 'FAB'),
(1, 'KBS'),
(1, 'SJS')
ON DUPLICATE KEY UPDATE pt_code = VALUES(pt_code);

-- ========================================
-- INDEXES (untuk performa)
-- ========================================

CREATE INDEX IF NOT EXISTS idx_kas_tanggal ON kas_kecil(tanggal);
CREATE INDEX IF NOT EXISTS idx_kas_pt ON kas_kecil(pt_code);
CREATE INDEX IF NOT EXISTS idx_kas_status ON kas_kecil(status);
CREATE INDEX IF NOT EXISTS idx_penjualan_tanggal ON penjualan(tanggal);
CREATE INDEX IF NOT EXISTS idx_penjualan_pt ON penjualan(pt_code);

-- ========================================
-- DONE! Database siap untuk production
-- ========================================
-- Login credentials:
-- Username: hengky
-- Password: hengky123
-- 
-- IMPORTANT: Ganti password setelah login pertama!
-- ========================================

