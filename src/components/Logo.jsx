/**
 * Logo — "Rise Level" brand mark
 * A rounded-square badge containing a stylised rising‑arrow R glyph,
 * rendered entirely in SVG with a vivid violet→indigo gradient.
 * Accepts `size` (px) and optional `mono` prop for single-colour contexts.
 */
export default function Logo({ size = 36, mono = false }) {
  const id = `rl-grad-${size}`;
  const glow = `rl-glow-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Rise Level logo"
    >
      <defs>
        {/* Main badge gradient */}
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={mono ? '#6d28d9' : '#8b5cf6'} />
          <stop offset="100%" stopColor={mono ? '#4338ca' : '#4f46e5'} />
        </linearGradient>

        {/* Subtle inner-glow filter */}
        <filter id={glow} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Badge background — rounded square */}
      <rect x="2" y="2" width="44" height="44" rx="12" ry="12"
        fill={`url(#${id})`}
      />

      {/* Subtle top-left specular highlight */}
      <rect x="2" y="2" width="44" height="22" rx="12" ry="12"
        fill="white" fillOpacity="0.08"
      />

      {/* ── Rising bar chart (3 bars, ascending left→right) ── */}
      {/* Bar 1 — short */}
      <rect x="10" y="30" width="6" height="10" rx="2" fill="white" fillOpacity="0.55" />
      {/* Bar 2 — medium */}
      <rect x="20" y="23" width="6" height="17" rx="2" fill="white" fillOpacity="0.80" />
      {/* Bar 3 — tall (accent) */}
      <rect x="30" y="15" width="6" height="25" rx="2" fill="white" fillOpacity="1" />

      {/* ── Upward trend arrow above tallest bar ── */}
      <polyline
        points="10,28 21,20 31,12"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      {/* Arrow head */}
      <polyline
        points="26,10 31,12 29,17"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}
