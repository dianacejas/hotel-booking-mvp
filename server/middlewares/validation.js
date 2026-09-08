/**
 * Lightweight input sanitization and validation helpers.
 * No third-party validation library — plain, readable functions.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s().-]{5,}$/;

/** Strip HTML/script tags and trim whitespace from a string. */
export function sanitizeString(value, maxLength = 200) {
  if (typeof value !== 'string') return '';
  const cleaned = value
    // remove <script>...</script> blocks entirely
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    // remove any remaining HTML tags
    .replace(/<[^>]*>/g, '')
    .trim();
  return cleaned.slice(0, maxLength);
}

/** Validate email shape. */
export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_REGEX.test(value);
}

/** Validate a loose international phone shape. */
export function isValidPhone(value) {
  return typeof value === 'string' && PHONE_REGEX.test(value);
}

/**
 * Parse a YYYY-MM-DD date string into a Date at LOCAL midnight.
 * Returns null when the input is not a valid calendar date.
 */
export function parseDateOnly(input) {
  if (typeof input !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  const date = new Date(y, m - 1, d); // local midnight
  // Reject rolls like 2026-02-30 that JS silently converts to March 02.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

/** Normalize a date to local midnight (used for night slots). */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Build the array of nights occupied by [checkIn, checkOut).
 * Returns one Date at local midnight per night. Empty if dates are invalid.
 */
export function buildNights(checkIn, checkOut) {
  const nights = [];
  const cursor = startOfDay(checkIn);
  const end = startOfDay(checkOut);
  while (cursor < end) {
    nights.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return nights;
}

/** Number of nights between two dates (checkOut - checkIn in days). */
export function nightsBetween(checkIn, checkOut) {
  const msPerNight = 24 * 60 * 60 * 1000;
  const nights = (startOfDay(checkOut) - startOfDay(checkIn)) / msPerNight;
  return Math.round(nights);
}

/** Generate a unique reservation reference like RES-4KX9Q. */
export function generateReferenceCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing chars
  const chars = [];
  for (let i = 0; i < 5; i += 1) {
    chars.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }
  return `RES-${chars.join('')}`;
}

/** Generic async handler wrapper that forwards errors to Express. */
export function asyncHandler(fn) {
  return function wrappedHandler(req, res, next) {
    fn(req, res, next).catch(next);
  };
}