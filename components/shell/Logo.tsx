/** Museum mark — five-point star over a column, in the brand tint. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 2.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L12 10.7l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" />
      <path d="M4 21.5h16M5.5 21.5v-6M9.8 21.5v-6M14.2 21.5v-6M18.5 21.5v-6M3.5 15.5h17" />
    </svg>
  );
}
