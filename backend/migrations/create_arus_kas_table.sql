-- Migration: Create arus_kas table
-- Description: Tabel untuk pencatatan manual arus kas (cash & cashless)
-- Date: 2025-10-25

-- Check if table exists before creating
CREATE TABLE IF NOT EXISTS arus_kas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  pt_code VARCHAR(10) NOT NULL,
  jenis ENUM('masuk', 'keluar') NOT NULL,
  jumlah DECIMAL(15, 2) NOT NULL,
  keterangan TEXT NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  metode_bayar ENUM('cash', 'cashless') NOT NULL DEFAULT 'cashless',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (pt_code) REFERENCES pt_list(code)
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_arus_kas_tanggal ON arus_kas(tanggal);
CREATE INDEX IF NOT EXISTS idx_arus_kas_pt_code ON arus_kas(pt_code);
CREATE INDEX IF NOT EXISTS idx_arus_kas_created_by ON arus_kas(created_by);
