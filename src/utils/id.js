/*
 * createId() — returns a stable, unique id for a card.
 *
 * crypto.randomUUID() is available in all modern browsers and in secure
 * contexts (localhost and https). The fallback keeps the app working
 * elsewhere.
 *
 * Use real ids as React `key`s and for edit/delete lookups — never the array
 * index, which changes as cards are added or removed.
 */
export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `card-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
