export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--primary)" />
      <path
        d="M11 12h9.5a6 6 0 0 1 0 12H15v6h-4V12zm4 4v4h5a2 2 0 0 0 0-4h-5z"
        fill="#fff"
      />
      <circle cx="28" cy="14" r="3" fill="#FF6600" />
    </svg>
  );
}
