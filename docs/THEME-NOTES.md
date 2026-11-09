# konnevo olive theme: notes

## Current look → new token

| Current look | Old value | New token | New value (light / dark stage) |
|---|---|---|---|
| Page background | `#0e0f13` | `--background` | `#E8E9DF` / `#1F2A1B` |
| Card / surface | `#16171c` | `--card` (`bg-surface`) | `#F3F4EC` / `#2E3D28` |
| Subtle / hover fill | `#1e2027` | `--subtle` | `#D7E0C1` / `#3C4F34` |
| Border | `#2a2c35` | `--border` | `#CED1C5` / `#485542` |
| Body text | `#f2f2f5` | `--foreground` | `#111111` / `#E8E9DF` |
| Headings | white | `--heading` | `#2E3D28` / `#E8E9DF` |
| Muted text | `#a1a3ad` | `--muted-foreground` (`text-muted`) | `#3C4F34` / `#D7E0C1` |
| **Magenta** primary (buttons, glows) | `#d6208f` | `--primary` | `#2E3D28` / `#A9B887` |
| **Pink** link / accent text | `#ff6ab9` | `--primary-text` | `#4F6B3A` / `#A9B887` |
| Primary soft chip bg | `#2a1022` | `--primary-soft` | `#D7E0C1` (text forced `#2E3D28`) / `#1F2A1B` |
| **Purple / violet** | `#6d4de0`, `#b78cff` | `--color-violet` (legacy name), `--color-moss` | `#6E8A4F` |
| **Cyan** | `#22d3ee`, `#0891b2`, `#5eead4` | `--color-cyan` (legacy name), `--color-sage` | `#A9B887` |
| Brand gradient text | pink → violet → cyan | `.text-gradient` | `#2E3D28 → #4F6B3A → #6E8A4F` (dark: `#E8E9DF → #D7E0C1 → #A9B887`) |
| 404 numerals | pink → cyan | `.text-gradient-404` | `#2E3D28 → #6E8A4F` |
| Orbit core / glows | `#ff9ad2 → #d6208f → #4b1fa8` | `.orbit-core` | `#D7E0C1 → #A9B887 → #6E8A4F` |
| Aurora blobs | `#d6208f`, `#6d4de0`, `#0891b2` | `.aurora-light` / `.aurora-dark` | see spec |
| Success | `#14803f`, `#6ee7a0` | `--success*` | `#4F6B3A`, text `#2E3D28` / `#D7E0C1` |
| Danger | `#c9303a`, `#ff8a8f` | `--danger*` | `#A63A28`, soft `#F0D5CE`, text `#7A2A1B` / dark soft `#7A2A1B`, text `#F0D5CE` |
| Warning | `#f5c26b` | `--warning*` | soft `#EBDDB0`, text `#7A4E0E` / dark soft `#7A4E0E`, text `#EBDDB0` |
| **/core blue** | `#1a5fa8` | `--core-primary`, `--color-core-*` | `#2E3D28` buttons, light surfaces, sidebar `theme-dark bar-dark` (`#2E3D28`); charts use `CHART.series` in `theme.ts` |
| Selection | magenta | `::selection` | `#A9B887` on `#111111` |
| Focus ring | `#ff6ab9` | `--ring` | `#4F6B3A` / `#A9B887` |
| Dialog overlay | black | `.overlay-dark` | `#1F2A1B` 55% + blur |

## Contrast (computed by `scripts/contrast.py`)

