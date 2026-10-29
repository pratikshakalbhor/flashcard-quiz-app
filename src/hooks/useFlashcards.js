import { useCallback, useState } from 'react'
import { seedCards, seedDeck } from '../data/seedCards.js'
import { toLocalDateString } from '../utils/dates.js'
import { createId } from '../utils/id.js'
import { applyReview } from '../utils/leitner.js'
import {
  MAX_DECK_NAME,
  migrateLegacyCards,
  sanitizeState,
  SCHEMA_VERSION,
} from '../utils/schema.js'
import { useLocalStorage } from './useLocalStorage.js'

/*
 * Namespaced + versioned storage keys.
 *   - "/v1" is the old array-of-cards format. It is READ for migration and
 *     never overwritten or deleted, so the original data stays as a backup.
 *   - "/v2" stores decks + cards + review history in one object.
 */
export const STORAGE_KEY = 'flashcard-quiz-app:data/v2'
export const LEGACY_STORAGE_KEY = 'flashcard-quiz-app:cards/v1'
export const ACTIVE_DECK_KEY = 'flashcard-quiz-app:activeDeck/v2'

function createSeedState(now = new Date()) {
  const deck = { ...seedDeck, createdAt: now.toISOString() }
  const today = toLocalDateString(now)

  return {
    version: SCHEMA_VERSION,
    decks: [deck],
    cards: seedCards.map((card) => ({
      ...card,
      deckId: deck.id,
      box: 1,
      dueDate: today,
      lastReviewedAt: null,
      reviewCount: 0,
      correctCount: 0,
    })),
    reviews: [],
  }
}

/*
 * Read v2 first. If it is absent (first run after upgrading), migrate the v1
 * card array into a Default deck. If neither exists, seed the demo deck.
 */
function loadInitialState() {
  const now = new Date()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      try {
        return sanitizeState(JSON.parse(raw), now)
      } catch {
        // Corrupt v2 value: fall through to the legacy/seed path below.
      }
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacyRaw !== null) {
      try {
        const legacy = JSON.parse(legacyRaw)
        if (Array.isArray(legacy)) return migrateLegacyCards(legacy, now)
      } catch {
        // Ignore corrupt legacy data and use the seed deck.
      }
    }
  } catch {
    // localStorage may be unavailable (private mode / blocked).
  }

  return createSeedState(now)
}

function uniqueDeckName(name, decks) {
  const base = (name || 'Imported deck').trim().slice(0, MAX_DECK_NAME) || 'Imported deck'
  const taken = new Set(decks.map((deck) => deck.name.toLowerCase()))
  let candidate = base
  let suffix = 2

  while (taken.has(candidate.toLowerCase())) {
    const tail = ` (${suffix})`
    candidate = `${base.slice(0, MAX_DECK_NAME - tail.length)}${tail}`
    suffix += 1
  }

  return candidate
}

/*
 * useFlashcards() is the app's persistence layer. It returns the whole v2
 * state plus small intent-based actions, so components never touch storage or
 * the shape of the data directly.
 */
