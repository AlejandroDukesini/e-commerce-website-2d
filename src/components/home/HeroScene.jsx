/**
 * Static SVG "open road at dawn" scene for the hero.
 * Deliberately SVG (not canvas) so it paints instantly — great for LCP.
 */
export function HeroScene() {
  return (
    <svg className="hero-scene" viewBox="0 0 640 512" role="img"
      aria-label="Un auto en una carretera abierta al amanecer" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a4368" />
          <stop offset="0.6" stopColor="#2c5f86" />
          <stop offset="1" stopColor="#e9a06a" />
        </linearGradient>
        <linearGradient id="hcar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f5f8" />
          <stop offset="1" stopColor="#c7d3dd" />
        </linearGradient>
      </defs>
      <rect width="640" height="512" fill="url(#hsky)" />
      {/* sun */}
      <circle cx="470" cy="210" r="58" fill="#ffd9a0" opacity="0.9" />
      <circle cx="470" cy="210" r="88" fill="#ffd9a0" opacity="0.18" />
      {/* hills */}
      <path d="M0 300 Q160 250 320 300 T640 292 V512 H0 Z" fill="#274b45" opacity="0.85" />
      <path d="M0 340 Q200 300 400 340 T640 336 V512 H0 Z" fill="#1d3a36" />
      {/* road */}
      <path d="M250 512 L300 340 L340 340 L440 512 Z" fill="#33383f" />
      <path d="M312 512 L318 360 L322 360 L340 512 Z" fill="#e9e6dd" opacity="0.85" />
      {/* car */}
      <g transform="translate(250 372)">
        <ellipse cx="70" cy="66" rx="66" ry="10" fill="rgba(0,0,0,0.28)" />
        <path d="M6 52 Q10 26 34 22 L58 6 Q68 0 84 0 L112 0 Q126 2 136 14 L150 30 Q168 34 168 50 L168 58 Q168 64 160 64 L14 64 Q6 64 6 56 Z" fill="url(#hcar)" />
        <path d="M62 8 L108 8 Q118 8 126 18 L134 30 L62 30 Z" fill="#9fc0d8" opacity="0.9" />
        <path d="M56 30 L56 10 Q56 6 50 10 L34 24 Q30 30 38 30 Z" fill="#9fc0d8" opacity="0.9" />
        <circle cx="46" cy="64" r="17" fill="#15181d" />
        <circle cx="46" cy="64" r="6" fill="#7a828c" />
        <circle cx="132" cy="64" r="17" fill="#15181d" />
        <circle cx="132" cy="64" r="6" fill="#7a828c" />
        <circle cx="166" cy="46" r="4" fill="#fff3c4" />
      </g>
    </svg>
  );
}
