import { useState } from 'react'

/*
 * CardForm — one controlled form reused for creating AND editing.
 *
 * Props
 *   initialCard   { question, answer, deckId } | null — null => create mode
 *   decks         [{ id, name }]
 *   defaultDeckId deck to preselect when creating
 *   onSubmit({ question, answer, deckId }) — parent decides add vs. update
 *   onCancel()
 *
 * The parent gives this component a `key` (editing id or "new"), so switching
 * which card is being edited remounts it and reseeds local state — no manual
 * prop-to-state syncing.
 */

const MAX_QUESTION = 200
const MAX_ANSWER = 600

export default function CardForm({
  initialCard = null,
  decks = [],
  defaultDeckId = '',
  onSubmit,
  onCancel,
}) {
  // Controlled inputs: React state is the single source of truth for the value.
  const [question, setQuestion] = useState(initialCard?.question ?? '')
  const [answer, setAnswer] = useState(initialCard?.answer ?? '')
  const [deckId, setDeckId] = useState(
    initialCard?.deckId ?? defaultDeckId ?? decks[0]?.id ?? '',
  )
  const [errors, setErrors] = useState({})

  const validate = () => {
    const next = {}
    const q = question.trim()
    const a = answer.trim()

    if (!q) next.question = 'Question is required.'
    else if (q.length > MAX_QUESTION)
      next.question = `Question must be ${MAX_QUESTION} characters or fewer.`

    if (!a) next.answer = 'Answer is required.'
    else if (a.length > MAX_ANSWER)
      next.answer = `Answer must be ${MAX_ANSWER} characters or fewer.`

    if (!deckId || !decks.some((deck) => deck.id === deckId)) {
      next.deckId = 'Choose a deck.'
    }

    return next
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({ question: question.trim(), answer: answer.trim(), deckId })

    // Reset after submit (matters in create mode; edit mode closes anyway).
    setQuestion('')
    setAnswer('')
    setErrors({})
  }

  const editing = Boolean(initialCard)

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <h3 className="form__title">{editing ? 'Edit card' : 'Add a card'}</h3>

      <div className={`field${errors.deckId ? ' field--invalid' : ''}`}>
        <label htmlFor="card-deck">Deck</label>
        <select
          id="card-deck"
          value={deckId}
          onChange={(event) => setDeckId(event.target.value)}
          aria-invalid={Boolean(errors.deckId)}
          aria-describedby={errors.deckId ? 'card-deck-error' : undefined}
        >
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
        {errors.deckId && (
          <p id="card-deck-error" className="field__error" role="alert">
            {errors.deckId}
          </p>
        )}
      </div>

      <div className={`field${errors.question ? ' field--invalid' : ''}`}>
        <label htmlFor="card-question">Question</label>
        <textarea
          id="card-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          aria-invalid={Boolean(errors.question)}
          aria-describedby={errors.question ? 'card-question-error' : undefined}
          placeholder="e.g. What is a JavaScript closure?"
        />
        <p
          className={`field__hint${question.length > MAX_QUESTION ? ' is-over' : ''}`}
        >
          {question.length}/{MAX_QUESTION}
        </p>
        {errors.question && (
          <p id="card-question-error" className="field__error" role="alert">
            {errors.question}
          </p>
        )}
      </div>

      <div className={`field${errors.answer ? ' field--invalid' : ''}`}>
        <label htmlFor="card-answer">Answer</label>
        <textarea
          id="card-answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          aria-invalid={Boolean(errors.answer)}
          aria-describedby={errors.answer ? 'card-answer-error' : undefined}
          placeholder="e.g. A function that remembers the variables from where it was created."
        />
        <p className={`field__hint${answer.length > MAX_ANSWER ? ' is-over' : ''}`}>
          {answer.length}/{MAX_ANSWER}
        </p>
        {errors.answer && (
          <p id="card-answer-error" className="field__error" role="alert">
            {errors.answer}
          </p>
        )}
      </div>

      <div className="form__actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          {editing ? 'Save changes' : 'Add card'}
        </button>
      </div>
    </form>
  )
}
