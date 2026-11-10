export default function Logo({ className = "h-9 w-9", decorative = false }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "VENDORA"}
    >
      <defs>
        <linearGradient id="cubeTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="cubeLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="cubeRight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      {/* Top Face */}
      <path d="M16 3 L29 9.5 L16 16 L3 9.5 Z" fill="url(#cubeTop)" />
      {/* Left Face */}
      <path d="M3 9.5 L16 16 L16 29 L3 22.5 Z" fill="url(#cubeLeft)" />
      {/* Right Face */}
      <path d="M29 9.5 L16 16 L16 29 L29 22.5 Z" fill="url(#cubeRight)" />
      {/* Inner subtle glow line */}
      <path
        d="M9 12.5 L16 16 L23 12.5"
        fill="none"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
