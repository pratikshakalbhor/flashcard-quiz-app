import { useCallback, useEffect, useState } from 'react'
import './styles/app.css'
import CardControls from './components/CardControls.jsx'
import CardForm from './components/CardForm.jsx'
import CardList from './components/CardList.jsx'
import Flashcard from './components/Flashcard.jsx'
import { useFlashcards } from './hooks/useFlashcards.js'

/*
 * App is the single owner of app state. It passes plain data down and receives
 * intent back via callbacks, so every child stays presentational.
 *
 * State owned here:
 *   - the deck              (via useFlashcards — persisted)
 *   - currentIndex          (which card the Study view shows)
 *   - isFlipped             (question vs. answer side)
 *   - formOpen / editingId  (Manage form: create vs. edit)
 *
 * Index clamping and flip-reset are done in the EVENT handlers that change the
 * card (navigation, delete, add) rather than in effects — derived/event-driven
 * updates avoid extra render passes.
 */
export default function App() {
  const { cards, addCard, updateCard, deleteCard } = useFlashcards()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const total = cards.length
  const currentCard = cards[currentIndex] ?? null
  const editingCard = editingId ? (cards.find((c) => c.id === editingId) ?? null) : null

  // Move to a card and always start it on the question side.
  const showCard = useCallback((index) => {
    setCurrentIndex(index)
    setIsFlipped(false)
  }, [])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
    setIsFlipped(false)
  }, [])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(total - 1, i + 1))
    setIsFlipped(false)
  }, [total])

  const handleFlip = useCallback(() => setIsFlipped((f) => !f), [])

  // Arrow-key navigation, ignored while typing in a form field.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey) return
      const tag = event.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (event.key === 'ArrowLeft') goPrev()
      else if (event.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goPrev, goNext])

  // --- Manage handlers ------------------------------------------------------
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

  const handleSubmit = ({ question, answer }) => {
    if (editingId) {
      updateCard(editingId, { question, answer })
    } else {
      addCard(question, answer)
      showCard(cards.length) // jump to the newly added card
    }
    handleCancel()
  }

  const handleDelete = (id) => {
    const removedIndex = cards.findIndex((c) => c.id === id)
    const newLength = cards.length - 1

    deleteCard(id)

    // Keep currentIndex valid: shift down if the removed card was before it,
    // then clamp to the new last index.
    setCurrentIndex((i) => {
      const shifted = removedIndex < i ? i - 1 : i
      return Math.min(shifted, Math.max(0, newLength - 1))
    })
    setIsFlipped(false)

    if (editingId === id) handleCancel()
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Flashcard Quiz App</h1>
        <p className="app__subtitle">Flip · Navigate · Create your own deck</p>
      </header>

      <main className="app__main">
        <section className="study" aria-label="Study">
          <h2 className="section-title">Study</h2>

          {currentCard ? (
            <>
              <Flashcard card={currentCard} isFlipped={isFlipped} onFlip={handleFlip} />
              <CardControls
                index={currentIndex}
                total={total}
                isFlipped={isFlipped}
                onPrev={goPrev}
                onNext={goNext}
                onFlip={handleFlip}
              />
            </>
          ) : (
            <p className="empty">
              Your deck is empty. Add a card below to start studying.
            </p>
          )}
        </section>

        <section className="manage" aria-label="Manage cards">
          <div className="manage__head">
            <h2 className="section-title">Manage cards</h2>
            {!formOpen && (
              <button type="button" className="btn btn--primary" onClick={handleNew}>
                + Add card
              </button>
            )}
          </div>

          {formOpen && (
            <CardForm
              key={editingId ?? 'new'}
              initialCard={editingCard}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}

          <CardList
            cards={cards}
            currentIndex={currentIndex}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelect={showCard}
          />
        </section>
      </main>
    </div>
  )
}
