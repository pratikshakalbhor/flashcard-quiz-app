/*
 * CardControls — Previous / Flip / Next plus a "current / total" indicator.
 *
 * Props
 *   index, total      numbers
 *   isFlipped         boolean
 *   onPrev, onNext, onFlip : () => void
 *
 * Ends are DISABLED (not wrapped) so the position indicator stays truthful and
 * navigation is never surprising.
 */
export default function CardControls({
  index = 0,
  total = 0,
  isFlipped = false,
  onPrev,
  onNext,
  onFlip,
}) {
  const canPrev = index > 0
  const canNext = index < total - 1

  return (
    <div className="controls">
      <button
        type="button"
        className="btn"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Previous card"
      >
        ‹ Previous
      </button>

      <button
        type="button"
        className="btn btn--primary"
        onClick={onFlip}
        aria-pressed={isFlipped}
      >
        {isFlipped ? 'Show question' : 'Show answer'}
      </button>

      <button
        type="button"
        className="btn"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Next card"
      >
        Next ›
      </button>

      <p className="controls__position" aria-live="polite">
        {total === 0 ? '0 / 0' : `${index + 1} / ${total}`}
      </p>
    </div>
  )
}
