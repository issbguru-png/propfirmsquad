/** Brand logomark: ascending candles in a rounded square. Header and footer share this. */
export function Logomark({ size = 30 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
      <rect x="1" y="1" width="30" height="30" rx="7" className="fill-accent" />
      <g stroke="var(--color-on-dark)" strokeWidth="3" strokeLinecap="round">
        <line x1="10" y1="21.5" x2="10" y2="16.5" />
        <line x1="16" y1="23.5" x2="16" y2="11.5" />
        <line x1="22" y1="18.5" x2="22" y2="8.5" />
      </g>
    </svg>
  )
}
