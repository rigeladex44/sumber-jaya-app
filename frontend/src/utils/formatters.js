/**
 * Formatting Helper Functions
 * Utility functions for formatting data
 */

/**
 * Format number as Indonesian currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'Rp 0';
  return `Rp ${Number(amount).toLocaleString('id-ID')}`;
};

/**
 * Format date for display
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format datetime for display
 * @param {string} dateString - DateTime string to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get month name from YYYY-MM format
 * @param {string} monthString - Month string in YYYY-MM format
 * @returns {string} Month name in Indonesian
 */
export const getMonthName = (monthString) => {
  if (!monthString) return '';
  const [year, month] = monthString.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};
