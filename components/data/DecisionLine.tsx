/** The "so what" line under a chart or card: what a decision-maker should do. */
export function DecisionLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-[10px] bg-[var(--inv-brand-soft)] px-3 py-2.5 text-[12.5px] leading-[1.45] font-medium text-[var(--inv-brand-ink)] dark:bg-[rgba(146,194,240,.12)]">
      <iconify-icon icon="solar:lightbulb-bolt-linear" className="mt-px shrink-0 text-[16px]" />
      <span><b>Decision:</b> {children}</span>
    </div>
  );
}
