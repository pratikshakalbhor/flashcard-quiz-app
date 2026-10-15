import { useCallback } from 'react'
import { seedCards } from '../data/seedCards.js'
import { createId } from '../utils/id.js'
import { useLocalStorage } from './useLocalStorage.js'

/*
 * Namespaced + versioned storage key.
 *   - Namespace "flashcard-quiz-app:" prevents collisions: localStorage is
 *     shared per-origin, and every Vite project runs on localhost:5173.
 *   - "/v1" lets us change the card shape later; bump to /v2 and the old value
 *     is ignored (a simple, manual migration).
 */
export const STORAGE_KEY = 'flashcard-quiz-app:cards/v1'

/*
 * A deck must always be an array. If stored data is the wrong shape (e.g. a
 * stray object from an old bug), fall back to the seed deck. An EMPTY array is
 * valid and is preserved — that's how "I deleted all my cards" sticks.
 */
const sanitizeDeck = (value) => (Array.isArray(value) ? value : seedCards)

/*
 * useFlashcards() -> { cards, addCard, updateCard, deleteCard }
 *
 * The persistence layer for the deck. On the FIRST launch the key is absent,
 * so `seedCards` becomes the initial value and is written straight back —
 * sample cards appear exactly once. Every later launch reads what's stored.
 *
 * State updates use the functional form (prev => ...) so they never read a
 * stale `cards` and don't need to be re-created when the deck changes.
 */
export function useFlashcards() {
  const [cards, setCards] = useLocalStorage(STORAGE_KEY, seedCards, sanitizeDeck)

  // addCard returns the new card so callers can, e.g., jump to it.
  const addCard = useCallback(
    (question, answer) => {
      const card = {
        id: createId(),
        question: question.trim(),
        answer: answer.trim(),
      }
      setCards((prev) => [...prev, card])
      return card
    },
    [setCards],
  )

  // updateCard takes a partial patch and merges it into the matching card.
  const updateCard = useCallback(
    (id, changes) => {
      setCards((prev) =>
        prev.map((card) => (card.id === id ? { ...card, ...changes } : card)),
      )
    },
    [setCards],
  )

  const deleteCard = useCallback(
    (id) => {
      setCards((prev) => prev.filter((card) => card.id !== id))
    },
    [setCards],
  )

  return { cards, addCard, updateCard, deleteCard }
}
