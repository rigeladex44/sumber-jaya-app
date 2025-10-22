-- Migration: Add kategori and metode_bayar columns to kas_kecil table
-- Date: 2025-10-22

-- Add kategori column for expense categorization (cashless transactions)
ALTER TABLE kas_kecil 
ADD COLUMN kategori VARCHAR(100) NULL AFTER keterangan;

-- Add metode_bayar column for payment method (cash/cashless)
ALTER TABLE kas_kecil 
ADD COLUMN metode_bayar VARCHAR(20) DEFAULT 'cash' AFTER kategori;

-- Update existing records to have default 'cash' payment method
UPDATE kas_kecil SET metode_bayar = 'cash' WHERE metode_bayar IS NULL;

-- Add indexes for better query performance
CREATE INDEX idx_metode_bayar ON kas_kecil(metode_bayar);
CREATE INDEX idx_kategori ON kas_kecil(kategori);

