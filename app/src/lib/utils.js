/**
 * Shared utility functions untuk Buku Saku OB
 */

/**
 * Generate a unique ID with a prefix using cryptographically secure randomness
 * @param {string} prefix - e.g., 'emp', 'ord', 'led', 'att', 'shop'
 * @returns {string}
 */
export function generateId(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Parse formatted number string (e.g., "1.500.000") to number
 * Extracted from Dashboard.svelte and KalkulatorTab.svelte to avoid duplication
 * @param {string} str
 * @returns {number}
 */
export function parseFormattedNumber(str) {
  if (!str) return 0;
  return parseInt(String(str).replace(/\./g, '').replace(/,/g, ''), 10) || 0;
}

/**
 * Format number to Indonesian locale string (e.g., 1500000 → "1.500.000")
 * @param {number} num
 * @returns {string}
 */
export function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID').format(num || 0);
}

/**
 * Capitalize first letter of each word
 * @param {string} str
 * @returns {string}
 */
export function capitalizeWords(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Sentence capitalize (first letter uppercase, rest lowercase)
 * @param {string} str
 * @returns {string}
 */
export function sentenceCase(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format phone number for WhatsApp (prepend 62, strip leading 0)
 * @param {string} phone
 * @returns {string}
 */
export function formatPhoneWA(phone) {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Mask phone number for display (e.g., 081234567890 → 0812****7890)
 * @param {string} phone
 * @returns {string}
 */
export function maskPhone(phone) {
  if (!phone || phone.length < 8) return phone || '';
  return phone.slice(0, 4) + '****' + phone.slice(-4);
}
