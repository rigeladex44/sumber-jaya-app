/**
 * Data Filtering Utilities
 * Shared filtering logic for data tables
 */

/**
 * Filter kas/cash data by PT and date
 * @param {Array} data - Array of transaction data
 * @param {Array} pts - Array of PT codes to filter by
 * @param {string} dateFilter - Date string to filter by (YYYY-MM-DD)
 * @returns {Array} Filtered transaction data
 */
export const filterKasData = (data, pts = [], dateFilter = '') => {
  let filtered = data;

  // Filter by PT if selected
  if (pts.length > 0) {
    filtered = filtered.filter(k => pts.includes(k.pt));
  }

  // Filter by date if selected
  if (dateFilter) {
    const selectedDate = new Date(dateFilter + 'T00:00:00');
    filtered = filtered.filter(item => {
      if (!item.tanggal) return false;
      const itemDate = new Date(item.tanggal);
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      return itemDateOnly.getTime() === selectedDate.getTime();
    });
  }

  return filtered;
};

/**
 * Calculate totals from filtered kas data
 * @param {Array} data - Filtered transaction data
 * @returns {Object} Object with masuk, keluar, and saldo totals
 */
export const calculateKasTotals = (data) => {
  const masuk = data
    .filter(k => k.jenis === 'masuk' && k.status === 'approved')
    .reduce((sum, k) => sum + k.jumlah, 0);
  
  const keluar = data
    .filter(k => k.jenis === 'keluar' && k.status === 'approved')
    .reduce((sum, k) => sum + k.jumlah, 0);
  
  const saldo = masuk - keluar;

  return { masuk, keluar, saldo };
};
