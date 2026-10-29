/*
 * Local-date helpers.
 *
 * Dates that represent a *day* (due dates, streak days) are stored as
 * `YYYY-MM-DD` strings built from the user's LOCAL calendar — never from
 * `toISOString()`. A card due "today" must stay due today for someone in
 * UTC-8 at 5pm (where the UTC date has already rolled over).
 */

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

// Turn a Date into a local YYYY-MM-DD string.
export function toLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Parse YYYY-MM-DD as a local Date at midnight. Returns null when invalid.
export function parseLocalDate(value) {
  if (typeof value !== 'string') return null

  const match = DATE_PATTERN.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  // Round-trip check rejects impossible dates such as 2026-02-30.
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function isValidDateString(value) {
  return parseLocalDate(value) !== null
}

// Add whole days to a YYYY-MM-DD string, staying in local time (DST-safe).
export function addDays(dateString, amount) {
  const date = parseLocalDate(dateString)
  if (!date || !Number.isInteger(amount)) return dateString

  date.setDate(date.getDate() + amount)
  return toLocalDateString(date)
}
