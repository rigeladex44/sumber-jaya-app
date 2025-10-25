-- Migration: Create sub_kategori table for categorizing income and expense
-- Date: 2025-10-25

-- Create sub_kategori table
CREATE TABLE IF NOT EXISTS sub_kategori (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jenis ENUM('pemasukan', 'pengeluaran') NOT NULL,
  nama VARCHAR(100) NOT NULL,
  urutan INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jenis (jenis),
  INDEX idx_urutan (urutan)
);

-- Seed initial sub kategori for PENGELUARAN
INSERT INTO sub_kategori (jenis, nama, urutan) VALUES
('pengeluaran', 'BIAYA OPERASIONAL', 1),
('pengeluaran', 'BIAYA LAIN-LAIN', 2),
('pengeluaran', 'TRANSPORT FEE', 3),
('pengeluaran', 'BEBAN GAJI KARYAWAN', 4),
('pengeluaran', 'BEBAN DIMUKA', 5),
('pengeluaran', 'BIAYA PAJAK & KONSULTAN', 6),
('pengeluaran', 'BIAYA ANGSURAN', 7),
('pengeluaran', 'BIAYA SEWA', 8),
('pengeluaran', 'KASBON KARYAWAN', 9),
('pengeluaran', 'PEMBELIAN BARANG', 10),
('pengeluaran', 'MAINTENANCE', 11),
('pengeluaran', 'KOMUNIKASI', 12);

-- Seed initial sub kategori for PEMASUKAN
INSERT INTO sub_kategori (jenis, nama, urutan) VALUES
('pemasukan', 'PEMASUKAN LAIN', 1);

-- Add sub_kategori_id to kas_kecil table
ALTER TABLE kas_kecil
ADD COLUMN sub_kategori_id INT NULL AFTER kategori,
ADD FOREIGN KEY (sub_kategori_id) REFERENCES sub_kategori(id);

-- Add sub_kategori_id to arus_kas table
ALTER TABLE arus_kas
ADD COLUMN sub_kategori_id INT NULL AFTER kategori,
ADD FOREIGN KEY (sub_kategori_id) REFERENCES sub_kategori(id);

-- Migrate existing kategori data to sub_kategori_id for kas_kecil
UPDATE kas_kecil kk
JOIN sub_kategori sk ON kk.kategori = sk.nama
SET kk.sub_kategori_id = sk.id
WHERE kk.kategori IS NOT NULL;

-- Migrate existing kategori data to sub_kategori_id for arus_kas
UPDATE arus_kas ak
JOIN sub_kategori sk ON ak.kategori = sk.nama
SET ak.sub_kategori_id = sk.id
WHERE ak.kategori IS NOT NULL;
