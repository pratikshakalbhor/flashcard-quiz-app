import { useState } from 'react'
import { MAX_DECK_NAME } from '../utils/schema.js'

export default function DeckBar({
  decks = [],
  activeDeck = null,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}) {
  const [mode, setMode] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const reset = () => {
    setMode(null)
    setName('')
    setError('')
  }

  const openCreate = () => {
    setMode('create')
    setName('')
    setError('')
  }

  const openRename = () => {
    if (!activeDeck) return
    setMode('rename')
    setName(activeDeck.name)
    setError('')
  }

  const validate = (value, ignoreId = null) => {
    const trimmed = value.trim()

    if (!trimmed) return 'Deck name is required.'
    if (trimmed.length > MAX_DECK_NAME) {
      return `Deck name must be ${MAX_DECK_NAME} characters or fewer.`
    }
    if (
      decks.some(
        (deck) =>
          deck.id !== ignoreId &&
          deck.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      return 'A deck with that name already exists.'
    }

    return ''
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const ignoreId = mode === 'rename' ? activeDeck?.id : null
    const nextError = validate(name, ignoreId)
    if (nextError) {
      setError(nextError)
      return
    }

    if (mode === 'create') onCreate?.(name.trim())
    else if (mode === 'rename' && activeDeck) onRename?.(activeDeck.id, name.trim())

    reset()
  }

  const handleDelete = () => {
    if (activeDeck) onDelete?.(activeDeck.id)
    reset()
  }

  return (
    <div className="deck-bar" role="group" aria-label="Deck management">
      <div className="deck-bar__row">
        <div className="deck-bar__select">
          <label htmlFor="deck-select">Deck</label>
          <select
            id="deck-select"
            value={activeDeck?.id ?? ''}
            onChange={(event) => {
              reset()
              onSelect?.(event.target.value)
            }}
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </div>

        <div className="deck-bar__actions" role="group" aria-label="Deck actions">
          <button type="button" className="btn btn--sm" onClick={openCreate}>
            + New deck
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={openRename}
            disabled={!activeDeck}
          >
            Rename
          </button>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={() => {
              setMode('delete')
              setError('')
            }}
            disabled={!activeDeck || decks.length <= 1}
            title={
              decks.length <= 1
                ? 'You need at least one deck'
                : 'Delete the selected deck'
            }
          >
            Delete deck
          </button>
        </div>
      </div>

      {(mode === 'create' || mode === 'rename') && (
        <form className="deck-bar__form" onSubmit={handleSubmit} noValidate>
          <div className={`field${error ? ' field--invalid' : ''}`}>
            <label htmlFor="deck-name">
              {mode === 'create' ? 'New deck name' : 'Deck name'}
            </label>
            <input
              id="deck-name"
              type="text"
              value={name}
              maxLength={MAX_DECK_NAME}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'deck-name-error' : undefined}
              autoFocus
            />
            {error && (
              <p id="deck-name-error" className="field__error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="deck-bar__form-actions">
            <button type="button" className="btn btn--sm" onClick={reset}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary btn--sm">
              {mode === 'create' ? 'Create deck' : 'Save name'}
            </button>
          </div>
        </form>
      )}

      {mode === 'delete' && activeDeck && (
        <div className="deck-bar__confirm" role="alert">
          <p>
            Delete “{activeDeck.name}” and all of its cards? This cannot be
            undone.
          </p>
          <div className="deck-bar__form-actions">
            <button type="button" className="btn btn--sm" onClick={reset}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={handleDelete}
            >
              Delete deck
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
