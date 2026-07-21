/**
 * Procedural SVG car silhouette used as a tasteful placeholder while
 * `resources/` has no real photography. Driven purely by a hue so every
 * vehicle looks distinct. Swap for <img> once real assets are dropped in.
 */
export function CarSilhouette({ hue = 210, title = 'Vehículo' }) {
  const body = `hsl(${hue} 55% 46%)`;
  const bodyDark = `hsl(${hue} 58% 36%)`;
  const glass = `hsl(${hue} 40% 82%)`;
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`g-${hue}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={body} />
          <stop offset="1" stopColor={bodyDark} />
        </linearGradient>
      </defs>
      {/* road hint */}
      <ellipse cx="160" cy="168" rx="120" ry="12" fill="rgba(0,0,0,0.10)" />
      {/* body */}
      <path
        d="M40 132 Q44 104 74 100 L108 78 Q120 70 140 70 L196 70 Q214 70 228 82 L262 100 Q290 104 292 126 L292 138 Q292 146 282 146 L48 146 Q38 146 38 138 Z"
        fill={`url(#g-${hue})`}
      />
      {/* cabin glass */}
      <path d="M120 76 L188 76 Q204 76 214 88 L226 100 L120 100 Z" fill={glass} opacity="0.9" />
      <path d="M114 100 L114 80 Q114 76 108 80 L88 96 Q84 100 92 100 Z" fill={glass} opacity="0.9" />
      {/* wheels */}
      <circle cx="98" cy="146" r="22" fill="#1b1e24" />
      <circle cx="98" cy="146" r="9" fill="#5b626c" />
      <circle cx="232" cy="146" r="22" fill="#1b1e24" />
      <circle cx="232" cy="146" r="9" fill="#5b626c" />
      {/* highlight */}
      <path d="M60 128 Q160 116 276 128" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" />
    </svg>
  );
}
