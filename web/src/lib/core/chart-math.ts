/**
 * Small pure helpers for the Core dashboards (no React, easy to test).
 * Every chart in components/core/charts.tsx gets its numbers from here.
 */

/** A "round" top for an axis: 0 -> 1, 87 -> 100, 1340 -> 1500. */
export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  const f = value / base;
  const step = f <= 1 ? 1 : f <= 1.5 ? 1.5 : f <= 2 ? 2 : f <= 3 ? 3 : f <= 5 ? 5 : f <= 7.5 ? 7.5 : 10;
  return step * base;
}

/** Evenly spaced axis ticks from 0 to niceMax(max), in whole-looking steps: 150 -> [0, 50, 100, 150]. */
export function ticks(max: number, count?: number): number[] {
  const top = niceMax(max);
  const mantissa = top / 10 ** Math.floor(Math.log10(top));
  const steps = count ?? (top <= 4 ? top : ({ 1: 4, 1.5: 3, 2: 4, 3: 3, 5: 5, 7.5: 3, 10: 5 } as Record<number, number>)[mantissa] ?? 4);
  return Array.from({ length: steps + 1 }, (_, i) => (top * i) / steps);
}

/** 1200 -> "1.2k", 15300 -> "15k". Small numbers stay whole. */
export function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (abs >= 10_000) return `${Math.round(value / 1000)}k`;
  if (abs >= 1_000) return `${trim(value / 1000)}k`;
  return String(Math.round(value));
}
const trim = (n: number) => String(Math.round(n * 10) / 10);

/** a / b as a percentage with one decimal; 0 when b is 0. */
export function pct(a: number, b: number): number {
  return b > 0 ? Math.round((a / b) * 1000) / 10 : 0;
}

export type Delta = { direction: "up" | "down" | "flat"; text: string };

/** Change against the period before. `percent` values are compared in points, counts in percent. */
export function delta(current: number, previous: number, unit: "count" | "percent"): Delta {
  if (unit === "percent") {
    const diff = Math.round((current - previous) * 10) / 10;
    if (diff === 0) return { direction: "flat", text: "no change" };
    return { direction: diff > 0 ? "up" : "down", text: `${Math.abs(diff)} ${Math.abs(diff) === 1 ? "pt" : "pts"}` };
  }
  if (previous === 0) return current === 0 ? { direction: "flat", text: "no change" } : { direction: "up", text: "new" };
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return { direction: "flat", text: "no change" };
  return { direction: change > 0 ? "up" : "down", text: `${Math.abs(change)}%` };
}

export type Slice = { key: string; label: string; value: number };
export type Arc = Slice & { start: number; end: number; share: number };

/** Turn values into start/end angles (radians, 0 = 12 o'clock, clockwise). Zero values are dropped. */
export function donutArcs(slices: Slice[]): Arc[] {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return [];
  let angle = 0;
  return slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const share = s.value / total;
      const arc = { ...s, start: angle, end: angle + share * Math.PI * 2, share };
      angle = arc.end;
      return arc;
    });
}

/** SVG path for a ring segment. */
export function ringPath(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number): string {
  // A full circle cannot be one arc; draw it just short of closing.
  const e = end - start >= Math.PI * 2 - 1e-4 ? start + Math.PI * 2 - 1e-4 : end;
  const pt = (r: number, a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x1, y1] = pt(rOuter, start);
  const [x2, y2] = pt(rOuter, e);
  const [x3, y3] = pt(rInner, e);
  const [x4, y4] = pt(rInner, start);
  const large = e - start > Math.PI ? 1 : 0;
  const f = (n: number) => n.toFixed(2);
  return `M${f(x1)} ${f(y1)}A${rOuter} ${rOuter} 0 ${large} 1 ${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}A${rInner} ${rInner} 0 ${large} 0 ${f(x4)} ${f(y4)}Z`;
}

export type FunnelStep = { key: string; label: string; value: number; ofFirst: number; ofPrevious: number | null };

/** Each stage with its share of the first stage and of the stage before it. */
export function funnelSteps(stages: { key: string; label: string; value: number }[]): FunnelStep[] {
  const first = stages[0]?.value ?? 0;
  return stages.map((stage, i) => ({
    ...stage,
    ofFirst: pct(stage.value, first),
    ofPrevious: i === 0 ? null : pct(stage.value, stages[i - 1].value),
  }));
}

/** 0..1 intensity for a heatmap cell. */
export function heatLevel(value: number, max: number): number {
  return max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
}

/** Shorten a long name for an axis label: "PES University, Bengaluru" -> "PES University, B…". */
export function shorten(text: string, max = 22): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** "2026-10-19" -> "19 Oct". */
export function weekLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return `${d.getUTCDate()} ${d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10" -> "Oct 26". Fixed English names, so every browser draws the same label. */
export function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const name = MONTHS[Number(month) - 1];
  return name && year ? `${name} ${year.slice(2)}` : yearMonth;
}
