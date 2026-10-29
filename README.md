# Flashcard Quiz App

A study flashcard app built with **React + Vite**. Flip a card to reveal the
answer, move through a session, organise cards into multiple decks, and let
**Leitner spaced repetition** decide what is due today. Everything is saved in
your browser, and the app is a **Progressive Web App (PWA)** — installable on
desktop and mobile and usable offline after the first load.

Built as **Task 1** of the CodeNova App Development Internship, extended with
multiple decks, spaced repetition, statistics, import/export and unit tests.

![Flashcard Quiz App screenshot](./docs/screenshot-desktop.png)

## Overview

- **Study** — pick a deck, start a **Due today** or **All cards** session, then
  click/tap the card (or press `Enter`/`Space`) to flip between question and
  answer. Previous/Next buttons and the left/right arrow keys move through the
  session. `Known` moves a card up one Leitner box; `Review again` sends it back
  to box 1. `Shuffle` randomises only the current session.
- **Manage** — add, edit and delete cards in the selected deck. Each card can be
  assigned to a deck, and cards show their current box and whether they are due.
  Create, rename and delete decks from the deck bar.
- **Stats** — cards due today, total reviewed, accuracy, daily streak and a
  mastery progress bar for every deck.

## Features

| Feature | Implementation |
|---|---|
| Multiple decks | Create, rename and delete decks; deck selector persists the active deck; cards always belong to exactly one deck |
| Safe migration | Existing `cards/v1` data is copied into a **Default** deck on first v2 launch; the old storage key is never deleted |
| Leitner spaced repetition | 5 boxes, due-today sessions, box counts, `Known`/`Review again` ratings |
| Stats page | Pure functions in `src/utils/stats.js`; local dates (not UTC); due count, reviews, accuracy, streak and per-deck mastery |
| Deck import/export | JSON download per deck; import validates every field and shows a clear error without crashing |
| Shuffle | Fisher-Yates shuffle of the session order only; saved card order is untouched |
| Unit tests | Vitest tests for Leitner rules, stats, import validation, mutation safety and legacy migration |
| Accessibility | Keyboard navigation, `aria-*` labels, live announcements, visible focus rings, 44px minimum targets |
| Responsive + themes | Works from 320px wide; light/dark tokens; `prefers-reduced-motion` honoured |
| PWA | Web App Manifest + Workbox service worker precache, auto-update registration |

## Leitner rules

Every card starts in **box 1** and is due today. A card is due when its local
`dueDate` is today or earlier.

| Rating | Box change | Next due |
|---|---|---|
| `Known` | Move up one box (box 5 stays at 5) | Today + interval for the new box |
| `Review again` | Return to box 1 | Tomorrow |

| Box | Review interval after rating |
|---|---|
| 1 | 1 day |
| 2 | 2 days |
| 3 | 4 days |
| 4 | 8 days |
| 5 | 16 days |

A study session is a **snapshot** of the deck's due cards when the session
starts. Rating a card updates its schedule and the box counts immediately, but
the card stays in the current session until you start a new one. This prevents
a session from looping over the same card after a `Review again`.

## Data schema

Storage key: `flashcard-quiz-app:data/v2`

```json
{
  "version": 2,
  "decks": [
    { "id": "deck-default", "name": "Default", "createdAt": "2026-10-29T10:00:00.000Z" }
  ],
  "cards": [
    {
      "id": "card-1",
      "deckId": "deck-default",
      "question": "What is a closure?",
      "answer": "A function that remembers variables from where it was created.",
      "box": 2,
      "dueDate": "2026-10-31",
      "lastReviewedAt": "2026-10-29T10:05:00.000Z",
      "reviewCount": 3,
      "correctCount": 2
    }
  ],
  "reviews": [
    {
      "id": "review-1",
      "cardId": "card-1",
      "deckId": "deck-default",
      "result": "known",
      "date": "2026-10-29",
      "at": "2026-10-29T10:05:00.000Z"
    }
  ]
}
```

- `dueDate` and `review.date` are **local** `YYYY-MM-DD` strings. They are never
  produced with `toISOString()`.
- `lastReviewedAt` and `at` are ISO timestamps used for display/auditing.
- `reviews` is append-only review history; stats derive total reviewed,
  accuracy and the daily streak from it.
- The active deck id is stored separately under
  `flashcard-quiz-app:activeDeck/v2`.

### Migration from v1

