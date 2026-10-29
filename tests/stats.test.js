import { describe, expect, it } from 'vitest'
import { toLocalDateString } from '../src/utils/dates.js'
import {
  accuracy,
  buildStats,
  calculateStreak,
  cardsDueToday,
  deckMastery,
  masteryPercent,
} from '../src/utils/stats.js'

const TODAY = '2026-10-29'

const card = (overrides = {}) => ({
  id: 'card',
  deckId: 'deck-1',
  question: 'Question',
  answer: 'Answer',
  box: 1,
  dueDate: TODAY,
  ...overrides,
})

const review = (date, result = 'known', extra = {}) => ({
  cardId: 'card',
  deckId: 'deck-1',
  result,
  date,
  ...extra,
})

describe('local dates', () => {
  it('formats a late-evening local date without rolling over to UTC', () => {
    const localLateEvening = new Date(2026, 0, 1, 23, 45, 0)
    expect(toLocalDateString(localLateEvening)).toBe('2026-01-01')
  })
})

describe('cardsDueToday', () => {
  it('counts cards due today or earlier', () => {
    expect(
      cardsDueToday(
        [
          card({ dueDate: '2026-10-27' }),
          card({ dueDate: TODAY }),
          card({ dueDate: '2026-10-30' }),
        ],
        TODAY,
      ),
    ).toBe(2)
  })

  it('returns 0 for an empty or missing list', () => {
    expect(cardsDueToday([], TODAY)).toBe(0)
    expect(cardsDueToday(undefined, TODAY)).toBe(0)
  })
})

describe('accuracy', () => {
  it('returns the rounded percentage of known reviews', () => {
    expect(accuracy([review(TODAY, 'known'), review(TODAY, 'known'), review(TODAY, 'again')])).toBe(67)
  })

  it('returns 0 when there are no reviews', () => {
    expect(accuracy([])).toBe(0)
  })
})

describe('calculateStreak', () => {
  it('counts consecutive review days ending today', () => {
    expect(
      calculateStreak(
        [review('2026-10-27'), review('2026-10-28'), review('2026-10-29')],
        TODAY,
      ),
    ).toBe(3)
  })

  it('allows yesterday to keep the streak alive before today’s review', () => {
    expect(
      calculateStreak([review('2026-10-27'), review('2026-10-28')], TODAY),
    ).toBe(2)
  })

  it('stops at the first missing day and ignores duplicate days', () => {
    expect(
      calculateStreak(
        [
          review('2026-10-25'),
          review('2026-10-27'),
          review('2026-10-27', 'again'),
          review('2026-10-28'),
        ],
        TODAY,
      ),
    ).toBe(2)
  })

  it('returns 0 when the last review was two or more days ago', () => {
    expect(calculateStreak([review('2026-10-27')], TODAY)).toBe(0)
    expect(calculateStreak([], TODAY)).toBe(0)
  })
})

describe('mastery', () => {
  it('averages box levels as a percentage of box 5', () => {
    expect(masteryPercent([card({ box: 1 }), card({ box: 5 })])).toBe(60)
    expect(masteryPercent([])).toBe(0)
  })

  it('builds per-deck counts, due cards and mastery', () => {
    const result = deckMastery(
      { id: 'deck-1', name: 'Biology' },
      [
        card({ id: 'a', deckId: 'deck-1', box: 1, dueDate: '2026-10-28' }),
        card({ id: 'b', deckId: 'deck-1', box: 3, dueDate: '2026-11-01' }),
        card({ id: 'c', deckId: 'deck-2', box: 5, dueDate: '2026-10-28' }),
      ],
      TODAY,
    )

    expect(result).toMatchObject({
      id: 'deck-1',
      name: 'Biology',
      cardCount: 2,
      dueToday: 1,
      mastery: 40,
    })
    expect(result.boxes).toEqual({ 1: 1, 2: 0, 3: 1, 4: 0, 5: 0 })
  })
})

describe('buildStats', () => {
  it('combines global stats and per-deck progress', () => {
    const stats = buildStats(
      {
        decks: [
          { id: 'deck-1', name: 'Biology' },
          { id: 'deck-2', name: 'History' },
        ],
        cards: [
          card({ id: 'a', deckId: 'deck-1', box: 1, dueDate: '2026-10-28' }),
          card({ id: 'b', deckId: 'deck-1', box: 3, dueDate: '2026-11-01' }),
          card({ id: 'c', deckId: 'deck-2', box: 5, dueDate: '2026-10-30' }),
        ],
        reviews: [
          review('2026-10-28', 'known'),
          review('2026-10-29', 'again'),
        ],
      },
      TODAY,
    )

    expect(stats.dueToday).toBe(1)
    expect(stats.totalReviewed).toBe(2)
    expect(stats.accuracy).toBe(50)
    expect(stats.streak).toBe(2)
    expect(stats.decks).toHaveLength(2)
    expect(stats.decks[0].mastery).toBe(40)
    expect(stats.decks[1].mastery).toBe(100)
  })
})
