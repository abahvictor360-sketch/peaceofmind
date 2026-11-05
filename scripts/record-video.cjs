const { chromium } = require('playwright');
const mode = process.argv[2]; const outDir = process.argv[3];
const mobile = mode === 'mobile';
const vp = mobile ? { width: 430, height: 932 } : { width: 1920, height: 1080 };
const BASE = 'http://localhost:4173/';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile,
    recordVideo: { dir: outDir, size: mobile ? { width: 860, height: 1864 } : vp } });
  const p = await ctx.newPage();
  const wait = ms => p.waitForTimeout(ms);
  const scrollTo = async (y, ms = 1800) => p.evaluate(([y, ms]) => new Promise(r => {
    const s = scrollY, d = y - s, t0 = performance.now();
    const f = t => { const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2) / 2; scrollTo(0, s + d * e); k < 1 ? requestAnimationFrame(f) : r(); };
    requestAnimationFrame(f); }), [y, ms]);
  const scrollToEl = async (sel, ms = 1600, off = 90) => { const y = await p.evaluate(([s, o]) => document.querySelector(s).getBoundingClientRect().top + scrollY - o, [sel, off]); await scrollTo(y, ms); };
  const go = async (sel) => { await Promise.all([p.waitForLoadState('networkidle'), p.click(sel)]); await p.waitForLoadState('networkidle'); await wait(1200); };
  const tap = async sel => { await p.click(sel); await wait(700); };

  await p.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.clear());
  await wait(2200);
  if (mobile) { await scrollToEl('.mood', 2200, 200); }
  await tap('.hero .chip:nth-child(1)'); await wait(600); await tap('.hero .chip:nth-child(4)'); await wait(900);
  await scrollToEl('.arc', 2200, 0); await wait(2600);
  await scrollToEl('#how-title', 2000); await wait(1500);
  await scrollToEl('#prog-title', 2000); await wait(1400);
  await scrollToEl('.band', 1800, 40); await wait(1400);
  await scrollToEl('#q-title', 1800); await wait(1200);
  await scrollTo(0, 2200); await wait(500);

  // Programs
  if (mobile) { await tap('[data-menu-open]'); await wait(900); await go('#menu a[href="programs.html"]'); }
  else await go('.nav__links a[href="programs.html"]');
  await scrollToEl('.filters', 1600, 120); await wait(600);
  await tap('.filter[data-filter="mindful"]'); await wait(1000); await tap('.filter[data-filter="all"]'); await wait(600);
  await scrollTo(await p.evaluate(() => scrollY + innerHeight * .9), 1800); await wait(800);

  // Pricing
  await scrollTo(0, 1200);
  if (mobile) { await tap('[data-menu-open]'); await wait(800); await go('#menu a[href="pricing.html"]'); }
  else await go('.nav__links a[href="pricing.html"]');
  await scrollToEl('.billing', 1600, 120); await tap('.billing button[data-cycle="yearly"]'); await wait(1200);
  if (mobile) { await scrollToEl('.plan--featured', 1500, 80); await wait(1200); }

  // Book
  await p.goto(BASE + 'book.html', { waitUntil: 'networkidle' }); await wait(1000);
  await scrollToEl('.therapists', 1400, 120);
  await tap('.therapist[data-name="Dr. Amara Okafor"]');
  const d = new Date(); d.setDate(d.getDate() + 3);
  await p.fill('#date', d.toISOString().slice(0, 10)); await p.dispatchEvent('#date', 'change'); await wait(500);
  await scrollToEl('.slots', 1200, 160);
  await tap('.slot:nth-child(2)');
  await scrollToEl('#confirm', 1200, 300); await wait(600);
  await go('#confirm');

  // Sign up
  await p.type('#name', 'Victor Abah', { delay: 60 });
  await p.type('#email', 'victor@peaceofmind.app', { delay: 40 });
  await p.type('#password', 'calmmind', { delay: 60 }); await wait(500);
  await go('#auth-form button[type="submit"]');
  await wait(800);
  await scrollToEl('#confirm', 1200, 300); await wait(400);
  await go('#confirm'); await wait(800);

  // Dashboard
  await tap('.welcome .chip:nth-child(1)'); await wait(700);
  if (mobile) await scrollToEl('#week', 1400, 200);
  await wait(1000);
  await scrollToEl('#sessions', 1400, 140); await wait(1200);
  await scrollToEl('#orb', 1200, 200); await p.click('#breathe-btn'); await wait(4800);
  await scrollToEl('#journal-text', 1400, 200);
  await p.type('#journal-text', 'Felt calmer after today\'s breathing. Grateful.', { delay: 35 });
  await tap('#journal-form button'); await wait(1600);
  await scrollTo(0, 1600); await wait(1200);
  await ctx.close(); await b.close();
})();
