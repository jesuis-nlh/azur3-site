/** The archive's mark: three orbits (three school years) around one star. */
export default function StarMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <ellipse cx="16" cy="16" rx="14.5" ry="5.2" stroke="currentColor" strokeOpacity=".35" transform="rotate(-24 16 16)" />
      <ellipse cx="16" cy="16" rx="10.5" ry="3.8" stroke="currentColor" strokeOpacity=".55" transform="rotate(-24 16 16)" />
      <ellipse cx="16" cy="16" rx="6.5" ry="2.4" stroke="currentColor" strokeOpacity=".8" transform="rotate(-24 16 16)" />
      <path d="M16 11.5l1.1 3.4 3.4 1.1-3.4 1.1L16 20.5l-1.1-3.4-3.4-1.1 3.4-1.1z" fill="currentColor" />
      <circle cx="29.2" cy="10.4" r="1.1" fill="#63D9FF" />
    </svg>
  );
}
