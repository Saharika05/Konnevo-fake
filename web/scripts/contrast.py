#!/usr/bin/env python3
"""WCAG contrast for every text/background pair in the konnevo olive theme.
Run: python3 scripts/contrast.py            (prints markdown, exits 1 if a pair fails)
"""
import sys

def lum(h):
    h = h.lstrip("#")
    c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

# (where, fg, bg, need)  need = 4.5 normal text, 3.0 large text / UI
P = []
def add(where, fg, bg, need=4.5): P.append((where, fg, bg, need))

# Light
add("Body text on page", "#111111", "#E8E9DF")
add("Body text on card (paper)", "#111111", "#F3F4EC")
add("Heading on page", "#2E3D28", "#E8E9DF")
add("Heading on card", "#2E3D28", "#F3F4EC")
add("Muted text on page", "#3C4F34", "#E8E9DF")
add("Muted text on card", "#3C4F34", "#F3F4EC")
add("Muted text on sage-200 (subtle/hover)", "#3C4F34", "#D7E0C1")
add("Link / primary-text on page", "#4F6B3A", "#E8E9DF")
add("Link / primary-text on card", "#4F6B3A", "#F3F4EC")
add("Chip text on sage-200 (forced deep olive)", "#2E3D28", "#D7E0C1")
add("Primary button", "#E8E9DF", "#2E3D28")
add("Primary button hover", "#E8E9DF", "#3C4F34")
add("Secondary button", "#111111", "#A9B887")
add("Secondary button hover", "#2E3D28", "#D7E0C1")
add("Destructive button / error toast", "#E8E9DF", "#A63A28")
add("Danger text on page", "#A63A28", "#E8E9DF")
add("Danger text on card", "#7A2A1B", "#F3F4EC")
add("Input text", "#111111", "#F3F4EC")
add("Input placeholder (muted)", "#3C4F34", "#F3F4EC")
add("Input border on card (UI)", "#6E8A4F", "#F3F4EC", 3.0)
add("Input border on page (UI)", "#6E8A4F", "#E8E9DF", 3.0)
add("Focus ring on page (UI)", "#4F6B3A", "#E8E9DF", 3.0)
add("Focus ring on card (UI)", "#4F6B3A", "#F3F4EC", 3.0)
add("Success button / success toast", "#E8E9DF", "#4F6B3A")
add("Success text on soft", "#2E3D28", "#D7E0C1")
add("Warning text on amber tint", "#7A4E0E", "#EBDDB0")
add("Danger text on brick tint", "#7A2A1B", "#F0D5CE")
add("Badge Registered", "#2E3D28", "#D7E0C1")
add("Badge Attended", "#E8E9DF", "#2E3D28")
add("Badge Waiting for club check", "#7A4E0E", "#EBDDB0")
add("Badge Report open", "#7A2A1B", "#F0D5CE")
add("Badge Report reviewing", "#7A4E0E", "#EBDDB0")
add("Badge Report resolved", "#2E3D28", "#D7E0C1")
add("Badge Report dismissed", "#2E3D28", "#D6D8C9")
add("Muted text on dismissed", "#3C4F34", "#D6D8C9")
add("Selection text", "#111111", "#A9B887")
add("Logo letter on tile", "#2E3D28", "#A9B887")
add("Orbit core letter (large)", "#2E3D28", "#A9B887", 3.0)
add("Text on skeleton shimmer", "#111111", "#DFE1D2")
add("Big 404 numerals start (large)", "#2E3D28", "#E8E9DF", 3.0)
add("Big 404 numerals end (large)", "#6E8A4F", "#E8E9DF", 3.0)
add("Gradient headline end (large)", "#6E8A4F", "#E8E9DF", 3.0)
# Charts
for c in ("#2E3D28", "#4F6B3A", "#6E8A4F"):
    add(f"Chart series {c} on paper (UI)", c, "#F3F4EC", 3.0)
