/*
 * Deck import/export format + validation.
 *
 * Export shape (version 2):
 * {
 *   "app": "flashcard-quiz-app",
 *   "version": 2,
 *   "exportedAt": "2026-10-29T10:00:00.000Z",
 *   "deck": { "name": "Biology" },
 *   "cards": [
 *     { "question": "...", "answer": "...", "box": 2, "dueDate": "2026-10-31" }
 *   ]
 * }
 *
 * Validation is deliberately strict about the fields the app relies on, but
 * ignores extra fields. It always returns a result object instead of throwing,
 * so the UI can show a clear message and keep running.
 */

import { isValidDateString } from './dates.js'
import { MAX_BOX } from './leitner.js'
import { MAX_DECK_NAME, SCHEMA_VERSION } from './schema.js'

export const APP_ID = 'flashcard-quiz-app'
export const MAX_IMPORT_CARDS = 1000
export const MAX_QUESTION_LENGTH = 200
export const MAX_ANSWER_LENGTH = 600
export const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024

const isObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const fail = (error) => ({ ok: false, error })

export function createDeckExport(deck, cards, now = new Date()) {
  return {
    app: APP_ID,
    version: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    deck: { name: deck?.name ?? 'Untitled deck' },
    cards: (Array.isArray(cards) ? cards : []).map((card) => ({
      question: card.question,
      answer: card.answer,
      box: card.box,
      dueDate: card.dueDate,
    })),
  }
}

export function validateDeckImport(value) {
  if (!isObject(value)) {
    return fail('The file must contain a JSON object with "deck" and "cards".')
  }

  if (value.app !== undefined && value.app !== APP_ID) {
    return fail('This JSON file was not exported by Flashcard Quiz App.')
  }

  const deckSource = isObject(value.deck) ? value.deck : null
  const rawName = deckSource ? deckSource.name : value.name
  if (typeof rawName !== 'string' || rawName.trim() === '') {
    return fail('The file is missing a deck name.')
  }

  const deckName = rawName.trim()
  if (deckName.length > MAX_DECK_NAME) {
    return fail(`The deck name must be ${MAX_DECK_NAME} characters or fewer.`)
  }

  if (!Array.isArray(value.cards)) {
    return fail('The file is missing a "cards" array.')
  }

  if (value.cards.length > MAX_IMPORT_CARDS) {
    return fail(
      `This deck has too many cards (maximum ${MAX_IMPORT_CARDS}).`,
    )
  }

  const cards = []

  for (let index = 0; index < value.cards.length; index += 1) {
    const rawCard = value.cards[index]
    const label = `Card ${index + 1}`

    if (!isObject(rawCard)) {
      return fail(`${label} is not a valid card object.`)
    }

    if (typeof rawCard.question !== 'string' || rawCard.question.trim() === '') {
      return fail(`${label} is missing a question.`)
    }

    const question = rawCard.question.trim()
    if (question.length > MAX_QUESTION_LENGTH) {
      return fail(
        `${label}: the question must be ${MAX_QUESTION_LENGTH} characters or fewer.`,
      )
    }

    if (typeof rawCard.answer !== 'string' || rawCard.answer.trim() === '') {
      return fail(`${label} is missing an answer.`)
    }

    const answer = rawCard.answer.trim()
    if (answer.length > MAX_ANSWER_LENGTH) {
      return fail(
        `${label}: the answer must be ${MAX_ANSWER_LENGTH} characters or fewer.`,
      )
    }

    const box = rawCard.box === undefined ? 1 : rawCard.box
    if (!Number.isInteger(box) || box < 1 || box > MAX_BOX) {
      return fail(`${label}: box must be a whole number from 1 to ${MAX_BOX}.`)
    }

    const dueDate = rawCard.dueDate === undefined ? null : rawCard.dueDate
    if (dueDate !== null && !isValidDateString(dueDate)) {
      return fail(
        `${label}: dueDate must be a valid date in YYYY-MM-DD format.`,
      )
    }

    cards.push({ question, answer, box, dueDate })
  }

  return { ok: true, data: { deckName, cards } }
}

export function parseDeckFile(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return fail('That file is empty. Choose a deck exported as JSON.')
  }

  if (text.length > MAX_IMPORT_FILE_SIZE) {
    return fail('That file is too large. The maximum size is 2 MB.')
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return fail(
      'That file is not valid JSON. Choose a deck exported by Flashcard Quiz App.',
    )
  }

  return validateDeckImport(parsed)
}
