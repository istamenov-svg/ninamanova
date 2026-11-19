"""Apply tracking markup to every *.html page (idempotent, stdlib only).

1. Internal-traffic flag in the inline gtag head snippet, before the first gtag('config'...):
   ?internal=1 sets localStorage nm_internal, ?internal=0 clears it; when set, GA4 gets traffic_type=internal.
2. data-clarity-mask="true" on the chat (#chat, #msgs) and the consultation form (form.lead).
Usage: python3 scripts/apply_tracking_markup.py   (run from the repo root)
"""
import pathlib, sys

INTERNAL = ("try{var q=location.search;if(/[?&]internal=1/.test(q))localStorage.setItem('nm_internal','1');"
            "if(/[?&]internal=0/.test(q))localStorage.removeItem('nm_internal');"
            "if(localStorage.getItem('nm_internal')==='1')gtag('set',{traffic_type:'internal'})}catch(e){}")
ANCHOR = "gtag('js',new Date());"
MASKS = [
    ('<div class="chat" id="chat" ', '<div class="chat" id="chat" data-clarity-mask="true" '),
    ('<div class="msgs" id="msgs" ', '<div class="msgs" id="msgs" data-clarity-mask="true" '),
    ('<form class="lead" ', '<form class="lead" data-clarity-mask="true" '),
]

root = pathlib.Path(__file__).resolve().parent.parent
bad = 0
for p in sorted(root.rglob('*.html')):
    if '.git' in p.parts or 'node_modules' in p.parts:
        continue
    s = p.read_text(encoding='utf-8')
    orig = s
    if INTERNAL not in s:
        if s.count(ANCHOR) != 1:
            print(f'SKIP {p.relative_to(root)}: gtag js anchor found {s.count(ANCHOR)} times'); bad += 1; continue
        s = s.replace(ANCHOR, ANCHOR + INTERNAL)
    for old, new in MASKS:
        if new not in s and old in s:
            s = s.replace(old, new, 1)
    if s != orig:
        p.write_text(s, encoding='utf-8', newline='')
        print(f'updated {p.relative_to(root)}')
sys.exit(1 if bad else 0)