| # | Where | Text / UI | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|---|
| 1 | Body text on page | `#111111` | `#E8E9DF` | 15.42 | 4.5 | PASS |
| 2 | Body text on card (paper) | `#111111` | `#F3F4EC` | 17.05 | 4.5 | PASS |
| 3 | Heading on page | `#2E3D28` | `#E8E9DF` | 9.45 | 4.5 | PASS |
| 4 | Heading on card | `#2E3D28` | `#F3F4EC` | 10.45 | 4.5 | PASS |
| 5 | Muted text on page | `#3C4F34` | `#E8E9DF` | 7.27 | 4.5 | PASS |
| 6 | Muted text on card | `#3C4F34` | `#F3F4EC` | 8.03 | 4.5 | PASS |
| 7 | Muted text on sage-200 (subtle/hover) | `#3C4F34` | `#D7E0C1` | 6.49 | 4.5 | PASS |
| 8 | Link / primary-text on page | `#4F6B3A` | `#E8E9DF` | 4.91 | 4.5 | PASS |
| 9 | Link / primary-text on card | `#4F6B3A` | `#F3F4EC` | 5.42 | 4.5 | PASS |
| 10 | Chip text on sage-200 (forced deep olive) | `#2E3D28` | `#D7E0C1` | 8.44 | 4.5 | PASS |
| 11 | Primary button | `#E8E9DF` | `#2E3D28` | 9.45 | 4.5 | PASS |
| 12 | Primary button hover | `#E8E9DF` | `#3C4F34` | 7.27 | 4.5 | PASS |
| 13 | Secondary button | `#111111` | `#A9B887` | 8.90 | 4.5 | PASS |
| 14 | Secondary button hover | `#2E3D28` | `#D7E0C1` | 8.44 | 4.5 | PASS |
| 15 | Destructive button / error toast | `#E8E9DF` | `#A63A28` | 5.27 | 4.5 | PASS |
| 16 | Danger text on page | `#A63A28` | `#E8E9DF` | 5.27 | 4.5 | PASS |
| 17 | Danger text on card | `#7A2A1B` | `#F3F4EC` | 8.72 | 4.5 | PASS |
| 18 | Input text | `#111111` | `#F3F4EC` | 17.05 | 4.5 | PASS |
| 19 | Input placeholder (muted) | `#3C4F34` | `#F3F4EC` | 8.03 | 4.5 | PASS |
| 20 | Input border on card (UI) | `#6E8A4F` | `#F3F4EC` | 3.50 | 3 | PASS |
| 21 | Input border on page (UI) | `#6E8A4F` | `#E8E9DF` | 3.17 | 3 | PASS |
| 22 | Focus ring on page (UI) | `#4F6B3A` | `#E8E9DF` | 4.91 | 3 | PASS |
| 23 | Focus ring on card (UI) | `#4F6B3A` | `#F3F4EC` | 5.42 | 3 | PASS |
| 24 | Success button / success toast | `#E8E9DF` | `#4F6B3A` | 4.91 | 4.5 | PASS |
| 25 | Success text on soft | `#2E3D28` | `#D7E0C1` | 8.44 | 4.5 | PASS |
| 26 | Warning text on amber tint | `#7A4E0E` | `#EBDDB0` | 5.30 | 4.5 | PASS |
| 27 | Danger text on brick tint | `#7A2A1B` | `#F0D5CE` | 6.95 | 4.5 | PASS |
| 28 | Badge Registered | `#2E3D28` | `#D7E0C1` | 8.44 | 4.5 | PASS |
| 29 | Badge Attended | `#E8E9DF` | `#2E3D28` | 9.45 | 4.5 | PASS |
| 30 | Badge Waiting for club check | `#7A4E0E` | `#EBDDB0` | 5.30 | 4.5 | PASS |
| 31 | Badge Report open | `#7A2A1B` | `#F0D5CE` | 6.95 | 4.5 | PASS |
| 32 | Badge Report reviewing | `#7A4E0E` | `#EBDDB0` | 5.30 | 4.5 | PASS |
| 33 | Badge Report resolved | `#2E3D28` | `#D7E0C1` | 8.44 | 4.5 | PASS |
| 34 | Badge Report dismissed | `#2E3D28` | `#D6D8C9` | 8.01 | 4.5 | PASS |
| 35 | Muted text on dismissed | `#3C4F34` | `#D6D8C9` | 6.15 | 4.5 | PASS |
| 36 | Selection text | `#111111` | `#A9B887` | 8.90 | 4.5 | PASS |
| 37 | Logo letter on tile | `#2E3D28` | `#A9B887` | 5.45 | 4.5 | PASS |
| 38 | Orbit core letter (large) | `#2E3D28` | `#A9B887` | 5.45 | 3 | PASS |
| 39 | Text on skeleton shimmer | `#111111` | `#DFE1D2` | 14.24 | 4.5 | PASS |
| 40 | Big 404 numerals start (large) | `#2E3D28` | `#E8E9DF` | 9.45 | 3 | PASS |
| 41 | Big 404 numerals end (large) | `#6E8A4F` | `#E8E9DF` | 3.17 | 3 | PASS |
| 42 | Gradient headline end (large) | `#6E8A4F` | `#E8E9DF` | 3.17 | 3 | PASS |
| 43 | Chart series #2E3D28 on paper (UI) | `#2E3D28` | `#F3F4EC` | 10.45 | 3 | PASS |
| 44 | Chart series #4F6B3A on paper (UI) | `#4F6B3A` | `#F3F4EC` | 5.42 | 3 | PASS |
| 45 | Chart series #6E8A4F on paper (UI) | `#6E8A4F` | `#F3F4EC` | 3.50 | 3 | PASS |
| 46 | Chart axis text on paper | `#3C4F34` | `#F3F4EC` | 8.03 | 4.5 | PASS |
| 47 | Dark: body text on stage | `#E8E9DF` | `#1F2A1B` | 12.21 | 4.5 | PASS |
| 48 | Dark: body text on bar / card | `#E8E9DF` | `#2E3D28` | 9.45 | 4.5 | PASS |
| 49 | Dark: muted text on stage | `#D7E0C1` | `#1F2A1B` | 10.90 | 4.5 | PASS |
| 50 | Dark: muted text on bar / card | `#D7E0C1` | `#2E3D28` | 8.44 | 4.5 | PASS |
| 51 | Dark: muted text on subtle | `#D7E0C1` | `#3C4F34` | 6.49 | 4.5 | PASS |
| 52 | Dark: link on stage | `#A9B887` | `#1F2A1B` | 7.04 | 4.5 | PASS |
| 53 | Dark: link on bar / card | `#A9B887` | `#2E3D28` | 5.45 | 4.5 | PASS |
| 54 | Dark: primary button | `#2E3D28` | `#A9B887` | 5.45 | 4.5 | PASS |
| 55 | Dark: chip text on stage-soft | `#A9B887` | `#1F2A1B` | 7.04 | 4.5 | PASS |
| 56 | Dark: danger text on stage | `#F0D5CE` | `#1F2A1B` | 10.76 | 4.5 | PASS |
| 57 | Dark: danger text on danger-soft | `#F0D5CE` | `#7A2A1B` | 6.95 | 4.5 | PASS |
| 58 | Dark: warning text on warning-soft | `#EBDDB0` | `#7A4E0E` | 5.30 | 4.5 | PASS |
| 59 | Dark: success text on success-soft | `#D7E0C1` | `#3C4F34` | 6.49 | 4.5 | PASS |
| 60 | Dark: active nav underline (UI) | `#A9B887` | `#2E3D28` | 5.45 | 3 | PASS |
| 61 | Dark: focus ring on stage (UI) | `#A9B887` | `#1F2A1B` | 7.04 | 3 | PASS |
| 62 | Dark: focus ring on bar (UI) | `#A9B887` | `#2E3D28` | 5.45 | 3 | PASS |
| 63 | Dark: border on stage (UI, decorative) | `#485542` | `#1F2A1B` | 1.89 | 1 | PASS |
| 64 | Dark: neutral toast | `#E8E9DF` | `#2E3D28` | 9.45 | 4.5 | PASS |
| 65 | Dark: gradient headline end (large) | `#A9B887` | `#1F2A1B` | 7.04 | 3 | PASS |
| 66 | Dark: shimmer base text | `#E8E9DF` | `#3C4F34` | 7.27 | 4.5 | PASS |
| 67 | SKIP label on brick end of slide track | `#E8E9DF` | `#A63A28` | 5.27 | 4.5 | PASS |
| 68 | MATCH label / funnel / heatmap text on moss | `#111111` | `#6E8A4F` | 4.87 | 4.5 | PASS |
| 69 | MATCH label on sage | `#111111` | `#A9B887` | 8.90 | 4.5 | PASS |
| 70 | Heatmap text on sage-200 | `#111111` | `#D7E0C1` | 13.78 | 4.5 | PASS |
| 71 | Why-you-match label (deep olive) on sage-200 | `#2E3D28` | `#D7E0C1` | 8.44 | 4.5 | PASS |
| 72 | Chip text on sage-200 over soft white card | `#2E3D28` | `#DDE5CA` | 8.89 | 4.5 | PASS |
| 73 | Chart amber series on paper (UI) | `#7A4E0E` | `#F3F4EC` | 6.49 | 3 | PASS |
| 74 | Chart brick series on paper (UI) | `#A63A28` | `#F3F4EC` | 5.82 | 3 | PASS |
| 75 | Chart neutral series on paper (UI) | `#485542` | `#F3F4EC` | 7.15 | 3 | PASS |
| 76 | Core sidebar link on deep olive | `#D7E0C1` | `#2E3D28` | 8.44 | 4.5 | PASS |
| 77 | Core sidebar active item on olive-900 | `#A9B887` | `#1F2A1B` | 7.04 | 4.5 | PASS |
| 78 | Avatar initial on moss-dark | `#E8E9DF` | `#4F6B3A` | 4.91 | 4.5 | PASS |
| 79 | Avatar initial on olive-700 | `#E8E9DF` | `#3C4F34` | 7.27 | 4.5 | PASS |
| 80 | Avatar initial on brick | `#E8E9DF` | `#A63A28` | 5.27 | 4.5 | PASS |
| 81 | Avatar initial on sage | `#2E3D28` | `#A9B887` | 5.45 | 4.5 | PASS |
| 82 | Remove-screenshot button | `#E8E9DF` | `#2E3D28` | 9.45 | 4.5 | PASS |
| 83 | Warning banner on dark stage | `#EBDDB0` | `#7A4E0E` | 5.30 | 4.5 | PASS |

