import { describe, expect, it } from 'vitest'
import {
  applyReview,
  boxCounts,
  isDue,
  nextBox,
  selectSessionCards,
} from '../src/utils/leitner.js'

const NOW = new Date(2026, 9, 29, 18, 30) // 29 Oct 2026, local time

const card = (overrides = {}) => ({
  id: 'card-1',
  deckId: 'deck-1',
  question: 'Question',
  answer: 'Answer',
  box: 1,
  dueDate: '2026-10-29',
  lastReviewedAt: null,
  reviewCount: 0,
  correctCount: 0,
  ...overrides,
})

describe('Leitner boxes', () => {
  it('moves a known card up one box and schedules the box interval', () => {
    const updated = applyReview(card({ box: 1 }), 'known', NOW)

    expect(updated.box).toBe(2)
    expect(updated.dueDate).toBe('2026-10-31') // box 2 = 2 days
    expect(updated.reviewCount).toBe(1)
    expect(updated.correctCount).toBe(1)
    expect(updated.lastReviewedAt).toBe(NOW.toISOString())
  })

  it('caps a known card at box 5', () => {
    const updated = applyReview(card({ box: 5 }), 'known', NOW)

    expect(updated.box).toBe(5)
    expect(updated.dueDate).toBe('2026-11-14') // box 5 = 16 days
    expect(nextBox(5, 'known')).toBe(5)
  })

  it('sends a card back to box 1 when reviewing again', () => {
    const updated = applyReview(
      card({ box: 4, reviewCount: 7, correctCount: 5 }),
      'again',
      NOW,
    )

    expect(updated.box).toBe(1)
    expect(updated.dueDate).toBe('2026-10-30') // box 1 = 1 day
    expect(updated.reviewCount).toBe(8)
    expect(updated.correctCount).toBe(5)
  })

  it('does not mutate the card it is given', () => {
    const original = card({ box: 2 })
    applyReview(original, 'known', NOW)

    expect(original.box).toBe(2)
    expect(original.reviewCount).toBe(0)
    expect(original.dueDate).toBe('2026-10-29')
  })
})

describe('due cards', () => {
  it('treats today and past due dates as due, and future dates as not due', () => {
    expect(isDue(card({ dueDate: '2026-10-29' }), '2026-10-29')).toBe(true)
    expect(isDue(card({ dueDate: '2026-10-28' }), '2026-10-29')).toBe(true)
    expect(isDue(card({ dueDate: '2026-10-30' }), '2026-10-29')).toBe(false)
  })

  it('treats a missing due date as due so legacy cards are never skipped', () => {
    expect(isDue(card({ dueDate: undefined }), '2026-10-29')).toBe(true)
  })

  it('selects only due cards for a due session and all cards for an all session', () => {
    const cards = [
      card({ id: 'a', dueDate: '2026-10-28' }),
      card({ id: 'b', dueDate: '2026-10-29' }),
      card({ id: 'c', dueDate: '2026-11-01' }),
    ]

    expect(
      selectSessionCards(cards, 'due', '2026-10-29').map((item) => item.id),
    ).toEqual(['a', 'b'])
    expect(
      selectSessionCards(cards, 'all', '2026-10-29').map((item) => item.id),
    ).toEqual(['a', 'b', 'c'])
  })
})

describe('boxCounts', () => {
  it('counts every box and clamps invalid box numbers into 1–5', () => {
    const counts = boxCounts([
      card({ box: 1 }),
      card({ box: 1 }),
      card({ box: 3 }),
      card({ box: 5 }),
      card({ box: 99 }),
      card({ box: 0 }),
    ])

    expect(counts).toEqual({ 1: 3, 2: 0, 3: 1, 4: 0, 5: 2 })
  })
})
