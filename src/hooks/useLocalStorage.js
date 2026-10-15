import { useEffect, useState } from 'react'

/*
 * useLocalStorage(key, initialValue, sanitize?) -> [value, setValue]
 *
 * A drop-in replacement for useState that mirrors its value into localStorage
 * so data survives app restarts. The returned tuple behaves exactly like
 * useState's, so callers can swap the two with no other changes.
 *
 * How it protects your app:
 *   - Lazy initializer: storage is read ONCE on mount (not every render).
 *   - try/catch on read: invalid JSON falls back to initialValue instead of
 *     throwing and white-screening the app.
 *   - `sanitize` (optional): validates the PARSED value. Use it to reject
 *     valid-JSON-but-wrong-shape data (e.g. an object where an array belongs).
 *   - try/catch on write: a full or unavailable store (private mode) is
 *     swallowed rather than crashing.
 */
export function useLocalStorage(key, initialValue, sanitize) {
  const normalize = (value) => (sanitize ? sanitize(value) : value)

  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return normalize(stored === null ? initialValue : JSON.parse(stored))
    } catch {
      // Corrupt JSON, or storage blocked by the browser.
      return normalize(initialValue)
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage may be full or unavailable (e.g. private mode). Fail quietly.
    }
  }, [key, value])

  return [value, setValue]
}
