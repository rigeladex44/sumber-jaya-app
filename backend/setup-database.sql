-- ========================================
-- SUMBER JAYA DATABASE SETUP
-- Run this in Railway MySQL Console
-- ========================================

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

-- Clear existing data (if re-running)
DELETE FROM pt_access;
DELETE FROM users;
DELETE FROM pt_list;
DELETE FROM kas_kecil;
DELETE FROM penjualan;
DELETE FROM pangkalan;

-- Reset auto increment
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE pt_list AUTO_INCREMENT = 1;

-- Insert PT list
INSERT INTO pt_list (code, name) VALUES
('KSS', 'PT KHALISA SALMA SEJAHTERA'),
('SJE', 'PT SUMBER JAYA ELPIJI'),
('FAB', 'PT FADILLAH AMANAH BERSAMA'),
('KBS', 'PT KHABITSA INDOGAS'),
('SJS', 'PT SUMBER JAYA SEJAHTERA');

-- Insert master user
-- Password: hengky123 (hashed with bcrypt)
INSERT INTO users (username, password, name, role, status) 
VALUES ('hengky', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGQeL8hE9zqT.XPvBGIJeOa', 'Hengky Master User', 'Master User', 'aktif');

-- Grant master user access to all PTs
INSERT INTO pt_access (user_id, pt_code) VALUES
(1, 'KSS'),
(1, 'SJE'),
(1, 'FAB'),
(1, 'KBS'),
(1, 'SJS');

-- Insert sample pangkalan
INSERT INTO pangkalan (pt, nama) VALUES
('KSS', 'Pangkalan A'),
('KSS', 'Pangkalan B'),
('SJE', 'Pangkalan C'),
('FAB', 'Pangkalan D'),
('KBS', 'Pangkalan E'),
('SJS', 'Pangkalan F');

-- ========================================
-- Verify setup
-- ========================================
SELECT 'Users:' as Table_Name, COUNT(*) as Count FROM users
UNION ALL
SELECT 'PT List:', COUNT(*) FROM pt_list
UNION ALL
SELECT 'PT Access:', COUNT(*) FROM pt_access
UNION ALL
SELECT 'Pangkalan:', COUNT(*) FROM pangkalan;

-- Show master user
SELECT id, username, name, role, status FROM users WHERE username = 'hengky';

