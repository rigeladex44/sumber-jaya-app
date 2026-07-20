-- Script ini digunakan untuk menghapus semua baris "Sisa Saldo" statis
-- setelah update sistem mengubah Sisa Saldo menjadi Header Dinamis.

DELETE FROM kas_kecil 
WHERE keterangan LIKE 'Sisa Saldo tanggal%';
