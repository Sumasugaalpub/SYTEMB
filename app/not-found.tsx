import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid h-[calc(100vh/0.9)] place-items-center bg-[#f4f5f7] dark:bg-[#0a0b0d]">
      <div className="text-center">
        <div className="text-[64px] font-extrabold text-[var(--inv-brand-ink)]">404</div>
        <p className="text-[14px] text-[var(--inv-muted)]">Page not found · Bogga lama helin</p>
        <Link href="/executive" className="mt-4 inline-block rounded-[10px] bg-[var(--inv-brand)] px-4 py-2 text-[13px] font-semibold text-[var(--inv-brand-on)]">Back to dashboard</Link>
      </div>
    </div>
  );
}
