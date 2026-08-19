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
 * Mendapatkan nama lengkap PT dari kodenya
 */
export const getPTName = (code) => {
  if (!code) return '';
  const pt = PT_LIST.find(p => p.code === code);
  return pt ? pt.name : code;
};

/**
 * Konfigurasi Grup Kasir (Penggabungan Kas Khusus Kas Kecil)
 * PT dalam satu grup akan berbagi saldo fisik (Running Balance).
 */
export const KASIR_GROUPS = [
  ['SJE', 'KSS', 'FAB']
];

/**
 * Mendapatkan seluruh PT yang satu grup dengan PT yang diberikan
 */
export const getKasirGroupForPT = (pt) => {
  const group = KASIR_GROUPS.find(g => g.includes(pt));
  return group ? group : [pt];
};

/**
 * Mengekspansi daftar PT dengan anggota grupnya (untuk Kas Kecil)
 */
export const getExpandedPTList = (ptList) => {
  if (!ptList || ptList.length === 0) return [];
  const expandedSet = new Set();
  ptList.forEach(pt => {
    const group = getKasirGroupForPT(pt);
    group.forEach(g => expandedSet.add(g));
  });
  return Array.from(expandedSet);
};

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
