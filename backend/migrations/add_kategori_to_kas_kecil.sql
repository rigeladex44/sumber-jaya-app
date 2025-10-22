-- Migration: Add kategori column to kas_kecil table
-- Date: 2025-10-22

-- Add kategori column to kas_kecil
ALTER TABLE kas_kecil ADD COLUMN kategori VARCHAR(100) AFTER keterangan;

-- Add index for kategori
CREATE INDEX idx_kas_kecil_kategori ON kas_kecil(kategori);

