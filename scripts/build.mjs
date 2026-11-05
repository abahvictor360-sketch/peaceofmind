// Zero-dependency static build: wraps src/pages/*.html in the shared
// <head> (SEO + social tags), nav, menu and footer, and writes to public/.
// Usage: node scripts/build.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = process.env.SITE_URL || "https://peaceofmind-wellness.vercel.app";
const KEYWORDS = "online therapy, mental wellness, mindfulness, meditation, anxiety support, stress relief, therapist booking, self-care app, emotional wellbeing, peaceofmind";

const icons = {
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 17l5-5-5-5M13 17l5-5-5-5"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18M9 15h6"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v3M12 14v3M7 12h3M14 12h3"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.6-9 9-9 9z"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>`,
  leaf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l7-7"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6"/></svg>`,
  google: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 01-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1V17A11 11 0 0012 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 010-4.2V7.1H2.1a11 11 0 000 9.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 002.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>`,
  apple: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 00-3.8-2c-1.6-.2-3.1.9-3.9.9s-2-.9-3.4-.9a5 5 0 00-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6s1.7-.8 3.3-.8 2 .8 3.3.8 2.2-1.3 3-2.5a10 10 0 001.4-2.8 4.3 4.3 0 01-2.3-4.2zM14 5.1a4.4 4.4 0 001-3.1 4.5 4.5 0 00-2.9 1.5 4.2 4.2 0 00-1 3 3.7 3.7 0 002.9-1.4z"/></svg>`,
};
const logoMark = `<svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true"><defs><radialGradient id="lm" cx="35%" cy="30%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#f7d3a6"/><stop offset="1" stop-color="#d98a3d"/></radialGradient></defs><circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" stroke-opacity=".35"/><circle cx="16" cy="16" r="9" fill="url(#lm)"/></svg>`;

const navLinks = [["index.html", "Home"], ["about.html", "About"], ["programs.html", "Programs"], ["pricing.html", "Pricing"]];

const nav = (current, variant) => `
<header class="nav ${variant === "dark" ? "nav--dark nav--solid" : ""}">
  <div class="container nav__bar ${variant === "dark" ? "glass glass--light" : ""}">
    <nav class="nav__links" aria-label="Primary">
      ${navLinks.map(([h, l]) => `<a href="${h}"${h === current ? ' aria-current="page"' : ""}>${l}</a>`).join("")}
    </nav>
    <a class="logo" href="index.html" aria-label="peaceofmind home">${logoMark}peaceofmind</a>
    <div class="nav__actions">
      <a class="btn btn--light" href="login.html?mode=signup" data-auth-link="login.html?mode=signup"><span data-auth-label="Become a Member">Become a Member</span><span class="ico">${icons.arrow}</span></a>
      <button class="icon-btn" type="button" data-menu-open aria-label="Open menu">${icons.grid}</button>
    </div>
  </div>
</header>
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Site menu">
  <div class="menu__top"><span class="logo">${logoMark}peaceofmind</span><button class="icon-btn" type="button" data-menu-close aria-label="Close menu">${icons.close}</button></div>
  ${[...navLinks, ["book.html", "Book a Session"], ["dashboard.html", "My Dashboard"]].map(([h, l], i) => `<a class="menu__link" href="${h}">${l}<span>0${i + 1}</span></a>`).join("")}
  <div class="menu__foot">
    <a class="btn btn--light btn--block" href="login.html" data-auth-link="login.html"><span data-auth-label="Log In">Log In</span><span class="ico">${icons.arrow}</span></a>
    <a class="btn btn--glass glass btn--block" href="#" data-logout hidden>Log out<span class="ico">${icons.arrow}</span></a>
  </div>
</div>`;

