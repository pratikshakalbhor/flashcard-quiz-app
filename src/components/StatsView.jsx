export default function StatsView({ stats }) {
  const deckRows = stats?.decks ?? []

  return (
    <section className="stats" aria-labelledby="stats-title">
      <div className="section-head">
        <div>
          <h2 id="stats-title" className="section-title">
            Stats
          </h2>
          <p className="section-meta">Your progress at a glance.</p>
        </div>
      </div>

      <dl className="stats-grid">
        <div className="stat-card">
          <dt className="stat-card__label">Cards due today</dt>
          <dd className="stat-card__value">{stats?.dueToday ?? 0}</dd>
        </div>
        <div className="stat-card">
          <dt className="stat-card__label">Total reviewed</dt>
          <dd className="stat-card__value">{stats?.totalReviewed ?? 0}</dd>
        </div>
        <div className="stat-card">
          <dt className="stat-card__label">Accuracy</dt>
          <dd className="stat-card__value">{stats?.accuracy ?? 0}%</dd>
        </div>
        <div className="stat-card">
          <dt className="stat-card__label">Daily streak</dt>
          <dd className="stat-card__value">
            {stats?.streak ?? 0}
            <span className="stat-card__unit">
              {' '}
              day{stats?.streak === 1 ? '' : 's'}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mastery">
        <h3 className="stats__subtitle">Mastery by deck</h3>

        {deckRows.length === 0 ? (
          <p className="empty">Add a deck to see mastery progress.</p>
        ) : (
          <ul className="mastery-list">
            {deckRows.map((deck) => (
              <li key={deck.id} className="mastery__item">
                <div className="mastery__head">
                  <span className="mastery__name">{deck.name}</span>
                  <span className="mastery__percent">{deck.mastery}%</span>
                </div>

                <div
                  className="progress"
                  role="progressbar"
                  aria-label={`${deck.name} mastery`}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={deck.mastery}
                >
                  <span
                    className="progress__bar"
                    style={{ width: `${deck.mastery}%` }}
                  />
                </div>

                <p className="mastery__meta">
                  {deck.cardCount} card{deck.cardCount === 1 ? '' : 's'} ·{' '}
                  {deck.dueToday} due today
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
