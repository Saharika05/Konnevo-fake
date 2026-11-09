"use client";

import * as React from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { toast } from "sonner";
import { friendlyMessage } from "@/lib/api/client";
import { useCoreColleges, useMergeColleges } from "@/lib/core/hooks";
import type { CollegeRow } from "@/lib/core/schemas";
import { canReview, duplicateGroups, mergeSummary } from "@/lib/core/logic";
import {
  Card,
  CoreButton,
  CoreDialog,
  formatDate,
  PageHeader,
  Pagination,
  Pill,
  QueryState,
  TableWrap,
  td,
  th,
} from "@/components/core/ui";

type Summary = ReturnType<typeof mergeSummary>;

/** The last step before a merge. The button stays off until the person ticks that they understand it cannot be undone. */
export function MergeConfirmDialog({
  open,
  summary,
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  summary: Summary;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [understood, setUnderstood] = React.useState(false);
  React.useEffect(() => {
    if (!open) setUnderstood(false);
  }, [open]);

  return (
    <CoreDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Merge these colleges?"
      description={summary.keep ? `Everything moves into “${summary.keep.name}”.` : undefined}
    >
      <ul className="list-disc space-y-1 pl-5 text-[13px]">
        {summary.others.map((college) => (
          <li key={college.id}>
            <span className="font-bold">{college.name}</span> ({college.students} students, {college.clubs}{" "}
            clubs) will be merged and its name removed
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px]">
        This moves <strong>{summary.students}</strong> students and <strong>{summary.clubs}</strong> clubs.
      </p>
      <p
        role="alert"
        className="mt-3 rounded-xl border border-core-danger/40 bg-core-danger-soft px-3 py-2 text-[13px] font-bold text-core-danger"
      >
        Merging cannot be undone.
      </p>
      <label className="mt-4 flex cursor-pointer items-start gap-2 text-[13px]">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4"
          checked={understood}
          onChange={(event) => setUnderstood(event.target.checked)}
        />
        <span>I understand this cannot be undone.</span>
      </label>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <CoreButton variant="outline" onClick={onClose}>
          Cancel
        </CoreButton>
        <CoreButton variant="danger" disabled={!understood || pending} onClick={onConfirm}>
          {pending ? "Merging…" : "Merge colleges"}
        </CoreButton>
      </div>
    </CoreDialog>
  );
}

export function CollegesView() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const query = useCoreColleges(page);
  // Likely duplicates are found across all colleges, not only the page on screen.
  const all = useCoreColleges(1, 200);
  const groups = React.useMemo(() => duplicateGroups(all.data?.items ?? []), [all.data]);

  // Ticked colleges are remembered across pages.
  const [selected, setSelected] = React.useState<Map<string, CollegeRow>>(new Map());
  const [keepId, setKeepId] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const merge = useMergeColleges();

  const chosen = [...selected.values()];
  const effectiveKeep = keepId && selected.has(keepId) ? keepId : null;
  const summary = mergeSummary(chosen, effectiveKeep ?? "");

  function toggle(college: CollegeRow) {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(college.id)) next.delete(college.id);
      else next.set(college.id, college);
      return next;
    });
  }

  async function runMerge() {
    if (!effectiveKeep) return;
    try {
      const result = await merge.mutateAsync({
        keepId: effectiveKeep,
        mergeIds: chosen.filter((college) => college.id !== effectiveKeep).map((college) => college.id),
      });
      toast.success(`Merged. ${result.studentsMoved} students and ${result.clubsMoved} clubs moved.`);
      setSelected(new Map());
      setKeepId(null);
      setConfirming(false);
      setPage(1);
    } catch (error) {
      toast.error(friendlyMessage(error));
      setConfirming(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Colleges"
        subtitle="Students type their college, so duplicates appear. Tick the ones that are the same and merge them."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <Card className="p-2">
            <QueryState
              {...query}
              refetch={() => query.refetch()}
              isEmpty={query.data?.items.length === 0}
              emptyTitle="No colleges yet"
              emptyText="Colleges appear when students add them."
              label="Loading colleges"
            >
              {query.data && (
                <TableWrap>
                  <thead>
                    <tr>
                      <th className={th}>
                        <span className="sr-only">Select</span>
                      </th>
                      <th className={th}>College</th>
                      <th className={th}>name_key</th>
                      <th className={th}>Students</th>
                      <th className={th}>Clubs</th>
                      <th className={th}>Created</th>
                      <th className={th}>
                        <span className="sr-only">Duplicate hint</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((college) => (
                      <tr
                        key={college.id}
                        className={selected.has(college.id) ? "bg-core-primary-soft/60" : undefined}
                      >
                        <td className={td}>
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            aria-label={`Select ${college.name}`}
                            checked={selected.has(college.id)}
                            onChange={() => toggle(college)}
                          />
                        </td>
                        <td className={td + " font-bold"}>{college.name}</td>
                        <td className={td + " text-core-muted"}>{college.nameKey}</td>
                        <td className={td + " tabular-nums"}>{college.students}</td>
                        <td className={td + " tabular-nums"}>{college.clubs}</td>
                        <td className={td + " whitespace-nowrap"}>{formatDate(college.createdAt)}</td>
                        <td className={td}>
                          {groups.has(college.id) ? (
                            <Pill tone="duplicate">Possible duplicate</Pill>
                          ) : (
                            <Pill tone="ok">OK</Pill>
                          )}
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
              onPage={(next) => setPage(next)}
              noun="colleges"
            />
          )}
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-3 text-[15px] font-bold">Merge duplicate colleges</h2>
          {chosen.length < 2 ? (
            <p className="text-[13px] text-core-muted">
              Tick two or more colleges in the table. Colleges marked “Possible duplicate” are a good place to
              start.
            </p>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (canReview(chosen, effectiveKeep)) setConfirming(true);
              }}
            >
              <fieldset>
                <legend className="mb-1 text-xs font-bold text-core-muted">Which name should stay?</legend>
                <div className="space-y-1.5">
                  {chosen.map((college) => (
                    <label key={college.id} className="flex cursor-pointer items-start gap-2 text-[13px]">
                      <input
                        type="radio"
                        name="keep"
                        className="mt-0.5 h-4 w-4"
                        checked={effectiveKeep === college.id}
                        onChange={() => setKeepId(college.id)}
                      />
                      <span>
                        {college.name} <span className="text-core-muted">({college.students} students)</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {effectiveKeep && (
                <div className="rounded-xl border border-core-line bg-core-primary-soft px-3 py-2 text-[13px]">
                  <p>
                    This moves {summary.students} students and {summary.clubs} clubs into{" "}
                    <strong>{summary.keep?.name}</strong>.
                  </p>
                  <p className="mt-1 font-bold text-core-danger">It cannot be undone.</p>
                </div>
              )}
              <CoreButton type="submit" className="w-full" disabled={!canReview(chosen, effectiveKeep)}>
                Review merge
              </CoreButton>
              <CoreButton
                variant="link"
                onClick={() => {
                  setSelected(new Map());
                  setKeepId(null);
                }}
              >
                Clear selection
              </CoreButton>
            </form>
          )}
        </Card>
      </div>

      <MergeConfirmDialog
        open={confirming && !!effectiveKeep}
        summary={summary}
        pending={merge.isPending}
        onConfirm={runMerge}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
