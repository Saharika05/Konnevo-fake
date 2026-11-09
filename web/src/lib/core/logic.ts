import type { CollegeRow } from "@/lib/core/schemas";

/** konnevo_events_YYYY-MM-DD.csv */
export function eventsCsvFileName(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `konnevo_events_${y}-${m}-${d}.csv`;
}

const FILLER = new Set([
  "college",
  "university",
  "institute",
  "of",
  "engineering",
  "engg",
  "technology",
  "school",
  "the",
  "and",
  "for",
  "science",
  "sciences",
  "univ",
  "inst",
]);

function tokens(name: string): Set<string> {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = words.filter((word) => !FILLER.has(word));
  return new Set(meaningful.length > 0 ? meaningful : words);
}

function isSubset(small: Set<string>, big: Set<string>) {
  if (small.size === 0) return false;
  for (const word of small) if (!big.has(word)) return false;
  return true;
}

/**
 * Likely duplicates: after dropping filler words ("college", "of", "engg"...), one name's words
 * are all inside the other's ("PES" and "PES University, Bengaluru"; "XYZ College" and "xyz college of engg").
 * Returns a group number per college id, only for colleges that have a likely twin.
 * This is a hint for the person; the server never merges anything by itself.
 */
export function duplicateGroups(colleges: Pick<CollegeRow, "id" | "name">[]): Map<string, number> {
  const parent = new Map<string, string>(colleges.map((college) => [college.id, college.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root) as string;
    return root;
  };
  const sets = colleges.map((college) => ({ id: college.id, words: tokens(college.name) }));
  const linked = new Set<string>();

  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const a = sets[i];
      const b = sets[j];
      const similar = a.words.size <= b.words.size ? isSubset(a.words, b.words) : isSubset(b.words, a.words);
      if (similar) {
        parent.set(find(a.id), find(b.id));
        linked.add(a.id);
        linked.add(b.id);
      }
    }
  }

  const numbers = new Map<string, number>();
  const result = new Map<string, number>();
  for (const id of linked) {
    const root = find(id);
    if (!numbers.has(root)) numbers.set(root, numbers.size + 1);
    result.set(id, numbers.get(root) as number);
  }
  return result;
}

/** What a merge moves: everything from the other colleges into the one that stays. */
export function mergeSummary(selected: CollegeRow[], keepId: string) {
  const others = selected.filter((college) => college.id !== keepId);
  return {
    keep: selected.find((college) => college.id === keepId) ?? null,
    others,
    students: others.reduce((sum, college) => sum + college.students, 0),
    clubs: others.reduce((sum, college) => sum + college.clubs, 0),
  };
}

export function canReview(selected: unknown[], keepId: string | null): boolean {
  return selected.length >= 2 && !!keepId;
}

/** A club that already has an admin cannot get another one. */
export function adminErrorMessage(code: string, fallback: string): string {
  if (code === "club_has_admin") return "This club already has an admin. Remove their access first.";
  if (code === "email_already_admin") return "That email is already an admin of another club.";
  return fallback;
}

export function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/** Only the core role may see the Core admin section. */
export function isCoreRole(role: string | null | undefined): boolean {
  return role === "core";
}

export const CORE_NAV = [
  { label: "Overview", href: "/core" },
  { label: "Analytics", href: "/core/analytics" },
  { label: "Events", href: "/core/events" },
  { label: "Reports", href: "/core/reports" },
  { label: "Clubs and admins", href: "/core/clubs" },
  { label: "Colleges", href: "/core/colleges" },
  { label: "Audit log", href: "/core/audit" },
] as const;

export function activeCoreHref(pathname: string): string {
  let best: string = CORE_NAV[0].href;
  for (const item of CORE_NAV) {
    if (
      item.href === "/core"
        ? pathname === "/core"
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
      best = item.href;
  }
  return best;
}
