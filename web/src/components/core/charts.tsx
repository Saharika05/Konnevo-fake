"use client";

import { CHART } from "@/lib/theme";
import * as React from "react";
import {
  compact,
  delta,
  donutArcs,
  funnelSteps,
  heatLevel,
  niceMax,
  ringPath,
  shorten,
  ticks,
  type Slice,
} from "@/lib/core/chart-math";
import { cn } from "@/lib/utils";

/**
 * Dashboard charts for the Core admin. Plain SVG, no chart library, so they match the dark
 * theme exactly and add nothing to the bundle. Each one:
 *  - scales to its box (viewBox) and stays readable on a phone,
 *  - has an accessible name and a hidden data table for screen readers,
 *  - never uses colour alone (values are printed or shown in a tooltip),
 *  - can be clicked (where it makes sense) to set a slicer, like a Power BI visual.
 */

export const CHART_COLORS = {
  olive: CHART.olive,
  mossDark: CHART.mossDark,
  moss: CHART.moss,
  sage: CHART.sage,
  amber: CHART.amber,
  brick: CHART.brick,
  neutral: CHART.neutral,
  grid: CHART.grid,
  axis: CHART.axisText,
  text: CHART.text,
  surface: CHART.surface,
  empty: CHART.empty,
} as const;

/** One stable colour per event type, used by every chart. */
export const TYPE_COLOR: Record<string, string> = {
  hackathon: CHART_COLORS.olive,
  meetup: CHART_COLORS.moss,
  conference: CHART_COLORS.sage,
  workshop: CHART_COLORS.amber,
};

const fmt = (n: number) => n.toLocaleString("en-IN");

function SrTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="sr-only">
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

