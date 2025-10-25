-- Migration: Add updated_at column to arus_kas table
-- Description: Fix 500 error by adding missing updated_at column
-- Date: 2025-10-25

-- Add updated_at column if not exists
ALTER TABLE arus_kas
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Verify the change
DESCRIBE arus_kas;
