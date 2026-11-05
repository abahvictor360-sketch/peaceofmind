# peaceofmind

A calm, modern mental-wellness website — online therapy, mindfulness programs, booking and a member dashboard — built with a warm **liquid-glass** UI.

**Pages:** Home · About · Programs · Pricing · Book a Session · Log in / Sign up · Member Dashboard · 404

## Highlights
- **Liquid glass UI** — layered translucent panels with backdrop blur, specular rims, a pointer-following highlight and real SVG refraction (`#liquid-refract`) in Chromium browsers.
- **Background-removed portraits** — hero and page visuals cut out with `rembg` (`scripts/prep_images.py`) and composited over warm gradients.
- **Full navigation flow** — mood check-in → programs → booking → login/sign-up → dashboard (sessions, weekly mood chart, box-breathing, private journal) → log out.
- **SEO-ready** — per-page titles/descriptions, Open Graph & Twitter cards, JSON-LD, sitemap.xml, robots.txt.
- **Responsive** — tuned for phones, tablets and desktop; respects `prefers-reduced-motion`.
- **Zero dependencies** — static HTML/CSS/JS; `scripts/build.mjs` wraps `src/pages/*` with shared head/nav/footer into `public/`.

> Auth is a front-end demo (accounts saved in the browser's localStorage). Connect a real backend (e.g. Supabase) before handling real client data.

## Develop
```bash
node scripts/build.mjs      # build pages into public/
npx serve public            # preview
```

## Deploy
Vercel picks up `vercel.json` (build: `node scripts/build.mjs`, output: `public`).

Fonts: Inter Tight + Geist Mono (Google Fonts).
