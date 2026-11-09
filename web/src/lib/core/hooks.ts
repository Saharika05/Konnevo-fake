"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superadminService } from "@/lib/services/superadmin";
import type { AnalyticsFilters, AuditFilters, EventFilters, ReportFilters, ReportUpdateInput } from "@/lib/core/schemas";

const root = ["core"] as const;
export const coreKeys = {
  overview: [...root, "overview"] as const,
  analytics: (filters: AnalyticsFilters) => [...root, "analytics", filters] as const,
  events: (filters: EventFilters) => [...root, "events", filters] as const,
  event: (id: string) => [...root, "event", id] as const,
  reports: (filters: ReportFilters) => [...root, "reports", filters] as const,
  report: (id: string) => [...root, "report", id] as const,
  clubs: (page: number, pageSize: number) => [...root, "clubs", page, pageSize] as const,
  colleges: (page: number, pageSize: number) => [...root, "colleges", page, pageSize] as const,
  audit: (filters: AuditFilters) => [...root, "audit", filters] as const,
};

export const useCoreOverview = () =>
  useQuery({ queryKey: coreKeys.overview, queryFn: superadminService.overview });

export const useCoreAnalytics = (filters: AnalyticsFilters) =>
  useQuery({
    queryKey: coreKeys.analytics(filters),
    queryFn: () => superadminService.analytics(filters),
    placeholderData: keepPreviousData,
  });

export const useCoreEvents = (filters: EventFilters) =>
  useQuery({
    queryKey: coreKeys.events(filters),
    queryFn: () => superadminService.events(filters),
    placeholderData: keepPreviousData,
  });

export const useCoreEvent = (id: string) =>
  useQuery({ queryKey: coreKeys.event(id), queryFn: () => superadminService.event(id) });

export const useCoreReports = (filters: ReportFilters) =>
  useQuery({
    queryKey: coreKeys.reports(filters),
    queryFn: () => superadminService.reports(filters),
    placeholderData: keepPreviousData,
  });

export const useCoreReport = (id: string | null) =>
  useQuery({
    queryKey: coreKeys.report(id ?? ""),
    queryFn: () => superadminService.report(id as string),
    enabled: !!id,
  });

export const useCoreClubs = (page: number, pageSize = 10) =>
  useQuery({
    queryKey: coreKeys.clubs(page, pageSize),
    queryFn: () => superadminService.clubs(page, pageSize),
    placeholderData: keepPreviousData,
  });

export const useCoreColleges = (page: number, pageSize = 10) =>
  useQuery({
    queryKey: coreKeys.colleges(page, pageSize),
    queryFn: () => superadminService.colleges(page, pageSize),
    placeholderData: keepPreviousData,
  });

export const useCoreAudit = (filters: AuditFilters) =>
  useQuery({
    queryKey: coreKeys.audit(filters),
    queryFn: () => superadminService.audit(filters),
    placeholderData: keepPreviousData,
  });

/** Every write by the core team lands in the audit log and can change the overview, so refresh them too. */
function useInvalidate() {
  const queryClient = useQueryClient();
  return (...parts: string[]) => {
    for (const part of parts) queryClient.invalidateQueries({ queryKey: [...root, part] });
    queryClient.invalidateQueries({ queryKey: [...root, "audit"] });
    queryClient.invalidateQueries({ queryKey: coreKeys.overview });
  };
}

export function useUpdateReport() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReportUpdateInput }) =>
      superadminService.updateReport(id, input),
    onSuccess: () => invalidate("reports", "report"),
  });
}

export function useAddAdmin() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: superadminService.addAdmin,
    onSuccess: () => invalidate("clubs"),
  });
}

export function useRemoveAdmin() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: superadminService.removeAdmin,
    onSuccess: () => invalidate("clubs"),
  });
}

export function useMergeColleges() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: superadminService.mergeColleges,
    onSuccess: () => invalidate("colleges", "clubs", "events"),
  });
}

export function useExportEvents() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: superadminService.exportEvents,
    onSuccess: () => invalidate(),
  });
}
