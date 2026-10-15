# Flashcard Quiz App

A study flashcard app built with **React + Vite**. Flip a card to reveal the
answer, move through the deck, and create your own cards. Everything is saved in
your browser, so your deck is still there when you come back. The app is also a
**Progressive Web App (PWA)** — installable on desktop and mobile and usable
offline after first load.

Built as **Task 1** of the CodeNova App Development Internship.

![Flashcard Quiz App screenshot](./docs/screenshot-desktop.png)

## Overview

The app has two halves on one screen:

- **Study** — shows one card at a time. Click/tap it (or press `Enter`/`Space`)
  to flip between question and answer. Use Previous/Next (or left/right arrow
  keys) to move through the deck; a position indicator (e.g. `3 / 10`) shows
  where you are.
- **Manage** — add a card, edit it inline, or delete it with a two-step
  confirmation. All cards are listed here; clicking one jumps the Study view to
  that card.

## Features (mapped to CodeNova brief)

| Brief requirement | Implementation |
|---|---|
| Card view with flip interaction (question → answer) | Click/tap/`Enter`/`Space`; 3D CSS flip; `role="button"`, `aria-pressed`, `aria-label`, hidden face `aria-hidden` |
| Next/Previous navigation | Buttons + arrow keys, ends **disabled** (not wrapped), `n / total` shown, `aria-live` for position |
| Create, edit, delete flashcards | Full CRUD in Manage section; `CardForm` reused for create and edit; two-step inline delete confirmation |
| Data persists across app restarts | `useLocalStorage` + namespaced key `flashcard-quiz-app:cards/v1`; seed on first launch only; sanitised read with try/catch |
| Smooth flip animation without layout glitches | CSS 3D: `perspective`, `transform-style: preserve-3d`, `backface-visibility: hidden`; fixed card height; `prefers-reduced-motion` honoured |
| Responsive across screen sizes and orientations | `clamp()` and media queries; works on mobile (portrait/landscape) and desktop; no horizontal scroll in tested widths |
| Clean component separation | Presentational: `components/`; orchestration: `App.jsx`; domain/stateful: `hooks/`; pure helpers: `utils/`; static data: `data/` |
| PWA: installable and works offline | Web App Manifest + Service Worker (Workbox precache), `registerType: 'autoUpdate'`, `injectRegister: 'auto'`; scope `.` for GitHub Pages |
| Deliverables | Public GitHub repo, `README.md`, screenshots, live demo link; no paid APIs; no secrets |
| No secrets or API keys | `.gitignore` covers `.env*`; none present; repo has no `.env` files |

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19 |
| Build | Vite |
| Styling | Plain CSS (custom properties, light/dark) |
| State/persistence | React hooks + `localStorage` |
| PWA | `vite-plugin-pwa` (Workbox) |
| Linting | oxlint |
| Deployment | GitHub Pages (free) |

## Project structure

```
Flashcard Quiz App/
├─ public/                 static assets
│  ├─ favicon.svg
│  ├─ pwa-192x192.png
│  ├─ pwa-512x512.png
│  └─ pwa-maskable-512x512.png
├─ src/
│  ├─ components/          presentational UI
│  │  ├─ Flashcard.jsx
│  │  ├─ CardControls.jsx
│  │  ├─ CardForm.jsx
│  │  └─ CardList.jsx
│  ├─ hooks/
│  │  ├─ useLocalStorage.js
│  │  └─ useFlashcards.js
│  ├─ data/
│  │  └─ seedCards.js
│  ├─ utils/
│  │  └─ id.js
│  ├─ styles/
│  │  ├─ global.css
│  │  └─ app.css
│  ├─ App.jsx
│  └─ main.jsx
├─ index.html
├─ vite.config.js
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
npm run dev      # start dev server (HMR)
npm run lint     # lint with oxlint
npm run build    # production build to dist/
npm run preview  # preview production build locally
npm run predeploy
npm run deploy   # deploy dist/ to gh-pages
```

## Build and deploy

### Local build+preview
```bash
npm run lint && npm run build
npm run preview
```

### Deploy to GitHub Pages (free)

`vite.config.js` sets `base: './'` so it works at `https://<your-username>.github.io/<repo-name>/`.

1. Push your code to GitHub (public).
2. Ensure repo name is `<repo-name>`.
3. Deploy:
```bash
npm run deploy
```
4. On GitHub: **Settings → Pages → Source** = `gh-pages` branch.

> Alternative free hosts: Netlify or Vercel. Build `npm run build`, publish dir `dist`.

## Screenshots

Save into a `docs/` folder at repo root.

- `docs/screenshot-desktop.png` — Desktop: Study view (question or answer side)
- `docs/screenshot-mobile.png` — Mobile (portrait): Study view with Manage visible or list shown
- `docs/screenshot-manage.png` — Manage section showing list, form in edit mode, or validation error (optional but recommended)

Then reference in this README (already included).

## Live demo

> **Demo:** https://<your-username>.github.io/<repo-name>/

## What I learned

- Splitting React logic: presentational components, a single stateful orchestrator (`App.jsx`), and domain hooks.
- Building a reusable persistence layer (`useLocalStorage`) and layering domain logic (`useFlashcards`).
- CSS 3D transforms: `perspective`, `transform-style: preserve-3d`, `backface-visibility`; keeping fixed card height; avoiding layout shift and mirrored text; `prefers-reduced-motion`.
- Controlled forms, validation, edit-state tracking via component keys, and two-step delete confirmation.
- PWA: Web App Manifest, Workbox precaching, auto-update registration, and GitHub Pages base-path/scoping considerations.
- Accessibility basics: keyboard interaction, `role`, `tabIndex`, `aria-pressed`, `aria-label`, `aria-live`, focus-visible.

## AI assistance disclosure

I used an AI assistant (opencode) to scaffold, implement, and document the app. The assistant helped with:
- scaffolding and the folder structure,
- the persistence layer and React logic,
- the 3D flip CSS, a11y, and responsive styles,
- PWA configuration (vite-plugin-pwa), icons generation, and GitHub Pages setup,
- writing this README.

All code was reviewed, linted (`npm run lint`), built (`npm run build`) and is intended to be tested manually. No AI-generated content was committed with hardcoded secrets; the `.gitignore` protects `.env*` files. Images/icons were generated locally. Deployment commands are provided (not executed) so you control pushing and publishing.

## Verification (PWA)

Check after `npm run build && npm run preview`:
1. **Manifest** (Chrome DevTools → Application → Manifest): shows name "Flashcard Quiz App", short_name "Flashcards", theme/background colors, display "standalone", start_url `.`, scope `.`, icons present (192, 512, maskable 512).
2. **Service Worker** (Application → Service Workers): `sw.js` is registered and active; `status` shows activated. With `registerType: 'autoUpdate'`, updates apply automatically.
3. **Offline** (Network → Offline + reload): app loads from cache after first visit; UI is usable offline.
4. **Lighthouse** (Lighthouse → Progressive Web App): should pass installable, uses https/workers/manifest/scope. (On http://localhost:4173 it's installable; on HTTPS production it's optimal.)
