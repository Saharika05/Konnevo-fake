#!/usr/bin/env python3
"""Usage: audit-hex.py [folder]. Fails if any file uses a colour outside the approved list (hex, rgb/rgba, or named colours in CSS values)."""
import re, sys, pathlib
OK = {h.upper() for h in """E8E9DF A9B887 2E3D28 111111 F3F4EC D7E0C1 6E8A4F 4F6B3A 3C4F34 1F2A1B CED1C5 D7DAD1 485542
A63A28 B3442F F0D5CE 7A2A1B EBDDB0 7A4E0E D6D8C9 8B9384 DFE1D2 EEF0E4 4A6040""".split()}
root = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent
files = [p for p in root.rglob("*") if p.suffix in {".css", ".ts", ".tsx", ".html", ".svg"} and "node_modules" not in p.parts]
bad = 0
for p in files:
    t = p.read_text()
    for m in re.finditer(r"#([0-9a-fA-F]{3,8})\b", t):
        h = m.group(1).upper()
        if h not in OK:
            bad += 1; print(f"{p.relative_to(root)}: unapproved hex #{h}")
    for m in re.finditer(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", t):
        h = "%02X%02X%02X" % tuple(int(x) for x in m.groups())
        if h not in OK:
            bad += 1; print(f"{p.relative_to(root)}: unapproved rgb {m.group(0)} = #{h}")
    for m in re.finditer(r":\s*(white|black|red|blue|purple|pink|cyan|magenta|violet|teal|indigo)\b", t):
        bad += 1; print(f"{p.relative_to(root)}: named colour {m.group(0)}")
print(f"{len(files)} files scanned, {bad} problems")
sys.exit(1 if bad else 0)
