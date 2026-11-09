"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsInteger, useQueryState } from "nuqs";
import { toast } from "sonner";
import { ApiError, friendlyMessage } from "@/lib/api/client";
import { useAddAdmin, useCoreClubs, useRemoveAdmin } from "@/lib/core/hooks";
import { addAdminFormSchema, type AddAdminInput, type ClubRow } from "@/lib/core/schemas";
import { adminErrorMessage } from "@/lib/core/logic";
import {
  Card,
  CoreButton,
  CoreDialog,
  coreInput,
  Label,
  PageHeader,
  Pagination,
  QueryState,
  TableWrap,
  td,
  th,
} from "@/components/core/ui";

export function ClubsView() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const query = useCoreClubs(page);
  // The form lists every club (up to 200), not just this page.
  const allClubs = useCoreClubs(1, 200);
  const [removing, setRemoving] = React.useState<ClubRow | null>(null);
  const [pickClub, setPickClub] = React.useState<string>("");

  return (
    <>
      <PageHeader
        title="Clubs and admins"
        subtitle="One admin per club. Admins log in with the email you add here."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <Card className="p-2">
            <QueryState
              {...query}
              refetch={() => query.refetch()}
              isEmpty={query.data?.items.length === 0}
              emptyTitle="No clubs yet"
              emptyText="Clubs appear here once they exist."
              label="Loading clubs"
            >
              {query.data && (
                <TableWrap>
                  <thead>
                    <tr>
                      <th className={th}>Club</th>
                      <th className={th}>College</th>
                      <th className={th}>Admin email</th>
                      <th className={th}>Events</th>
                      <th className={th}>
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((club) => (
                      <tr key={club.id}>
                        <td className={td + " font-bold"}>{club.name}</td>
                        <td className={td}>{club.college}</td>
                        <td className={td}>
                          {club.admin ? (
                            club.admin.email
                          ) : (
                            <span className="text-core-muted">(no admin yet)</span>
                          )}
                        </td>
                        <td className={td + " tabular-nums"}>{club.eventsCount}</td>
                        <td className={td + " text-right"}>
                          {club.admin ? (
                            <CoreButton
                              variant="link"
                              className="text-core-danger"
                              aria-label={`Remove admin access for ${club.name}`}
                              onClick={() => setRemoving(club)}
                            >
                              Remove
                            </CoreButton>
                          ) : (
                            <CoreButton
                              variant="link"
                              aria-label={`Add an admin for ${club.name}`}
                              onClick={() => {
                                setPickClub(club.id);
                                document.getElementById("admin-email")?.focus();
                              }}
                            >
                              Add
                            </CoreButton>
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
              noun="clubs"
            />
          )}
        </div>

        <AddAdminForm
          clubs={allClubs.data?.items ?? []}
          clubsLoading={allClubs.isPending}
          pickClub={pickClub}
        />
      </div>

      <RemoveAdminDialog club={removing} onClose={() => setRemoving(null)} />
    </>
  );
}

export function AddAdminForm({
  clubs,
  clubsLoading,
  pickClub,
}: {
  clubs: ClubRow[];
  clubsLoading: boolean;
  pickClub: string;
}) {
  const add = useAddAdmin();
  const form = useForm<AddAdminInput>({
    resolver: zodResolver(addAdminFormSchema),
    defaultValues: { clubId: "", email: "" },
  });
  const { errors } = form.formState;

  React.useEffect(() => {
    if (pickClub) form.setValue("clubId", pickClub, { shouldValidate: true });
  }, [pickClub, form]);

  // Only clubs without an admin can get one (one admin per club).
  const free = clubs.filter((club) => !club.admin);

  async function onSubmit(values: AddAdminInput) {
    try {
      await add.mutateAsync(values);
      toast.success("Admin access given");
      form.reset({ clubId: "", email: "" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // 409: this club already has an admin (or the email is an admin elsewhere).
        const field = error.code === "email_already_admin" ? "email" : "clubId";
        form.setError(field, { message: adminErrorMessage(error.code, error.message) });
      } else if (error instanceof ApiError && error.status === 422) {
        for (const [field, message] of Object.entries(error.fields)) {
          if (field === "email" || field === "clubId") form.setError(field, { message });
        }
      } else {
        toast.error(friendlyMessage(error));
      }
    }
  }

  return (
    <Card className="h-fit p-5">
      <h2 className="mb-3 text-[15px] font-bold">Give admin access</h2>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <Label htmlFor="admin-email">Admin email</Label>
          <input
            id="admin-email"
            type="email"
            autoComplete="off"
            placeholder="admin@college.edu"
            className={coreInput}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "admin-email-error" : undefined}
            {...form.register("email")}
          />
          {errors.email && (
            <p id="admin-email-error" role="alert" className="mt-1 text-xs text-core-danger">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="admin-club">Club</Label>
          <select
            id="admin-club"
            className={coreInput}
            disabled={clubsLoading}
            aria-invalid={errors.clubId ? true : undefined}
            aria-describedby={errors.clubId ? "admin-club-error" : undefined}
            {...form.register("clubId")}
          >
            <option value="">{clubsLoading ? "Loading clubs…" : "Select a club"}</option>
            {free.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name} · {club.college}
              </option>
            ))}
          </select>
          {errors.clubId && (
            <p id="admin-club-error" role="alert" className="mt-1 text-xs text-core-danger">
              {errors.clubId.message}
            </p>
          )}
          {!clubsLoading && free.length === 0 && (
            <p className="mt-1 text-xs text-core-muted">Every club already has an admin.</p>
          )}
        </div>
        <CoreButton type="submit" className="w-full" disabled={add.isPending}>
          {add.isPending ? "Giving access…" : "Give admin access"}
        </CoreButton>
        <p className="text-xs text-core-muted">
          They sign in with Google or GitHub using this same email and choose “I&apos;m a club admin”.
        </p>
      </form>
    </Card>
  );
}

function RemoveAdminDialog({ club, onClose }: { club: ClubRow | null; onClose: () => void }) {
  const remove = useRemoveAdmin();

  async function confirm() {
    if (!club?.admin) return;
    try {
      await remove.mutateAsync(club.admin.id);
      toast.success("Admin access removed");
      onClose();
    } catch (error) {
      toast.error(friendlyMessage(error));
    }
  }

  return (
    <CoreDialog
      open={!!club}
      onOpenChange={(open) => !open && onClose()}
      title="Remove admin access?"
      description={
        club?.admin
          ? `${club.admin.email} will go back to being a normal student and can no longer manage ${club.name}.`
          : undefined
      }
    >
      <p className="text-[13px]">
        The club and all its events stay exactly as they are. You can give someone admin access again at any
        time.
      </p>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <CoreButton variant="outline" onClick={onClose}>
          Cancel
        </CoreButton>
        <CoreButton variant="danger" onClick={confirm} disabled={remove.isPending}>
          {remove.isPending ? "Removing…" : "Remove access"}
        </CoreButton>
      </div>
    </CoreDialog>
  );
}
