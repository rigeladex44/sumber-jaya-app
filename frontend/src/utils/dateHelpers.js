/**
 * Date Helper Functions
 * Utility functions for date formatting and manipulation
 */

/**
 * Get today's date in YYYY-MM-DD format (timezone-aware for WIB)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convert ISO date string to local YYYY-MM-DD format
 * Handles timezone properly - parses ISO string and extracts local date
 * @param {string} isoString - ISO date string
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getLocalDateFromISO = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current month in YYYY-MM format
 * @returns {string} Month string in YYYY-MM format
 */
export const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get today's date in YYYY-MM-DD format (Asia/Jakarta timezone)
 * Alias for getLocalDateString for backward compatibility
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getTodayDate = () => getLocalDateString();
