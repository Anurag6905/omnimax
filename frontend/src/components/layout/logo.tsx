/** Wordmark: a rising line that crosses a marker, echoing the life line on client profiles. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <rect width="26" height="26" rx="7" fill="#0f6b5c" />
        <path d="M5 18.5h5.5l3-6 3 3.5L21 7.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="21" cy="7.5" r="1.8" fill="#cfe6df" />
      </svg>
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Omnimax</span>
    </span>
  );
}
