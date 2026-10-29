import { useCallback, useEffect, useMemo, useState } from 'react'
import './styles/app.css'
import DeckBar from './components/DeckBar.jsx'
import ManageView from './components/ManageView.jsx'
import StatsView from './components/StatsView.jsx'
import StudyView from './components/StudyView.jsx'
import { ACTIVE_DECK_KEY, useFlashcards } from './hooks/useFlashcards.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { toLocalDateString } from './utils/dates.js'
import { boxCounts, nextBox, selectSessionCards } from './utils/leitner.js'
import { shuffleArray } from './utils/shuffle.js'
import { buildStats } from './utils/stats.js'

const VIEWS = [
  { id: 'study', label: 'Study' },
  { id: 'manage', label: 'Manage' },
  { id: 'stats', label: 'Stats' },
]

function createSession(cards, deckId, mode, today) {
  const deckCards = cards.filter((card) => card.deckId === deckId)
  return {
    deckId,
    mode,
    cardIds: selectSessionCards(deckCards, mode, today).map((card) => card.id),
  }
}

/*
 * App is the single owner of UI state. Data lives in useFlashcards (persisted);
 * session order, the current card and the open view are local UI state.
 */
export default function App() {
  const {
    decks,
    cards,
    reviews,
    addDeck,
    renameDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    reviewCard,
    importDeck,
  } = useFlashcards()

  const [storedDeckId, setActiveDeckId] = useLocalStorage(
    ACTIVE_DECK_KEY,
    null,
    (value) => (typeof value === 'string' ? value : null),
  )

  const activeDeck =
    decks.find((deck) => deck.id === storedDeckId) ?? decks[0] ?? null
  const activeDeckId = activeDeck?.id ?? ''
  const today = toLocalDateString()

  const deckCards = useMemo(
    () => cards.filter((card) => card.deckId === activeDeckId),
    [cards, activeDeckId],
  )

  const [session, setSession] = useState(() =>
    activeDeck ? createSession(cards, activeDeck.id, 'due', today) : null,
  )
  const [sessionDeckId, setSessionDeckId] = useState(activeDeckId)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [view, setView] = useState('study')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [announcement, setAnnouncement] = useState('')

  const cardsById = useMemo(
    () => new Map(cards.map((card) => [card.id, card])),
    [cards],
  )

  const sessionCards = useMemo(
    () =>
      (session?.cardIds ?? [])
        .map((id) => cardsById.get(id))
        .filter(Boolean),
    [session, cardsById],
  )

  const shownIndex =
    sessionCards.length === 0
      ? 0
      : Math.min(currentIndex, sessionCards.length - 1)
  const currentCard = sessionCards[shownIndex] ?? null
  const editingCard = editingId
    ? (cards.find((card) => card.id === editingId) ?? null)
    : null

  const dueCount = useMemo(
    () => selectSessionCards(deckCards, 'due', today).length,
    [deckCards, today],
  )
  const counts = useMemo(() => boxCounts(deckCards), [deckCards])
  const stats = useMemo(
    () => buildStats({ decks, cards, reviews }, today),
    [decks, cards, reviews, today],
  )

  /*
   * Adjust session state when the selected deck changes. This is React's
   * guarded "derive state from a previous prop" pattern — it avoids an effect
   * and the extra render pass that setState-in-effect would cause.
   */
  if (sessionDeckId !== activeDeckId) {
    setSessionDeckId(activeDeckId)
    setSession(
      activeDeckId ? createSession(cards, activeDeckId, 'due', today) : null,
    )
    setCurrentIndex(0)
    setIsFlipped(false)
    setAnnouncement('')
  }

  const goPrev = useCallback(() => {
    setCurrentIndex((index) => Math.max(0, index - 1))
    setIsFlipped(false)
  }, [])

  const goNext = useCallback(() => {
    setCurrentIndex((index) =>
      Math.min(Math.max(0, sessionCards.length - 1), index + 1),
    )
    setIsFlipped(false)
  }, [sessionCards.length])

  const handleFlip = useCallback(() => setIsFlipped((flipped) => !flipped), [])

  // Arrow-key navigation, ignored while typing in a form field.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey)
        return
      const tag = event.target?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        event.target?.isContentEditable
      ) {
        return
      }
      if (event.key === 'ArrowLeft') goPrev()
      else if (event.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goPrev, goNext])

  const handleStartSession = useCallback(
    (mode) => {
      if (!activeDeckId) return
      const nextSession = createSession(cards, activeDeckId, mode, today)
      setSession(nextSession)
      setCurrentIndex(0)
      setIsFlipped(false)
      setAnnouncement(
        `Started a ${mode === 'due' ? 'due-today' : 'all-cards'} session with ${
          nextSession.cardIds.length
        } card${nextSession.cardIds.length === 1 ? '' : 's'}.`,
      )
    },
    [activeDeckId, cards, today],
  )

  const handleShuffle = useCallback(() => {
    if (!session || session.cardIds.length < 2) return

    setSession({ ...session, cardIds: shuffleArray(session.cardIds) })
    setCurrentIndex(0)
    setIsFlipped(false)
    setAnnouncement('Session shuffled. Saved card order is unchanged.')
  }, [session])

  const handleReview = useCallback(
    (result) => {
      if (!currentCard) return

      reviewCard(currentCard.id, result)
      const box = nextBox(currentCard.box, result)
      setAnnouncement(
        result === 'known'
          ? `Known — card moved to box ${box}.`
          : 'Review again — card moved back to box 1.',
      )
      setCurrentIndex((index) =>
        index < sessionCards.length - 1 ? index + 1 : index,
      )
      setIsFlipped(false)
    },
    [currentCard, reviewCard, sessionCards.length],
  )

  // --- Deck handlers -------------------------------------------------------
  const handleSelectDeck = (id) => {
    setActiveDeckId(id)
  }

  const handleCreateDeck = (name) => {
    const deck = addDeck(name)
    setActiveDeckId(deck.id)
    setView('study')
    setFormOpen(false)
    setEditingId(null)
  }

  const handleDeleteDeck = (id) => {
    if (decks.length <= 1) return

    const remaining = decks.filter((deck) => deck.id !== id)
    deleteDeck(id)

    if (activeDeckId === id) setActiveDeckId(remaining[0]?.id ?? null)
    if (editingCard?.deckId === id) {
      setFormOpen(false)
      setEditingId(null)
    }

    setAnnouncement('Deck deleted.')
  }

  // --- Card handlers -------------------------------------------------------
  const handleNew = () => {
    setEditingId(null)
    setFormOpen(true)
  }

  const handleEdit = (id) => {
    setEditingId(id)
    setFormOpen(true)
  }

  const handleCancel = () => {
    setFormOpen(false)
    setEditingId(null)
  }

  const handleSubmit = ({ question, answer, deckId }) => {
    if (editingId) {
      updateCard(editingId, { question, answer, deckId })
      if (deckId !== activeDeckId) setActiveDeckId(deckId)
      handleCancel()
      return
    }

    const card = addCard(question, answer, deckId)

    if (deckId !== activeDeckId) {
      setActiveDeckId(deckId)
      setView('study')
    } else {
      const ids = [...deckCards.map((item) => item.id), card.id]
      setSession({ deckId, mode: 'all', cardIds: ids })
      setCurrentIndex(ids.length - 1)
      setIsFlipped(false)
      setView('study')
      setAnnouncement('Card added and ready to study.')
    }

    handleCancel()
  }

  const handleDelete = (id) => {
    const removedAt = session?.cardIds.indexOf(id) ?? -1

    if (removedAt !== -1) {
      setSession((prev) =>
        prev
          ? { ...prev, cardIds: prev.cardIds.filter((cardId) => cardId !== id) }
          : prev,
      )
      setCurrentIndex((index) =>
        removedAt < index ? Math.max(0, index - 1) : index,
      )
    }

    deleteCard(id)
    if (editingId === id) handleCancel()
    setIsFlipped(false)
    setAnnouncement('Card deleted.')
  }

  const handleShowCard = (id) => {
    if (!activeDeckId) return

    const ids = deckCards.map((card) => card.id)
    const index = ids.indexOf(id)

    setSession({ deckId: activeDeckId, mode: 'all', cardIds: ids })
    setCurrentIndex(Math.max(0, index))
    setIsFlipped(false)
    setView('study')
  }

  const handleImport = (payload) => {
    const deckId = importDeck(payload)
    setActiveDeckId(deckId)
    setView('study')
    setAnnouncement(`Imported “${payload.deckName}”.`)
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-inner">
          <h1 className="app__title">Flashcard Quiz App</h1>
          <p className="app__subtitle">
            Flip · Navigate · Remember with spaced repetition
          </p>
        </div>

        <DeckBar
          decks={decks}
          activeDeck={activeDeck}
          onSelect={handleSelectDeck}
          onCreate={handleCreateDeck}
          onRename={renameDeck}
          onDelete={handleDeleteDeck}
        />

        <nav className="view-nav" aria-label="Sections">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`view-nav__btn${view === item.id ? ' is-active' : ''}`}
              aria-current={view === item.id ? 'page' : undefined}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app__main">
        {view === 'study' && (
          <StudyView
            deck={activeDeck}
            mode={session?.mode ?? 'due'}
            dueCount={dueCount}
            cardCount={deckCards.length}
            sessionCount={sessionCards.length}
            currentCard={currentCard}
            currentIndex={shownIndex}
            isFlipped={isFlipped}
            boxCounts={counts}
            announcement={announcement}
            onPrev={goPrev}
            onNext={goNext}
            onFlip={handleFlip}
            onReview={handleReview}
            onShuffle={handleShuffle}
            onStartSession={handleStartSession}
          />
        )}

        {view === 'manage' && (
          <ManageView
            deck={activeDeck}
            cards={deckCards}
            decks={decks}
            formOpen={formOpen}
            editingCard={editingCard}
            currentCardId={currentCard?.id}
            onNew={handleNew}
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelect={handleShowCard}
            onImport={handleImport}
          />
        )}

        {view === 'stats' && <StatsView stats={stats} />}
      </main>
    </div>
  )
}