The previous version stored a plain array under
`flashcard-quiz-app:cards/v1`:

```json
[
  { "id": "seed-1", "question": "...", "answer": "..." }
]
```

On first launch with v2:

1. If `data/v2` exists, it is sanitised and used.
2. Otherwise, if `cards/v1` exists, each card is copied into a deck named
   **Default** (`deck-default`) with `box: 1` and `dueDate: today`.
3. The old `cards/v1` key is **left untouched** as a backup.
4. If neither key exists, the demo deck is seeded once.

Missing or malformed v2 fields are repaired defensively. Valid empty arrays are
preserved, so deleting every card sticks instead of reseeding demo data.

## Import / export JSON format

Export downloads the selected deck as `<deck-name>-flashcards.json`:

```json
{
  "app": "flashcard-quiz-app",
  "version": 2,
  "exportedAt": "2026-10-29T10:00:00.000Z",
  "deck": { "name": "Biology" },
  "cards": [
    { "question": "What is a cell?", "answer": "The basic unit of life.", "box": 2, "dueDate": "2026-10-31" }
  ]
}
```

Validation rejects, with a readable message:

- empty files, invalid JSON, or files over 2 MB;
- JSON that is not an object, or is from another app;
- a missing/blank deck name or one longer than 40 characters;
- a missing `cards` array, more than 1,000 cards, or a non-object card;
- missing questions/answers; questions over 200 characters; answers over 600;
- a `box` that is not a whole number from 1 to 5;
- a `dueDate` that is not a real `YYYY-MM-DD` date.

Imported cards receive fresh ids and join a new deck. If the name already
exists, the new deck gets a suffix such as `Biology (2)`. An import never
replaces or overwrites existing cards.

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19 |
| Build | Vite |
| Styling | Plain CSS (custom properties, light/dark) |
| State/persistence | React hooks + `localStorage` |
| Dates | Local-calendar helpers (`src/utils/dates.js`) |
| PWA | `vite-plugin-pwa` (Workbox) |
| Linting | oxlint |
| Testing | Vitest |
| Deployment | GitHub Pages (free) |

## Project structure

```
Flashcard Quiz App/
├─ public/                     static assets + PWA icons
├─ src/
│  ├─ components/
│  │  ├─ BoxCounts.jsx         box-count chips
│  │  ├─ CardControls.jsx      previous / flip / next
│  │  ├─ CardForm.jsx          create/edit a card (with deck picker)
│  │  ├─ CardList.jsx          card list with box/due badges + delete confirm
│  │  ├─ DeckBar.jsx           deck selector + create/rename/delete
│  │  ├─ DeckIO.jsx            JSON import/export UI
│  │  ├─ Flashcard.jsx         3D flip card
│  │  ├─ ManageView.jsx        manage section
│  │  ├─ ReviewActions.jsx     Known / Review again
│  │  ├─ StatsView.jsx         stats cards + mastery bars
│  │  └─ StudyView.jsx         study section
│  ├─ data/
│  │  └─ seedCards.js          first-run demo deck
│  ├─ hooks/
│  │  ├─ useFlashcards.js      v2 persistence, decks, cards, reviews, import
│  │  └─ useLocalStorage.js    safe JSON storage hook
│  ├─ utils/
│  │  ├─ dates.js              local-date parsing, formatting, addDays
│  │  ├─ deckIO.js             export shape + import validation
│  │  ├─ id.js                 id generation
│  │  ├─ leitner.js            boxes, due cards, ratings, box counts
│  │  ├─ schema.js             v2 sanitising + v1 migration
│  │  ├─ shuffle.js            Fisher-Yates (returns a copy)
│  │  └─ stats.js              pure stats functions
│  ├─ styles/
│  │  ├─ global.css
│  │  └─ app.css
│  ├─ App.jsx
│  └─ main.jsx
├─ tests/
│  ├─ deckIO.test.js
│  ├─ leitner.test.js
│  ├─ schema.test.js
│  ├─ shuffle.test.js
│  └─ stats.test.js
├─ index.html
├─ vite.config.js
├─ vitest.config.js
├─ package.json
└─ README.md
```

## Setup and run

