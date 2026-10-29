/*
 * Leitner box rules (5 boxes).
 *
 *   Known        → move up one box (box 5 stays at 5)
 *   Review again → back to box 1
 *
 * After a review the next due date is today + the interval for the new box.
 * Box 1 is therefore reviewed daily, box 5 every 16 days. New cards start in
 * box 1 and are due immediately (today).
 */

import { addDays, isValidDateString, toLocalDateString } from './dates.js'

export const MAX_BOX = 5

// Index 0 = box 1. Days until the card is due again after a review.
export const BOX_INTERVALS = [1, 2, 4, 8, 16]

export const BOX_LABELS = ['Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5']

export function normalizeBox(value) {
  const number = Number(value)
  if (!Number.isInteger(number)) return 1
  return Math.min(MAX_BOX, Math.max(1, number))
}

// The box a card will move to after a rating.
export function nextBox(box, result) {
  if (result !== 'known') return 1
  return Math.min(MAX_BOX, normalizeBox(box) + 1)
}

// A card is due when its local due date is today or earlier. Cards without a
// due date (legacy data) are treated as due so they are never lost.
export function isDue(card, today = toLocalDateString()) {
  if (!card) return false
  if (!isValidDateString(card.dueDate)) return true
  return card.dueDate <= today
}

export function selectSessionCards(cards, mode = 'due', today = toLocalDateString()) {
  if (!Array.isArray(cards)) return []
  if (mode === 'all') return [...cards]
  return cards.filter((card) => isDue(card, today))
}

/*
 * applyReview returns an updated copy of the card. `now` is injectable so the
 * unit tests (and future features) can use a fixed date.
 */
export function applyReview(card, result, now = new Date()) {
  const today = toLocalDateString(now)
  const box = nextBox(card?.box, result)
  const interval = BOX_INTERVALS[box - 1]
  const reviewCount = Math.max(
    0,
    Number.isInteger(card?.reviewCount) ? card.reviewCount : 0,
  )
  const correctCount = Math.max(
    0,
    Number.isInteger(card?.correctCount) ? card.correctCount : 0,
  )

  return {
    ...card,
    box,
    dueDate: addDays(today, interval),
    lastReviewedAt: now.toISOString(),
    reviewCount: reviewCount + 1,
    correctCount: correctCount + (result === 'known' ? 1 : 0),
  }
}

export function boxCounts(cards) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  if (Array.isArray(cards)) {
    for (const card of cards) {
      counts[normalizeBox(card?.box)] += 1
    }
  }

  return counts
}
