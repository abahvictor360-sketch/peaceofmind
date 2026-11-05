/* peaceofmind — shared behaviour for every page.
   Auth here is a front-end demo (localStorage); swap `Auth` for a real
   backend (Supabase, Firebase, your API) before taking real client data. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };

  /* ---------------- Auth (demo) ---------------- */
  async function hash(text) {
    if (crypto?.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    }
    return btoa(text);
  }
  const Auth = {
    user: () => store.get("pom_session", null),
    async signUp({ name, email, password }) {
      const users = store.get("pom_users", {});
      email = email.trim().toLowerCase();
      if (users[email]) throw new Error("An account with this email already exists. Try logging in.");
      users[email] = { name: name.trim(), pass: await hash(password), created: Date.now() };
      store.set("pom_users", users);
      store.set("pom_session", { name: name.trim(), email });
    },
    async logIn({ email, password }) {
      const users = store.get("pom_users", {});
      email = email.trim().toLowerCase();
      const u = users[email];
      if (!u || u.pass !== await hash(password)) throw new Error("That email and password don't match. Please try again.");
      store.set("pom_session", { name: u.name, email });
    },
    demo() { store.set("pom_session", { name: "Guest", email: "guest@peaceofmind.app", demo: true }); },
    logOut() { store.del("pom_session"); location.href = "index.html"; },
  };
  window.POM = { Auth, store };

  const page = document.body.dataset.page;
  const protectedPages = ["dashboard"];
  if (protectedPages.includes(page) && !Auth.user()) {
    location.replace(`login.html?next=${encodeURIComponent(location.pathname.split("/").pop() || "dashboard.html")}`);
    return;
  }

  /* ---------------- Nav state ---------------- */
  const user = Auth.user();
  $$("[data-auth-label]").forEach(el => { el.textContent = user ? "Dashboard" : el.dataset.authLabel; });
  $$("[data-auth-link]").forEach(el => { el.href = user ? "dashboard.html" : el.dataset.authLink; });
  $$("[data-logout]").forEach(el => {
    el.hidden = !user;
    el.addEventListener("click", e => { e.preventDefault(); Auth.logOut(); });
  });
  $$("[data-user-name]").forEach(el => { el.textContent = user ? user.name.split(" ")[0] : "friend"; });

  const menu = $("#menu");
  $$("[data-menu-open]").forEach(b => b.addEventListener("click", () => { menu.classList.add("open"); document.body.style.overflow = "hidden"; }));
  $$("[data-menu-close], #menu a").forEach(b => b.addEventListener("click", () => { menu.classList.remove("open"); document.body.style.overflow = ""; }));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && menu?.classList.contains("open")) menu.classList.remove("open"); });

  /* ---------------- Liquid glass ---------------- */
  // Real refraction needs SVG filters inside backdrop-filter — Chromium only.
  if (navigator.userAgentData && CSS.supports("backdrop-filter", "blur(1px)")) document.documentElement.classList.add("has-refraction");
  const glassMove = e => {
    const el = e.currentTarget, r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  $$(".glass").forEach(el => el.addEventListener("pointermove", glassMove));

  /* ---------------- Reveal ---------------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0, rootMargin: "0px 0px 12% 0px" }) : null;
  $$(".reveal").forEach(el => io ? io.observe(el) : el.classList.add("in"));

  /* ---------------- Toast ---------------- */
  const toast = msg => {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.append(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2800);
  };
  window.POM.toast = toast;

  /* ---------------- Mood chips ---------------- */
  const moodLines = {
    Calm: "Beautiful. Let's protect that stillness today.",
    Overwhelmed: "Let's slow things down — one breath, one step.",
    Stressed: "Stress is a signal, not a sentence. We'll work through it.",
    Hopeful: "Hold on to that light — it's leading somewhere good.",
    Happy: "Joy deserves to be noticed. Savor it.",
    Sadness: "It's okay not to be okay. You're not alone in this.",
  };
  $$("[data-mood]").forEach(group => {
    const quote = $(".mood__quote", group.closest(".mood"));
    $$(".chip", group).forEach(chip => chip.addEventListener("click", () => {
      $$(".chip", group).forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
      const m = chip.textContent.trim();
      if (quote) { quote.style.opacity = 0; setTimeout(() => { quote.textContent = `“${moodLines[m]}”`; quote.style.opacity = 1; }, 200); }
      if (Auth.user()) {
        const log = store.get("pom_moods", []);
        log.push({ m, t: Date.now() }); store.set("pom_moods", log.slice(-60));
        document.dispatchEvent(new CustomEvent("pom:mood"));
      }
    }));
  });

  /* ---------------- Pricing ---------------- */
  const billing = $(".billing");
  if (billing) $$("button", billing).forEach(b => b.addEventListener("click", () => {
    $$("button", billing).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    const yearly = b.dataset.cycle === "yearly";
    $$("[data-monthly]").forEach(p => { p.firstChild.textContent = `$${yearly ? p.dataset.yearly : p.dataset.monthly}`; });
  }));

  /* ---------------- Program filters ---------------- */
  const filters = $(".filters");
  if (filters) $$(".filter", filters).forEach(f => f.addEventListener("click", () => {
    $$(".filter", filters).forEach(x => x.setAttribute("aria-pressed", String(x === f)));
    $$(".program[data-cat]").forEach(p => { p.hidden = f.dataset.filter !== "all" && !p.dataset.cat.includes(f.dataset.filter); });
  }));

  /* ---------------- Newsletter ---------------- */
  $$(".footer__news").forEach(f => f.addEventListener("submit", e => { e.preventDefault(); f.reset(); toast("You're on the list — gentle notes only, no spam."); }));

  /* ---------------- Login page ---------------- */
  if (page === "login") {
    const form = $("#auth-form"), msg = $("#form-msg"), nameField = $("#name-field");
    const params = new URLSearchParams(location.search);
    const next = params.get("next") || "dashboard.html";
    let mode = params.get("mode") === "signup" ? "signup" : "login";
    const setMode = m => {
      mode = m;
      $$(".tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.mode === m)));
      nameField.hidden = m !== "signup";
      $("#name").required = m === "signup";
      $("#auth-title").textContent = m === "signup" ? "Create your space" : "Welcome back";
      $("#auth-sub").textContent = m === "signup" ? "Start your journey to a calmer, clearer mind." : "Log in to continue your journey to a healthier mind.";
      $("#auth-submit-label").textContent = m === "signup" ? "Create Account" : "Log In";
      $("#password").autocomplete = m === "signup" ? "new-password" : "current-password";
      msg.className = "form-msg";
    };
    $$(".tabs button").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
    setMode(mode);
    $("#toggle-pw").addEventListener("click", e => {
      const i = $("#password"); i.type = i.type === "password" ? "text" : "password";
      e.currentTarget.textContent = i.type === "password" ? "Show" : "Hide";
    });
    const show = (text, kind = "error") => { msg.textContent = text; msg.className = `form-msg show ${kind}`; };
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      if (!/^\S+@\S+\.\S+$/.test(data.email || "")) return show("Please enter a valid email address.");
      if ((data.password || "").length < 6) return show("Password needs at least 6 characters.");
      try {
        if (mode === "signup") await Auth.signUp(data); else await Auth.logIn(data);
        show(mode === "signup" ? "Account created — taking you in…" : "Welcome back — taking you in…", "ok");
        setTimeout(() => location.href = next, 600);
      } catch (err) { show(err.message); }
    });
    $$("[data-demo]").forEach(b => b.addEventListener("click", () => { Auth.demo(); location.href = next; }));
    $("#forgot").addEventListener("click", e => { e.preventDefault(); show("Password reset links are sent by email once a backend is connected.", "ok"); });
  }

  /* ---------------- Booking page ---------------- */
  if (page === "book") {
    const state = { therapist: null, date: null, time: null, type: "Online video" };
    const sum = k => $(`[data-sum="${k}"]`);
    const render = () => {
      sum("therapist").textContent = state.therapist || "—";
      sum("date").textContent = state.date ? new Date(state.date + "T12:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "—";
      sum("time").textContent = state.time || "—";
      sum("type").textContent = state.type;
      $("#confirm").disabled = !(state.therapist && state.date && state.time);
    };
    $$(".therapist").forEach(t => t.addEventListener("click", () => {
      $$(".therapist").forEach(x => x.setAttribute("aria-pressed", String(x === t)));
      state.therapist = t.dataset.name; render();
    }));
    $$(".slot").forEach(s => s.addEventListener("click", () => {
      $$(".slot").forEach(x => x.setAttribute("aria-pressed", String(x === s)));
      state.time = s.textContent.trim(); render();
    }));
    const date = $("#date");
    const today = new Date(); today.setDate(today.getDate() + 1);
    date.min = today.toISOString().slice(0, 10);
    date.addEventListener("change", () => { state.date = date.value; render(); });
    $("#session-type").addEventListener("change", e => { state.type = e.target.value; render(); });
    const pre = new URLSearchParams(location.search).get("program");
    if (pre) $("#focus").value = pre;
    $("#confirm").addEventListener("click", () => {
      if (!Auth.user()) { store.set("pom_pending_booking", state); location.href = "login.html?next=book.html&mode=signup"; return; }
      const list = store.get("pom_bookings", []);
      list.push({ ...state, focus: $("#focus").value, id: Date.now() });
      store.set("pom_bookings", list);
      toast("Session booked — see you soon 🌿");
      setTimeout(() => location.href = "dashboard.html", 900);
    });
    const pending = store.get("pom_pending_booking", null);
    if (pending && Auth.user()) {
      store.del("pom_pending_booking");
      Object.assign(state, pending);
      $$(".therapist").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.name === state.therapist)));
      $$(".slot").forEach(x => x.setAttribute("aria-pressed", String(x.textContent.trim() === state.time)));
      if (state.date) date.value = state.date;
      toast("You're signed in — confirm your session below.");
    }
    render();
  }

  /* ---------------- Dashboard ---------------- */
  if (page === "dashboard") {
    const hour = new Date().getHours();
    $("#greet").textContent = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    $("#today").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

    const sessions = () => {
      const list = store.get("pom_bookings", []);
      const box = $("#sessions");
      $("#kpi-sessions").textContent = list.length;
      if (!list.length) { box.innerHTML = `<div class="empty">No sessions yet. <a href="book.html" style="color:var(--rust)">Book your first session →</a></div>`; return; }
      const pics = { "Dr. Amara Okafor": "listen-warm", "Kemi Adeyemi": "mindful-prayer", "Daniel Mensah": "listen-yellow" };
      box.innerHTML = list.slice().reverse().map(b => `
        <div class="list-item">
          <img src="assets/img/${pics[b.therapist] || "reading-calm"}.webp" alt="">
          <div><b>${b.focus || "Therapy session"} · ${b.therapist}</b>
          <small>${new Date(b.date + "T12:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at ${b.time} · ${b.type}</small></div>
          <button class="pill" data-cancel="${b.id}" style="border:0;cursor:pointer">Cancel</button>
        </div>`).join("");
      $$("[data-cancel]", box).forEach(btn => btn.addEventListener("click", () => {
        store.set("pom_bookings", store.get("pom_bookings", []).filter(x => String(x.id) !== btn.dataset.cancel));
        toast("Session cancelled."); sessions();
      }));
    };
    const moods = () => {
      const log = store.get("pom_moods", []);
      $("#kpi-checkins").textContent = log.length;
      const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
      const score = { Calm: 5, Happy: 5, Hopeful: 4, Stressed: 2, Overwhelmed: 1, Sadness: 1 };
      $("#week").innerHTML = days.map(d => {
        const entries = log.filter(e => new Date(e.t).toDateString() === d.toDateString());
        const avg = entries.length ? entries.reduce((s, e) => s + score[e.m], 0) / entries.length : 0;
        return `<div title="${entries.map(e => e.m).join(", ") || "No check-in"}"><i style="height:${avg ? avg * 18 : 6}%;opacity:${avg ? 1 : .25}"></i>${d.toLocaleDateString(undefined, { weekday: "narrow" })}</div>`;
      }).join("");
      const last = log[log.length - 1];
      $("#last-mood").textContent = last ? `Last check-in: ${last.m}` : "No check-ins yet this week";
    };
    const journal = () => {
      const list = store.get("pom_journal", []);
      $("#kpi-journal").textContent = list.length;
      $("#journal-list").innerHTML = list.slice().reverse().map(j => `<div><small>${new Date(j.t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small>${j.text.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]))}</div>`).join("");
    };
    $("#journal-form").addEventListener("submit", e => {
      e.preventDefault();
      const ta = $("#journal-text"); if (!ta.value.trim()) return;
      const list = store.get("pom_journal", []); list.push({ text: ta.value.trim(), t: Date.now() });
      store.set("pom_journal", list); ta.value = ""; journal(); toast("Saved to your journal.");
    });
    // Box breathing
    const orb = $("#orb"), label = $("#orb-label"), btn = $("#breathe-btn");
    let timer = null;
    btn.addEventListener("click", () => {
      if (timer) { clearInterval(timer); timer = null; orb.classList.remove("in"); label.textContent = "Ready"; btn.querySelector("span").textContent = "Start breathing"; return; }
      const phases = [["Breathe in", true], ["Hold", true], ["Breathe out", false], ["Hold", false]];
      let i = 0;
      const tick = () => { const [t, inn] = phases[i++ % 4]; label.textContent = t; orb.classList.toggle("in", inn); };
      tick(); timer = setInterval(tick, 4000);
      btn.querySelector("span").textContent = "Stop";
    });
    document.addEventListener("pom:mood", moods);
    sessions(); moods(); journal();
  }
})();
