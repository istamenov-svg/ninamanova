# ninamanova.com

Static site for Nina Manova, hosted on GitHub Pages (repo `istamenov-svg/ninamanova`, custom domain via `CNAME`).
No build step is needed on GitHub: every page is plain HTML.

## Structure

| URL | File |
| --- | --- |
| / | index.html |
| /classical-pilates/ | classical-pilates/index.html |
| /nourishment/ | nourishment/index.html |
| /about/ | about/index.html |
| /journal/ | journal/index.html |
| /journal/<slug>/ | journal/<slug>/index.html (3 articles) |
| /begin/ | begin/index.html (consultation form) |
| /privacy/ | privacy/index.html |
| any unknown path | 404.html |

Assets live in `/assets/css`, `/assets/js`, `/assets/img`.

## Do not break

- `CNAME` must stay at the repo root.
- Google tag `AW-18467051626` is in the `<head>` of every page.
- Form posts to Formspree `f/xnjbbked` with fields firstName, lastName, email, phone, interest, location, message (plus frequency, nourishment, smsConsent, source).
- Conversion fires only after Formspree returns ok, in this order: `gtag('set','user_data',…)` then `gtag('event','conversion',{send_to:'AW-18467051626/zCDyCM_TpYEdEOqw4-VE'})`. Code: `assets/js/site.js`.
- The chat submits through the same form endpoint and fires the same conversion. A per-session flag stops one visitor counting twice.
- Google Ads call tracking: `gtag('config','AW-18467051626/ujg7CJiLvIgdEOqw4-VE',{'phone_conversion_number':'(754) 999-0699'})` in every page head (generated from `build_prod.py`). The number shown must stay exactly `(754) 999-0699`.
- GA4 (`G-J1ZRW0LNW8`) events, sent only to GA4 via `gaEvent` in `site.js`. New events go through `gaEvent` and stay outside the conversion function (`fireConversion`). No names, emails, phone numbers or messages go to GA4.
  - `generate_lead` {`lead_source`: `website form` or `chat`; `interest`; `service_location`; `value` 230 + `currency` USD (LEAD_VALUE)}: fired inside the conversion function, so at most once per session. Key event.
  - `phone_click` {`link_location`}: tap on any `tel:` link. Key event.
  - `cta_click` {`cta_type`: `consult_link` | `chat_button`; `link_location`; `link_text` (first 40 chars)}: links to /begin/, `[data-chat]` buttons, and `#chatBtn` when it opens the chat.
  - `form_start` {`form_name`: `consultation`}: first focus or input in `form.lead`, once per page view.
  - `form_error` {`form_name`: `consultation` | `chat`; `error_type`: `validation` | `network`; `field`}: validation once per field per page view; network on every Formspree failure.
  - `chat_open` (first open per page), `chat_engaged` (first answer in the chat, once per session; no longer a key event).
  - `chat_step` {`step`; `in_area`}: `format` (`in_area: online` when Online), `zip` (`in_area`: `yes` | `no`), `where`, `nourish`, `contact_shown`, `contact_submitted`, `live_started`. Each once per session.
  - `chat_message_sent`: first live message the visitor sends, once per session.
  - `review_click` {`link_location`: `home_reviews` | `begin_reviews`; `link_text`: `read_all` | `leave_review` | `card`}: clicks on `[data-review-link]` in the Google reviews section (homepage) and strip (/begin/).
  - `scroll_depth` {`percent_scrolled`: 25 | 50 | 75}: once per threshold per page view (enhanced measurement sends `scroll` at 90).
  - `link_location` values (shared `where()` helper): nav, hero, mobile_bar, footer, chat, page.
- Internal traffic: every page head sets `traffic_type: internal` before the first `gtag('config')` when localStorage `nm_internal` is `1`. Open any page with `?internal=1` once per browser to mark it, `?internal=0` to clear. Internal browsers also skip Microsoft Clarity. Head markup is applied by `scripts/apply_tracking_markup.py` (idempotent).
- Microsoft Clarity (`CLARITY_ID` in `site.js`, project `zfuo624ro1`): the chat (`#chat`, `#msgs`) and `form.lead` carry `data-clarity-mask="true"`. Disclosed on /privacy/.
- Formspree auto-response (Professional plan, form `xnjbbked`) emails every form and chat lead; it is sent from Formspree's domain, so it can land in spam. The thank-you text in `site.js` (`CONFIRM_NOTE`) tells the visitor to check spam. If the auto-response is ever switched off, remove that note.
- Old hash links (#movement, #nutrition, #about, #blog, #contact) redirect from the homepage to the new pages.
- Google Ads final URL stays https://ninamanova.com/.

## Verify

Run before every push that touches tracking, page heads or `site.js`; both must exit 0.

```
node --check assets/js/site.js
python3 scripts/check_tracking.py
```

`check_tracking.py` asserts every page has the GA4 config, the Google Ads call-tracking config with (754) 999-0699 and the internal-traffic flag before the first config; that `site.js` contains every GA4 event and chat step; and that `gtag('set','user_data')` still precedes the Ads conversion event.

## Known measurement leaks

Not fixable in code; recorded so the conversion numbers are read correctly.

- **A phone number typed into a chat reply.** If Nina types (754) 999-0699 into a chat reply from Telegram, it reaches the visitor as raw text and is never swapped by the Google Ads call tag (`phone_conversion_number`), so a call made from it is untracked. Mitigation: in chat replies, point the visitor at the call button (header, or the Call bar on mobile) instead of typing the number.
- The site's own chat prompt does not leak: `assets/js/site.js` reads the number from the header call link at the moment the prompt renders and outputs it as a `tel:` link, so it shows whatever the call tag put in the header (the swapped number for ad traffic, the real one otherwise).

## Settings to fill in

- `assets/js/site.js` → `LEAD_VALUE`: `230` (USD), the 3-session introductory package most clients start with (decided by Ivan 2026-11-18). Adds `value` and `currency` to `generate_lead` only; `phone_click` carries no value. 10-packs and repeat purchases are not in the value (no data yet). Set to `null` to remove.
- `assets/js/site.js` → `CLARITY_ID`: Microsoft Clarity project ID; empty turns Clarity off.
- `assets/js/site.js` → `CHAT_API`: URL of the chat worker (see `chat-worker/SETUP.md` in the build folder). Empty = the chat ends after the questions with an email confirmation; set = visitors keep chatting and Nina replies from Telegram, invisibly to the visitor.

## Before launch

1. Replace AI placeholder photos in `/assets/img` with the real shoot (same file names, 1600px+ wide).
2. Submit the form on desktop and phone; in DevTools → Network confirm a request to `googleadservices.com` containing `label=zCDyCM_TpYEdEOqw4-VE` and an `em=` parameter. Repeat through the chat.
3. Confirm the Formspree email arrives with all fields.
4. Open https://ninamanova.com/#movement and check it lands on /classical-pilates/.
5. In Search Console, submit `sitemap.xml`.
