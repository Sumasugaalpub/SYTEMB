/** Never optional — rendered under every map. */
export function BoundaryDisclaimer() {
  return (
    <p className="mt-2.5 flex items-start gap-1.5 text-[10.5px] leading-[1.45] text-[var(--inv-muted)]">
      <iconify-icon icon="solar:info-circle-linear" className="mt-px shrink-0 text-[12px]" />
      The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the Federal Government of Somalia or its partners. Administrative boundaries are indicative only.
    </p>
  );
}
