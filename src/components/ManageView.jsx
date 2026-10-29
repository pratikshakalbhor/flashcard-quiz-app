import CardForm from './CardForm.jsx'
import CardList from './CardList.jsx'
import DeckIO from './DeckIO.jsx'

export default function ManageView({
  deck,
  cards = [],
  decks = [],
  formOpen = false,
  editingCard = null,
  currentCardId = null,
  onNew,
  onCancel,
  onSubmit,
  onEdit,
  onDelete,
  onSelect,
  onImport,
}) {
  return (
    <section className="manage" aria-labelledby="manage-title">
      <div className="section-head">
        <div>
          <h2 id="manage-title" className="section-title">
            Manage cards
          </h2>
          <p className="section-meta">
            {deck?.name ?? 'Deck'} · {cards.length} card
            {cards.length === 1 ? '' : 's'}
          </p>
        </div>

        {!formOpen && (
          <button type="button" className="btn btn--primary" onClick={onNew}>
            + Add card
          </button>
        )}
      </div>

      {formOpen && (
        <CardForm
          key={editingCard?.id ?? 'new'}
          initialCard={editingCard}
          decks={decks}
          defaultDeckId={deck?.id}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )}

      <DeckIO deck={deck} cards={cards} onImport={onImport} />

      <CardList
        cards={cards}
        currentIndex={cards.findIndex((card) => card.id === currentCardId)}
        onEdit={onEdit}
        onDelete={onDelete}
        onSelect={onSelect}
      />
    </section>
  )
}
