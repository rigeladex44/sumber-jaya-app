-- ========================================
-- DEBUG: Kas Kecil Selisih Rp 5.000.000
-- ========================================

-- 1. Cek SEMUA transaksi di tanggal 01/11/2025
SELECT
  id,
  tanggal,
  pt_code,
  jenis,
  jumlah,
  keterangan,
  status,
  CASE
    WHEN keterangan LIKE 'Sisa Saldo tanggal%' THEN '⚠️ WILL BE EXCLUDED'
    ELSE '✅ COUNTED'
  END as counted_in_recalculate
FROM kas_kecil
WHERE tanggal = '2025-11-01'
ORDER BY id;

-- 2. Hitung saldo akhir 01/11 PER PT (seperti yang dilakukan recalculate)
SELECT
  pt_code,
  SUM(CASE WHEN jenis = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END) as total_masuk,
  SUM(CASE WHEN jenis = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END) as total_keluar,
  SUM(CASE WHEN jenis = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END) -
  SUM(CASE WHEN jenis = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END) as saldo_akhir,
  '(This is what recalculate will use)' as note
FROM kas_kecil
WHERE tanggal = '2025-11-01'
AND keterangan NOT LIKE 'Sisa Saldo tanggal%'
AND status = 'approved'
GROUP BY pt_code;

-- 3. Hitung saldo akhir 01/11 SEMUA PT (termasuk yang NOT LIKE 'Sisa Saldo')
SELECT
  SUM(CASE WHEN jenis = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END) as total_masuk,
  SUM(CASE WHEN jenis = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END) as total_keluar,
  SUM(CASE WHEN jenis = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END) -
  SUM(CASE WHEN jenis = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END) as total_saldo_akhir_01_11,
  '(Excluding Sisa Saldo entries)' as note
FROM kas_kecil
WHERE tanggal = '2025-11-01'
AND keterangan NOT LIKE 'Sisa Saldo tanggal%'
AND status = 'approved';

-- 4. Cek transaksi "Sisa Saldo" di tanggal 02/11/2025
SELECT
  id,
  tanggal,
  pt_code,
  jenis,
  jumlah,
  keterangan,
  status
FROM kas_kecil
WHERE tanggal = '2025-11-02'
AND keterangan LIKE 'Sisa Saldo tanggal%'
ORDER BY pt_code;

-- 5. Total "Sisa Saldo" di 02/11 (semua PT)
SELECT
  SUM(jumlah) as total_sisa_saldo_02_11,
  COUNT(*) as jumlah_pt,
  '(This should match saldo akhir 01/11)' as note
FROM kas_kecil
WHERE tanggal = '2025-11-02'
AND keterangan LIKE 'Sisa Saldo tanggal%';

-- 6. Cek apakah ada transaksi dengan status 'pending' atau 'rejected' di 01/11
SELECT
  status,
  COUNT(*) as count,
  SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) as total_masuk,
  SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) as total_keluar
FROM kas_kecil
WHERE tanggal = '2025-11-01'
GROUP BY status;

-- 7. Cek apakah ada transaksi di 01/11 yang keterangannya mengandung "Sisa Saldo"
SELECT
  id,
  tanggal,
  pt_code,
  jenis,
  jumlah,
  keterangan,
  status,
  '⚠️ THIS IS EXCLUDED FROM RECALCULATE!' as warning
FROM kas_kecil
WHERE tanggal = '2025-11-01'
AND keterangan LIKE '%Sisa Saldo%';

-- ========================================
-- EXPECTED RESULT:
-- ========================================
-- Total saldo akhir 01/11 (query #3) HARUS SAMA dengan Total sisa saldo 02/11 (query #5)
-- Jika berbeda Rp 5.000.000, cek query #7 untuk melihat apakah ada transaksi yang di-exclude
