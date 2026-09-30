# Data model

Every collection lives in `localStorage` under a `spm_` key and is reached only
through `lib/db.ts`. Views never touch storage directly. Replacing
`db.get / set / add / update / remove` with `fetch()` turns this prototype into a
real client without changing a single view.

## Collections

| Entity | Key | Seeded from | Written by |
|---|---|---|---|
| Submissions | `spm_submissions` | `data/submissions.ts` | District app, state review |
| Alerts | `spm_alerts` | `data/alerts.ts` | Early warning console |
| Incidents | `spm_incidents` | `data/alerts.ts` | Conflict navigator |
| Evidence | `spm_evidence` | `data/evidence.ts` | Evidence library, district app |
| Projects | `spm_projects` | `data/projects.ts` | Interventions |
| Users | `spm_users` | `data/users.ts` | Users & roles |
| Notifications | `spm_notifications` | `data/notifications.ts` | System events |
| Activity (audit) | `spm_activity` | 5 seeded entries | Every staff action |
| Drafts | `spm_drafts` | empty | Multi-step forms |

## Counters and settings

| Key | Holds |
|---|---|
| `spm_seq_LOG`, `spm_seq_SUB`, `spm_seq_EW`, `spm_seq_EV`, `spm_seq_PRJ`, `spm_seq_USR` | Persisted ID sequences |
| `spm_seed_version` | Seed version, so a future migration can detect old data |
| `spm-store` | Zustand: role, region, period, band mode, language, sidebar, sharing switches |
| `spm_bridge_<entity>` | Cross-tab signal — written on every mutation, read by the `storage` event |

## Submission

```
id            SUB-SW-015
district      Berdale
region        bay
focalPoint    Bashiir Muuse
status        missing | draft | pending | returned | approved
submittedAt   ISO date or null
period        2026-Q1
disputes      number
resolved      number
tension       1–5
evidence      count
note          reason, when returned
events        [{ to, at, by, reason? }]   ← the timeline
```

## Relationships

```
District return (submissions)
        ↓ approved by the state
State sharing flags (spm-store.sharing)
        ↓ decide what federal users may render
National dashboard · map · alerts · brief
        ↓ every action
Audit log (activity)
```

## State machine

```
missing → draft → pending → approved
                     ↓
                  returned → pending
```

`returned` cannot be saved without a written reason. `approved` is terminal —
an approved return can no longer be edited.

## Ceilings

- One browser, one device. `localStorage` is per-origin; a second laptop sees nothing.
- About 5 MB. Data-URI photos consume it quickly.
- Clearing browsing data deletes everything. There is no backup.
- Every rule lives in JavaScript the user could edit. A prototype can demonstrate
  a rule; it cannot impose one.
