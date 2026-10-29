import { DEFAULT_DECK_ID, DEFAULT_DECK_NAME } from '../utils/schema.js'

/*
 * Default deck + cards shown the very first time the app runs (before the
 * user has anything saved in localStorage). Edit freely — it's demo content.
 */
export const seedDeck = {
  id: DEFAULT_DECK_ID,
  name: DEFAULT_DECK_NAME,
}

export const seedCards = [
  {
    id: 'seed-1',
    question: 'What is the virtual DOM in React?',
    answer:
      'An in-memory representation of the UI that React diffs against the real DOM to apply the smallest possible set of updates.',
  },
  {
    id: 'seed-2',
    question: 'What does the `useState` hook return?',
    answer: 'A pair: the current state value and a setter function to update it.',
  },
  {
    id: 'seed-3',
    question: 'Why give each list item a stable `key`?',
    answer:
      'Keys let React match items between renders so it can preserve state and avoid unnecessary re-renders.',
  },
]