export function useFlashcards() {
  const [initialState] = useState(loadInitialState)
  const [data, setData] = useLocalStorage(
    STORAGE_KEY,
    initialState,
    sanitizeState,
  )

  // --- Decks ---------------------------------------------------------------
  const addDeck = useCallback(
    (name) => {
      const deck = {
        id: createId(),
        name: (name || 'New deck').trim().slice(0, MAX_DECK_NAME) || 'New deck',
        createdAt: new Date().toISOString(),
      }

      setData((prev) => {
        const nextDeck = { ...deck, name: uniqueDeckName(deck.name, prev.decks) }
        return { ...prev, decks: [...prev.decks, nextDeck] }
      })

      return deck
    },
    [setData],
  )

  const renameDeck = useCallback(
    (id, name) => {
      const trimmed = (name || '').trim().slice(0, MAX_DECK_NAME)
      if (!trimmed) return

      setData((prev) => ({
        ...prev,
        decks: prev.decks.map((deck) =>
          deck.id === id ? { ...deck, name: trimmed } : deck,
        ),
      }))
    },
    [setData],
  )

  const deleteDeck = useCallback(
    (id) => {
      setData((prev) => {
        if (prev.decks.length <= 1) return prev
        if (!prev.decks.some((deck) => deck.id === id)) return prev

        return {
          ...prev,
          decks: prev.decks.filter((deck) => deck.id !== id),
          cards: prev.cards.filter((card) => card.deckId !== id),
        }
      })
    },
    [setData],
  )

  // --- Cards ---------------------------------------------------------------
  const addCard = useCallback(
    (question, answer, deckId) => {
      const card = {
        id: createId(),
        deckId,
        question: (question || '').trim(),
        answer: (answer || '').trim(),
        box: 1,
        dueDate: toLocalDateString(),
        lastReviewedAt: null,
        reviewCount: 0,
        correctCount: 0,
      }

      setData((prev) => {
        const targetDeckId = prev.decks.some((deck) => deck.id === deckId)
          ? deckId
          : prev.decks[0]?.id
        return {
          ...prev,
          cards: [...prev.cards, { ...card, deckId: targetDeckId }],
        }
      })

      return card
    },
    [setData],
  )

  const updateCard = useCallback(
    (id, changes) => {
      setData((prev) => {
        const deckIds = new Set(prev.decks.map((deck) => deck.id))

        return {
          ...prev,
          cards: prev.cards.map((card) => {
            if (card.id !== id) return card

            const next = { ...card }
            if (typeof changes.question === 'string' && changes.question.trim()) {
              next.question = changes.question.trim()
            }
            if (typeof changes.answer === 'string' && changes.answer.trim()) {
              next.answer = changes.answer.trim()
            }
            if (typeof changes.deckId === 'string' && deckIds.has(changes.deckId)) {
              next.deckId = changes.deckId
            }
            return next
          }),
        }
      })
    },
    [setData],
  )

  const deleteCard = useCallback(
    (id) => {
      setData((prev) => ({
        ...prev,
        cards: prev.cards.filter((card) => card.id !== id),
      }))
    },
    [setData],
  )

  // --- Spaced repetition ---------------------------------------------------
  const reviewCard = useCallback(
    (id, result, now = new Date()) => {
      setData((prev) => {
        const card = prev.cards.find((item) => item.id === id)
        if (!card) return prev

        const updated = applyReview(card, result, now)
        const entry = {
          id: createId(),
          cardId: card.id,
          deckId: card.deckId,
          result: result === 'known' ? 'known' : 'again',
          date: toLocalDateString(now),
          at: now.toISOString(),
        }

        return {
          ...prev,
          cards: prev.cards.map((item) => (item.id === id ? updated : item)),
          reviews: [...prev.reviews, entry],
        }
      })
    },
    [setData],
  )

  // --- Import --------------------------------------------------------------
  const importDeck = useCallback(
    (payload, now = new Date()) => {
      const deckId = createId()
      const today = toLocalDateString(now)

      setData((prev) => {
        const deck = {
          id: deckId,
          name: uniqueDeckName(payload.deckName, prev.decks),
          createdAt: now.toISOString(),
        }

        const cards = payload.cards.map((card) => ({
          id: createId(),
          deckId,
          question: card.question,
          answer: card.answer,
          box: card.box,
          dueDate: card.dueDate || today,
          lastReviewedAt: null,
          reviewCount: 0,
          correctCount: 0,
        }))

        return {
          ...prev,
          decks: [...prev.decks, deck],
          cards: [...prev.cards, ...cards],
        }
      })

      return deckId
    },
    [setData],
  )

  return {
    data,
    decks: data.decks,
    cards: data.cards,
    reviews: data.reviews,
    addDeck,
    renameDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    reviewCard,
    importDeck,
  }
}
