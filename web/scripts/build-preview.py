#!/usr/bin/env python3
"""Builds theme-preview.html from src/app/globals.css so the preview always uses the real tokens and classes."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
css = (root / "src/app/globals.css").read_text()

def block(src, header):
    i = src.index(header); j = src.index("{", i); depth = 0
    for k in range(j, len(src)):
        depth += src[k] == "{"; depth -= src[k] == "}"
        if depth == 0: return i, j + 1, k
    raise ValueError(header)

# palette from @theme { } -> :root
i, a, b = block(css, "@theme {")
palette = ":root{" + css[a:b] + "}"
css = css[:i] + css[b + 1:]
i, a, b = block(css, "@theme inline {"); css = css[:i] + css[b + 1:]
i, a, b = block(css, "@layer base {"); css = css[:i] + css[a:b] + css[b + 1:]
css = css.replace('@import "tailwindcss";', "")

SW = [
 ("Brand", [("Soft White","#E8E9DF"),("Sage Green","#A9B887"),("Deep Olive","#2E3D28"),("Black (text only)","#111111")]),
 ("Derived", [("Paper","#F3F4EC"),("Sage-200","#D7E0C1"),("Moss","#6E8A4F"),("Moss-dark","#4F6B3A"),("Olive-700","#3C4F34"),("Olive-900","#1F2A1B"),("Line on light","#CED1C5"),("Line on paper","#D7DAD1"),("Line on dark","#485542")]),
 ("Status", [("Brick","#A63A28"),("Brick glow","#B3442F"),("Brick tint","#F0D5CE"),("Brick text","#7A2A1B"),("Amber tint","#EBDDB0"),("Amber text","#7A4E0E"),("Dismissed","#D6D8C9"),("Success","#4F6B3A")]),
 ("Match / loading", [("Knob mid","#8B9384"),("Shimmer light A","#DFE1D2"),("Shimmer light B","#EEF0E4"),("Shimmer dark A","#3C4F34"),("Shimmer dark B","#4A6040")]),
]
def txt(h):
    h=h.lstrip("#"); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=.03928 else ((x+.055)/1.055)**2.4 for x in c]; L=.2126*c[0]+.7152*c[1]+.0722*c[2]
    return "#111111" if (L+.05)/.05 > (1.05)/(L+.05) and L>0.18 else "#E8E9DF"
sw = "".join(f'<h3 class="lbl">{g}</h3><div class="sw">' + "".join(f'<div style="background:{h};color:{txt(h)}"><b>{n}</b><span>{h}</span></div>' for n,h in items) + "</div>" for g,items in SW)

page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>konnevo olive theme preview</title>
<style>
{palette}
{css}
*{{box-sizing:border-box}}
body{{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--background);color:var(--foreground)}}
main{{max-width:1100px;margin:0 auto;padding:24px 16px 80px}}
h1,h2,h3{{font-family:"Syne",system-ui,sans-serif;margin:0}}
h1{{font-size:2rem;font-weight:800}} h2{{font-size:1.35rem;margin:40px 0 12px}}
.lbl{{font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;margin:16px 0 8px;color:var(--muted-foreground)}}
.sw{{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}}
.sw div{{border-radius:12px;padding:12px;min-height:76px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid var(--border);font-size:.78rem}}
.sw b{{font-size:.8rem}}
.panel{{position:relative;overflow:hidden;border-radius:20px;border:1px solid var(--border);min-height:300px;padding:24px;isolation:isolate}}
.panel .aurora{{position:absolute;inset:0;z-index:-1}}
.row{{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0}}
.btn{{font:600 .875rem system-ui;border-radius:8px;padding:10px 16px;border:1px solid transparent;cursor:pointer;transition:background .15s}}
.btn-primary{{background:var(--primary);color:var(--primary-foreground)}}
.btn-primary:hover{{background:var(--primary-hover);color:var(--primary-foreground)}}
.btn-secondary{{background:var(--secondary);color:var(--secondary-foreground)}}
.btn-secondary:hover{{background:var(--secondary-hover);color:var(--secondary-hover-foreground)}}
.btn-danger{{background:var(--destructive);color:var(--destructive-foreground)}}
.btn-outline{{background:var(--card);color:var(--foreground);border-color:var(--border)}}
.btn-outline:hover{{background:var(--subtle)}}
a.lnk{{color:var(--link);font-weight:600}}
.inp{{background:var(--input-bg);border:1px solid var(--input);color:var(--foreground);border-radius:8px;padding:10px 12px;font:inherit;width:240px}}
.card{{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;color:var(--card-foreground)}}
.badge{{display:inline-block;border-radius:999px;padding:3px 10px;font:700 .75rem system-ui}}
.bar{{display:flex;align-items:center;gap:20px;padding:12px 16px;border-radius:12px;color:#E8E9DF}}
.bar .logo{{width:32px;height:32px;border-radius:8px;background:#A9B887;color:#2E3D28;display:grid;place-items:center;font:900 .9rem Syne,system-ui}}
.bar a{{color:#E8E9DF;text-decoration:none;font-weight:600;padding:6px 0;border-bottom:2px solid transparent}}
.bar a.on{{border-bottom-color:#A9B887}}
.swipe{{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}}
.person{{background:#E8E9DF;color:#111111;border-radius:20px;padding:20px;border:1px solid #CED1C5}}
.person h3{{color:#2E3D28}}
.track{{position:relative;height:48px;border-radius:999px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font:700 .8rem system-ui;color:#E8E9DF;margin-top:16px}}
.track span:last-child{{color:#111111}}
.knob{{position:absolute;left:50%;top:4px;width:40px;height:40px;border-radius:999px;background:#E8E9DF;color:#2E3D28;display:grid;place-items:center;font-weight:900;transform:translateX(-50%)}}
.toast{{border-radius:10px;padding:12px 16px;font-weight:600;color:#E8E9DF}}
.sk{{height:16px;border-radius:8px;margin:8px 0}}
.big404{{font:800 6rem/1 Syne,system-ui;margin:0}}
.focusdemo:focus-visible{{outline:2px solid var(--ring);outline-offset:2px}}
.fall{{position:relative;height:120px;overflow:hidden}}
</style></head>
<body><main>
<h1>konnevo olive theme preview</h1>
<p style="color:var(--muted-foreground)">Built from <code>src/app/globals.css</code>. Open in any browser. Resize to check phone width.</p>

<h2>Swatches</h2>{sw}

<h2>Light aurora, grid, controls</h2>
<div class="panel"><div class="aurora aurora-light"><span class="aurora-blob aurora-a"></span><span class="aurora-blob aurora-b"></span><span class="aurora-blob aurora-c"></span><span class="aurora-grid"></span></div>
 <h3 style="font-size:1.6rem">Find events. <span class="text-gradient">Find your squad.</span></h3>
 <p style="color:var(--muted-foreground);max-width:46ch">Body text is black or deep olive, secondary text is Olive-700 on a soft white page.</p>
 <div class="row"><button class="btn btn-primary">Primary</button><button class="btn btn-secondary">Secondary</button><button class="btn btn-danger">Delete</button><button class="btn btn-outline">Outline</button><a class="lnk" href="#">A link</a><button class="btn btn-outline focusdemo" autofocus>Tab to see the focus ring</button></div>
 <div class="row"><input class="inp" placeholder="Input on paper"><span class="badge" style="background:#D7E0C1;color:#2E3D28">Registered</span><span class="badge" style="background:#2E3D28;color:#E8E9DF">Attended</span><span class="badge" style="background:#EBDDB0;color:#7A4E0E">Waiting for club check</span></div>
 <div class="row"><span class="badge" style="background:#F0D5CE;color:#7A2A1B">Report open</span><span class="badge" style="background:#EBDDB0;color:#7A4E0E">Reviewing</span><span class="badge" style="background:#D7E0C1;color:#2E3D28">Resolved</span><span class="badge" style="background:#D6D8C9;color:#2E3D28">Dismissed</span></div>
 <div class="card hover-lift" style="max-width:340px;margin-top:12px"><b style="color:var(--heading)">Paper card with hover lift</b><p style="margin:6px 0 0;color:var(--muted-foreground)">1px line border, deep olive heading.</p></div>
</div>

<h2>Navbar and footer (deep olive)</h2>
<div class="bar bar-dark theme-dark"><span class="logo">k</span><a class="on" href="#">Events</a><a href="#">My Teams</a><a href="#">Settings</a><span style="margin-left:auto"><button class="btn btn-primary">Log in</button></span></div>

<h2>Dark aurora, slide to match</h2>
<div class="panel theme-dark"><div class="aurora aurora-dark"><span class="aurora-blob aurora-a"></span><span class="aurora-blob aurora-b"></span><span class="aurora-blob aurora-c"></span><span class="aurora-grid"></span></div>
 <h3 style="font-size:1.4rem">Slide to match</h3>
 <div class="row"><button class="btn btn-primary">Primary on dark</button><a class="lnk" href="#">Link on dark</a><span class="badge" style="background:#7A2A1B;color:#F0D5CE">Danger soft</span></div>
 <div class="swipe">
  <div><div class="person glow-skip"><h3>Skip glow</h3><p>Brick #B3442F at 45%.</p></div></div>
  <div><div class="person glow-match"><h3>Match glow</h3><p>Sage at 60%, moss edge.</p></div></div>
 </div>
 <div class="track knob-track"><span>✕ Skip</span><span class="knob glow-skip-knob">‹›</span><span>✓ Match</span></div>
 <div class="row" style="margin-top:14px"><div style="flex:1;height:10px;border-radius:999px;background:#1F2A1B;border:1px solid #485542"><div class="bar-fill" style="width:64%;height:100%;border-radius:999px"></div></div><span style="font-size:.8rem">Progress / funnel bar</span></div>
 <div class="fall" id="fall"></div>
 <button class="btn btn-primary" id="burst">Replay confetti</button>
</div>

<h2>Skeletons, toasts, 404</h2>
<div class="row" style="align-items:stretch;gap:16px">
 <div class="card" style="flex:1;min-width:240px"><div class="sk skeleton shimmer-light" style="width:70%"></div><div class="sk skeleton shimmer-light"></div><div class="sk skeleton shimmer-light" style="width:45%"></div></div>
 <div class="card theme-dark" style="flex:1;min-width:240px;background:#2E3D28"><div class="sk skeleton shimmer-dark" style="width:70%"></div><div class="sk skeleton shimmer-dark"></div><div class="sk skeleton shimmer-dark" style="width:45%"></div></div>
</div>
<div class="row"><div class="toast" style="background:#4F6B3A">Saved</div><div class="toast" style="background:#A63A28">Something went wrong</div><div class="toast" style="background:#2E3D28">Link copied</div></div>
<p class="big404 text-gradient-404">404</p>

<h2>Orbit core and tilt hover</h2>
<div class="row"><div style="position:relative;width:160px;height:160px"><div class="orbit-core">k</div></div><div class="card tilt" style="width:260px"><b>Tilt card</b><div class="tilt-glare"></div><p style="margin:6px 0 0;color:var(--muted-foreground)">Hover me.</p></div></div>
</main>
<script>
(function(){{var C=["#A9B887","#E8E9DF","#6E8A4F","#D7E0C1","#F3F4EC"];var f=document.getElementById("fall");
function go(){{f.innerHTML="";for(var i=0;i<40;i++){{var s=document.createElement("span");s.className="confetti";s.style.left=(Math.random()*100)+"%";s.style.background=C[i%C.length];s.style.setProperty("--dx",(Math.random()*120-60)+"px");s.style.animationDelay=(Math.random()*.4)+"s";f.appendChild(s)}}}}
document.getElementById("burst").onclick=go;go();}})();
</script></body></html>"""
(root / "theme-preview.html").write_text(page)
print("wrote", len(page), "bytes")
