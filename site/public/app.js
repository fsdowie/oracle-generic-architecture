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
  const COL = { oic: "var(--oic)", airflow: "var(--airflow)", sched: "var(--airflow)", bulk: "var(--bulk)", extract: "var(--extract)", int: "var(--line)", ret: "var(--ext)",
    doc: "var(--oic)", acct: "var(--airflow)", oi: "var(--bulk)", ledger: "var(--extract)", goods: "var(--goods)", cash: "var(--cash)", ext: "var(--ext)" };
  // one journal entry card: { event, dr: [account types], cr: [account types] }
  // a REST resource: name linked to Oracle's page, root path, then methods and custom actions
  const safeUrl = (u) => /^https:\/\//.test(u || "") ? u : "#";
  const REST_BASE = /^\/fscmRestApi\/resources\/[\d.]+/;
  const shortPath = (p) => p.replace(REST_BASE, "");
  const restItem = (r) => `<li><a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer">${esc(r.name)}</a>` +
    `<div class="ev">${esc(r.methods.join(" · "))} ${esc(shortPath(r.path))}${r.actions.length ? " · actions: " + esc(r.actions.join(", ")) : ""}</div></li>`;
  const je = (e) => `<div class="je"><div class="je-ev">${esc(e.event)}</div><div class="je-row"><b>Dr</b><span>${e.dr.map(esc).join("<br>")}</span></div><div class="je-row"><b>Cr</b><span>${e.cr.map(esc).join("<br>")}</span></div></div>`;
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
      const links = D.edges.filter((e) => e.from === d.sel || e.to === d.sel);
      const nb = links.map((e) => {
        const o = D.nodes.find((x) => x.id === (e.from === d.sel ? e.to : e.from));
        return (e.from === d.sel ? "→ " : "← ") + o.title + (e.label ? " · " + e.label : "");
      });
      const labels = Object.assign({ functions: "What it does", integrations: "Interfaces", processes: "Key processes",
        open_interfaces: "Open interfaces", entries: "Journal entries", rest: "REST APIs" }, D.labels || {});
      const tags = (a) => a.map((i) => `<span class="tag">${esc(i)}</span>`).join("");
      const list = (a, cls) => `<ul class="${cls}">${a.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
      const fns = n.functions || [], ifs = n.integrations || [], docs = n.docs || [], facts = n.facts || [];
      const procs = n.processes || [], ois = n.open_interfaces || [], entries = n.entries || [], rest = n.rest || [];
      const docLinks = docs.filter((x) => /^https:\/\//.test(x.url))
        .map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)}</a></li>`).join("");
      $(ids.detail).innerHTML = `
        <div class="eyebrow">${esc(layer.label)} · ${esc(layer.title)}${n.external ? " · external" : ""}</div>
        <h3>${esc(n.title)}</h3><p>${esc(n.description)}</p>
        <dl>
          ${facts.map((f) => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join("")}
          ${fns.length ? `<div><dt>${esc(labels.functions)}</dt><dd>${list(fns, "fn")}</dd></div>` : ""}
          ${procs.length ? `<div><dt>${esc(labels.processes)}</dt><dd>${list(procs, "fn")}</dd></div>` : ""}
          ${entries.length ? `<div><dt>${esc(labels.entries)}</dt><dd>${entries.map(je).join("")}</dd></div>` : ""}
          ${ois.length ? `<div><dt>${esc(labels.open_interfaces)}</dt><dd>${list(ois, "ifs")}</dd></div>` : ""}
          ${ifs.length ? `<div><dt>${esc(labels.integrations)}</dt><dd>${list(ifs, "ifs")}</dd></div>` : ""}
          ${rest.length ? `<div><dt>${esc(labels.rest)}</dt><dd><ul class="docs rest">${rest.map(restItem).join("")}</ul></dd></div>` : ""}
          ${nb.length ? `<div><dt>Connected to</dt><dd>${links.some((e) => e.label) ? list(nb, "fn") : tags(nb)}</dd></div>` : ""}
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
  /* Business workflows (view kind "workflows"): scenario pills, then one swimlane diagram per scenario.
     Lanes are modules (columns), steps are process bubbles placed in rows by `seq` (top to bottom), flows are labelled arrows.
     data: { scenarios: [{ id, label, lede, lanes: [{id, label, external?}], steps: [{id, lane, seq, title, sub, description,
       process: [], in: [], out: [], entries: [], impacts: [{k, text}], open_interfaces: [], rest: [], docs: [] }],
       flows: [{from, to, kind, label}], notes: [] }], legend? } */
  const IMPACT = { DRCR: "Dr/Cr", INV: "Inventory", COST: "Cost", ACCR: "Accrual", CASH: "Cash" };
  const FLOW_LEGEND = [{ label: "document hand-off", color: "var(--oic)" }, { label: "goods movement", color: "var(--goods)" },
    { label: "accounting", color: "var(--airflow)" }, { label: "cash or bank", color: "var(--cash)" },
    { label: "external party", color: "var(--ext)", dash: true }];
  function makeFlow(t, P, data, tabSec) {
    const f = { sc: null, sel: null };
    const pick = (id) => data.scenarios.find((s) => s.id === id) || data.scenarios[0];
    $(P + "pills").innerHTML = data.scenarios.map((s, i) => `<button type="button" class="chip" data-sc="${esc(s.id)}" aria-pressed="false"><b>${i + 1}</b> ${esc(s.label)}</button>`).join("");
    $(P + "pills").querySelectorAll("[data-sc]").forEach((b) => b.addEventListener("click", () => {
      f.show(b.dataset.sc);
      try { history.replaceState(null, "", "#" + t + "/" + b.dataset.sc); } catch (e) {}
    }));
    $(P + "legend").innerHTML = legendHtml(data.legend || FLOW_LEGEND).replace("<span>Dashed box = external system</span>", "<span>Dashed bubble = external party</span>") +
      `<span class="bdkey">${Object.entries(IMPACT).map(([k, v]) => `<em class="bd ${k.toLowerCase()}">${k === "DRCR" ? "Dr/Cr" : k}</em> ${esc(v === "Dr/Cr" ? "journal entry" : v.toLowerCase())}`).join(" ")}</span>`;
    f.show = function (id) {
      const S = f.sc = pick(id);
      f.sel = S.steps[0].id;
      $(P + "pills").querySelectorAll("[data-sc]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.sc === S.id));
      $(P + "sclede").textContent = S.lede || "";
      const rows = Math.max(...S.steps.map((s) => s.seq)), n = S.lanes.length;
      const grid = $(P + "grid");
      grid.style.gridTemplateColumns = `repeat(${n}, minmax(96px, 1fr))`;
      grid.style.gridTemplateRows = `auto repeat(${rows}, auto)`;
      grid.style.minWidth = (n * 104) + "px";
      grid.innerHTML = `<svg class="edges" id="${P}edges" aria-hidden="true"></svg><svg class="edges flabels" id="${P}labels" aria-hidden="true"></svg>` + S.lanes.map((L, c) =>
        `<div class="wlane${L.external ? " ext" : ""}${c % 2 ? " alt" : ""}" style="grid-column:${c + 1};grid-row:1/-1"></div><div class="wlab" style="grid-column:${c + 1}">${esc(L.label)}</div>`).join("") +
        S.steps.map((s) => {
          const c = S.lanes.findIndex((L) => L.id === s.lane) + 1, ext = S.lanes[c - 1].external;
          const badges = (s.entries && s.entries.length ? `<em class="bd drcr">Dr/Cr</em>` : "") + (s.impacts || []).filter((i) => i.k !== "DRCR").map((i) => `<em class="bd ${esc(i.k.toLowerCase())}">${esc(i.k)}</em>`).join("");
          return `<button type="button" class="bubble${ext ? " ext" : ""}" id="${P}s-${esc(s.id)}" data-step="${esc(s.id)}" style="grid-column:${c};grid-row:${s.seq + 1}">` +
            `<span class="bt">${esc(s.title)}</span>${s.sub ? `<small>${esc(s.sub)}</small>` : ""}${badges ? `<span class="bds">${badges}</span>` : ""}</button>`;
        }).join("");
      grid.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => { f.sel = b.dataset.step; f.select(); }));
      $(P + "notes").innerHTML = notes(S.notes);
      f.select();
    };
    f.select = function () {
      const S = f.sc, s = S.steps.find((x) => x.id === f.sel), lane = S.lanes.find((L) => L.id === s.lane);
      S.steps.forEach((x) => { const el = $(P + "s-" + x.id); el.classList.toggle("sel", x.id === f.sel); el.setAttribute("aria-pressed", x.id === f.sel); });
      const name = (id) => S.steps.find((x) => x.id === id).title;
      const nb = S.flows.filter((e) => e.from === f.sel || e.to === f.sel)
        .map((e) => (e.from === f.sel ? "→ " + name(e.to) : "← " + name(e.from)) + (e.label ? " · " + e.label : ""));
      const list = (a, cls) => `<ul class="${cls}">${a.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
      const row = (label, html) => html ? `<div><dt>${esc(label)}</dt><dd>${html}</dd></div>` : "";
      const L = (a, cls) => (a && a.length ? list(a, cls || "fn") : "");
      const docLinks = (s.docs || []).filter((x) => /^https:\/\//.test(x.url))
        .map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)}</a></li>`).join("");
      $(P + "detail").innerHTML = `
        <div class="eyebrow">${esc(S.label)} · Step ${S.steps.indexOf(s) + 1} of ${S.steps.length} · ${esc(lane.label)}</div>
        <h3>${esc(s.title)}</h3><p>${esc(s.description || "")}</p>
        <dl>
          ${row("Process or task", L(s.process))}
          ${row("In", L(s.in))}
          ${row("Out", L(s.out))}
          ${row("Journal entries", (s.entries || []).map(je).join(""))}
          ${row("Impact", L((s.impacts || []).map((i) => (IMPACT[i.k] || i.k) + ": " + i.text)))}
          ${row("Open interfaces", L(s.open_interfaces, "ifs"))}
          ${row("REST APIs", s.rest && s.rest.length ? `<ul class="docs rest">${s.rest.map(restItem).join("")}</ul>` : "")}
          ${row("Connected to", L(nb))}
          ${row("Documents", docLinks ? `<ul class="docs">${docLinks}</ul>` : "")}
        </dl>
        ${s.goto && data.scenarios.some((x) => x.id === s.goto) ? `<button type="button" class="btn small" data-goto>Open the ${esc(pick(s.goto).label)} scenario</button> ` : ""}
        <button type="button" class="btn ghost small cmt-btn" data-cmt>Add comment</button>`;
      $(P + "detail").querySelector("[data-cmt]").addEventListener("click", () =>
        openComment({ tabLabel: tabLabel(tabSec), item_id: t + ":" + S.id + ":" + s.id, item_title: S.label + " › " + s.title }));
      const go = $(P + "detail").querySelector("[data-goto]");
      if (go) go.addEventListener("click", () => { f.show(s.goto); try { history.replaceState(null, "", "#" + t + "/" + s.goto); } catch (e) {} });
      f.draw();
    };
    f.draw = function () {
      const S = f.sc;
      if (!S || $("app").hidden || $(tabSec).hidden) return;
      const grid = $(P + "grid"), svg = $(P + "edges"), box = grid.getBoundingClientRect();
      if (!box.width) return;
      const kinds = [...new Set(S.flows.map((e) => e.kind))];
      let out = `<defs>${kinds.map((k) => `<marker id="${P}m-${esc(k)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:${COL[k] || "var(--line)"}"/></marker>`).join("")}</defs>`;
      let labels = "";
      const placed = []; // label boxes already drawn, so converging arrows don't print on top of each other
      const step = (id) => S.steps.find((x) => x.id === id);
      S.flows.forEach((e) => {
        const A = $(P + "s-" + e.from), B = $(P + "s-" + e.to); if (!A || !B) return;
        const a = A.getBoundingClientRect(), b = B.getBoundingClientRect();
        const on = e.from === f.sel || e.to === f.sel;
        const ax = a.left - box.left, ay = a.top - box.top, bx = b.left - box.left, by = b.top - box.top;
        const sa = step(e.from), sb = step(e.to);
        const skip = sa.lane === sb.lane && S.steps.some((x) => x.lane === sa.lane && x.seq > Math.min(sa.seq, sb.seq) && x.seq < Math.max(sa.seq, sb.seq));
        let x1, y1, x2, y2, c1x, c1y, c2x, c2y, level = false;
        if (skip) { // same lane with a step in between: bow out to the right so the arrow doesn't run behind it
          x1 = ax + a.width; y1 = ay + a.height / 2; x2 = bx + b.width; y2 = by + b.height / 2;
          c1x = Math.max(x1, x2) + 26; c1y = y1; c2x = c1x; c2y = y2;
        } else if (b.top >= a.bottom - 2) { // later row: bottom edge → top edge
          x1 = ax + a.width / 2; y1 = ay + a.height; x2 = bx + b.width / 2; y2 = by;
          const dy = Math.max(18, (y2 - y1) / 2); c1x = x1; c1y = y1 + dy; c2x = x2; c2y = y2 - dy;
        } else if (a.top >= b.bottom - 2) { // earlier row (a loop back): out of the right side, round, into the right side
          x1 = ax + a.width; y1 = ay + a.height / 2; x2 = bx + b.width; y2 = by + b.height / 2;
          c1x = Math.max(x1, x2) + 30; c1y = y1; c2x = c1x; c2y = y2;
        } else { // same row: side to side
          level = true; y1 = ay + a.height / 2; y2 = by + b.height / 2;
          if (bx > ax) { x1 = ax + a.width; x2 = bx; } else { x1 = ax; x2 = bx + b.width; }
          const dx = (x2 - x1) / 2; c1x = x1 + dx; c1y = y1; c2x = x2 - dx; c2y = y2;
        }
        const col = COL[e.kind] || "var(--line)";
        out += `<path d="M${x1},${y1} C${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}" fill="none" style="stroke:${col}" stroke-width="${on ? 2.4 : 1.5}" stroke-opacity="${on ? 1 : 0.55}"` +
          `${e.kind === "ext" ? ' stroke-dasharray="5 4"' : ""} marker-end="url(#${P}m-${esc(e.kind)})"/>`;
        if (e.label) { // on the curve's midpoint (in the gap between rows); for a side-to-side arrow, above the bubbles
          const mx = level ? (x1 + x2) / 2 : 0.125 * x1 + 0.375 * c1x + 0.375 * c2x + 0.125 * x2;
          let my = level ? Math.min(ay, by) - 4 : 0.125 * y1 + 0.375 * c1y + 0.375 * c2y + 0.125 * y2 + 3;
          const w = e.label.length * 6.4 + 6;
          while (placed.some((p) => Math.abs(p.y - my) < 12 && Math.abs(p.x - mx) < (p.w + w) / 2)) my += 12;
          placed.push({ x: mx, y: my, w });
          labels += `<text x="${mx}" y="${my}" text-anchor="middle" class="flabel${on ? " on" : ""}">${esc(e.label)}</text>`;
        }
      });
      [svg, $(P + "labels")].forEach((g) => g.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`));
      svg.innerHTML = out;
      $(P + "labels").innerHTML = labels;
    };
    new ResizeObserver(() => f.draw()).observe($(P + "grid"));
    const h = (location.hash || "").slice(1);
    f.show(h.startsWith(t + "/") ? h.slice(t.length + 1) : data.scenarios[0].id);
    return f;
  }

  const estate = makeDiagram({ box: "diagram", bands: "bands", edges: "edges", detail: "detail", chips: "wsChips", legend: "legend", tab: "tab-estate", prefix: "n-" });
  const dash = makeDiagram({ box: "dbDiagram", bands: "dbBands", edges: "dbEdges", detail: "dbDetail", chips: "dbChips", legend: "dbLegend", tab: "tab-dash", prefix: "d-" });
  const closeMap = makeDiagram({ box: "cpDiagram", bands: "cpBands", edges: "cpEdges", detail: "cpDetail", chips: "cpChips", legend: "cpLegend", tab: "tab-close", prefix: "c-" });
  const DIAGRAMS = [estate, dash, closeMap];
  let extraDiagrams = []; // diagrams on the current map's extra tabs (model.views)
  function drawVisible() { DIAGRAMS.concat(extraDiagrams).forEach((g) => g.draw()); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawVisible);

  // ---------- rendering ----------
  let M = null, groups = [];
  // every tab in the nav: the fixed tabs plus the current map's extra tabs
  const tabIds = () => [...document.querySelectorAll("nav.tabs button")].map((b) => b.dataset.tab);
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
    document.querySelectorAll("nav.tabs button:not([data-view])").forEach((b) => { if (b.dataset.tab === "admin") return; b.textContent = labels[b.dataset.tab]; b.hidden = !has[b.dataset.tab]; });
    const current = tabIds().find((k) => $("tab-" + k) && !$("tab-" + k).hidden) || "estate";

    // estate diagram and register filters
    const wss = model.workstreams || DEFAULTS.workstreams;
    estate.render(model, wss, model.legend || DEFAULTS.legend);
    groups = (model.lane_groups || DEFAULTS.lane_groups).map((g) => Object.assign({}, g, { re: new RegExp(g.match) }));
    $("laneSel").innerHTML = `<option value="">All lanes</option>` + groups.map((g) => `<option>${esc(g.name)}</option>`).join("");
    $("wsSel").innerHTML = `<option value="">All workstreams</option>` + wss.map((w) => `<option value="${esc(w.id)}">${esc(w.label)}</option>`).join("");
    $("q").value = "";

    // stage chains: Procure to Pay, Record to Report, Foundation & controls
    const badge = (s, suffix) => s.accounting === undefined ? "" :
      `<span class="acct ${s.accounting === "none" ? "none" : ""}">${s.accounting === "none" ? "no accounting" : esc(s.accounting) + suffix}</span>`;
    function chain(p, ids, suffix) {
      if (!p) return;
      $(ids.title).textContent = p.title; $(ids.lede).textContent = p.lede;
      if (p.badge_suffix !== undefined) suffix = p.badge_suffix;
      $(ids.chain).innerHTML = p.stages.map((s) => `<div class="stage"><span class="n">Stage ${esc(s.n)}</span><h4>${esc(s.title)}</h4><span class="sys">${esc(s.system)}</span>${badge(s, suffix)}<ul>${(s.points || [s.what]).filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${(s.entries || []).map(je).join("")}<button type="button" class="btn ghost small cmt-btn" data-stage="${esc(s.n)}" data-title="${esc(s.title)}">Add comment</button></div>`).join("");
      $(ids.chain).querySelectorAll("[data-stage]").forEach((b) => b.addEventListener("click", () =>
        openComment({ tabLabel: tabLabel(ids.tab), item_id: ids.chain + ":" + b.dataset.stage, item_title: "Stage " + b.dataset.stage + " · " + b.dataset.title })));
      $(ids.notes).innerHTML = (p.accounting_note ? `<div class="note"><b>Account types.</b> ${esc(p.accounting_note)}</div>` : "") + notes(p.notes);
    }
    chain(model.p2p, { title: "p2pTitle", lede: "p2pLede", chain: "chain", notes: "p2pNotes", tab: "tab-p2p" }, " via XLA");
    chain(model.r2r, { title: "r2rTitle", lede: "r2rLede", chain: "r2rChain", notes: "r2rNotes", tab: "tab-r2r" }, "");
    chain(model.fnd, { title: "fndTitle", lede: "fndLede", chain: "fndChain", notes: "fndNotes", tab: "tab-fnd" }, "");
    renderViews(model, chain);

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
    const cols = model.integrations.columns || ["Interface", "Source → Target", "Lane", "Cadence", "Workstream"];
    $("inHead").innerHTML = cols.map((c) => `<th>${esc(c)}</th>`).join("");
    $("q").placeholder = model.integrations.search_hint || "System or flow, e.g. Kyriba or supplier";
    renderInts();

    // stay on the same tab when it exists on this map; otherwise go back to the estate
    // a deep link to an extra tab (#v-…) only resolves now that the extra tabs exist
    const want = (location.hash || "").slice(1).split("/")[0]; // "#v-p2p/goods" opens a workflow scenario
    const target = want.startsWith("v-") && tabIds().includes(want) ? want : current;
    const ok = target === "admin" || (target in has ? has[target] : tabIds().includes(target));
    showTab(ok ? target : "estate");
  }

  /* Extra tabs a map declares in model.views: [{ id, label, kind: "chain" | "diagram" | "workflows" | "table", after?, eyebrow?, data }].
     Rebuilt on every render, so switching maps removes the previous map's extra tabs. */
  function renderViews(model, chain) {
    document.querySelectorAll("[data-view]").forEach((el) => el.remove());
    extraDiagrams = [];
    const nav = document.querySelector("nav.tabs"), adminBtn = nav.querySelector('[data-tab="admin"]');
    (model.views || []).forEach((v) => {
      const t = "v-" + v.id, P = t + "-";
      const btn = document.createElement("button");
      btn.setAttribute("role", "tab"); btn.setAttribute("aria-selected", "false");
      btn.dataset.tab = t; btn.dataset.view = "1"; btn.textContent = v.label;
      btn.addEventListener("click", () => selectTab(t));
      const prev = v.after && nav.querySelector(`[data-tab="${v.after}"]`);
      if (prev) prev.after(btn); else nav.insertBefore(btn, adminBtn);
      const sec = document.createElement("section");
      sec.id = "tab-" + t; sec.hidden = true; sec.dataset.view = "1";
      sec.innerHTML = `<div class="eyebrow">${esc(v.eyebrow || "Flow")}</div><h2 id="${P}title"></h2><p class="lede" id="${P}lede"></p>` +
        (v.kind === "diagram"
          ? `<div class="estate"><div><div class="filters"><span class="eyebrow">Path</span><span id="${P}chips" class="chipset"></span></div>
               <div class="diagram" id="${P}box"><svg class="edges" id="${P}edges" aria-hidden="true"></svg><div id="${P}bands"></div></div>
               <div class="legend" id="${P}legend"></div></div><aside class="detail" id="${P}detail" aria-live="polite"></aside></div>`
          : v.kind === "workflows"
          ? `<div class="filters wfpills"><span class="eyebrow">Scenario</span><span id="${P}pills" class="chipset"></span></div>
             <p class="sclede" id="${P}sclede"></p>
             <div class="estate"><div><div class="diagram flowbox"><div class="flowgrid" id="${P}grid"></div></div>
               <div class="legend" id="${P}legend"></div></div><aside class="detail" id="${P}detail" aria-live="polite"></aside></div>`
          : v.kind === "table"
          ? `<div class="tools"><label class="eyebrow" for="${P}q" style="align-self:center">Search</label>
               <input id="${P}q" type="search" placeholder="${esc(v.data.search_hint || "Search")}">
               <select id="${P}mod" aria-label="Module"></select><select id="${P}src" aria-label="Guide"></select>
               <span class="count" id="${P}count"></span></div>
             <div class="tablewrap"><table><thead><tr>${(v.data.columns || []).map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody id="${P}body"></tbody></table></div>`
          : `<div class="chain" id="${P}chain"></div>`) +
        `<div class="rail" id="${P}notes"></div>`;
      $("tab-admin").before(sec);
      const D = v.data;
      if (v.kind === "diagram") {
        $(P + "title").textContent = D.title; $(P + "lede").textContent = D.lede;
        const g = makeDiagram({ box: P + "box", bands: P + "bands", edges: P + "edges", detail: P + "detail", chips: P + "chips", legend: P + "legend", tab: sec.id, prefix: P + "n-" });
        g.render(D, D.chips || [], D.legend || model.legend || DEFAULTS.legend);
        $(P + "notes").innerHTML = notes(D.notes);
        extraDiagrams.push(g);
      } else if (v.kind === "workflows") {
        $(P + "title").textContent = D.title; $(P + "lede").textContent = D.lede;
        extraDiagrams.push(makeFlow(t, P, D, sec.id));
      } else if (v.kind === "table") {
        restTable(D, P);
      } else {
        chain(D, { title: P + "title", lede: P + "lede", chain: P + "chain", notes: P + "notes", tab: sec.id }, "");
      }
    });
  }

  /* A REST catalogue tab (view kind "table"): rows { name, description, module, path, methods, actions, guide, area, url },
     filtered by text, map module and guide. */
  function restTable(D, P) {
    $(P + "title").textContent = D.title; $(P + "lede").textContent = D.lede;
    const rows0 = D.rows || [];
    const uniq = (k) => [...new Set(rows0.map((r) => r[k]))].sort((a, b) => a === "Not on this map" ? 1 : b === "Not on this map" ? -1 : a.localeCompare(b));
    $(P + "mod").innerHTML = `<option value="">All modules</option>` + uniq("module").map((m) => `<option>${esc(m)}</option>`).join("");
    $(P + "src").innerHTML = `<option value="">All guides</option>` + uniq("guide").map((m) => `<option>${esc(m)}</option>`).join("");
    const draw = () => {
      const q = $(P + "q").value.trim().toLowerCase(), m = $(P + "mod").value, g = $(P + "src").value;
      const rows = rows0.filter((r) => (!m || r.module === m) && (!g || r.guide === g) &&
        (!q || [r.name, r.description, r.path, r.area, r.module, r.actions.join(" ")].join(" ").toLowerCase().includes(q)));
      $(P + "body").innerHTML = rows.map((r) => `<tr><td><a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer">${esc(r.name)}</a><div class="ev">${esc(r.description)}</div></td>` +
        `<td>${esc(r.module)}</td><td class="pathcell"><code class="path">${esc(shortPath(r.path))}</code></td>` +
        `<td>${esc(r.methods.join(" · "))}${r.actions.length ? `<div class="ev">actions: ${esc(r.actions.join(", "))}</div>` : ""}</td>` +
        `<td>${esc(r.guide)}${r.area !== r.guide ? `<div class="ev">${esc(r.area)}</div>` : ""}</td></tr>`).join("");
      $(P + "count").textContent = rows.length + " of " + rows0.length;
    };
    [P + "q", P + "mod", P + "src"].forEach((id) => $(id).addEventListener("input", draw));
    draw();
    $(P + "notes").innerHTML = notes(D.notes) + ((D.sources || []).length ? `<div class="note"><b>Source.</b> ${D.sources.map((s) =>
      `<a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`).join(" · ")}</div>` : "");
  }

  const groupOf = (lane) => groups.find((g) => g.re.test(lane || "")) || null;
  function renderInts() {
    if (!M) return;
    const rows0 = M.integrations.rows;
    const q = $("q").value.trim().toLowerCase(), ln = $("laneSel").value, w = $("wsSel").value.toLowerCase();
    const rows = rows0.filter((i) => (!ln || (groupOf(i.lane) || {}).name === ln) &&
      (!w || String(i.workstream).toLowerCase().includes(w)) &&
      (!q || [i.id, i.label, i.source, i.target, i.notes].join(" ").toLowerCase().includes(q)));
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
        if (!started) { started = true; $("addMaps").innerHTML = mapBoxes([], "add"); }
        try { await loadUsers(); await Promise.all([loadComments(), loadLog()]); subscribe(); }
        catch (err) { toast("Admin data could not be loaded: " + err.message); }
      },
    };
  })();

  function showTab(t) {
    const ids = tabIds();
    if (!ids.includes(t)) t = "estate";
    document.querySelectorAll("nav.tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === t));
    ids.forEach((k) => { const s = $("tab-" + k); if (s) s.hidden = k !== t; });
    if (t === "admin" && me && me.is_admin) admin.start(); // refresh users, comments and log each time
    requestAnimationFrame(drawVisible);
  }
  function selectTab(t) { showTab(t); try { history.replaceState(null, "", "#" + t); } catch (e) {} }
  document.querySelectorAll("nav.tabs button").forEach((b) => b.addEventListener("click", () => selectTab(b.dataset.tab)));
  const h = (location.hash || "").slice(1);
  if (tabIds().includes(h)) showTab(h);
})();
