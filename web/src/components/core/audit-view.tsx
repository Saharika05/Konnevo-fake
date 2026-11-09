"use client";

import * as React from "react";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useCoreAudit } from "@/lib/core/hooks";
import { AUDIT_ACTION_LABEL, AUDIT_ACTIONS } from "@/lib/core/schemas";
import {
  Card,
  CoreButton,
  coreInput,
  formatDate,
  Label,
  PageHeader,
  Pagination,
  QueryState,
  TableWrap,
  td,
  th,
} from "@/components/core/ui";

const PARSERS = {
  actor: parseAsString.withDefault(""),
  action: parseAsStringLiteral(AUDIT_ACTIONS),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

/** Read-only. There is no edit or delete anywhere on this page. */
export function AuditView() {
  const [params, setParams] = useQueryStates(PARSERS, { clearOnDefault: true });
  const query = useCoreAudit({
    actor: params.actor || undefined,
    action: params.action ?? undefined,
    from: params.from || undefined,
    to: params.to || undefined,
    page: params.page,
  });
  const filtered = !!(params.actor || params.action || params.from || params.to);

  const [actor, setActor] = React.useState(params.actor);
  React.useEffect(() => setActor(params.actor), [params.actor]);
  React.useEffect(() => {
    if (actor === params.actor) return;
    const timer = setTimeout(() => setParams({ actor, page: 1 }), 350);
    return () => clearTimeout(timer);
  }, [actor, params.actor, setParams]);

  return (
    <>
      <PageHeader title="Audit log" subtitle="Every change made by the core team. Newest first. Read-only." />

      <Card className="mb-4 p-4">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Filter audit log"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <Label htmlFor="au-actor">Actor</Label>
            <input
              id="au-actor"
              type="search"
              className={coreInput}
              placeholder="Email"
              value={actor}
              onChange={(event) => setActor(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="au-action">Action</Label>
            <select
              id="au-action"
              className={coreInput}
              value={params.action ?? ""}
              onChange={(event) => setParams({ action: (event.target.value || null) as never, page: 1 })}
            >
              <option value="">All</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {AUDIT_ACTION_LABEL[action]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="au-from">From date</Label>
            <input
              id="au-from"
              type="date"
              className={coreInput}
              value={params.from}
              max={params.to || undefined}
              onChange={(event) => setParams({ from: event.target.value, page: 1 })}
            />
          </div>
          <div>
            <Label htmlFor="au-to">To date</Label>
            <input
              id="au-to"
              type="date"
              className={coreInput}
              value={params.to}
              min={params.from || undefined}
              onChange={(event) => setParams({ to: event.target.value, page: 1 })}
            />
          </div>
          {filtered && (
            <div className="flex items-end">
              <CoreButton
                variant="link"
                onClick={() => {
                  setActor("");
                  setParams(null);
                }}
              >
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
          emptyTitle={filtered ? "No entries match these filters" : "Nothing logged yet"}
          emptyText={filtered ? "Try removing a filter." : "Changes made by the core team show up here."}
          label="Loading audit log"
        >
          {query.data && (
            <TableWrap>
              <thead>
                <tr>
                  <th className={th}>Time</th>
                  <th className={th}>Actor</th>
                  <th className={th}>Action</th>
                  <th className={th}>Target</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td className={td + " whitespace-nowrap"}>{formatDate(entry.at, true)}</td>
                    <td className={td}>{entry.actor}</td>
                    <td className={td}>{AUDIT_ACTION_LABEL[entry.action]}</td>
                    <td className={td}>{entry.target}</td>
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
          noun="entries"
        />
      )}
    </>
  );
}