add("Chart axis text on paper", "#3C4F34", "#F3F4EC")
# Dark
add("Dark: body text on stage", "#E8E9DF", "#1F2A1B")
add("Dark: body text on bar / card", "#E8E9DF", "#2E3D28")
add("Dark: muted text on stage", "#D7E0C1", "#1F2A1B")
add("Dark: muted text on bar / card", "#D7E0C1", "#2E3D28")
add("Dark: muted text on subtle", "#D7E0C1", "#3C4F34")
add("Dark: link on stage", "#A9B887", "#1F2A1B")
add("Dark: link on bar / card", "#A9B887", "#2E3D28")
add("Dark: primary button", "#2E3D28", "#A9B887")
add("Dark: chip text on stage-soft", "#A9B887", "#1F2A1B")
add("Dark: danger text on stage", "#F0D5CE", "#1F2A1B")
add("Dark: danger text on danger-soft", "#F0D5CE", "#7A2A1B")
add("Dark: warning text on warning-soft", "#EBDDB0", "#7A4E0E")
add("Dark: success text on success-soft", "#D7E0C1", "#3C4F34")
add("Dark: active nav underline (UI)", "#A9B887", "#2E3D28", 3.0)
add("Dark: focus ring on stage (UI)", "#A9B887", "#1F2A1B", 3.0)
add("Dark: focus ring on bar (UI)", "#A9B887", "#2E3D28", 3.0)
add("Dark: border on stage (UI, decorative)", "#485542", "#1F2A1B", 1.0)
add("Dark: neutral toast", "#E8E9DF", "#2E3D28")
add("Dark: gradient headline end (large)", "#A9B887", "#1F2A1B", 3.0)
add("Dark: shimmer base text", "#E8E9DF", "#3C4F34")

# Added in step 2 (components)
add("SKIP label on brick end of slide track", "#E8E9DF", "#A63A28")
add("MATCH label / funnel / heatmap text on moss", "#111111", "#6E8A4F")
add("MATCH label on sage", "#111111", "#A9B887")
add("Heatmap text on sage-200", "#111111", "#D7E0C1")
add("Why-you-match label (deep olive) on sage-200", "#2E3D28", "#D7E0C1")
add("Chip text on sage-200 over soft white card", "#2E3D28", "#DDE5CA")
add("Chart amber series on paper (UI)", "#7A4E0E", "#F3F4EC", 3.0)
add("Chart brick series on paper (UI)", "#A63A28", "#F3F4EC", 3.0)
add("Chart neutral series on paper (UI)", "#485542", "#F3F4EC", 3.0)
add("Core sidebar link on deep olive", "#D7E0C1", "#2E3D28")
add("Core sidebar active item on olive-900", "#A9B887", "#1F2A1B")
add("Avatar initial on moss-dark", "#E8E9DF", "#4F6B3A")
add("Avatar initial on olive-700", "#E8E9DF", "#3C4F34")
add("Avatar initial on brick", "#E8E9DF", "#A63A28")
add("Avatar initial on sage", "#2E3D28", "#A9B887")
add("Remove-screenshot button", "#E8E9DF", "#2E3D28")
add("Warning banner on dark stage", "#EBDDB0", "#7A4E0E")

# Pairs that must never be used (documented, expected to fail)
NEVER = [
    ("#E8E9DF", "#A9B887"), ("#A9B887", "#E8E9DF"), ("#6E8A4F", "#2E3D28"),
    ("#4F6B3A", "#D7E0C1"), ("#A9B887", "#3C4F34"),
]

def main():
    bad = 0
    print("| # | Where | Text / UI | Background | Ratio | Needs | Result |")
    print("|---|---|---|---|---|---|---|")
    for i, (w, f, b, n) in enumerate(P, 1):
        r = ratio(f, b)
        ok = r >= n
        bad += 0 if ok else 1
        print(f"| {i} | {w} | `{f}` | `{b}` | {r:.2f} | {n:g} | {'PASS' if ok else 'FAIL'} |")
    print("\n**Never use as normal text:**\n")
    print("| Text | Background | Ratio |\n|---|---|---|")
    for f, b in NEVER:
        print(f"| `{f}` | `{b}` | {ratio(f, b):.2f} |")
    print(f"\n{len(P)} pairs checked, {bad} failing.")
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
