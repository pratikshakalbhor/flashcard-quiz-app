import { useState } from 'react'
import { isDue, normalizeBox } from '../utils/leitner.js'

/*
 * CardList — every card in the active deck with Edit / Delete and a
 * "study this" jump.
 *
 * Props
 *   cards          [{ id, question, answer, box, dueDate }]
 *   currentIndex   number — highlights the card shown in the Study view
 *   onEdit(id), onDelete(id), onSelect(id)
 *
 * Delete uses a two-step inline confirmation (no window.confirm) so the action
 * is explicit and keyboard accessible.
 */
export default function CardList({
  cards = [],
  currentIndex = -1,
  onEdit,
  onDelete,
  onSelect,
}) {
  const [confirmingId, setConfirmingId] = useState(null)

  if (cards.length === 0) {
    return <p className="empty">No cards yet. Use “Add card” to create your first one.</p>
  }

  return (
    <ul className="card-list">
      {cards.map((card, index) => (
        <li
          key={card.id}
          className={`card-list__item${index === currentIndex ? ' is-current' : ''}`}
        >
          <button
            type="button"
            className="card-list__text"
            onClick={() => onSelect?.(card.id)}
            title="Study this card"
          >
            <span className="card-list__q">{card.question}</span>
            <span className="card-list__a">{card.answer}</span>
            <span className="card-list__tags">
              <span className="badge">Box {normalizeBox(card.box)}</span>
              {isDue(card) && <span className="badge badge--due">Due</span>}
            </span>
          </button>

          <div className="card-list__actions">
            {confirmingId === card.id ? (
              <div className="card-list__confirm">
                <span className="card-list__confirm-text">Delete?</span>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => {
                    onDelete?.(card.id)
                    setConfirmingId(null)
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => setConfirmingId(null)}
                >
                  No
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => onEdit?.(card.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => setConfirmingId(card.id)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
