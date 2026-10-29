import { BOX_LABELS } from '../utils/leitner.js'

export default function BoxCounts({ counts = {} }) {
  return (
    <ul className="box-counts" aria-label="Cards in each Leitner box">
      {BOX_LABELS.map((label, index) => {
        const box = index + 1
        return (
          <li key={box} className="box-counts__item">
            <span className="box-counts__label">{label}</span>
            <strong className="box-counts__value">{counts[box] ?? 0}</strong>
          </li>
        )
      })}
    </ul>
  )
}
