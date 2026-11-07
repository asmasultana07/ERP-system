export default function Logo({ className = "h-9 w-9", decorative = false }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "VENDORA"}
    >
      <path d="M16 3 L29 10 L16 17 L3 10 Z" fill="#10B981" />
      <path d="M3 10 L16 17 L16 29 L3 22 Z" fill="#022C22" />
      <path d="M29 10 L16 17 L16 29 L29 22 Z" fill="#064E3B" />
      <path
        d="M9 15.5 L16 20.5 L23 15.5"
        fill="none"
        stroke="#F0FDF4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