**Never use as normal text:**

| Text | Background | Ratio |
|---|---|---|
| `#E8E9DF` | `#A9B887` | 1.73 |
| `#A9B887` | `#E8E9DF` | 1.73 |
| `#6E8A4F` | `#2E3D28` | 2.98 |
| `#4F6B3A` | `#D7E0C1` | 4.38 |
| `#A9B887` | `#3C4F34` | 4.19 |

83 pairs checked, 0 failing.

## Files and order

1. Replace `src/app/globals.css` (everything the old file had is kept and recoloured: rise, reveal, tilt, marquee, orbit, confetti, reduced motion).
2. Replace `src/components/aurora-background.tsx` (adds `variant`, default `"light"`, so the existing `<AuroraBackground />` in `layout.tsx` keeps working).
3. Add `src/lib/theme.ts`.
4. Open `theme-preview.html` in a browser to check the look. Re-create it any time with `python3 scripts/build-preview.py`.
5. Checks: `python3 scripts/contrast.py` and `python3 scripts/audit-hex.py`.

## How to use in the next step (components)

- Dark sections: add `theme-dark` (navbar and footer: `theme-dark bar-dark`). Slide-to-match page: `theme-dark stage-dark` with `<AuroraBackground variant="dark" />`.
- Glows: `glow-match`, `glow-skip`, `glow-match-knob`, `glow-skip-knob`, `knob-track`, `bar-fill`, `hover-lift`, `shimmer-light`, `shimmer-dark`, `overlay-dark`.

