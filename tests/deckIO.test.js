import { describe, expect, it } from 'vitest'
import {
  APP_ID,
  createDeckExport,
  MAX_IMPORT_CARDS,
  MAX_IMPORT_FILE_SIZE,
  parseDeckFile,
  validateDeckImport,
} from '../src/utils/deckIO.js'

const validFile = () => ({
  app: APP_ID,
  version: 2,
  deck: { name: '  Biology  ' },
  cards: [
    {
      question: '  What is a cell?  ',
      answer: '  The basic unit of life.  ',
      box: 2,
      dueDate: '2026-10-31',
    },
  ],
})

describe('createDeckExport', () => {
  it('creates the documented export shape', () => {
    const exported = createDeckExport(
      { name: 'Biology' },
      [
        {
          question: 'Q',
          answer: 'A',
          box: 3,
          dueDate: '2026-11-02',
        },
      ],
      new Date(2026, 9, 29, 12, 0, 0),
    )

    expect(exported).toMatchObject({
      app: APP_ID,
      version: 2,
      deck: { name: 'Biology' },
      cards: [
        { question: 'Q', answer: 'A', box: 3, dueDate: '2026-11-02' },
      ],
    })
  })
})

describe('parseDeckFile — valid files', () => {
  it('accepts and trims a complete deck export', () => {
    const result = parseDeckFile(JSON.stringify(validFile()))

    expect(result.ok).toBe(true)
    expect(result.data.deckName).toBe('Biology')
    expect(result.data.cards).toEqual([
      {
        question: 'What is a cell?',
        answer: 'The basic unit of life.',
        box: 2,
        dueDate: '2026-10-31',
      },
    ])
  })

  it('defaults a missing box to 1 and a missing due date to null', () => {
    const result = validateDeckImport({
      deck: { name: 'History' },
      cards: [{ question: 'Q', answer: 'A' }],
    })

    expect(result).toEqual({
      ok: true,
      data: {
        deckName: 'History',
        cards: [{ question: 'Q', answer: 'A', box: 1, dueDate: null }],
      },
    })
  })

  it('accepts a top-level name as a convenience', () => {
    const result = validateDeckImport({
      name: 'Geography',
      cards: [],
    })

    expect(result.ok).toBe(true)
    expect(result.data.deckName).toBe('Geography')
    expect(result.data.cards).toEqual([])
  })
})

describe('parseDeckFile — rejected files', () => {
  const expectError = (result, pattern) => {
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(pattern)
  }

  it('rejects an empty file', () => {
    expectError(parseDeckFile('   '), /empty/i)
  })

  it('rejects invalid JSON without throwing', () => {
    expectError(parseDeckFile('{ nope'), /not valid JSON/i)
  })

  it('rejects files that are too large', () => {
    expectError(
      parseDeckFile('x'.repeat(MAX_IMPORT_FILE_SIZE + 1)),
      /too large/i,
    )
  })

  it('rejects a JSON value that is not an object', () => {
    expectError(parseDeckFile('[]'), /JSON object/i)
  })

  it('rejects a file from another app', () => {
    expectError(
      validateDeckImport({ ...validFile(), app: 'another-app' }),
      /not exported by Flashcard Quiz App/i,
    )
  })

  it('rejects a missing or blank deck name', () => {
    expectError(validateDeckImport({ cards: [] }), /deck name/i)
    expectError(
      validateDeckImport({ deck: { name: '   ' }, cards: [] }),
      /deck name/i,
    )
  })

  it('rejects a deck name that is too long', () => {
    expectError(
      validateDeckImport({ deck: { name: 'x'.repeat(41) }, cards: [] }),
      /40 characters or fewer/i,
    )
  })

  it('rejects a missing cards array', () => {
    expectError(
      validateDeckImport({ deck: { name: 'Biology' } }),
      /"cards" array/i,
    )
  })

  it('rejects too many cards', () => {
    const cards = Array.from({ length: MAX_IMPORT_CARDS + 1 }, () => ({
      question: 'Q',
      answer: 'A',
    }))
    expectError(
      validateDeckImport({ deck: { name: 'Big' }, cards }),
      /too many cards/i,
    )
  })

  it('rejects a card that is not an object', () => {
    expectError(
      validateDeckImport({ deck: { name: 'Biology' }, cards: ['Q'] }),
      /Card 1 is not a valid card/i,
    )
  })

  it('rejects missing or too-long questions and answers', () => {
    expectError(
      validateDeckImport({
        deck: { name: 'Biology' },
        cards: [{ answer: 'A' }],
      }),
      /Card 1 is missing a question/i,
    )
    expectError(
      validateDeckImport({
        deck: { name: 'Biology' },
        cards: [{ question: 'x'.repeat(201), answer: 'A' }],
      }),
      /question must be 200 characters or fewer/i,
    )
    expectError(
      validateDeckImport({
        deck: { name: 'Biology' },
        cards: [{ question: 'Q' }],
      }),
      /Card 1 is missing an answer/i,
    )
    expectError(
      validateDeckImport({
        deck: { name: 'Biology' },
        cards: [{ question: 'Q', answer: 'x'.repeat(601) }],
      }),
      /answer must be 600 characters or fewer/i,
    )
  })

  it('rejects an invalid box', () => {
    for (const box of [0, 6, 1.5, '2']) {
      expectError(
        validateDeckImport({
          deck: { name: 'Biology' },
          cards: [{ question: 'Q', answer: 'A', box }],
        }),
        /box must be a whole number from 1 to 5/i,
      )
    }
  })

  it('rejects an impossible due date', () => {
    expectError(
      validateDeckImport({
        deck: { name: 'Biology' },
        cards: [
          { question: 'Q', answer: 'A', dueDate: '2026-02-30' },
        ],
      }),
      /dueDate must be a valid date/i,
    )
  })
})
