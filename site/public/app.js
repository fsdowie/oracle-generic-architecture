/* Estate maps — client.
 * 1. Signs the viewer in with Supabase Auth (email + password), or lets them request access.
 *    New registrations wait for the administrator to activate them and assign maps.
 * 2. Downloads each map's JSON from the private Storage bucket. Row-level security on
 *    storage.objects lets a viewer read only the maps assigned to them (see supabase/migrations).
 * 3. Renders the chosen map. Viewers can comment on any item; the admin manages users,
 *    comments and watches a live log. Nothing about the architecture is in this file.
 */
(function () {
  "use strict";
  const cfg = window.MAP_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };
  const VIEWS = ["boot", "gate", "pending", "setpw", "app"];
  function show(which) { VIEWS.forEach((v) => { $(v).hidden = v !== which; }); }
  let toastTimer = null;
  function toast(msg) {
    $("toast").textContent = msg; $("toast").hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $("toast").hidden = true; }, 3500);
  }

  if (!cfg.url || !cfg.anonKey || !window.supabase) {
    $("boot").textContent = "This site is not configured yet: config.js is missing its Supabase URL or anon key.";
    return;
  }
  // An invite or recovery link lands with tokens in the URL; ask for a password once the session exists.
  let needPassword = /type=(invite|recovery)/.test(location.hash || "");
  const sb = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const MAPS = Array.isArray(cfg.maps) && cfg.maps.length ? cfg.maps : [{ id: "map", title: "Estate Map", object: cfg.object || "map.json" }];
  const callFn = async (name, body) => {
    const { data, error } = await sb.functions.invoke(name, { body });
    if (error) {
      let msg = error.message;
      try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (e) { /* not JSON */ }
      throw new Error(msg);
    }
    return data;
  };

  // ---------- sign in / request access ----------
  function mode(up) {
    $("modeIn").setAttribute("aria-selected", !up); $("modeUp").setAttribute("aria-selected", up);
    $("loginForm").hidden = up; $("signupForm").hidden = !up;
  }
  $("modeIn").addEventListener("click", () => mode(false));
  $("modeUp").addEventListener("click", () => mode(true));
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("loginBtn"), msg = $("loginMsg");
    btn.disabled = true; msg.className = "msg"; msg.textContent = "Signing in…";
    const { error } = await sb.auth.signInWithPassword({ email: $("email").value.trim(), password: $("password").value });
    btn.disabled = false;
    if (error) { msg.className = "msg err"; msg.textContent = "Sign-in failed. Check your email and password."; return; }
    msg.textContent = "";
    $("password").value = "";
  });
  $("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("signupMsg"), btn = $("signupBtn");
    const email = $("suEmail").value.trim().toLowerCase(), pw = $("suPw").value;
    const name = $("suName").value.trim(), org = $("suOrg").value.trim();
    msg.className = "msg err";
    if (!name || !org || !email.includes("@")) { msg.textContent = "Please fill in your name, organisation and email."; return; }
    if (pw.length < 10) { msg.textContent = "Please choose a password of at least 10 characters."; return; }
    if (!$("suAgree").checked) { msg.textContent = "Please confirm the internal-use statement."; return; }
    btn.disabled = true; msg.className = "msg"; msg.textContent = "Sending your request…";
    const { error } = await sb.auth.signUp({ email, password: pw, options: { data: { display_name: name, organisation: org } } });
    btn.disabled = false;
    if (error) { msg.className = "msg err"; msg.textContent = /registered|exists/i.test(error.message) ? "This email already has an account. Sign in instead." : "The request could not be sent: " + error.message; return; }
    try { await callFn("estate-signup-notify", { email }); } catch (err) { /* the admin also sees it in the live log */ }
    msg.textContent = "";
  });
  $("pendingOut").addEventListener("click", () => sb.auth.signOut());
  $("signOut").addEventListener("click", async () => { await sb.auth.signOut(); });
  $("setpwForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = $("newPw").value, msg = $("setpwMsg");
    if (pw.length < 10) { msg.className = "msg err"; msg.textContent = "At least 10 characters, please."; return; }
    $("setpwBtn").disabled = true;
    const { error } = await sb.auth.updateUser({ password: pw });
    $("setpwBtn").disabled = false;
    if (error) { msg.className = "msg err"; msg.textContent = error.message; return; }
    needPassword = false;
    try { history.replaceState(null, "", location.pathname); } catch (err) { /* ignore */ }
    loadedFor = null;
    const { data } = await sb.auth.getSession();
    onSession(data.session);
  });

  // ---------- session → profile → maps ----------
  let loadedFor = null, available = [], me = null, currentMap = null;
  async function logEvent(event, detail) {
    if (!me) return;
    try { await sb.from("activity_log").insert({ user_id: me.id, email: me.email, event, detail: detail || null }); } catch (e) { /* best effort */ }
  }
  async function onSession(session) {
    if (!session) { loadedFor = null; me = null; show("gate"); return; }
    if (needPassword) { show("setpw"); return; }
    if (loadedFor === session.user.id) return;
    loadedFor = session.user.id;
    show("boot"); $("boot").textContent = "Loading maps…";
    const { data: prof } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    me = prof || { id: session.user.id, email: session.user.email, status: "active", maps: [], is_admin: false };
    if (me.status === "disabled") {
      $("pendingText").textContent = "This account has been disabled. Contact the administrator if you think this is a mistake.";
      show("pending"); return;
    }
    const results = await Promise.all(MAPS.map(async (m) => {
      const { data, error } = await sb.storage.from(cfg.bucket || "estate-map").download(m.object);
      if (error || !data) return null;
      try { return { meta: m, model: JSON.parse(await data.text()) }; } catch (err) { return null; }
    }));
    available = results.filter(Boolean);
    if (!available.length) {
      $("pendingText").textContent = me.status === "pending"
        ? "Thanks for registering. The administrator reviews each request and assigns the maps you can see. Once that is done, sign in here with the password you chose."
        : "Your account is active but no map has been assigned to it yet. The administrator has been notified.";
      show("pending"); return;
    }
    if (!sessionStorage.getItem("loggedIn:" + me.id)) { try { sessionStorage.setItem("loggedIn:" + me.id, "1"); } catch (e) { /* ignore */ } logEvent("signed_in"); }
    $("who").textContent = me.is_admin ? "Admin" : (me.display_name || session.user.email);
    const picker = $("mapSel");
    picker.innerHTML = available.map((a) => `<option value="${esc(a.meta.id)}">${esc(a.model.header.title || a.meta.title)}</option>`).join("");
    $("mapPick").hidden = available.length < 2;
    const saved = store.get("estateMap");
    const first = available.find((a) => a.meta.id === saved) || available[0];
    picker.value = first.meta.id;
    currentMap = first.meta.id;
    render(first.model);
    document.querySelector('nav.tabs button[data-tab="admin"]').hidden = !me.is_admin;
    show("app");
    if (me.is_admin) admin.start();
    logEvent("opened_map", currentMap);
    requestAnimationFrame(drawVisible);
  }
  $("mapSel").addEventListener("change", () => {
    const a = available.find((x) => x.meta.id === $("mapSel").value);
    if (!a) return;
    store.set("estateMap", a.meta.id);
    currentMap = a.meta.id;
    render(a.model);
    logEvent("opened_map", currentMap);
    requestAnimationFrame(drawVisible);
  });
  sb.auth.getSession().then(({ data }) => onSession(data.session));
  sb.auth.onAuthStateChange((evt, session) => {
    if (evt === "PASSWORD_RECOVERY") needPassword = true;
    setTimeout(() => onSession(session), 0);
  });

  // ---------- comments ----------
  let cmtCtx = null;
  function openComment(ctx) {
    cmtCtx = Object.assign({ map: currentMap }, ctx);
    $("cmtWhere").textContent = [(M && M.header.title) || currentMap, ctx.tabLabel, ctx.item_title].filter(Boolean).join(" › ");
    $("cmtBody").value = ""; $("cmtMsg").textContent = ""; $("cmtSend").disabled = false;
    $("cmtDlg").showModal();
    $("cmtBody").focus();
  }
  $("cmtCancel").addEventListener("click", () => $("cmtDlg").close());
  $("cmtForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = $("cmtBody").value.trim();
    if (!body) { $("cmtMsg").className = "msg err"; $("cmtMsg").textContent = "Please write a comment first."; return; }
    $("cmtSend").disabled = true; $("cmtMsg").className = "msg"; $("cmtMsg").textContent = "Sending…";
    try {
      await callFn("estate-comment", { map: cmtCtx.map, tab: cmtCtx.tabLabel, item_id: cmtCtx.item_id, item_title: cmtCtx.item_title, body });
      $("cmtDlg").close();
      toast("Thanks — your comment was sent to the administrator.");
    } catch (err) {
      $("cmtSend").disabled = false; $("cmtMsg").className = "msg err"; $("cmtMsg").textContent = err.message;
    }
  });
  const tabLabel = (tabId) => { const b = document.querySelector(`nav.tabs button[data-tab="${tabId.replace("tab-", "")}"]`); return b ? b.textContent : ""; };

  // ---------- defaults (the Travel map predates per-map settings) ----------
  const DEFAULTS = {
    tab_labels: { estate: "Estate", p2p: "Procure to Pay", r2r: "Record to Report", fnd: "Foundation & controls", dash: "Dashboards", onboard: "Supplier onboarding", close: "Close rhythm", ints: "Integrations" },
    workstreams: [{ id: "P2P", label: "Procure to Pay" }, { id: "R2R", label: "Record to Report" }, { id: "PLAT", label: "Platform accounting" }],
    lane_groups: [
      { name: "Airflow", match: "Airflow", color: "var(--airflow)" },
      { name: "Bulk", match: "^(?!.*OIC).*(EIB|FBDI)", color: "var(--bulk)" },
      { name: "Extract", match: "BICC", color: "var(--extract)" },
      { name: "OIC", match: ".*", color: "var(--oic)" },
    ],
    legend: [
      { label: "OIC integration", color: "var(--oic)" }, { label: "Airflow DAG", color: "var(--airflow)" },
      { label: "FBDI / EIB bulk", color: "var(--bulk)" }, { label: "BICC / BIP extract", color: "var(--extract)" },
      { label: "return path / internal", color: "var(--ext)", dash: true },
    ],
  };

  // ---------- diagrams (estate, dashboards, close process) ----------
  const COL = { oic: "var(--oic)", airflow: "var(--airflow)", sched: "var(--airflow)", bulk: "var(--bulk)", extract: "var(--extract)", int: "var(--line)", ret: "var(--ext)" };
  const legendHtml = (items) => items.map((l) => `<span${l.dash ? ' class="dash"' : ""}><i style="border-color:${esc(l.color)}"></i>${esc(l.label)}</span>`).join("") + "<span>Dashed box = external system</span>";

  /* One clickable layered diagram. ids: box, bands, edges, detail, chips, legend, tab (section id), prefix (node element id prefix). */
  function makeDiagram(ids) {
    const d = { data: null, sel: null, ws: "all" };
    d.render = function (data, chips, legend) {
      d.data = data; d.sel = data.default_node; d.ws = "all";
      $(ids.chips).innerHTML = `<button class="chip" aria-pressed="true" data-ws="all">All</button>` +
        chips.map((w) => `<button class="chip" aria-pressed="false" data-ws="${esc(w.id)}">${esc(w.label)}</button>`).join("");
      $(ids.chips).querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
        d.ws = c.dataset.ws;
        $(ids.chips).querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", x === c));
        d.select();
      }));
      $(ids.legend).innerHTML = legendHtml(legend);
      const bands = $(ids.bands); bands.innerHTML = "";
      data.layers.forEach((L) => {
        const b = document.createElement("div");
        b.className = "band" + (L.narrow ? " narrow" : "");
        b.innerHTML = `<div class="lab">${esc(L.label)}<b>${esc(L.title)}</b></div><div class="nodes"></div>`;
        data.nodes.filter((n) => n.layer === L.id).forEach((n) => {
          const el = document.createElement("button");
          el.type = "button";
          el.className = "node" + (n.external ? " ext" : "") + (n.core ? " core" : "");
          el.id = ids.prefix + n.id;
          el.innerHTML = `${esc(n.title)}<small>${esc(n.subtitle)}</small>`;
          el.addEventListener("click", () => { d.sel = n.id; d.select(); });
          b.querySelector(".nodes").appendChild(el);
        });
        bands.appendChild(b);
      });
      d.select();
    };
    d.select = function () {
      const D = d.data;
      D.nodes.forEach((n) => {
        const el = $(ids.prefix + n.id);
        el.classList.toggle("sel", n.id === d.sel);
        el.classList.toggle("dim", d.ws !== "all" && !n.workstreams.includes(d.ws));
        el.setAttribute("aria-pressed", n.id === d.sel);
      });
      const n = D.nodes.find((x) => x.id === d.sel);
      const layer = D.layers.find((L) => L.id === n.layer);
      const nb = D.edges.filter((e) => e.from === d.sel || e.to === d.sel).map((e) => {
        const o = D.nodes.find((x) => x.id === (e.from === d.sel ? e.to : e.from));
        return (e.from === d.sel ? "→ " : "← ") + o.title;
      });
      const labels = Object.assign({ functions: "What it does", integrations: "Interfaces" }, D.labels || {});
      const tags = (a) => a.map((i) => `<span class="tag">${esc(i)}</span>`).join("");
      const list = (a, cls) => `<ul class="${cls}">${a.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
      const fns = n.functions || [], ifs = n.integrations || [], docs = n.docs || [], facts = n.facts || [];
      const docLinks = docs.filter((x) => /^https:\/\//.test(x.url))
        .map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)}</a></li>`).join("");
      $(ids.detail).innerHTML = `
        <div class="eyebrow">${esc(layer.label)} · ${esc(layer.title)}${n.external ? " · external" : ""}</div>
        <h3>${esc(n.title)}</h3><p>${esc(n.description)}</p>
        <dl>
          ${facts.map((f) => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join("")}
          ${fns.length ? `<div><dt>${esc(labels.functions)}</dt><dd>${list(fns, "fn")}</dd></div>` : ""}
          ${ifs.length ? `<div><dt>${esc(labels.integrations)}</dt><dd>${list(ifs, "ifs")}</dd></div>` : ""}
          ${nb.length ? `<div><dt>Connected to</dt><dd>${tags(nb)}</dd></div>` : ""}
          ${docLinks ? `<div><dt>Documents</dt><dd><ul class="docs">${docLinks}</ul></dd></div>` : ""}
        </dl>
        <button type="button" class="btn ghost small cmt-btn" data-cmt>Add comment</button>`;
      $(ids.detail).querySelector("[data-cmt]").addEventListener("click", () =>
        openComment({ tabLabel: tabLabel(ids.tab), item_id: n.id, item_title: n.title }));
      d.draw();
    };
    d.draw = function () {
      const D = d.data;
      if (!D || $("app").hidden || $(ids.tab).hidden || $(ids.box).closest("[hidden]")) return;
      const svg = $(ids.edges), box = $(ids.box).getBoundingClientRect();
      let out = "";
      D.edges.forEach(({ from: a, to: b, kind: k }) => {
        const A = $(ids.prefix + a), B = $(ids.prefix + b); if (!A || !B) return;
        const ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect();
        const na = D.nodes.find((x) => x.id === a), nbb = D.nodes.find((x) => x.id === b);
        const on = a === d.sel || b === d.sel;
        const hidden = d.ws !== "all" && (!na.workstreams.includes(d.ws) || !nbb.workstreams.includes(d.ws));
        let x1 = ra.left + ra.width / 2 - box.left, y1 = ra.top + ra.height / 2 - box.top, x2 = rb.left + rb.width / 2 - box.left, y2 = rb.top + rb.height / 2 - box.top;
        const vertical = Math.abs(y1 - y2) > 8;
        if (vertical) { if (y2 > y1) { y1 = ra.bottom - box.top; y2 = rb.top - box.top; } else { y1 = ra.top - box.top; y2 = rb.bottom - box.top; } }
        else { if (x2 > x1) { x1 = ra.right - box.left; x2 = rb.left - box.left; } else { x1 = ra.left - box.left; x2 = rb.right - box.left; } }
        const my = (y1 + y2) / 2;
        const path = vertical ? `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}` : `M${x1},${y1} L${x2},${y2}`;
        out += `<path d="${path}" fill="none" stroke="${COL[k] || "var(--line)"}" stroke-width="${on ? 2.4 : 1.2}" stroke-opacity="${hidden ? 0.06 : on ? 1 : 0.35}" ${k === "ret" ? 'stroke-dasharray="5 4"' : ""}/>`;
      });
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      svg.innerHTML = out;
    };
    new ResizeObserver(() => d.draw()).observe($(ids.box));
    return d;
  }
  const estate = makeDiagram({ box: "diagram", bands: "bands", edges: "edges", detail: "detail", chips: "wsChips", legend: "legend", tab: "tab-estate", prefix: "n-" });
  const dash = makeDiagram({ box: "dbDiagram", bands: "dbBands", edges: "dbEdges", detail: "dbDetail", chips: "dbChips", legend: "dbLegend", tab: "tab-dash", prefix: "d-" });
  const closeMap = makeDiagram({ box: "cpDiagram", bands: "cpBands", edges: "cpEdges", detail: "cpDetail", chips: "cpChips", legend: "cpLegend", tab: "tab-close", prefix: "c-" });
  const DIAGRAMS = [estate, dash, closeMap];
  function drawVisible() { DIAGRAMS.forEach((g) => g.draw()); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawVisible);

  // ---------- rendering ----------
  let M = null, groups = [];
  const TABS = ["estate", "p2p", "r2r", "fnd", "dash", "onboard", "close", "ints", "admin"];
  const notes = (arr) => (arr || []).map((n) => `<div class="note"><b>${esc(n.title)}</b> ${esc(n.text)}</div>`).join("");

  function render(model) {
    M = model;
    const h = model.header;
    document.title = h.title || "Estate Map";
    $("hEyebrow").textContent = h.eyebrow; $("hTitle").textContent = h.title; $("hLede").textContent = h.lede;
    $("facts").innerHTML = h.facts.map((f) => `<div><b>${esc(f.value)}</b>${esc(f.label)}</div>`).join("");
    $("footer").textContent = model.footer;

    // tabs: labels from the model; tabs without data are hidden
    const labels = Object.assign({}, DEFAULTS.tab_labels, model.tab_labels || {});
    const has = { estate: true, p2p: !!model.p2p, r2r: !!model.r2r, fnd: !!model.fnd, dash: !!model.dashboards, onboard: !!model.onboarding, close: !!model.close, ints: !!model.integrations };
    document.querySelectorAll("nav.tabs button").forEach((b) => { if (b.dataset.tab === "admin") return; b.textContent = labels[b.dataset.tab]; b.hidden = !has[b.dataset.tab]; });
    const current = TABS.find((k) => !$("tab-" + k).hidden) || "estate";
    showTab(has[current] || current === "admin" ? current : "estate");

    // estate diagram and register filters
    const wss = model.workstreams || DEFAULTS.workstreams;
    estate.render(model, wss, model.legend || DEFAULTS.legend);
    groups = (model.lane_groups || DEFAULTS.lane_groups).map((g) => Object.assign({}, g, { re: new RegExp(g.match) }));
    $("laneSel").innerHTML = `<option value="">All lanes</option>` + groups.map((g) => `<option>${esc(g.name)}</option>`).join("");
    $("wsSel").innerHTML = `<option value="">All workstreams</option>` + wss.map((w) => `<option value="${esc(w.id)}">${esc(w.label)}</option>`).join("");
    $("q").value = "";

    // stage chains: Procure to Pay, Record to Report, Foundation & controls
    const je = (e) => `<div class="je"><div class="je-ev">${esc(e.event)}</div><div class="je-row"><b>Dr</b><span>${e.dr.map(esc).join("<br>")}</span></div><div class="je-row"><b>Cr</b><span>${e.cr.map(esc).join("<br>")}</span></div></div>`;
    const badge = (s, suffix) => s.accounting === undefined ? "" :
      `<span class="acct ${s.accounting === "none" ? "none" : ""}">${s.accounting === "none" ? "no accounting" : esc(s.accounting) + suffix}</span>`;
    function chain(p, ids, suffix) {
      if (!p) return;
      $(ids.title).textContent = p.title; $(ids.lede).textContent = p.lede;
      $(ids.chain).innerHTML = p.stages.map((s) => `<div class="stage"><span class="n">Stage ${esc(s.n)}</span><h4>${esc(s.title)}</h4><span class="sys">${esc(s.system)}</span>${badge(s, suffix)}<ul>${(s.points || [s.what]).filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${(s.entries || []).map(je).join("")}<button type="button" class="btn ghost small cmt-btn" data-stage="${esc(s.n)}" data-title="${esc(s.title)}">Add comment</button></div>`).join("");
      $(ids.chain).querySelectorAll("[data-stage]").forEach((b) => b.addEventListener("click", () =>
        openComment({ tabLabel: tabLabel(ids.tab), item_id: ids.chain + ":" + b.dataset.stage, item_title: "Stage " + b.dataset.stage + " · " + b.dataset.title })));
      $(ids.notes).innerHTML = (p.accounting_note ? `<div class="note"><b>Account types.</b> ${esc(p.accounting_note)}</div>` : "") + notes(p.notes);
    }
    chain(model.p2p, { title: "p2pTitle", lede: "p2pLede", chain: "chain", notes: "p2pNotes" }, " via XLA");
    chain(model.r2r, { title: "r2rTitle", lede: "r2rLede", chain: "r2rChain", notes: "r2rNotes" }, "");
    chain(model.fnd, { title: "fndTitle", lede: "fndLede", chain: "fndChain", notes: "fndNotes" }, "");

    // dashboards diagram
    const db = model.dashboards;
    if (db) {
      $("dbTitle").textContent = db.title; $("dbLede").textContent = db.lede;
      dash.render(db, db.chips || [], db.legend || model.legend || DEFAULTS.legend);
      $("dbNotes").innerHTML = notes(db.notes);
    }

    // lanes (supplier onboarding on Travel, data & reporting on Insurance)
    const o = model.onboarding;
    if (o) {
      $("obTitle").textContent = o.title; $("obLede").textContent = o.lede;
      $("lanes").innerHTML = o.lanes.map((l) => `<div class="lane"><header><h3>${esc(l.title)}</h3><span class="eyebrow">${esc(l.route)}</span></header><div class="steps">${l.steps.map((s) => `<div class="step ${esc(s.kind)}"><b>${esc(s.label)}</b>${esc(s.text)}</div>`).join("")}</div></div>`).join("") + `<div class="rail">${notes(o.notes)}</div>`;
    }

    // close: optional process map, then the calendar
    const c = model.close;
    if (c) {
      $("clTitle").textContent = c.title; $("clLede").textContent = c.lede;
      const pm = c.process;
      $("cpWrap").hidden = !pm;
      $("clCalTitle").hidden = !pm;
      $("clCalTitle").textContent = c.calendar_title || "Calendar";
      if (pm) closeMap.render(pm, pm.chips || [], pm.legend || DEFAULTS.legend);
      $("timeline").innerHTML = c.timeline.map((r) => `<div class="trow ${r.consolidation_team ? "cons" : ""}"><span class="when">${esc(r.when)}</span><span>${esc(r.what)}</span><span class="who">${esc(r.owner)}</span></div>`).join("");
    }

    // integrations
    $("inTitle").textContent = model.integrations.title; $("inLede").textContent = model.integrations.lede;
    renderInts();
  }

  const groupOf = (lane) => groups.find((g) => g.re.test(lane || "")) || null;
  function renderInts() {
    if (!M) return;
    const rows0 = M.integrations.rows;
    const q = $("q").value.trim().toLowerCase(), ln = $("laneSel").value, w = $("wsSel").value.toLowerCase();
    const rows = rows0.filter((i) => (!ln || (groupOf(i.lane) || {}).name === ln) &&
      (!w || String(i.workstream).toLowerCase().includes(w)) &&
      (!q || [i.id, i.name, i.source, i.target, i.notes].join(" ").toLowerCase().includes(q)));
    $("tbody").innerHTML = rows.map((i) => {
      const g = groupOf(i.lane);
      return `<tr><td>${esc(i.label || i.name)}${i.notes ? `<div class="ev">${esc(i.notes)}</div>` : ""}</td><td>${esc(i.source || "—")} → ${esc(i.target || "—")}</td><td><span class="lane-pill" style="color:${g ? esc(g.color) : "var(--muted)"}">${esc(i.lane)}</span></td><td>${esc(i.cadence || "—")}</td><td>${esc(i.workstream)}</td></tr>`;
    }).join("");
    $("count").textContent = rows.length + " of " + rows0.length;
  }
  ["q", "laneSel", "wsSel"].forEach((id) => $(id).addEventListener("input", renderInts));


  // ---------- admin ----------
  const admin = (function () {
    let users = [], comments = [], started = false, cs = "new", channel = null;
    const fmt = (d) => d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
    const mapIds = () => MAPS.map((m) => m.id);
    const mapBoxes = (sel, name) => [...mapIds(), "*"].map((id) =>
      `<label><input type="checkbox" name="${name}" value="${esc(id)}"${sel.includes(id) ? " checked" : ""}>${id === "*" ? "all" : esc(id)}</label>`).join("");
    const EVENTS = { registered: "registered", signed_in: "signed in", opened_map: "opened", commented: "commented on", invited: "invited", created_user: "created", deleted_user: "deleted", admin_update: "updated access" };
    function logLine(a, fresh) {
      const who = (users.find((u) => u.id === a.user_id) || {});
      const name = who.is_admin ? "Admin" : (who.display_name || a.email || "someone");
      const li = document.createElement("li");
      if (fresh) li.className = "new";
      li.innerHTML = `<b>${esc(name)}</b> ${esc(EVENTS[a.event] || a.event)} ${a.detail && a.event !== "admin_update" ? esc(a.detail) : ""}<span class="ev">${esc(fmt(a.at))}</span>`;
      return li;
    }
    async function loadUsers() {
      const r = await callFn("estate-admin", { action: "list_users" });
      users = r.users || [];
      $("admUserCount").textContent = users.length + " · " + users.filter((u) => u.status === "pending").length + " pending";
      $("admUsers").innerHTML = users.map((u) => {
        const self = u.id === me.id;
        const who = self ? "<b>Admin (you)</b>" : `<b>${esc(u.display_name || "—")}</b><div class="ev">${esc(u.email)}</div><div class="ev">${esc(u.organisation || "")}</div>`;
        return `<tr data-id="${esc(u.id)}"><td>${who}</td><td class="ev">${esc(fmt(u.created_at))}<br>last in: ${esc(fmt(u.last_sign_in_at))}</td>
          <td><select data-f="status"${self ? " disabled" : ""}>${["pending", "active", "disabled"].map((s) => `<option${s === u.status ? " selected" : ""}>${s}</option>`).join("")}</select></td>
          <td><span class="maps-pick">${mapBoxes(u.maps || [], "m-" + u.id)}</span></td>
          <td><input type="checkbox" data-f="admin"${u.is_admin ? " checked" : ""}${self ? " disabled" : ""}></td>
          <td><button type="button" class="btn small" data-act="save">Save</button>${self ? "" : ' <button type="button" class="btn small ghost" data-act="del">Delete</button>'}</td></tr>`;
      }).join("");
      $("admUsers").querySelectorAll("tr").forEach((tr) => {
        const id = tr.dataset.id;
        tr.querySelector('[data-act="save"]').addEventListener("click", async () => {
          const maps = [...tr.querySelectorAll('input[type="checkbox"][name]')].filter((x) => x.checked).map((x) => x.value);
          const body = { action: "update_user", user_id: id, maps };
          if (id !== me.id) { body.status = tr.querySelector('[data-f="status"]').value; body.is_admin = tr.querySelector('[data-f="admin"]').checked; }
          try { await callFn("estate-admin", body); toast("Saved."); loadUsers(); } catch (err) { toast(err.message); }
        });
        const del = tr.querySelector('[data-act="del"]');
        if (del) del.addEventListener("click", async () => {
          if (del.dataset.armed !== "1") { del.dataset.armed = "1"; del.textContent = "Confirm delete"; del.classList.add("danger"); setTimeout(() => { del.dataset.armed = ""; del.textContent = "Delete"; del.classList.remove("danger"); }, 4000); return; }
          try { await callFn("estate-admin", { action: "delete_user", user_id: id }); toast("User deleted."); loadUsers(); } catch (err) { toast(err.message); }
        });
      });
    }
    async function loadComments() {
      const r = await callFn("estate-admin", { action: "list_comments" });
      comments = r.comments || [];
      renderComments();
    }
    function renderComments() {
      const list = comments.filter((c) => !cs || c.status === cs);
      $("admCmtCount").textContent = comments.filter((c) => c.status === "new").length + " new";
      $("admComments").innerHTML = list.length ? list.map((c) => {
        const u = users.find((x) => x.id === c.user_id) || {};
        return `<div class="cmt" data-id="${c.id}"><div class="meta">#${c.id} · ${esc(fmt(c.created_at))} · ${esc(u.display_name || c.email || "")} · ${esc([c.map, c.tab, c.item_title].filter(Boolean).join(" › "))} · ${esc(c.status)}${c.emailed ? " · emailed" : ""}</div>
          <div class="body">${esc(c.body)}</div>
          <button type="button" class="btn small" data-s="accepted">Accept</button> <button type="button" class="btn small ghost" data-s="rejected">Reject</button> <button type="button" class="btn small ghost" data-s="new">Back to new</button></div>`;
      }).join("") : '<p class="muted">No comments here.</p>';
      $("admComments").querySelectorAll(".cmt").forEach((el) => el.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", async () => {
        try { await callFn("estate-admin", { action: "set_comment_status", id: Number(el.dataset.id), status: b.dataset.s }); await loadComments(); } catch (err) { toast(err.message); }
      })));
    }
    async function loadLog() {
      const r = await callFn("estate-admin", { action: "list_activity" });
      const ul = $("admLog"); ul.innerHTML = "";
      (r.activity || []).forEach((a) => ul.appendChild(logLine(a, false)));
    }
    function subscribe() {
      if (channel) return;
      channel = sb.channel("estate-activity")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, (payload) => {
          const a = payload.new;
          $("admLog").prepend(logLine(a, true));
          if (["registered", "commented"].includes(a.event)) { loadUsers().then(loadComments); toast(a.event === "registered" ? "New registration." : "New comment."); }
        })
        .subscribe();
    }
    $("cmtFilters").querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
      cs = c.dataset.cs;
      $("cmtFilters").querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", x === c));
      renderComments();
    }));
    $("addMode").addEventListener("change", () => { $("addPw").hidden = $("addMode").value !== "create"; });
    $("admAdd").addEventListener("submit", async (e) => {
      e.preventDefault();
      const maps = [...$("addMaps").querySelectorAll("input:checked")].map((x) => x.value);
      const body = { action: $("addMode").value === "create" ? "create_user" : "invite", email: $("addEmail").value.trim(), display_name: $("addName").value.trim(), maps };
      if (body.action === "create_user") body.password = $("addPw").value;
      $("addMsg").className = "msg"; $("addMsg").textContent = "Working…";
      try { await callFn("estate-admin", body); $("addMsg").textContent = body.action === "invite" ? "Invite sent." : "User created."; $("admAdd").reset(); $("addPw").hidden = true; loadUsers(); }
      catch (err) { $("addMsg").className = "msg err"; $("addMsg").textContent = err.message; }
    });
    return {
      async start() {
        if (started) return; started = true;
        $("addMaps").innerHTML = mapBoxes([], "add");
        try { await loadUsers(); await Promise.all([loadComments(), loadLog()]); subscribe(); }
        catch (err) { started = false; toast("Admin data could not be loaded: " + err.message); }
      },
    };
  })();

  const tabs = document.querySelectorAll("nav.tabs button");
  function showTab(t) {
    tabs.forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === t));
    TABS.forEach((k) => { $("tab-" + k).hidden = k !== t; });
    requestAnimationFrame(drawVisible);
  }
  tabs.forEach((b) => b.addEventListener("click", () => { showTab(b.dataset.tab); try { history.replaceState(null, "", "#" + b.dataset.tab); } catch (e) {} }));
  const h = (location.hash || "").slice(1);
  if (TABS.includes(h)) showTab(h);
})();