const footer = `
<footer class="footer">
  <div class="container">
    <div class="footer__grid">
      <div>
        <a class="logo" href="index.html">${logoMark}peaceofmind</a>
        <p>Personalized therapy, mindfulness and evidence-based support for lasting emotional well-being — online or in person.</p>
        <form class="footer__news" aria-label="Newsletter">
          <label class="sr-only" for="news-email">Email</label>
          <input id="news-email" type="email" placeholder="Your email" required>
          <button class="btn btn--dark btn--plain" type="submit">Subscribe</button>
        </form>
      </div>
      <div><h4>Explore</h4><ul>${navLinks.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul></div>
      <div><h4>Members</h4><ul><li><a href="login.html">Log in</a></li><li><a href="login.html?mode=signup">Create account</a></li><li><a href="book.html">Book a session</a></li><li><a href="dashboard.html">Dashboard</a></li></ul></div>
      <div><h4>Support</h4><ul><li><a href="pricing.html#faq">FAQ</a></li><li><a href="mailto:hello@peaceofmind.app">hello@peaceofmind.app</a></li><li><a href="about.html#team">Our therapists</a></li><li><a href="#" onclick="return false">Crisis resources</a></li></ul></div>
    </div>
    <div class="footer__word" aria-hidden="true">peaceofmind</div>
    <div class="footer__bottom"><span>© ${new Date().getFullYear()} peaceofmind. Design & development portfolio project.</span><span>If you are in crisis, contact your local emergency number.</span></div>
  </div>
</footer>`;

// SVG filter that powers the refraction in liquid-glass panels (Chromium).
const glassFilter = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="liquid-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise"/><feGaussianBlur in="noise" stdDeviation="2" result="soft"/><feDisplacementMap in="SourceGraphic" in2="soft" scale="18" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

const head = (m, file) => {
  const url = `${SITE}/${file === "index.html" ? "" : file.replace(/\.html$/, "")}`;
  const img = `${SITE}/assets/img/og-cover.jpg`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${m.title}</title>
<meta name="description" content="${m.description}">
<meta name="keywords" content="${KEYWORDS}">
<meta name="author" content="peaceofmind">
${m.noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow">'}
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#4a1c08">
<meta property="og:type" content="website">
<meta property="og:site_name" content="peaceofmind">
<meta property="og:title" content="${m.title}">
<meta property="og:description" content="${m.description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${m.title}">
<meta name="twitter:description" content="${m.description}">
<meta name="twitter:image" content="${img}">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/styles.css">
${file === "index.html" ? `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "MedicalBusiness", name: "peaceofmind", url: SITE,
    description: m.description, image: img, priceRange: "$$",
    medicalSpecialty: "Psychiatric", availableService: ["Online therapy", "Mindfulness programs", "Stress & anxiety support"],
  })}</script>` : ""}
</head>`;
};

const pagesDir = join(root, "src/pages");
const built = [];
for (const file of readdirSync(pagesDir).filter(f => f.endsWith(".html"))) {
  const raw = readFileSync(join(pagesDir, file), "utf8");
  const metaMatch = raw.match(/^<!--\s*(\{[\s\S]*?\})\s*-->/);
  const meta = JSON.parse(metaMatch[1]);
  let body = raw.slice(metaMatch[0].length).replace(/\{\{icon:(\w+)\}\}/g, (_, n) => icons[n]);
  const html = `${head(meta, file)}
<body data-page="${meta.page}"${meta.bodyClass ? ` class="${meta.bodyClass}"` : ""}>
${glassFilter}
${meta.nav === false ? "" : nav(file, meta.nav)}
${body.trim()}
${meta.footer === false ? "" : footer}
<script src="assets/js/app.js" defer></script>
</body>
</html>
`;
  writeFileSync(join(root, "public", file), html);
  if (!meta.noindex) built.push(file);
}

writeFileSync(join(root, "public/sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${built.map(f => `  <url><loc>${SITE}/${f === "index.html" ? "" : f.replace(/\.html$/, "")}</loc></url>`).join("\n")}
</urlset>
`);
writeFileSync(join(root, "public/robots.txt"), `User-agent: *\nAllow: /\nDisallow: /dashboard\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${built.length} indexable pages →`, built.join(", "));
