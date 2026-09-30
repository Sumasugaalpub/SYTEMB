"use client";

/**
 * The ONLY place localStorage is touched.
 *
 * Views and components must never read or write storage directly — everything
 * goes through `db.get / set / add / update / remove`. Swapping these four
 * functions for `fetch()` turns this prototype into a real client without
 * rewriting a single view.
 */

export const PREFIX = "spm";

export type Row = { id: string } & Record<string, unknown>;

type Listener = (entity: string) => void;
const listeners = new Set<Listener>();

const key = (entity: string) => `${PREFIX}_${entity}`;
const isBrowser = () => typeof window !== "undefined";

function notify(entity: string) {
  listeners.forEach((fn) => fn(entity));
}

export const db = {
  /** Read a collection. Returns the fallback (cloned) when nothing is stored yet. */
  get<T = Row>(entity: string, fallback: T[] = []): T[] {
    if (!isBrowser()) return structuredClone(fallback);
    try {
      const raw = localStorage.getItem(key(entity));
      return raw ? (JSON.parse(raw) as T[]) : structuredClone(fallback);
    } catch {
      return structuredClone(fallback);
    }
  },

  /** Read a single stored value (not a collection) — settings, counters, drafts. */
  getOne<T>(entity: string, fallback: T): T {
    if (!isBrowser()) return fallback;
    try {
      const raw = localStorage.getItem(key(entity));
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T = Row>(entity: string, rows: T[]): T[] {
    if (!isBrowser()) return rows;
    try {
      localStorage.setItem(key(entity), JSON.stringify(rows));
      bridge.push(entity);
      notify(entity);
    } catch {
      /* quota — caller surfaces the toast */
    }
    return rows;
  },

  setOne<T>(entity: string, value: T): T {
    if (!isBrowser()) return value;
    try {
      localStorage.setItem(key(entity), JSON.stringify(value));
      bridge.push(entity);
      notify(entity);
    } catch {
      /* quota */
    }
    return value;
  },

  add<T extends Row>(entity: string, row: T): T {
    const rows = db.get<T>(entity);
    rows.unshift(row);
    db.set(entity, rows);
    return row;
  },

  update<T extends Row>(entity: string, id: string, patch: Partial<T>): T | null {
    const rows = db.get<T>(entity);
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) return null;
    rows[i] = { ...rows[i], ...patch };
    db.set(entity, rows);
    return rows[i];
  },

  remove(entity: string, id: string): void {
    db.set(
      entity,
      db.get(entity).filter((r) => r.id !== id),
    );
  },

  /** Write seed rows only when the entity has never been stored. */
  seed<T = Row>(entity: string, rows: T[]): void {
    if (!isBrowser()) return;
    if (localStorage.getItem(key(entity)) === null) db.set(entity, rows);
  },

  has(entity: string): boolean {
    if (!isBrowser()) return false;
    return localStorage.getItem(key(entity)) !== null;
  },

  /** Clear every namespaced key. The caller reseeds and reloads. */
  resetAll(): void {
    if (!isBrowser()) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${PREFIX}_`))
      .forEach((k) => localStorage.removeItem(k));
  },

  /** Subscribe to writes made in THIS tab. Returns an unsubscribe function. */
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

/**
 * Cross-portal bridge. All three portals share one origin, so they share
 * localStorage. A write in the district portal must be visible in the state
 * and executive portals — including in another open tab, via `storage` events.
 */
export const bridge = {
  push(entity: string) {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(`${PREFIX}_bridge_${entity}`, String(Date.now()));
    } catch {
      /* quota */
    }
  },

  /** Fires when ANOTHER tab writes to the given entity. */
  listen(cb: (entity: string) => void): () => void {
    if (!isBrowser()) return () => {};
    const handler = (ev: StorageEvent) => {
      if (!ev.key?.startsWith(`${PREFIX}_bridge_`)) return;
      cb(ev.key.replace(`${PREFIX}_bridge_`, ""));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
