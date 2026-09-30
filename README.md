# Somalia Peace Museum — Raad-Raac mockup

National peace & reconciliation monitoring mockup. Design system (double sidebar, Inter / Plus Jakarta Sans / IBM Plex Mono, brand green `#1f9266`, hatch-header cards, Solar icons) is taken from `../Inventory-System`.

```bash
npm install
npm run dev      # http://localhost:3000 → /executive
```

## Portals
- **Executive** (`app/(executive)`) — 20 pages, icon rail + contextual panel
- **State** (`app/(state)/state`) — 7 pages, South West
- **District** (`app/(district)/district`) — phone app, 9 screens + event report

## Rules
- All dates come from `data/timeline.ts`.
- Every number renders with `ProvenanceLine`.
- Coverage denominators come from `lib/coverage.ts#getDenominator` — never type "of 90".
- State sharing switches live in `lib/store.ts` and drive `SomaliaMap`.
- People counts below 5 are suppressed (`lib/suppression.ts`).

No backend, no auth — demo data only. Switch roles from the account menu.
