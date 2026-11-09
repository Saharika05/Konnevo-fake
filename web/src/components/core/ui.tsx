"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ApiError, friendlyMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/* Small building blocks that copy the look of the Core Admin screenshots. */

export const coreInput =
  "h-10 w-full rounded-lg border border-core-line bg-core-card px-3 text-sm text-core-text placeholder:text-core-muted";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger" | "link";
  size?: "md" | "sm";
};

export const CoreButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 text-[13px] font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-10 rounded-lg px-4" : "h-8 rounded-lg px-3",
        variant === "primary" &&
          "bg-core-primary text-primary-foreground shadow-[0_0_28px_-8px] shadow-primary hover:bg-primary-hover hover:shadow-[0_0_36px_-6px]",
        variant === "outline" && "border border-core-line bg-core-card text-core-text hover:bg-core-bg",
        variant === "danger" &&
          "border border-danger/50 bg-core-card text-core-danger hover:bg-core-danger-soft",
        variant === "link" && "h-auto rounded-none bg-transparent p-0 text-primary-text hover:underline",
        className,
      )}
      {...props}
    />
  ),
);
CoreButton.displayName = "CoreButton";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-core-line bg-core-card/80 backdrop-blur", className)} {...props} />;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-core-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <Card className="px-4 py-4">
      <p className="font-display text-4xl leading-none font-extrabold">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
      <p className="mt-2 text-xs text-core-muted">{label}</p>
    </Card>
  );
}

const PILL: Record<string, string> = {
  open: "bg-core-danger-soft text-core-danger",
  reviewing: "bg-core-warn-soft text-core-warn",
  resolved: "bg-core-ok-soft text-core-ok",
  dismissed: "bg-dismissed text-deep-olive",
  duplicate: "bg-core-warn-soft text-core-warn",
  ok: "bg-core-primary-soft text-primary-text",
  none: "bg-core-primary-soft text-primary-text",
  active: "bg-core-ok-soft text-core-ok",
};

export function Pill({
  tone,
  children,
}: {
  tone: keyof typeof PILL | (string & {});
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold", PILL[tone] ?? PILL.ok)}
    >
      {children}
    </span>
  );
}

/** A horizontal bar with a label and a number. Width is relative to `max`. */
export function BarRow({ label, value, max }: { label: React.ReactNode; value: number; max: number }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-center gap-3 py-1.5 text-[13px] sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_3rem]">
      <span className="truncate">{label}</span>
      <span className="h-3.5 rounded-[4px] bg-core-bg" aria-hidden="true">
        <span
          className="block h-full rounded-[4px] bar-fill"
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="text-right text-xs font-bold tabular-nums">{value.toLocaleString("en-IN")}</span>
    </div>
  );
}

/* ---- Loading, empty and error states, shared by every list page ---- */

export function TableSkeleton({ rows = 6, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="space-y-3 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-5 animate-pulse rounded bg-core-bg" />
      ))}
    </div>
  );
}

export function EmptyBox({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-[15px] font-bold">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-[13px] text-core-muted">{children}</p>}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="px-6 py-10 text-center">
      <p className="text-[13px] text-core-danger">{friendlyMessage(error)}</p>
      <CoreButton variant="outline" className="mt-4" onClick={onRetry}>
        Retry
      </CoreButton>
    </div>
  );
}

/** One place that decides: skeleton, error with Retry, empty message, or the real content. */
export function QueryState({
  isPending,
  isError,
  error,
  refetch,
  isEmpty,
  emptyTitle,
  emptyText,
  rows,
  label,
  children,
}: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  isEmpty: boolean;
  emptyTitle: string;
  emptyText?: string;
  rows?: number;
  label?: string;
  children: React.ReactNode;
}) {
  if (isPending) return <TableSkeleton rows={rows} label={label} />;
  if (isError) return <ErrorBox error={error} onRetry={refetch} />;
  if (isEmpty) return <EmptyBox title={emptyTitle}>{emptyText}</EmptyBox>;
  return <>{children}</>;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  noun = "items",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  noun?: string;
}) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3 text-xs text-core-muted"
    >
      <p>
        Showing {from}–{to} of {total} {noun}
      </p>
      <div className="flex items-center gap-2">
        <CoreButton variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </CoreButton>
        <span aria-current="page">
          Page {page} of {pages}
        </span>
        <CoreButton variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </CoreButton>
      </div>
    </nav>
  );
}

/** A table wrapper that scrolls sideways on a phone instead of breaking the page. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">{children}</table>
    </div>
  );
}
export const th =
  "border-b border-core-line px-3 py-2.5 font-mono text-[11px] font-bold tracking-widest text-core-muted uppercase whitespace-nowrap";
export const td = "border-b border-core-line/70 px-3 py-3 align-middle";

export function formatDate(value: string, withTime = false) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return withTime
    ? d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ---- A light dialog. The shared dark Dialog is not used here, so the core look stays in one place. ---- */
export function CoreDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] overlay-dark" />
        <DialogPrimitive.Content className="core-root fixed top-1/2 left-1/2 z-[71] max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-core-line bg-core-card p-5 shadow-xl">
          <DialogPrimitive.Title className="pr-6 text-lg font-bold">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 text-[13px] text-core-muted">
              {description}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
          <div className="mt-4">{children}</div>
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-4 right-4 rounded p-1 text-core-muted hover:bg-core-bg"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function apiCode(error: unknown): string {
  return error instanceof ApiError ? error.code : "";
}

export function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-core-muted">
      {children}
    </label>
  );
}
