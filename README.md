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
- GA4 (`G-J1ZRW0LNW8`) events, sent only to GA4 via `gaEvent` in `site.js`: `generate_lead` (`lead_source`: `website form` or `chat`, fired inside the conversion function, so at most once per session), `phone_click` (`link_location`: nav, chat, mobile_bar, footer, page), `chat_open` (first open per page), `chat_engaged` (first answer in the chat, once per session). New events go through `gaEvent` and stay outside the conversion function.
- Formspree auto-response (Professional plan, form `xnjbbked`) emails every form and chat lead; it is sent from Formspree's domain, so it can land in spam. The thank-you text in `site.js` (`CONFIRM_NOTE`) tells the visitor to check spam. If the auto-response is ever switched off, remove that note.
- Old hash links (#movement, #nutrition, #about, #blog, #contact) redirect from the homepage to the new pages.
- Google Ads final URL stays https://ninamanova.com/.

## Known measurement leaks

Not fixable in code; recorded so the conversion numbers are read correctly.

- **A phone number typed into a chat reply.** If Nina types (754) 999-0699 into a chat reply from Telegram, it reaches the visitor as raw text and is never swapped by the Google Ads call tag (`phone_conversion_number`), so a call made from it is untracked. Mitigation: in chat replies, point the visitor at the call button (header, or the Call bar on mobile) instead of typing the number.
- The site's own chat prompt does not leak: `assets/js/site.js` reads the number from the header call link at the moment the prompt renders and outputs it as a `tel:` link, so it shows whatever the call tag put in the header (the swapped number for ad traffic, the real one otherwise).

## Settings to fill in

- `assets/js/site.js` → `CHAT_API`: URL of the chat worker (see `chat-worker/SETUP.md` in the build folder). Empty = the chat ends after the questions with an email confirmation; set = visitors keep chatting and Nina replies from Telegram, invisibly to the visitor.

## Before launch

1. Replace AI placeholder photos in `/assets/img` with the real shoot (same file names, 1600px+ wide).
2. Submit the form on desktop and phone; in DevTools → Network confirm a request to `googleadservices.com` containing `label=zCDyCM_TpYEdEOqw4-VE` and an `em=` parameter. Repeat through the chat.
3. Confirm the Formspree email arrives with all fields.
4. Open https://ninamanova.com/#movement and check it lands on /classical-pilates/.
5. In Search Console, submit `sitemap.xml`.
