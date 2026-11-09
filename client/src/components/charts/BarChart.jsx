import { formatCompact, formatMoney } from '../../utils/format';

// Rounds a maximum up to a "nice" axis value (1, 2, 5 x 10^n)
function niceCeil(n) {
  if (n <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(n));
  const f = n / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

// Hand-drawn SVG chart: no chart library, no inline styles (works under the strict CSP).
export default function BarChart({ data, title }) {
  const width = 620;
  const height = 280;
  const pad = { left: 58, right: 12, top: 14, bottom: 34 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = niceCeil(Math.max(0, ...data.map((d) => d.value)));
  const slot = innerW / Math.max(data.length, 1);
  const barW = slot * 0.62;
  const y = (v) => pad.top + innerH - (v / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);

  return (
    <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
      <title>{title}</title>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid-line" x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} />
          <text className="axis-label" x={pad.left - 8} y={y(t) + 4} textAnchor="end">
            {formatCompact(t)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const x = pad.left + i * slot + (slot - barW) / 2;
        return (
          <g key={d.label + i}>
            <rect
              className={d.value > 0 ? 'bar' : 'bar bar-empty'}
              x={x}
              y={y(d.value)}
              width={barW}
              height={Math.max(h, d.value > 0 ? 2 : 0)}
              rx="3"
            >
              <title>{`${d.label}: ${formatMoney(d.value)}`}</title>
            </rect>
            <text className="axis-label" x={x + barW / 2} y={height - 12} textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
