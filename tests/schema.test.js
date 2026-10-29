import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DECK_ID,
  migrateLegacyCards,
  sanitizeState,
} from '../src/utils/schema.js'

const NOW = new Date(2026, 9, 29, 12, 0, 0)

describe('migrateLegacyCards', () => {
  it('moves every v1 card into a Default deck without changing its content', () => {
    const migrated = migrateLegacyCards(
      [
        { id: 'old-1', question: 'Q1', answer: 'A1' },
        { id: 'old-2', question: 'Q2', answer: 'A2' },
      ],
      NOW,
    )

    expect(migrated.decks).toHaveLength(1)
    expect(migrated.decks[0]).toMatchObject({
      id: DEFAULT_DECK_ID,
      name: 'Default',
    })
    expect(migrated.cards).toHaveLength(2)
    expect(migrated.cards[0]).toMatchObject({
      id: 'old-1',
      deckId: DEFAULT_DECK_ID,
      question: 'Q1',
      answer: 'A1',
      box: 1,
      dueDate: '2026-10-29',
    })
    expect(migrated.reviews).toEqual([])
  })

  it('keeps an empty legacy deck empty instead of reseeding demo cards', () => {
    expect(migrateLegacyCards([], NOW).cards).toEqual([])
  })
})

describe('sanitizeState', () => {
  it('preserves a valid empty deck and its cards array', () => {
    const state = sanitizeState(
      {
        decks: [{ id: 'deck-1', name: 'Mine' }],
        cards: [],
        reviews: [],
      },
      NOW,
    )

    expect(state.decks).toHaveLength(1)
    expect(state.cards).toEqual([])
  })

  it('repairs cards with missing schedule fields', () => {
    const state = sanitizeState(
      {
        decks: [{ id: 'deck-1', name: 'Mine' }],
        cards: [{ id: 'card-1', question: 'Q', answer: 'A' }],
      },
      NOW,
    )

    expect(state.cards[0]).toMatchObject({
      id: 'card-1',
      deckId: 'deck-1',
      box: 1,
      dueDate: '2026-10-29',
      reviewCount: 0,
      correctCount: 0,
    })
  })

  it('moves cards with an unknown deck into the first available deck', () => {
    const state = sanitizeState(
      {
        decks: [{ id: 'deck-1', name: 'Mine' }],
        cards: [
          {
            id: 'card-1',
            deckId: 'missing',
            question: 'Q',
            answer: 'A',
          },
        ],
      },
      NOW,
    )

    expect(state.cards[0].deckId).toBe('deck-1')
  })

  it('falls back to a Default deck for an unusable value', () => {
    const state = sanitizeState(null, NOW)

    expect(state.decks).toHaveLength(1)
    expect(state.decks[0].name).toBe('Default')
    expect(state.cards).toEqual([])
  })
})
