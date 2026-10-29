import { useRef, useState } from 'react'
import {
  createDeckExport,
  MAX_IMPORT_FILE_SIZE,
  parseDeckFile,
} from '../utils/deckIO.js'

function safeFilename(name) {
  return (
    (name || 'deck')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'deck'
  )
}

export default function DeckIO({ deck, cards = [], onImport }) {
  const inputRef = useRef(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const handleExport = () => {
    const payload = createDeckExport(deck, cards)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `${safeFilename(deck?.name)}-flashcards.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)

    setError('')
    setStatus(`Exported “${deck?.name ?? 'deck'}” as JSON.`)
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setStatus('')

    if (file.size > MAX_IMPORT_FILE_SIZE) {
      setError('That file is too large. The maximum size is 2 MB.')
      return
    }

    try {
      const result = parseDeckFile(await file.text())
      if (!result.ok) {
        setError(result.error)
        return
      }

      onImport?.(result.data)
      setError('')
      setStatus(
        `Imported “${result.data.deckName}” with ${result.data.cards.length} card${
          result.data.cards.length === 1 ? '' : 's'
        }.`,
      )
    } catch {
      setError('Could not read that file. Please try again.')
    }
  }

  return (
    <div className="io" aria-labelledby="io-title">
      <div>
        <h3 id="io-title" className="io__title">
          Import / export
        </h3>
        <p className="io__hint">
          Download “{deck?.name ?? 'this deck'}” as JSON, or import a deck file.
        </p>
      </div>

      <div className="io__actions">
        <button type="button" className="btn btn--sm" onClick={handleExport}>
          Export deck
        </button>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => inputRef.current?.click()}
        >
          Import deck
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleFile}
        />
      </div>

      {error && (
        <p className="io__error" role="alert">
          {error}
        </p>
      )}
      {status && (
        <p className="io__status" role="status">
          {status}
        </p>
      )}
    </div>
  )
}
