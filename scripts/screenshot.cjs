const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const [,, out, w, h, ...pages] = process.argv;
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: +w < 600, hasTouch: +w < 600 });
  await ctx.addInitScript(() => { try { localStorage.setItem('pom_session', JSON.stringify({name:'Victor',email:'v@x.com'})); } catch {} });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  for (const pg of pages) {
    await p.goto('http://localhost:4173/' + pg, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in')));
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `${out}-${pg.replace('.html','')}.png`, fullPage: true });
  }
  console.log('errors:', errs);
  await b.close();
})();
