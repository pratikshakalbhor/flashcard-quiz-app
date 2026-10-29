export default function ReviewActions({ onReview, disabled = false }) {
  return (
    <div className="review-actions" role="group" aria-label="Rate this card">
      <button
        type="button"
        className="btn btn--danger"
        onClick={() => onReview?.('again')}
        disabled={disabled}
        aria-label="Review again — move this card back to box 1"
      >
        ↺ Review again
      </button>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => onReview?.('known')}
        disabled={disabled}
        aria-label="Known — move this card up one box"
      >
        Known ↑
      </button>
    </div>
  )
}
