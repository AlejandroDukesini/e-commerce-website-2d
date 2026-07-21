/**
 * Elegant side-profile luxury coupé silhouette (SVG, crisp at any scale).
 * `variant="line"` → thin champagne outline (used as the faint scroll motif).
 * `variant="solid"` → filled graphite body (used parked in the finale).
 */
export function LuxuryCar({ variant = 'line', className = '', title = 'Automóvil de lujo' }) {
  const line = variant === 'line';
  return (
    <svg
      className={className}
      viewBox="0 0 900 300"
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lux-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2b30" />
          <stop offset="1" stopColor="#141317" />
        </linearGradient>
        <linearGradient id="lux-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4650" />
          <stop offset="1" stopColor="#20262c" />
        </linearGradient>
      </defs>

      {/* ground reflection */}
      <ellipse cx="450" cy="252" rx="360" ry="14" fill="#000" opacity={line ? 0.06 : 0.18} />

      {/* body — long, low, coupé roofline */}
      <path
        d="M70 214
           C 90 170, 150 168, 210 165
           L 300 120
           C 340 96, 400 88, 470 90
           L 590 96
           C 660 100, 705 128, 742 158
           L 812 176
           C 852 186, 860 196, 858 214
           C 856 224, 846 226, 836 226
           L 92 226
           C 78 226, 66 224, 70 214 Z"
        fill={line ? 'none' : 'url(#lux-body)'}
        stroke={line ? 'currentColor' : 'none'}
        strokeWidth={line ? 2 : 0}
      />
      {/* greenhouse / glass */}
      <path
        d="M312 122 L455 96 C 520 94, 585 100, 628 128 L 470 132 Z"
        fill={line ? 'none' : 'url(#lux-glass)'}
        stroke={line ? 'currentColor' : 'none'}
        strokeWidth={line ? 1.5 : 0}
        opacity={line ? 0.7 : 1}
      />
      <path
        d="M300 126 L300 150 L 452 150 L 468 130 Z"
        fill={line ? 'none' : 'url(#lux-glass)'}
        stroke={line ? 'currentColor' : 'none'}
        strokeWidth={line ? 1.5 : 0}
        opacity={line ? 0.7 : 1}
      />

      {/* beltline accent (champagne) */}
      <path d="M120 196 L820 196" stroke="var(--accent)" strokeWidth={line ? 1.5 : 2.5} opacity={line ? 0.5 : 0.9} />

      {/* wheels */}
      {[268, 690].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="226" r="46" fill={line ? 'none' : '#0c0c0e'} stroke="currentColor" strokeWidth={line ? 2 : 0} />
          <circle cx={cx} cy="226" r="26" fill="none" stroke="var(--accent)" strokeWidth="2" opacity={line ? 0.5 : 0.85} />
          <circle cx={cx} cy="226" r="7" fill="var(--accent)" opacity={line ? 0.6 : 1} />
        </g>
      ))}

      {/* headlight hint */}
      <path d="M842 190 L858 194" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
