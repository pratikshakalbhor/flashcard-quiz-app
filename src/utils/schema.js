/*
 * Persistence schema (v2) + defensive sanitising.
 *
 * Shape:
 * {
 *   version: 2,
 *   decks:  [{ id, name, createdAt }],
 *   cards:  [{ id, deckId, question, answer, box, dueDate,
 *              lastReviewedAt, reviewCount, correctCount }],
 *   reviews:[{ id, cardId, deckId, result, date, at }]
 * }
 *
 * sanitizeState accepts unknown JSON and always returns a usable state. It is
 * used when loading localStorage, so a hand-edited or partially-old value can
 * never crash the app. Missing fields get safe defaults instead of dropping
 * the user's cards.
 */

import { isValidDateString, toLocalDateString } from './dates.js'
import { createId } from './id.js'
import { normalizeBox } from './leitner.js'

export const SCHEMA_VERSION = 2
export const DEFAULT_DECK_ID = 'deck-default'
export const DEFAULT_DECK_NAME = 'Default'
export const MAX_DECK_NAME = 40

const isObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asString = (value) => (typeof value === 'string' ? value : '')

const asCount = (value) =>
  Number.isInteger(value) && value >= 0 ? value : 0

export function createDefaultDeck(now = new Date()) {
  return {
    id: DEFAULT_DECK_ID,
    name: DEFAULT_DECK_NAME,
    createdAt: now.toISOString(),
  }
}

function normalizeDeck(rawDeck, usedIds, now) {
  if (!isObject(rawDeck)) return null

  const name = asString(rawDeck.name).trim()
  if (!name) return null

  let id = asString(rawDeck.id).trim()
  if (!id || usedIds.has(id)) id = createId()
  usedIds.add(id)

  return {
    id,
    name: name.slice(0, MAX_DECK_NAME),
    createdAt:
      typeof rawDeck.createdAt === 'string'
        ? rawDeck.createdAt
        : now.toISOString(),
  }
}

function normalizeCard(rawCard, deckIds, fallbackDeckId, today, usedIds) {
  if (!isObject(rawCard)) return null

  const question = asString(rawCard.question).trim()
  const answer = asString(rawCard.answer).trim()
  if (!question || !answer) return null

  let id = asString(rawCard.id).trim()
  if (!id || usedIds.has(id)) id = createId()
  usedIds.add(id)

  const deckId = deckIds.has(rawCard.deckId)
    ? rawCard.deckId
    : fallbackDeckId

  return {
    id,
    deckId,
    question,
    answer,
    box: normalizeBox(rawCard.box),
    dueDate: isValidDateString(rawCard.dueDate) ? rawCard.dueDate : today,
    lastReviewedAt:
      typeof rawCard.lastReviewedAt === 'string'
        ? rawCard.lastReviewedAt
        : null,
    reviewCount: asCount(rawCard.reviewCount),
    correctCount: asCount(rawCard.correctCount),
  }
}

function normalizeReview(rawReview) {
  if (!isObject(rawReview)) return null
  if (rawReview.result !== 'known' && rawReview.result !== 'again') return null

  let date = isValidDateString(rawReview.date) ? rawReview.date : null
  if (!date && typeof rawReview.at === 'string') {
    const parsed = new Date(rawReview.at)
    if (!Number.isNaN(parsed.getTime())) date = toLocalDateString(parsed)
  }
  if (!date) return null

  return {
    id: asString(rawReview.id).trim() || createId(),
    cardId: asString(rawReview.cardId),
    deckId: asString(rawReview.deckId),
    result: rawReview.result,
    date,
    at:
      typeof rawReview.at === 'string' ? rawReview.at : `${date}T00:00:00.000Z`,
  }
}

/*
 * Convert the old v1 storage value (a plain array of { id, question, answer })
 * into a v2 state with a single "Default" deck. The old key is never deleted
 * by the app, so the original data remains available as a backup.
 */
export function migrateLegacyCards(legacyCards, now = new Date()) {
  const today = toLocalDateString(now)
  const deck = createDefaultDeck(now)
  const deckIds = new Set([deck.id])
  const usedCardIds = new Set()
  const cards = []

  if (Array.isArray(legacyCards)) {
    for (const rawCard of legacyCards) {
      const card = normalizeCard(
        { ...rawCard, deckId: deck.id },
        deckIds,
        deck.id,
        today,
        usedCardIds,
      )
      if (card) cards.push(card)
    }
  }

  return {
    version: SCHEMA_VERSION,
    decks: [deck],
    cards,
    reviews: [],
  }
}

export function sanitizeState(value, now = new Date()) {
  if (Array.isArray(value)) return migrateLegacyCards(value, now)

  const source = isObject(value) ? value : {}
  const today = toLocalDateString(now)
  const usedDeckIds = new Set()
  const decks = []

  if (Array.isArray(source.decks)) {
    for (const rawDeck of source.decks) {
      const deck = normalizeDeck(rawDeck, usedDeckIds, now)
      if (deck) decks.push(deck)
    }
  }

  if (decks.length === 0) decks.push(createDefaultDeck(now))

  const deckIds = new Set(decks.map((deck) => deck.id))
  const fallbackDeckId = decks[0].id
  const usedCardIds = new Set()
  const cards = []

  if (Array.isArray(source.cards)) {
    for (const rawCard of source.cards) {
      const card = normalizeCard(
        rawCard,
        deckIds,
        fallbackDeckId,
        today,
        usedCardIds,
      )
      if (card) cards.push(card)
    }
  }

  const reviews = Array.isArray(source.reviews)
    ? source.reviews
        .map((review) => normalizeReview(review))
        .filter(Boolean)
    : []

  return {
    version: SCHEMA_VERSION,
    decks,
    cards,
    reviews,
  }
}
