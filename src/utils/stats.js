/*
 * Pure statistics helpers. No React, no browser APIs, no mutation.
 *
 * All "day" values are local YYYY-MM-DD strings (see dates.js), so a review
 * at 11:30pm local time counts toward that local day even when the UTC date
 * has already moved on.
 */

import { addDays, isValidDateString, toLocalDateString } from './dates.js'
import { boxCounts, isDue, MAX_BOX, normalizeBox } from './leitner.js'

export function cardsDueToday(cards, today = toLocalDateString()) {
  if (!Array.isArray(cards)) return 0
  return cards.filter((card) => isDue(card, today)).length
}

// Percentage of reviews marked "known", rounded to a whole number.
export function accuracy(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) return 0
  const known = reviews.filter((review) => review?.result === 'known').length
  return Math.round((known / reviews.length) * 100)
}

/*
 * Consecutive review days ending today. If the user has not reviewed yet
 * today, yesterday still counts as the end of the streak — a streak is not
 * lost at midnight before the user has had a chance to study.
 */
export function calculateStreak(reviews, today = toLocalDateString()) {
  if (!Array.isArray(reviews) || reviews.length === 0) return 0

  const days = new Set(
    reviews
      .map((review) => review?.date)
      .filter((date) => isValidDateString(date)),
  )

  let cursor = today
  if (!days.has(cursor)) {
    cursor = addDays(today, -1)
    if (!days.has(cursor)) return 0
  }

  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

// Average box level as a percentage of the maximum box (0–100).
export function masteryPercent(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return 0

  const total = cards.reduce(
    (sum, card) => sum + normalizeBox(card?.box),
    0,
  )
  return Math.round((total / (cards.length * MAX_BOX)) * 100)
}

export function deckMastery(deck, cards, today = toLocalDateString()) {
  const deckCards = Array.isArray(cards)
    ? cards.filter((card) => card?.deckId === deck?.id)
    : []

  return {
    id: deck?.id ?? '',
    name: deck?.name ?? 'Untitled deck',
    cardCount: deckCards.length,
    dueToday: cardsDueToday(deckCards, today),
    mastery: masteryPercent(deckCards),
    boxes: boxCounts(deckCards),
  }
}

export function buildStats(data, today = toLocalDateString()) {
  const decks = Array.isArray(data?.decks) ? data.decks : []
  const cards = Array.isArray(data?.cards) ? data.cards : []
  const reviews = Array.isArray(data?.reviews) ? data.reviews : []

  return {
    dueToday: cardsDueToday(cards, today),
    totalReviewed: reviews.length,
    accuracy: accuracy(reviews),
    streak: calculateStreak(reviews, today),
    decks: decks.map((deck) => deckMastery(deck, cards, today)),
  }
}
