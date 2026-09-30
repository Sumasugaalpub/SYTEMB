"use client";

import * as React from "react";

import { downloadCSV } from "@/lib/download";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SkeletonRows } from "@/components/system/Skeleton";
import { EmptyState } from "./ui";

export type Column<T> = {
  key: string;
  header: string;
  /** Value used for sorting, searching and CSV export. */
  value: (row: T) => string | number;
  /** Optional custom cell. Falls back to `value`. */
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "right";
  width?: string;
};

export type Filter = { id: string; label: string; count?: number };

/**
 * One table engine for the whole system: search, sort, filter chips,
 * pagination, sticky header, empty state, skeleton and CSV export.
 */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  filters,
  activeFilter,
  onFilter,
  matchFilter,
  onRowClick,
  searchPlaceholder = "Search…",
  pageSize = 10,
  exportName,
  loading,
  empty = "Nothing here yet",
}: {
  rows: T[];
  columns: Column<T>[];
  filters?: Filter[];
  activeFilter?: string;
  onFilter?: (id: string) => void;
  matchFilter?: (row: T, filter: string) => boolean;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  pageSize?: number;
  exportName?: string;
  loading?: boolean;
  empty?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = React.useState(1);

  // Derive rather than synchronise: a changed query or filter resets the page
  // during render, which avoids a cascading effect.
  const signature = `${query}|${activeFilter}|${rows.length}`;
  const lastSignature = React.useRef(signature);
  if (lastSignature.current !== signature) {
    lastSignature.current = signature;
    if (page !== 1) setPage(1);
  }

  const filtered = React.useMemo(() => {
    let out = rows;
    if (activeFilter && activeFilter !== "all" && matchFilter) out = out.filter((r) => matchFilter(r, activeFilter));
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((r) => columns.some((c) => String(c.value(r)).toLowerCase().includes(q)));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col)
        out = [...out].sort((a, b) => {
          const av = col.value(a);
          const bv = col.value(b);
          if (typeof av === "number" && typeof bv === "number") return (av - bv) * sort.dir;
          return String(av).localeCompare(String(bv)) * sort.dir;
        });
    }
    return out;
  }, [rows, columns, query, sort, activeFilter, matchFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: string) {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }

  function exportCsv() {
    downloadCSV(
      filtered.map((r) => Object.fromEntries(columns.map((c) => [c.header, c.value(r)]))),
      `${exportName ?? "export"}.csv`,
    );
  }

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 px-5 pb-3 pt-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 w-full max-w-64 rounded-[var(--pms-radius-control)] border-[color:var(--pms-search-border)] bg-[var(--pms-search-bg)] px-3.5 text-[13px]"
        />
        {filters?.length ? (
          <div className="flex flex-wrap items-center gap-1">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilter?.(f.id)}
                className={cn(
                  "h-9 rounded-[var(--pms-radius-control)] px-3 text-[13px] font-medium transition-colors",
                  activeFilter === f.id
                    ? "bg-[var(--pms-segmented-thumb)] text-[var(--pms-text-strong)] shadow-sm"
                    : "text-[var(--pms-muted-text)] hover:text-[var(--pms-text-strong)]",
                )}
              >
                {f.label}
                {f.count !== undefined ? <span className="ml-1 tabular-nums opacity-60">{f.count}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
        <span className="ml-auto flex items-center gap-2">
          <span className="text-xs tabular-nums text-[var(--pms-muted-text)]">{filtered.length} rows</span>
          {exportName ? (
            <Button variant="outline" size="sm" onClick={exportCsv} className="h-9 rounded-[var(--pms-radius-control)]">
              Export CSV
            </Button>
          ) : null}
        </span>
      </div>

      {loading ? (
        <div className="px-5 pb-5">
          <SkeletonRows rows={6} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title={empty} hint={query ? "Try a different search or filter." : undefined} />
      ) : (
        <>
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead className="sticky top-0 z-10 bg-[var(--pms-surface)]">
                <tr className="border-y border-[color:var(--pms-divide)]">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      style={{ width: c.width }}
                      className={cn(
                        "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pms-muted-text)]",
                        c.align === "right" && "text-right",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1 hover:text-[var(--pms-text-strong)]"
                      >
                        {c.header}
                        {sort?.key === c.key ? (
                          <iconify-icon
                            icon={sort.dir === 1 ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
                            className="text-[13px]"
                          />
                        ) : null}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "border-b border-[color:var(--pms-divide)] transition-colors last:border-b-0",
                      onRowClick && "cursor-pointer hover:bg-[var(--pms-row-hover)]",
                    )}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-4 py-3 align-middle text-[var(--pms-text)]",
                          c.align === "right" && "text-right tabular-nums",
                        )}
                      >
                        {c.cell ? c.cell(row) : c.value(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 ? (
            <div className="flex items-center justify-between gap-2 border-t border-[color:var(--pms-divide)] px-5 py-3">
              <span className="text-xs text-[var(--pms-muted-text)]">
                Page {page} of {pages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 rounded-[var(--pms-radius-control)]"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 rounded-[var(--pms-radius-control)]"
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
