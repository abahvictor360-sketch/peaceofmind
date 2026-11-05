// Scrolls every page on desktop + mobile and reports any text that an image
// is drawn on top of (elementFromPoint at the text's centre returns an <img>).
// Usage: node scripts/check-overlap.cjs   (expects the site on :4173)
const { chromium } = require('playwright');
const pages = ['index.html', 'about.html', 'programs.html', 'pricing.html', 'book.html', 'login.html', 'dashboard.html'];
(async () => {
  const b = await chromium.launch();
  let total = 0;
  for (const [name, vp, mobile] of [['desktop', { width: 1440, height: 900 }, false], ['mobile', { width: 390, height: 844 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
    await ctx.addInitScript(() => { try { localStorage.setItem('pom_session', JSON.stringify({ name: 'Test', email: 't@x.com' })); } catch {} });
    const p = await ctx.newPage();
    for (const pg of pages) {
      await p.goto('http://localhost:4173/' + pg, { waitUntil: 'networkidle' });
      await p.waitForTimeout(1800);
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      const hits = new Set();
      for (let y = 0; y < H; y += vp.height / 3) {
        await p.evaluate(y => scrollTo(0, y), y);
        await p.waitForTimeout(350);
        const found = await p.evaluate(() => {
          const out = [];
          document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'));
          const els = [...document.querySelectorAll('h1,h2,h3,p,a.btn,button,li,label,span.tag,strong')];
          for (const el of els) {
            const r = el.getBoundingClientRect();
            if (!r.width || r.bottom < 0 || r.top > innerHeight || getComputedStyle(el).visibility === 'hidden') continue;
            for (const [fx, fy] of [[.5, .5], [.15, .5], [.85, .5]]) {
              const x = r.left + r.width * fx, y = r.top + r.height * fy;
              if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) continue;
              const top = document.elementFromPoint(x, y);
              if (top && top.tagName === 'IMG' && !el.contains(top)) { out.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}" under ${top.getAttribute('src').split('/').pop()}`); break; }
            }
          }
          return out;
        });
        found.forEach(f => hits.add(f));
      }
      total += hits.size;
      console.log(`${name.padEnd(7)} ${pg.padEnd(15)} ${hits.size ? '✗ ' + [...hits].join(' | ') : '✓'}`);
    }
    await ctx.close();
  }
  await b.close();
  console.log(total ? `${total} overlap(s)` : 'No text covered by images.');
})();
