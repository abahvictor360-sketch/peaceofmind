/* peaceofmind — motion layer.
   Pure enhancement: every effect is skipped when the visitor prefers
   reduced motion, and nothing here is required for the page to work. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  if (reduce) return;

  /* ---------- Page transitions (fallback where cross-document View Transitions are unsupported) ---------- */
  if (!("onpagereveal" in window)) {
    document.addEventListener("click", e => {
      const a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || a.hasAttribute("download")) return;
      e.preventDefault();
      document.body.classList.add("leaving");
      setTimeout(() => { location.href = a.href; }, 260);
    });
    addEventListener("pageshow", e => { if (e.persisted) document.body.classList.remove("leaving"); });
  }

  /* ---------- Split headlines into words ---------- */
  const split = (el, delay = 0) => {
    if (!el || el.dataset.split) return;
    el.dataset.split = "1";
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(" "); return; }
            const w = document.createElement("span"); w.className = "w";
            const inner = document.createElement("span"); inner.textContent = part;
            inner.style.setProperty("--wi", i++); inner.style.setProperty("--wd", `${delay}ms`);
            w.append(inner); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
  };

  // Hero headlines animate on load
  $$(".hero h1, .page-hero h1").forEach(h => {
    split(h, 250);
    requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add("split-now")));
  });
  // Section headlines animate when their .reveal parent enters
  $$(".section__head h2, .band__copy h2, .cta h2, .story h2").forEach(h => split(h, 120));

  /* ---------- Intro sequences ---------- */
  $$(".hero__copy, .page-hero .container, .auth__form, .dash__head > div:first-child").forEach(box => {
    [...box.children].forEach((c, i) => c.style.setProperty("--i", i));
    box.classList.add("intro");
  });
  $$(".hero__bottom .feature").forEach((f, i) => { f.style.animation = `introUp 1s cubic-bezier(.2,.8,.2,1) ${0.9 + i * 0.12}s both`; });

  /* ---------- Stagger grid reveals ---------- */
  $$(".steps, .programs-grid, .quotes, .plans, .values, .team, .dash__grid").forEach(grid => {
    [...grid.children].forEach((c, i) => {
      if (grid.classList.contains("dash__grid")) c.classList.add("reveal");
      c.style.setProperty("--rd", `${(i % 6) * 90}ms`);
    });
  });
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    io.unobserve(en.target);
  }), { threshold: 0, rootMargin: "0px 0px 12% 0px" });
  $$(".reveal:not(.in), .footer__word").forEach(el => io.observe(el));

  /* ---------- Footer wordmark letters ---------- */
  $$(".footer__word").forEach(w => {
    w.innerHTML = [...w.textContent].map((ch, i) => `<span class="l" style="--li:${i}">${ch}</span>`).join("");
  });

  /* ---------- Count-up numbers ---------- */
  const countUp = el => {
    const m = el.textContent.trim().match(/^(\d+)(.*)$/);
    if (!m || el.dataset.counted) return;
    el.dataset.counted = "1";
    const to = +m[1], suffix = m[2], t0 = performance.now(), dur = 1600;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(to * e) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); countIO.unobserve(e.target); } }), { threshold: .6 });
  $$(".stat strong").forEach(s => countIO.observe(s));
  // Dashboard KPIs are rendered by app.js after load — animate whatever value they land on.
  setTimeout(() => $$(".kpi strong").forEach(k => { delete k.dataset.counted; countUp(k); }), 350);
  $$(".week").forEach(w => new MutationObserver(() => $$("div", w).forEach((d, i) => d.style.setProperty("--d", i))).observe(w, { childList: true }));
  $$(".week div").forEach((d, i) => d.style.setProperty("--d", i));

  /* ---------- Price change bump ---------- */
  $$(".billing button").forEach(b => b.addEventListener("click", () => $$(".plan__price").forEach(p => {
    p.classList.remove("bump"); void p.offsetWidth; p.classList.add("bump");
  })));

  /* ---------- Program filter re-entry ---------- */
  $$(".filter").forEach(f => f.addEventListener("click", () => {
    $$(".program[data-cat]:not([hidden])").forEach((p, i) => {
      p.classList.remove("pop-in"); void p.offsetWidth; p.style.setProperty("--i", i); p.classList.add("pop-in");
    });
  }));

  /* ---------- Chip ripples ---------- */
  document.addEventListener("pointerdown", e => {
    const chip = e.target.closest(".chip, .filter, .slot, .billing button, .tabs button");
    if (!chip) return;
    const r = chip.getBoundingClientRect(), dot = document.createElement("span");
    dot.className = "ripple"; dot.style.left = `${e.clientX - r.left}px`; dot.style.top = `${e.clientY - r.top}px`;
    if (getComputedStyle(chip).position === "static") chip.style.position = "relative";
    chip.style.overflow = "hidden"; chip.append(dot); setTimeout(() => dot.remove(), 700);
  });

  /* ---------- Floating glass ---------- */
  $$(".hero .mood, .band__float, .auth__quote, .auth__visual .mood").forEach((el, i) => el.classList.add("float", i % 2 ? "float--slow" : "x"));

  /* ---------- Scroll progress + parallax + arc wheel (one rAF loop) ---------- */
  const bar = document.createElement("div"); bar.className = "progress-bar"; document.body.append(bar);
  // Parallax offsets are measured from each element's own section (not the
  // page's total scroll) and clamped, so nothing can drift onto nearby text.
  // On narrow screens images and copy stack vertically, so only the purely
  // decorative glow moves there.
  const wide = () => innerWidth > 820;
  const par = [
    // [selector, speed, anchor, max px, allowed on narrow screens]
    [".hero__person", .10, "top", 90], [".hero__sun", -.18, "top", 160, true],
    [".page-hero__img", .12, "top", 70], [".band__img", -.06, "center", 40],
    [".hero__copy", .12, "top", 60], [".auth__visual img", 0, "top", 0],
  ].flatMap(([s, k, mode, max, narrow]) => $$(s).map(el => ({
    el, k, mode, max, narrow, anchor: el.closest(".hero, .page-hero, .band, .auth__visual") || el.parentElement,
  })));
  const wheel = $(".arc__wheel"), ticks = $(".arc__ticks"), arc = $(".arc");
  let hover = false, angle = 0, last = performance.now(), mouse = { x: 0, y: 0 }, sm = { x: 0, y: 0 };
  if (wheel) {
    wheel.style.animation = "none"; if (ticks) ticks.style.animation = "none";
    arc.addEventListener("pointerenter", () => hover = true);
    arc.addEventListener("pointerleave", () => hover = false);
  }
  let lastScroll = scrollY, velocity = 0;
  addEventListener("pointermove", e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; }, { passive: true });

  const loop = t => {
    const dt = Math.min(64, t - last); last = t;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    velocity = lerp(velocity, y - lastScroll, .1); lastScroll = y;
    sm.x = lerp(sm.x, mouse.x, .06); sm.y = lerp(sm.y, mouse.y, .06);
    const isWide = wide();
    for (const { el, k, mode, max, narrow, anchor } of par) {
      if (!isWide && !narrow) { if (el.style.translate) el.style.translate = ""; continue; }
      const r = anchor.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue; // off-screen: skip work
      const d = mode === "center" ? r.top + r.height / 2 - innerHeight / 2 : r.top;
      const sy = Math.max(-max, Math.min(max, -d * k));
      const mx = fine && isWide ? sm.x * (k === 0 ? 14 : 22) : 0, my = fine && isWide ? sm.y * 12 : 0;
      el.style.translate = `${mx * (k < 0 ? -1 : 1)}px ${sy + my}px`;
    }
    if (wheel) {
      // Base drift + a push from scroll velocity, eased so it feels physical.
      angle += (hover ? .0015 : .0075) * dt + velocity * .04;
      wheel.style.transform = `rotate(${angle}deg)`;
      if (ticks) ticks.style.transform = `translate(-50%, -50%) rotate(${-angle * .5}deg)`;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  /* ---------- Pointer glow on dark heroes ---------- */
  if (fine) $$(".hero, .page-hero, .band, .cta, .auth__visual, .welcome").forEach(sec => {
    const g = document.createElement("div"); g.className = "glow"; sec.append(g);
    let gx = 0, gy = 0, tx = 0, ty = 0, raf = 0;
    const tick = () => { gx = lerp(gx, tx, .12); gy = lerp(gy, ty, .12); g.style.transform = `translate(${gx}px, ${gy}px)`; raf = Math.abs(gx - tx) + Math.abs(gy - ty) > .5 ? requestAnimationFrame(tick) : 0; };
    sec.addEventListener("pointermove", e => { const r = sec.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; g.classList.add("on"); if (!raf) raf = requestAnimationFrame(tick); });
    sec.addEventListener("pointerleave", () => g.classList.remove("on"));
  });

  /* ---------- Magnetic buttons ---------- */
  if (fine) $$(".btn, .icon-btn").forEach(b => {
    b.addEventListener("pointermove", e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });

  /* ---------- 3D tilt cards ---------- */
  if (fine) $$(".program, .step, .plan, .member, .quote, .therapist").forEach(card => {
    const arm = () => card.classList.add("tilt");
    if (card.classList.contains("reveal")) {
      const wait = new MutationObserver(() => { if (card.classList.contains("in")) { setTimeout(arm, 1100); wait.disconnect(); } });
      wait.observe(card, { attributes: true, attributeFilter: ["class"] });
      if (card.classList.contains("in")) setTimeout(arm, 1100);
    } else arm();
    card.addEventListener("pointermove", e => {
      if (!card.classList.contains("tilt")) return;
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      card.classList.add("tilting");
      card.style.transform = `perspective(900px) rotateX(${-py * 7}deg) rotateY(${px * 9}deg) translateY(-6px)`;
    });
    card.addEventListener("pointerleave", () => { card.classList.remove("tilting"); card.style.transform = ""; });
  });
})();