/** The frame every visual sits in: title, small caption, optional action, then the chart. */
export function Visual({
  title,
  caption,
  className,
  children,
  action,
}: {
  title: string;
  caption?: string;
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={cn("min-w-0 rounded-2xl border border-core-line bg-core-card/80 p-5 backdrop-blur", className)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold">{title}</h2>
          {caption && <p className="mt-0.5 text-xs text-core-muted">{caption}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-core-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: item.color }} />
          <span>{item.label}</span>
          {item.value && <span className="font-bold text-core-text tabular-nums">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- KPI tile */

export function Sparkline({ values, color = CHART_COLORS.olive }: { values: number[]; color?: string }) {
  const w = 120;
  const h = 32;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    values.length === 1 ? w / 2 : (i / (values.length - 1)) * w,
    h - 3 - ((v - min) / span) * (h - 6),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const id = React.useId();
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {pts.length > 1 && <path d={`${line}L${w} ${h}L0 ${h}Z`} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function KpiTile({
  label,
  value,
  previous,
  unit,
  spark,
  compareLabel,
}: {
  label: string;
  value: number;
  previous: number;
  unit: "count" | "percent";
  spark: number[];
  compareLabel: string;
}) {
  const d = delta(value, previous, unit);
  const tone =
    d.direction === "up" ? "text-core-ok" : d.direction === "down" ? "text-core-danger" : "text-core-muted";
  const arrow = d.direction === "up" ? "▲" : d.direction === "down" ? "▼" : "■";
  return (
    <div className="rounded-2xl border border-core-line bg-core-card/80 p-4 backdrop-blur">
      <p className="text-xs font-bold text-core-muted">{label}</p>
      <p className="font-display mt-2 text-[32px] leading-none font-extrabold tabular-nums">
        {unit === "percent" ? `${value}%` : fmt(value)}
      </p>
      <p className={cn("mt-2 text-xs font-bold", tone)}>
        <span aria-hidden="true">{arrow} </span>
        {d.direction === "flat" ? d.text : `${d.direction === "up" ? "Up" : "Down"} ${d.text}`}
        <span className="font-normal text-core-muted"> {compareLabel}</span>
      </p>
      <div className="mt-2">
        <Sparkline values={spark} color={d.direction === "down" ? CHART_COLORS.brick : CHART_COLORS.olive} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Line / area */

export type LineSeries = { key: string; name: string; color: string; values: number[]; area?: boolean };

export function LineAreaChart({
  labels,
  series,
  ariaLabel,
}: {
  labels: string[];
  series: LineSeries[];
  ariaLabel: string;
}) {
  const W = 640;
  const H = 250;
  const m = { l: 40, r: 26, t: 12, b: 28 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const top = niceMax(Math.max(...series.flatMap((s) => s.values), 1));
  const ys = ticks(top);
  const x = (i: number) => m.l + (labels.length === 1 ? iw / 2 : (i / (labels.length - 1)) * iw);
  const y = (v: number) => m.t + ih - (v / top) * ih;
  const every = labels.length > 8 ? 2 : 1;
  const [hover, setHover] = React.useState<number | null>(null);
  const baseId = React.useId();

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        className="h-auto w-full"
        onMouseLeave={() => setHover(null)}
      >
        {ys.map((tick) => (
          <g key={tick}>
            <line x1={m.l} x2={W - m.r} y1={y(tick)} y2={y(tick)} stroke={CHART_COLORS.grid} strokeWidth="1" />
            <text x={m.l - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fill={CHART_COLORS.axis}>
              {compact(tick)}
            </text>
          </g>
        ))}
        {labels.map((label, i) =>
          i % every === 0 || i === labels.length - 1 ? (
            <text key={`${label}-${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={CHART_COLORS.axis}>
              {label}
            </text>
          ) : null,
        )}
        {series.map((s) => {
          const pts = s.values.map((v, i) => [x(i), y(v)] as const);
          const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join("");
          const gid = `${baseId}-${s.key}`;
          return (
            <g key={s.key}>
              {s.area && (
                <>
                  <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={s.color} stopOpacity="0.32" />
                      <stop offset="1" stopColor={s.color} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`${line}L${pts[pts.length - 1][0]} ${m.t + ih}L${pts[0][0]} ${m.t + ih}Z`} fill={`url(#${gid})`} />
                </>
              )}
              <path d={line} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map(([px, py], i) => (
                <circle key={i} cx={px} cy={py} r={hover === i ? 4.5 : 2.6} fill={s.color} stroke={CHART_COLORS.surface} strokeWidth="1.5" />
              ))}
            </g>
          );
        })}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke={CHART_COLORS.axis} strokeDasharray="3 3" strokeWidth="1" />
        )}
        {labels.map((label, i) => {
          const slot = iw / Math.max(labels.length - 1, 1);
          return (
            <rect
              key={`hit-${i}`}
              x={x(i) - slot / 2}
              y={m.t}
              width={slot}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            >
              <title>{`${label}: ${series.map((s) => `${s.name} ${fmt(s.values[i])}`).join(", ")}`}</title>
            </rect>
          );
        })}
      </svg>
      {hover !== null && (
        <p aria-hidden="true" className="-mt-1 text-xs text-core-muted">
          <span className="font-bold text-core-text">Week of {labels[hover]}</span>
          {series.map((s) => (
            <span key={s.key} className="ml-3">
              <span className="mr-1 inline-block h-2 w-2 rounded-[2px]" style={{ background: s.color }} />
              {s.name} <b className="text-core-text">{fmt(s.values[hover])}</b>
            </span>
          ))}
        </p>
      )}
      <Legend items={series.map((s) => ({ label: s.name, color: s.color }))} />
      <SrTable
        caption={ariaLabel}
        head={["Week", ...series.map((s) => s.name)]}
        rows={labels.map((label, i) => [label, ...series.map((s) => s.values[i])])}
      />
    </figure>
  );
}

/* ---------------------------------------------------------------- Horizontal bars */

export type BarItem = { key: string; label: string; value: number; color?: string; note?: string };

export function HBarChart({
  items,
  selected,
  onSelect,
  ariaLabel,
  valueLabel = "",
}: {
  items: BarItem[];
  selected?: string | null;
  onSelect?: (key: string | null) => void;
  ariaLabel: string;
  valueLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <figure>
      <ul aria-label={ariaLabel} className="space-y-1">
        {items.map((item) => {
          const active = selected === item.key;
          const dim = selected && !active;
          const body = (
            <>
              <span className="truncate text-left" title={item.label}>
                {item.label}
              </span>
              <span className="h-4 rounded-[4px] bg-core-bg" aria-hidden="true">
                <span
                  className={cn("block h-full rounded-[4px] transition-opacity", dim && "opacity-35")}
                  style={{
                    width: `${Math.max(2, (item.value / max) * 100)}%`,
                    background: item.color ?? `linear-gradient(90deg, ${CHART_COLORS.sage}, ${CHART_COLORS.moss})`,
                  }}
                />
              </span>
              <span className="text-right text-xs font-bold tabular-nums">
                {fmt(item.value)}
                {valueLabel}
              </span>
            </>
          );
          const grid =
            "grid w-full grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_3.6rem] items-center gap-3 rounded-lg px-2 py-1.5 text-[13px] sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_3.6rem]";
          return (
            <li key={item.key}>
              {onSelect ? (
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(active ? null : item.key)}
                  className={cn(grid, "cursor-pointer hover:bg-core-bg/70", active && "bg-core-primary-soft")}
                >
                  {body}
                </button>
              ) : (
                <div className={grid}>{body}</div>
              )}
              {item.note && <p className="px-2 text-[11px] text-core-muted">{item.note}</p>}
            </li>
          );
        })}
      </ul>
      <SrTable caption={ariaLabel} head={["Name", "Value"]} rows={items.map((i) => [i.label, i.value])} />
    </figure>
  );
}

/* ---------------------------------------------------------------- Columns */

export function ColumnChart({
  items,
  ariaLabel,
  color = CHART_COLORS.moss,
}: {
  items: { label: string; value: number }[];
  ariaLabel: string;
  color?: string;
}) {
  const W = 360;
  const H = 190;
  const m = { l: 28, r: 8, t: 14, b: 26 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const top = niceMax(Math.max(...items.map((i) => i.value), 1));
  const slot = iw / Math.max(items.length, 1);
  const bw = Math.min(34, slot * 0.62);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="h-auto w-full">
        {ticks(top).map((tick) => {
          const ty = m.t + ih - (tick / top) * ih;
          return (
            <g key={tick}>
              <line x1={m.l} x2={W - m.r} y1={ty} y2={ty} stroke={CHART_COLORS.grid} />
              <text x={m.l - 6} y={ty + 4} textAnchor="end" fontSize="10.5" fill={CHART_COLORS.axis}>
                {compact(tick)}
              </text>
            </g>
          );
        })}
        {items.map((item, i) => {
          const h = (item.value / top) * ih;
          const cx = m.l + slot * i + slot / 2;
          return (
            <g key={item.label}>
              <rect x={cx - bw / 2} y={m.t + ih - h} width={bw} height={h} rx="4" fill={color}>
                <title>{`${item.label}: ${fmt(item.value)}`}</title>
              </rect>
              <text x={cx} y={m.t + ih - h - 4} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={CHART_COLORS.text}>
                {item.value}
              </text>
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="10.5" fill={CHART_COLORS.axis}>
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
      <SrTable caption={ariaLabel} head={["Month", "Events"]} rows={items.map((i) => [i.label, i.value])} />
    </figure>
  );
}

/* ---------------------------------------------------------------- Donut */

export function DonutChart({
  slices,
  colors,
  centerValue,
  centerLabel,
  ariaLabel,
  selected,
  onSelect,
}: {
  slices: Slice[];
  colors: Record<string, string>;
  centerValue: string;
  centerLabel: string;
  ariaLabel: string;
  selected?: string | null;
  onSelect?: (key: string | null) => void;
}) {
  const arcs = donutArcs(slices);
  const total = slices.reduce((n, s) => n + s.value, 0);
  return (
    <figure className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
      <svg viewBox="0 0 160 160" role="img" aria-label={ariaLabel} className="h-40 w-40 shrink-0">
        {arcs.length === 0 && <circle cx="80" cy="80" r="57" fill="none" stroke={CHART_COLORS.grid} strokeWidth="22" />}
        {arcs.length === 1 && (
          <circle cx="80" cy="80" r="57" fill="none" stroke={colors[arcs[0].key] ?? CHART_COLORS.moss} strokeWidth="22">
            <title>{`${arcs[0].label}: ${fmt(arcs[0].value)} (100%)`}</title>
          </circle>
        )}
        {arcs.length > 1 && arcs.map((arc) => (
          <path
            key={arc.key}
            d={ringPath(80, 80, 68, 46, arc.start, arc.end)}
            fill={colors[arc.key] ?? CHART_COLORS.moss}
            stroke={CHART_COLORS.surface}
            strokeWidth="2"
            opacity={selected && selected !== arc.key ? 0.35 : 1}
            className={onSelect ? "cursor-pointer" : undefined}
            onClick={onSelect ? () => onSelect(selected === arc.key ? null : arc.key) : undefined}
          >
            <title>{`${arc.label}: ${fmt(arc.value)} (${Math.round(arc.share * 100)}%)`}</title>
          </path>
        ))}
        <text x="80" y="82" textAnchor="middle" fontSize="24" fontWeight="800" fill={CHART_COLORS.text}>
          {centerValue}
        </text>
        <text x="80" y="98" textAnchor="middle" fontSize="10.5" fill={CHART_COLORS.axis}>
          {centerLabel}
        </text>
      </svg>
      <ul className="min-w-[12.5rem] flex-1 space-y-1.5 text-[13px]">
        {slices.map((s) => {
          const share = total > 0 ? Math.round((s.value / total) * 100) : 0;
          const row = (
            <>
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-[3px]" style={{ background: colors[s.key] }} />
              <span className="flex-1 text-left">{s.label}</span>
              <span className="font-bold tabular-nums">{fmt(s.value)}</span>
              <span className="w-10 text-right text-xs text-core-muted tabular-nums">{share}%</span>
            </>
          );
          return (
            <li key={s.key}>
              {onSelect ? (
                <button
                  type="button"
                  aria-pressed={selected === s.key}
                  onClick={() => onSelect(selected === s.key ? null : s.key)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-core-bg/70",
                    selected === s.key && "bg-core-primary-soft",
                  )}
                >
                  {row}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-2 py-1">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
      <SrTable caption={ariaLabel} head={["Group", "Value"]} rows={slices.map((s) => [s.label, s.value])} />
    </figure>
  );
}

/* ---------------------------------------------------------------- Funnel */

export function FunnelChart({
  stages,
  ariaLabel,
}: {
  stages: { key: string; label: string; value: number }[];
  ariaLabel: string;
}) {
  const steps = funnelSteps(stages);
    return (
    <figure>
      <ol aria-label={ariaLabel} className="space-y-2.5">
        {steps.map((step) => (
          <li key={step.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="font-bold">{step.label}</span>
              <span className="tabular-nums">
                <b>{fmt(step.value)}</b>
                <span className="ml-2 text-xs text-core-muted">
                  {step.ofPrevious === null ? "100%" : `${step.ofPrevious}% of previous step`}
                </span>
              </span>
            </div>
            <div className="h-7 rounded-md bg-core-bg" aria-hidden="true">
              <div
                className="bar-fill mx-auto flex h-full items-center justify-center rounded-md text-xs font-bold text-ink"
                style={{ width: `${Math.max(step.ofFirst, 6)}%` }}
              >
                {step.ofFirst >= 14 ? `${step.ofFirst}%` : ""}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <SrTable
        caption={ariaLabel}
        head={["Stage", "Count", "Share of first stage"]}
        rows={steps.map((s) => [s.label, s.value, `${s.ofFirst}%`])}
      />
    </figure>
  );
}

/* ---------------------------------------------------------------- Heatmap (matrix) */

export function Heatmap({
  rows,
  cols,
  cells,
  ariaLabel,
  selectedRow,
  onSelectRow,
}: {
  rows: { id: string; name: string }[];
  cols: string[];
  cells: number[][];
  ariaLabel: string;
  selectedRow?: string | null;
  onSelectRow?: (id: string | null) => void;
}) {
  const max = Math.max(...cells.flat(), 1);
  return (
    <figure>
      <div className="overflow-x-auto">
        <table aria-label={ariaLabel} className="w-full min-w-[420px] border-separate border-spacing-1 text-[12px]">
          <thead>
            <tr>
              <th className="w-[34%]" />
              {cols.map((c) => (
                <th key={c} scope="col" className="px-1 pb-1 text-center font-bold text-core-muted capitalize">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row.id}>
                <th scope="row" className="pr-2 text-left font-normal">
                  {onSelectRow ? (
                    <button
                      type="button"
                      aria-pressed={selectedRow === row.id}
                      onClick={() => onSelectRow(selectedRow === row.id ? null : row.id)}
                      className={cn(
                        "w-full cursor-pointer truncate rounded px-1 py-1 text-left hover:text-primary-text",
                        selectedRow === row.id && "font-bold text-primary-text",
                      )}
                      title={row.name}
                    >
                      {shorten(row.name, 24)}
                    </button>
                  ) : (
                    shorten(row.name, 24)
                  )}
                </th>
                {cells[r].map((value, c) => {
                  const level = heatLevel(value, max);
                  return (
                    <td
                      key={c}
                      title={`${row.name}, ${cols[c]}: ${fmt(value)} interested`}
                      className="h-9 rounded-md text-center font-bold tabular-nums"
                      style={{
                        background:
                          value === 0
                            ? CHART_COLORS.empty
                            : `color-mix(in srgb, ${CHART_COLORS.moss} ${Math.round(level * 100)}%, ${CHART.sage200})`,
                        color: value === 0 ? CHART_COLORS.axis : CHART.text,
                      }}
                    >
                      {value === 0 ? "-" : compact(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 flex items-center gap-2 text-[11px] text-core-muted">
        <span>Fewer</span>
        <span
          aria-hidden="true"
          className="h-2 w-24 rounded-full"
          style={{ background: `linear-gradient(90deg, ${CHART.sage200}, ${CHART_COLORS.moss})` }}
        />
        <span>More interested clicks</span>
      </p>
    </figure>
  );
}

/* ---------------------------------------------------------------- Bubble scatter */

export function BubbleChart({
  points,
  ariaLabel,
  xLabel,
  yLabel,
  onOpen,
}: {
  points: { id: string; title: string; type: string; x: number; y: number; size: number }[];
  ariaLabel: string;
  xLabel: string;
  yLabel: string;
  onOpen?: (id: string) => void;
}) {
  const W = 640;
  const H = 280;
  const m = { l: 44, r: 14, t: 12, b: 38 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const xMax = niceMax(Math.max(...points.map((p) => p.x), 1));
  const yMax = niceMax(Math.max(...points.map((p) => p.y), 1));
  const sMax = Math.max(...points.map((p) => p.size), 1);
  const X = (v: number) => m.l + (v / xMax) * iw;
  const Y = (v: number) => m.t + ih - (v / yMax) * ih;
  const R = (v: number) => 4 + Math.sqrt(v / sMax) * 10;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="h-auto w-full">
        {ticks(yMax).map((t) => (
          <g key={`y${t}`}>
            <line x1={m.l} x2={W - m.r} y1={Y(t)} y2={Y(t)} stroke={CHART_COLORS.grid} />
            <text x={m.l - 8} y={Y(t) + 4} textAnchor="end" fontSize="11" fill={CHART_COLORS.axis}>
              {compact(t)}
            </text>
          </g>
        ))}
        {ticks(xMax).map((t) => (
          <text key={`x${t}`} x={X(t)} y={H - 20} textAnchor="middle" fontSize="11" fill={CHART_COLORS.axis}>
            {compact(t)}
          </text>
        ))}
        <text x={m.l + iw / 2} y={H - 4} textAnchor="middle" fontSize="11" fill={CHART_COLORS.axis}>
          {xLabel}
        </text>
        <text transform={`translate(12 ${m.t + ih / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill={CHART_COLORS.axis}>
          {yLabel}
        </text>
        {points.map((p) => (
          <circle
            key={p.id}
            cx={X(p.x)}
            cy={Y(p.y)}
            r={R(p.size)}
            fill={TYPE_COLOR[p.type] ?? CHART_COLORS.moss}
            fillOpacity="0.62"
            stroke={TYPE_COLOR[p.type] ?? CHART_COLORS.moss}
            strokeWidth="1.4"
            className={onOpen ? "cursor-pointer" : undefined}
            onClick={onOpen ? () => onOpen(p.id) : undefined}
          >
            <title>{`${p.title} (${p.type}): ${fmt(p.x)} interested, ${fmt(p.y)} register clicks, ${fmt(p.size)} teams`}</title>
          </circle>
        ))}
      </svg>
      <Legend
        items={[
          ...Object.entries(TYPE_COLOR).map(([label, color]) => ({ label: label[0].toUpperCase() + label.slice(1), color })),
          { label: "Bubble size = teams formed", color: CHART_COLORS.neutral },
        ]}
      />
      <SrTable
        caption={ariaLabel}
        head={["Event", "Type", xLabel, yLabel, "Teams"]}
        rows={points.map((p) => [p.title, p.type, p.x, p.y, p.size])}
      />
    </figure>
  );
}
