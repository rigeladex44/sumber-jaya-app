-- Migration: Create arus_kas table for comprehensive cash flow tracking
-- Date: 2025-10-22

-- Create arus_kas table for manual entries (cashless transactions)
-- This table stores manual cash flow entries with categories
-- Auto-synced with penjualan and kas_kecil data via API aggregation

CREATE TABLE IF NOT EXISTS arus_kas (
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
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_arus_kas_tanggal (tanggal),
  INDEX idx_arus_kas_pt (pt_code),
  INDEX idx_arus_kas_kategori (kategori),
  INDEX idx_arus_kas_metode (metode_bayar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Note: Data aggregation happens at API level
-- GET /api/arus-kas returns combined data from:
-- 1. arus_kas table (manual entries)
-- 2. kas_kecil table (approved cash transactions)
-- 3. penjualan table (sales data)

