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
- Old hash links (#movement, #nutrition, #about, #blog, #contact) redirect from the homepage to the new pages.
- Google Ads final URL stays https://ninamanova.com/.

## Settings to fill in

- `assets/js/site.js` → `CHAT_API`: URL of the chat worker (see `chat-worker/SETUP.md` in the build folder). Empty = the chat ends after the questions with an email confirmation; set = visitors keep chatting and Nina replies from Telegram, invisibly to the visitor.

## Before launch

1. Replace AI placeholder photos in `/assets/img` with the real shoot (same file names, 1600px+ wide).
2. Submit the form on desktop and phone; in DevTools → Network confirm a request to `googleadservices.com` containing `label=zCDyCM_TpYEdEOqw4-VE` and an `em=` parameter. Repeat through the chat.
3. Confirm the Formspree email arrives with all fields.
4. Open https://ninamanova.com/#movement and check it lands on /classical-pilates/.
5. In Search Console, submit `sitemap.xml`.