## Defaults I chose (please confirm)

1. Old tokens `violet` and `cyan` keep their names but are olive now, so existing `to-violet` / `from-cyan` gradients compile. Remove after migration.
2. In this app `text-muted` is a TEXT colour, so shadcn's `bg-muted` is not exposed as a utility (the raw `--muted` variable exists).
3. `primary-soft` is Sage-200. `#4F6B3A` on it is only 4.38:1, so a rule in globals.css forces `#2E3D28` for `text-primary-text` on those fills.
4. Borders default to Line on light `#CED1C5`; Line on paper `#D7DAD1` is available as `--line-paper` / `--color-line-paper`.
5. Dark chips use `#1F2A1B` because `#A9B887` on `#3C4F34` is only 4.19:1.
6. The marquee mask used `#000`; it now uses `#111111` (only its transparency matters).
7. Not yet changed (component files, next step): hard-coded colours in `site-header.tsx`, `match/*`, `core/core-shell.tsx`, `core/charts.tsx`, `analytics-view.tsx`, `layout.tsx`, `text-white` classes (use `text-primary-foreground`), and `dialog.tsx` overlay.

## Changes since the first foundation

- `.theme-dark` now only swaps colours (it no longer paints a background). Use `bar-dark` for the olive bar and `stage-dark` for the dark stage.
- New `.theme-light` puts soft white cards back on a dark stage (used by the match profile card).
- New `--chip-text` variable so sage chips keep deep olive text in light areas and sage text in dark areas.
- `.knob-track` keeps the skip end flat brick for the first 30% so the SKIP label stays above 4.5:1.
- New helper shadows and mesh classes: `shadow-knob`, `shadow-inset-track`, `shadow-dock`, `shadow-note`, `shadow-ring-glow`, `shadow-ring-glow-soft`, `hero-mesh`, `hero-grid`, `aurora-contained`.
- Tailwind default shadows (`shadow-sm` to `shadow-xl`) are tinted deep olive instead of black.
- Legacy `--color-violet` and `--color-cyan` are removed.
