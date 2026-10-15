/*
 * Flashcard — a presentational 3D flip card.
 *
 * Props
 *   card      { id, question, answer }
 *   isFlipped boolean       — whether the answer side is showing
 *   onFlip    () => void    — request a flip (parent owns the state)
 *
 * Accessibility: it behaves like a toggle button. role="button", focusable
 * via tabIndex, aria-pressed reflects the flip state, and Enter/Space flip it.
 * The hidden face is aria-hidden so screen readers don't read both sides.
 */
export default function Flashcard({ card, isFlipped = false, onFlip }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault() // stop Space from scrolling the page
      onFlip?.()
    }
  }

  return (
    <div
      className={`flashcard${isFlipped ? ' is-flipped' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={
        isFlipped
          ? 'Flashcard showing the answer. Activate to show the question.'
          : 'Flashcard showing the question. Activate to show the answer.'
      }
      onClick={() => onFlip?.()}
      onKeyDown={handleKeyDown}
    >
      <div className="flashcard__inner">
        <div
          className="flashcard__face flashcard__face--front"
          aria-hidden={isFlipped}
        >
          <span className="flashcard__label">Question</span>
          <p className="flashcard__text">{card?.question}</p>
        </div>

        <div
          className="flashcard__face flashcard__face--back"
          aria-hidden={!isFlipped}
        >
          <span className="flashcard__label">Answer</span>
          <p className="flashcard__text">{card?.answer}</p>
        </div>
      </div>
    </div>
  )
}
