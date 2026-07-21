/**
 * Data Filtering Utilities
 * Shared filtering logic for data tables
 */

export const filterKasData = (data = [], pts = [], dateFilter = '') => {
  let filtered = data;

  if (pts && pts.length > 0) {
    filtered = filtered.filter(k => pts.includes(k.pt));
  }

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

export const calculateKasTotals = (data = []) => {
  const masuk = data
    .filter(k => k.jenis === 'masuk' && k.status === 'approved')
    .reduce((sum, k) => sum + (parseFloat(k.jumlah) || 0), 0);
  
  const keluar = data
    .filter(k => k.jenis === 'keluar' && k.status === 'approved')
    .reduce((sum, k) => sum + (parseFloat(k.jumlah) || 0), 0);
  
  const saldo = masuk - keluar;

  return { masuk, keluar, saldo };
};
