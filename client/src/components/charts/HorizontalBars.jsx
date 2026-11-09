import { formatMoney } from '../../utils/format';

// Ranked bars built on <progress>: accessible, and styled through CSS classes only.
export default function HorizontalBars({ items, valueFormatter = formatMoney, label }) {
  const max = Math.max(0, ...items.map((i) => i.value));
  return (
    <ul className="hbars" aria-label={label}>
      {items.map((item) => (
        <li key={item.key || item.label}>
          <div className="hbar-head">
            <span>{item.label}</span>
            <strong>{valueFormatter(item.value)}</strong>
          </div>
          <progress className="meter" max={max || 1} value={item.value} aria-label={item.label} />
          {item.sub && <span className="muted small">{item.sub}</span>}
        </li>
      ))}
    </ul>
  );
}
