/*
 * Fisher-Yates shuffle. Returns a NEW array, so callers can shuffle a study
 * session without touching the persisted card order.
 */
export function shuffleArray(items, random = Math.random) {
  const copy = Array.isArray(items) ? [...items] : []

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = current
  }

  return copy
}