Requires [Node.js](https://nodejs.org/) 20+ and npm.

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
npm install
npm run dev   # http://localhost:5173
```

Scripts:

```bash
npm run dev         # start dev server (HMR)
npm run lint        # lint with oxlint
npm test            # run Vitest unit tests once
npm run test:watch  # run Vitest in watch mode
npm run build       # production build to dist/
npm run preview     # preview production build locally
npm run predeploy
npm run deploy      # deploy dist/ to gh-pages
```

## Tests

The unit tests use Vitest and run in a Node environment:

```bash
npm test
```

Coverage includes:

- **Leitner** — box movement/capping, reset to box 1, intervals, due filtering,
  legacy cards without a due date, box counts, input immutability.
- **Stats** — due count, accuracy, streak (including the “yesterday grace”
  rule), mastery percentages, per-deck rows, local-date formatting.
- **Import validation** — valid exports, defaults, invalid JSON/shape/fields,
  impossible dates, size and card-count limits.
- **Schema/migration** — v1 cards copied into the Default deck, empty arrays
  preserved, missing fields repaired.
- **Shuffle** — returns a permutation and never mutates the saved array.

## Build and deploy

### Local build + preview

```bash
npm run lint && npm test && npm run build
npm run preview
```

### Deploy to GitHub Pages (free)

`vite.config.js` sets `base: './'` so it works at
`https://<your-username>.github.io/<repo-name>/`.

1. Push your code to GitHub (public).
2. Ensure the repo name is `<repo-name>`.
3. Deploy:

```bash
npm run deploy
```

4. On GitHub: **Settings → Pages → Source** = `gh-pages` branch.

> Alternative free hosts: Netlify or Vercel. Build with `npm run build`, publish
> the `dist` directory.

## Screenshots

Save images into a `docs/` folder at the repo root.

- `docs/screenshot-desktop.png` — desktop Study view with the selected deck,
  box counts and review buttons.
- `docs/screenshot-decks.png` — deck selector and create/rename/delete controls.
- `docs/screenshot-leitner.png` — a study session with a card flipped, box
  counts and `Known` / `Review again` actions.
- `docs/screenshot-stats.png` — Stats page with the four summary cards and
  per-deck mastery bars.
- `docs/screenshot-import-export.png` — Manage view showing import/export and a
  successful export or a clear validation error.
- `docs/screenshot-mobile.png` — mobile portrait at 320–390px.

Recommended capture flow: load with the demo deck, answer one card as `Known`,
open **Stats**, then export a deck and import it again. That shows every new
feature in one set of screenshots.

## Accessibility and responsiveness

- Every control is reachable by keyboard; arrow keys navigate cards and the
  flip card responds to `Enter`/`Space`.
- `aria-pressed` describes the flip state, `aria-live` announces position and
  rating results, and progress bars expose `role="progressbar"` values.
- Interactive targets are at least 44px high (buttons, inputs, selects and card
  rows).
- Layout wraps from 320px upward without horizontal scrolling.
- Colours come from tokens with a dark-mode override; motion is reduced when
  the user prefers reduced motion.

## Verification (PWA)

After `npm run build && npm run preview`:

1. **Manifest** (Chrome DevTools → Application → Manifest): name, short name,
   theme/background colours, `display: standalone`, start URL, scope and icons.
2. **Service Worker** (Application → Service Workers): `sw.js` is registered and
   active; auto-update is enabled.
3. **Offline** (Network → Offline + reload): the app loads from cache and is
   usable offline.
4. **Lighthouse** (Lighthouse → Progressive Web App): should pass installable
   checks when served over HTTPS.

## What I learned

- Splitting React logic into presentational components, a stateful orchestrator
  (`App.jsx`) and domain hooks.
- Designing a versioned persistence schema with a defensive sanitiser and a
  no-data-loss migration path.
- Implementing Leitner scheduling with local calendar dates and testable pure
  functions.
- Validating untrusted JSON at the boundary so bad files produce messages, not
  crashes.
- Keeping shuffling as a view-only concern so persisted order never changes.
- Writing accessibility and responsive behaviour into the component and CSS
  layer rather than adding it later.

## AI assistance disclosure

I used an AI assistant (opencode) to scaffold, extend, implement and document the
app. The assistant helped with:

- the original Vite/React scaffold and PWA configuration;
- the v2 schema, v1 migration, Leitner logic, stats and import validation;
- the new deck, stats, review and import/export components and styles;
- Vitest unit tests and this README.

All code was reviewed, linted (`npm run lint`), tested (`npm test`) and built
(`npm run build`). Images/icons were generated locally. No secrets or API keys
are present in the repo, and `.gitignore` protects `.env*` files. Deployment
commands are provided but not executed.
