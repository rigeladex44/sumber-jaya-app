/**
 * Application Constants
 * Centralized constants for the application
 */

/**
 * Application version
 */
export const APP_VERSION = '1.0.0';

/**
 * List of PT (Perusahaan) entities
 */
export const PT_LIST = [
  { code: 'KSS', name: 'PT KHALISA SALMA SEJAHTERA' },
  { code: 'SJE', name: 'PT SUMBER JAYA ELPIJI' },
  { code: 'FAB', name: 'PT FADILLAH AMANAH BERSAMA' },
  { code: 'KBS', name: 'PT KHABITSA INDOGAS' },
  { code: 'SJS', name: 'PT SRI JOYO SHAKTI' }
];

/**
 * Kategori Pengeluaran untuk Kas Kecil
 */
export const KATEGORI_PENGELUARAN = [
  'BIAYA OPERASIONAL',
  'BIAYA LAIN-LAIN',
  'BEBAN GAJI KARYAWAN',
  'BEBAN DIMUKA',
  'BIAYA SEWA',
  'KASBON KARYAWAN'
];

/**
 * Main menu items configuration
 */
export const MAIN_MENU_ITEMS = [
  { id: 'beranda', label: 'Beranda', shortLabel: 'Beranda' },
  { id: 'kas-kecil', label: 'Kas Kecil', shortLabel: 'Kas' },
  { id: 'arus-kas', label: 'Arus Kas', shortLabel: 'Arus' },
  { id: 'detail-kas', label: 'Detail Kas', shortLabel: 'Detail' },
  { id: 'penjualan', label: 'Penjualan', shortLabel: 'Jual' },
  { id: 'laporan', label: 'Laporan', shortLabel: 'Laporan' },
  { id: 'master-kategori', label: 'Master Kategori', shortLabel: 'Kategori' },
  { id: 'master-admin', label: 'Admin', shortLabel: 'Admin' }
];

/**
 * Auto-refresh interval in milliseconds (30 seconds)
 */
export const AUTO_REFRESH_INTERVAL = 30000;
