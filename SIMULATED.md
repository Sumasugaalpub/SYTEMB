# What is simulated

Everything on this list is a demonstration, not a working service. Each one
wears a `DEMO` badge in the interface.

| Feature | What is simulated | Where | What would replace it |
|---|---|---|---|
| Sign-in | No password is checked. The demo sign-in screen asks which role to use. | `lib/store.ts` → `role` | Identity provider with real sessions |
| Storage | `localStorage` stands in for a database. One browser only. | `lib/db.ts` | API + PostgreSQL |
| Network latency | 700–2000 ms of artificial delay on every write. | `lib/async.ts` → `wait()` | Real request time |
| Offline queue | The field app's outbox is a local array, not a sync engine. | District portal | Background sync + conflict resolution |
| Notifications | Stored rows, not push or SMS. | `data/notifications.ts` | Push service / SMS gateway |
| QR verification | Codes are looked up in local data. Nothing is cryptographically verified. | Evidence | Issuer key held server-side |
| PDF generation | A hand-written one-page PDF writer. | `lib/download.ts` → `makePDF()` | Server-side document service |
| Audit log | Recorded in the same browser it describes, so it is editable. | `lib/audit.ts` | Append-only server log |
| IP addresses | Chosen from a fixed list for realism. | `lib/audit.ts` | Real request metadata |
| Map boundaries | Demo geometry. Disputed boundaries carry the standard disclaimer. | Map components | Authoritative government GIS |

## Never faked

- No login accepts any password. The demo sign-in says what it is.
- No verification screen returns "valid" without a lookup.
- No figure is shown without its coverage, source and period.
