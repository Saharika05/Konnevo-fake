"use client";

import * as React from "react";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { toast } from "sonner";
import { friendlyMessage } from "@/lib/api/client";
import { useCoreReport, useCoreReports, useUpdateReport } from "@/lib/core/hooks";
import { REPORT_STATUSES, REPORT_TYPES, type ReportRow, type ReportStatus } from "@/lib/core/schemas";
import { statusLabel } from "@/lib/core/logic";
import {
  Card,
  CoreButton,
  CoreDialog,
  coreInput,
  formatDate,
  Label,
  PageHeader,
  Pagination,
  Pill,
  QueryState,
  TableSkeleton,
  TableWrap,
  td,
  th,
} from "@/components/core/ui";

const PARSERS = {
  type: parseAsStringLiteral(REPORT_TYPES),
  status: parseAsStringLiteral(REPORT_STATUSES),
  page: parseAsInteger.withDefault(1),
  report: parseAsString,
};

const who = (name: string | null) => name ?? "Deleted user";

export function ReportsView() {
  const [params, setParams] = useQueryStates(PARSERS, { clearOnDefault: true });
  const filters = { type: params.type ?? undefined, status: params.status ?? undefined, page: params.page };
  const query = useCoreReports(filters);
  const filtered = !!(params.type || params.status);

  return (
    <>
      <PageHeader title="Reports" subtitle="Reports from students about events, users and projects" />

      <Card className="mb-4 p-4">
        <form
          className="grid gap-3 sm:grid-cols-3"
          aria-label="Filter reports"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <Label htmlFor="rp-type">Type</Label>
            <select
              id="rp-type"
              className={coreInput}
              value={params.type ?? ""}
              onChange={(e) => setParams({ type: (e.target.value || null) as never, page: 1 })}
            >
              <option value="">All</option>
              {REPORT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {statusLabel(type)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="rp-status">Status</Label>
            <select
              id="rp-status"
              className={coreInput}
              value={params.status ?? ""}
              onChange={(e) => setParams({ status: (e.target.value || null) as never, page: 1 })}
            >
              <option value="">All</option>
              {REPORT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          {filtered && (
            <div className="flex items-end">
              <CoreButton variant="link" onClick={() => setParams({ type: null, status: null, page: 1 })}>
                Clear filters
              </CoreButton>
            </div>
          )}
        </form>
      </Card>

      <Card className="p-2">
        <QueryState
          {...query}
          refetch={() => query.refetch()}
          isEmpty={query.data?.items.length === 0}
          emptyTitle={filtered ? "No reports match these filters" : "No reports yet"}
          emptyText={
            filtered ? "Try removing a filter." : "When students report something, it shows up here."
          }
          label="Loading reports"
        >
          {query.data && (
            <TableWrap>
              <thead>
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Type</th>
                  <th className={th}>Target</th>
                  <th className={th}>Reason</th>
                  <th className={th}>Status</th>
                  <th className={th}>Reporter</th>
                  <th className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((report: ReportRow) => (
                  <tr key={report.id} className="hover:bg-core-bg">
                    <td className={td + " whitespace-nowrap"}>{formatDate(report.createdAt)}</td>
                    <td className={td + " capitalize"}>{report.type}</td>
                    <td className={td}>{who(report.target)}</td>
                    <td className={td}>{report.reason}</td>
                    <td className={td}>
                      <Pill tone={report.status}>{statusLabel(report.status)}</Pill>
                    </td>
                    <td className={td}>{who(report.reporter)}</td>
                    <td className={td + " text-right"}>
                      <CoreButton
                        variant="link"
                        aria-label={`Open report: ${report.reason}`}
                        onClick={() => setParams({ report: report.id })}
                      >
                        Open &gt;
                      </CoreButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </QueryState>
      </Card>

      {query.data && (
        <Pagination
          page={query.data.page}
          pageSize={query.data.pageSize}
          total={query.data.total}
          onPage={(page) => setParams({ page })}
          noun="reports"
        />
      )}
      <p className="mt-3 text-xs text-core-muted">
        You can change a report's status and add a note. Suspending users is not part of this version.
      </p>

      <ReportDialog id={params.report} onClose={() => setParams({ report: null })} />
    </>
  );
}

function ReportDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  return (
    <CoreDialog open={!!id} onOpenChange={(open) => !open && onClose()} title="Report details">
      {id && <ReportBody key={id} id={id} />}
    </CoreDialog>
  );
}

function ReportBody({ id }: { id: string }) {
  const query = useCoreReport(id);
  const update = useUpdateReport();
  const [note, setNote] = React.useState("");
  const [status, setStatus] = React.useState<ReportStatus | "">("");
  const report = query.data;
  const chosen = status || report?.status || "open";

  async function save() {
    if (!report) return;
    if (note.length > 500) return;
    try {
      await update.mutateAsync({ id, input: { status: chosen, note: note.trim() || undefined } });
      toast.success(`Report marked ${chosen}`);
      setNote("");
      setStatus("");
    } catch (error) {
      toast.error(friendlyMessage(error));
    }
  }

  if (query.isPending) return <TableSkeleton rows={4} label="Loading report" />;
  if (query.isError || !report)
    return (
      <div role="alert" className="text-[13px] text-core-danger">
        {friendlyMessage(query.error)}{" "}
        <CoreButton variant="link" onClick={() => query.refetch()}>
          Retry
        </CoreButton>
      </div>
    );

  return (
    <div className="space-y-4 text-[13px]">
      <dl className="grid gap-2">
        <div>
          <dt className="text-xs font-bold text-core-muted">Reason</dt>
          <dd>{report.reason}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-core-muted">Target ({report.type})</dt>
          <dd>
            {who(report.target)}
            {report.targetSummary && <span className="block text-core-muted">{report.targetSummary}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-core-muted">Reported by</dt>
          <dd>
            {who(report.reporter)} · {formatDate(report.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-core-muted">Current status</dt>
          <dd>
            <Pill tone={report.status}>{statusLabel(report.status)}</Pill>
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="mb-1 text-xs font-bold text-core-muted">Status history</h3>
        <ol className="space-y-1.5 border-l-2 border-core-line pl-3">
          {report.history.map((item, index) => (
            <li key={index}>
              <span className="font-bold">{statusLabel(item.status)}</span> · {formatDate(item.at, true)} ·{" "}
              {item.by}
              {item.note && <span className="block text-core-muted">“{item.note}”</span>}
            </li>
          ))}
        </ol>
      </div>

      <form
        className="space-y-3 border-t border-core-line pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div>
          <Label htmlFor="rp-new-status">Update status</Label>
          <select
            id="rp-new-status"
            className={coreInput}
            value={chosen}
            onChange={(event) => setStatus(event.target.value as ReportStatus)}
          >
            {REPORT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {statusLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="rp-note">Note (optional)</Label>
          <textarea
            id="rp-note"
            rows={3}
            maxLength={500}
            className={coreInput + " h-auto py-2"}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
        <CoreButton type="submit" disabled={update.isPending || (chosen === report.status && !note.trim())}>
          {update.isPending ? "Saving…" : "Save status"}
        </CoreButton>
      </form>
    </div>
  );
}
