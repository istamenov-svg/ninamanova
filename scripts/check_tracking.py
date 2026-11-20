"""Check that tracking on ninamanova.com is intact. Stdlib only; exits 1 with a message on any failure.

(a) every *.html has the GA4 config, the Google Ads call-tracking config with (754) 999-0699,
    and the nm_internal snippet before the first gtag('config'...).
(b) assets/js/site.js contains every GA4 event name.
(c) in site.js, gtag('set','user_data' comes before gtag('event','conversion', both inside fireConversion,
    the CONVERSION constant is unchanged, and fireConversion runs only after Formspree returns ok.
(d) #chat, #msgs and form.lead carry data-clarity-mask="true" on every page that has them.
Usage: python3 scripts/check_tracking.py   (from the repo root or anywhere)
"""
import pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
GA4_CFG = "gtag('config','G-J1ZRW0LNW8')"
CALL_CFG = "gtag('config','AW-18467051626/ujg7CJiLvIgdEOqw4-VE',{'phone_conversion_number':'(754) 999-0699'})"
ADS_CFG = "gtag('config','AW-18467051626')"
INTERNAL = "localStorage.getItem('nm_internal')==='1')gtag('set',{traffic_type:'internal'})"
EVENTS = ['generate_lead', 'phone_click', 'chat_open', 'chat_engaged', 'cta_click', 'form_start',
          'form_error', 'chat_step', 'chat_message_sent', 'scroll_depth', 'review_click']
STEPS = ['format', 'zip', 'where', 'nourish', 'contact_shown', 'contact_submitted', 'live_started']

errors = []
pages = [p for p in sorted(root.rglob('*.html')) if '.git' not in p.parts and 'node_modules' not in p.parts]
if not pages:
    errors.append('no *.html files found')
for p in pages:
    rel = p.relative_to(root)
    s = p.read_text(encoding='utf-8')
    for needle, label in ((GA4_CFG, 'GA4 config'), (ADS_CFG, 'Ads config'), (CALL_CFG, 'call-tracking config')):
        if needle not in s:
            errors.append(f'{rel}: missing {label}')
    for tag_re, label in ((r'<div[^>]*\bid="chat"[^>]*>', '#chat'), (r'<div[^>]*\bid="msgs"[^>]*>', '#msgs'),
                          (r'<form[^>]*\bclass="lead"[^>]*>', 'form.lead')):
        for m in re.finditer(tag_re, s):
            if 'data-clarity-mask="true"' not in m.group(0):
                errors.append(f'{rel}: {label} lacks data-clarity-mask="true"')
    i, c = s.find(INTERNAL), s.find("gtag('config'")
    if i < 0:
        errors.append(f'{rel}: missing nm_internal snippet')
    elif c < 0 or i > c:
        errors.append(f'{rel}: nm_internal snippet is not before the first gtag config')

js = (root / 'assets/js/site.js').read_text(encoding='utf-8')
for ev in EVENTS:
    if f"'{ev}'" not in js:
        errors.append(f'site.js: event {ev} not found')
for st in STEPS:
    if f"chatStep('{st}'" not in js:
        errors.append(f'site.js: chat_step {st} not found')
u, v = js.find("gtag('set','user_data'"), js.find("gtag('event','conversion'")
if u < 0 or v < 0:
    errors.append('site.js: user_data set or conversion event missing')
elif u > v:
    errors.append("site.js: gtag('set','user_data') must come before gtag('event','conversion')")
if "var CONVERSION = 'AW-18467051626/zCDyCM_TpYEdEOqw4-VE';" not in js:
    errors.append('site.js: CONVERSION constant changed')
fc = re.search(r"function fireConversion\(.*?\n  \}", js, re.S)
if not fc or "gtag('set','user_data'" not in fc.group(0) or "gtag('event','conversion',{send_to:CONVERSION})" not in fc.group(0):
    errors.append('site.js: user_data set and conversion event must both sit inside fireConversion')
if "if(!r.ok)throw" not in js or js.find("if(!r.ok)throw") > js.find("fireConversion(fields.email"):
    errors.append('site.js: conversion must fire only after Formspree returns ok')
if "gtag('event','conversion',{send_to:CONVERSION})" not in js:
    errors.append('site.js: Google Ads conversion call changed')

if errors:
    print('FAIL\n' + '\n'.join(errors))
    sys.exit(1)
print(f'OK: {len(pages)} pages, {len(EVENTS)} events, {len(STEPS)} chat steps, conversion order intact')
