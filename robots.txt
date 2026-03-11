# Nina Manova — Movement & Longevity

Personal website for Nina Manova, a certified Pilates instructor and movement educator based in Fort Lauderdale, FL.

## Structure

```
index.html          — Full multi-page site (client-side routing)
404.html            — Custom 404 error page
sitemap.xml         — XML sitemap for search engines
robots.txt          — Crawler directives
images/             — All site images
```

## Pages

- **Home** — Hero, services (Private, Semi-Private, Online), philosophy, nourishment, about preview, CTA
- **Movement** — Pilates approach, session types, guiding principles
- **Nourishment** — Nutrition philosophy integrated with movement
- **About** — Nina's background and credentials
- **Journal** — Blog (articles coming soon)
- **Contact** — Consultation request form (powered by Formspree)

## SEO

- Per-page meta descriptions and title tags (updated dynamically via JS)
- Open Graph and Twitter Card tags
- JSON-LD LocalBusiness structured data
- Canonical tags
- Hash-based routing with browser history support
- XML sitemap and robots.txt

## Deployment

### GitHub Pages
1. Push to GitHub
2. Go to repo Settings → Pages
3. Set source to `main` branch, root (`/`)
4. Site live at `https://[username].github.io/[repo-name]`

### Custom Domain
1. Add A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
2. Add CNAME for www → [username].github.io
3. Add domain in repo Settings → Pages → Custom domain
4. Create a CNAME file in repo root with your domain
5. Update all URLs in index.html, sitemap.xml, robots.txt, and 404.html
