export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left compass arm */}
      <line x1="20" y1="4" x2="2" y2="36" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Right compass arm */}
      <line x1="20" y1="4" x2="38" y2="36" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />

      {/* Horizontal crossbar (square instrument) */}
      <line x1="8" y1="26" x2="32" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* Upper eye — inside triangle */}
      <ellipse cx="20" cy="14" rx="4" ry="2.8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="14" r="1.4" fill="currentColor" />

      {/* Vertical pillar down from crossbar */}
      <line x1="20" y1="26" x2="20" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* Arrow tip at bottom */}
      <polyline points="15,40 20,46 25,40" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Small centre eye at crossbar */}
      <ellipse cx="20" cy="26" rx="2.8" ry="1.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="20" cy="26" r="0.9" fill="currentColor" />
    </svg>
  )
}
