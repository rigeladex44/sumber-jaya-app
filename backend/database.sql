-- Tabel: users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel: pt_access (akses user ke PT)
CREATE TABLE pt_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pt_code VARCHAR(10) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_access (user_id, pt_code)
);

-- Tabel: pt_list (daftar PT)
CREATE TABLE pt_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel: kas_kecil (Cash Only - Kas Fisik)
CREATE TABLE kas_kecil (
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

-- Tabel: arus_kas (Cash + Cashless - Comprehensive Cash Flow)
CREATE TABLE arus_kas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  pt_code VARCHAR(10) NOT NULL,
  jenis ENUM('masuk', 'keluar') NOT NULL,
  jumlah DECIMAL(15, 2) NOT NULL,
  keterangan TEXT NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  metode_bayar VARCHAR(20) DEFAULT 'cashless',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabel: penjualan
CREATE TABLE penjualan (
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
CREATE TABLE pangkalan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pt_code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  alamat TEXT,
  kontak VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Data Default PT
INSERT INTO pt_list (code, name) VALUES
('KSS', 'PT KHALISA SALMA SEJAHTERA'),
('SJE', 'PT SUMBER JAYA ELPIJI'),
('FAB', 'PT FADILLAH AMANAH BERSAMA'),
('KBS', 'PT KHABITSA INDOGAS'),
('SJS', 'PT SRI JOYO SHAKTI');

-- Insert User Default (password: hengky123 - sudah di-hash)
INSERT INTO users (username, password, name, role) VALUES
('hengky', '$2a$10$rKJ5VgHZ3YvBpZ4QNkYjeuH0HvLUQqZXhLzD1H8K9yVnZ2eXqUZZu', 'Hengky', 'Master User');

-- Insert Akses PT untuk user hengky (semua PT)
INSERT INTO pt_access (user_id, pt_code) VALUES
(1, 'KSS'),
(1, 'SJE'),
(1, 'FAB'),
(1, 'KBS'),
(1, 'SJS');

-- Insert Data Pangkalan Contoh
INSERT INTO pangkalan (pt_code, name, alamat, kontak) VALUES
('SJE', 'Pangkalan Jaya', 'Jl. Raya Malang No. 123', '081234567890'),
('SJE', 'Pangkalan Makmur', 'Jl. Soekarno Hatta No. 456', '081234567891'),
('KSS', 'Pangkalan Sejahtera', 'Jl. Ahmad Yani No. 789', '081234567892');

-- Insert Data Kas Kecil Contoh (Cash Only)
INSERT INTO kas_kecil (tanggal, pt_code, jenis, jumlah, keterangan, status, created_by, approved_by) VALUES
('2025-10-11', 'SJE', 'masuk', 5000000, 'Penjualan Tunai Pangkalan Jaya', 'approved', 1, 1),
('2025-10-11', 'SJE', 'keluar', 180000, 'Biaya Operasional Tunai', 'approved', 1, 1),
('2025-10-10', 'KSS', 'masuk', 3500000, 'Penjualan Tunai Pangkalan Sejahtera', 'approved', 1, 1),
('2025-10-10', 'KSS', 'keluar', 150000, 'Pembelian ATK Tunai', 'approved', 1, 1);

-- Insert Data Arus Kas Contoh (Cashless Transactions)
INSERT INTO arus_kas (tanggal, pt_code, jenis, jumlah, keterangan, kategori, metode_bayar, created_by) VALUES
('2025-10-11', 'SJE', 'keluar', 250000, 'Pembelian ATK Kantor Transfer', 'BIAYA OPERASIONAL', 'cashless', 1),
('2025-10-11', 'KSS', 'keluar', 3000000, 'Gaji Staff Bulanan', 'BEBAN GAJI', 'cashless', 1),
('2025-10-10', 'SJE', 'keluar', 500000, 'Biaya Transportasi', 'BIAYA TRANSPORTASI', 'cashless', 1);

-- Insert Data Penjualan Contoh
INSERT INTO penjualan (tanggal, pt_code, pangkalan, qty, harga, total, ppn, ppn_percent, metode_bayar, created_by) VALUES
('2025-10-11', 'SJE', 'Pangkalan Jaya', 300, 16000, 4800000, 528000, 11, 'cash', 1),
('2025-10-10', 'KSS', 'Pangkalan Sejahtera', 250, 16000, 4000000, 440000, 11, 'cash', 1),
('2025-10-10', 'SJE', 'Pangkalan Makmur', 180, 16000, 2880000, 316800, 11, 'cashless', 1);

-- Index untuk performa
CREATE INDEX idx_kas_tanggal ON kas_kecil(tanggal);
CREATE INDEX idx_kas_pt ON kas_kecil(pt_code);
CREATE INDEX idx_kas_status ON kas_kecil(status);
CREATE INDEX idx_arus_kas_tanggal ON arus_kas(tanggal);
CREATE INDEX idx_arus_kas_pt ON arus_kas(pt_code);
CREATE INDEX idx_arus_kas_kategori ON arus_kas(kategori);
CREATE INDEX idx_arus_kas_metode ON arus_kas(metode_bayar);
CREATE INDEX idx_penjualan_tanggal ON penjualan(tanggal);
CREATE INDEX idx_penjualan_pt ON penjualan(pt_code);
