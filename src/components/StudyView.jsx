import BoxCounts from './BoxCounts.jsx'
import CardControls from './CardControls.jsx'
import Flashcard from './Flashcard.jsx'
import ReviewActions from './ReviewActions.jsx'

export default function StudyView({
  deck,
  mode = 'due',
  dueCount = 0,
  cardCount = 0,
  sessionCount = 0,
  currentCard = null,
  currentIndex = 0,
  isFlipped = false,
  boxCounts = {},
  announcement = '',
  onPrev,
  onNext,
  onFlip,
  onReview,
  onShuffle,
  onStartSession,
}) {
  const emptyMessage =
    cardCount === 0
      ? `No cards in “${deck?.name ?? 'this deck'}” yet. Add one in Manage.`
      : mode === 'due' && dueCount === 0
        ? `Nothing is due today in “${deck?.name ?? 'this deck'}”. Review all cards or come back tomorrow.`
        : 'This session is empty. Start a new session above.'

  return (
    <section className="study" aria-labelledby="study-title">
      <div className="section-head">
        <div>
          <h2 id="study-title" className="section-title">
            Study
          </h2>
          <p className="section-meta">
            {deck?.name ?? 'Deck'} · {mode === 'due' ? 'Due today' : 'All cards'} ·{' '}
            {sessionCount} in session
          </p>
        </div>

        <div className="session-actions" role="group" aria-label="Study session">
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => onStartSession?.('due')}
          >
            Due today ({dueCount})
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => onStartSession?.('all')}
          >
            All cards ({cardCount})
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={onShuffle}
            disabled={sessionCount < 2}
          >
            Shuffle
          </button>
        </div>
      </div>

      <BoxCounts counts={boxCounts} />

      {currentCard ? (
        <>
          <p className="study__card-meta">
            Box {currentCard.box} of 5 · {sessionCount} card
            {sessionCount === 1 ? '' : 's'} in this session
          </p>
          <Flashcard card={currentCard} isFlipped={isFlipped} onFlip={onFlip} />
          <CardControls
            index={currentIndex}
            total={sessionCount}
            isFlipped={isFlipped}
            onPrev={onPrev}
            onNext={onNext}
            onFlip={onFlip}
          />
          <ReviewActions onReview={onReview} />
          <p className="study__hint">
            Known moves the card up one box. Review again returns it to box 1.
          </p>
          <p className="sr-only" role="status" aria-live="polite">
            {announcement}
          </p>
        </>
      ) : (
        <p className="empty">{emptyMessage}</p>
      )}
    </section>
  )
}
