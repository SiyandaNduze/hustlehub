import { formatMoney, formatPercent } from '../../utils/format';

// segments: [{ label, value, tone }]  tone = CSS class suffix (e.g. 'net', 'tax')
export default function DonutChart({ segments, title, centerLabel, centerValue }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;

  return (
    <div className="donut">
      <svg className="chart-donut" viewBox="0 0 200 200" role="img" aria-label={title}>
        <title>{title}</title>
        <circle className="donut-track" cx="100" cy="100" r={r} />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * c;
            const circle = (
              <circle
                key={s.label}
                className={`donut-seg donut-${s.tone}`}
                cx="100"
                cy="100"
                r={r}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 100 100)"
              />
            );
            offset += len;
            return circle;
          })}
        <text className="donut-center-value" x="100" y="102" textAnchor="middle">{centerValue}</text>
        <text className="donut-center-label" x="100" y="122" textAnchor="middle">{centerLabel}</text>
      </svg>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className={`dot dot-${s.tone}`} aria-hidden="true" />
            <span>{s.label}</span>
            <strong>{formatMoney(s.value)}</strong>
            <span className="muted small">{total > 0 ? formatPercent((s.value / total) * 100) : '0%'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
