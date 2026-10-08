/* Estate maps — client.
 * 1. Signs the viewer in with Supabase Auth (email + password).
 * 2. Downloads each map's JSON from the private Storage bucket. Row-level security on
 *    storage.objects lets a viewer read only the maps they are allow-listed for
 *    (see supabase/setup.sql). The viewer picks between the maps they can read.
 * 3. Renders the chosen map from its data. Nothing about the architecture is in this file.
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

  function show(which) {
    $("boot").hidden = which !== "boot";
    $("gate").hidden = which !== "gate";
    $("app").hidden = which !== "app";
  }

  if (!cfg.url || !cfg.anonKey || !window.supabase) {
    $("boot").textContent = "This site is not configured yet: config.js is missing its Supabase URL or anon key.";
    return;
  }
  const sb = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  const MAPS = Array.isArray(cfg.maps) && cfg.maps.length ? cfg.maps : [{ id: "map", title: "Estate Map", object: cfg.object || "map.json" }];

  // ---------- auth ----------
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
  $("signOut").addEventListener("click", async () => { await sb.auth.signOut(); });

  let loadedFor = null, available = [];
  async function onSession(session) {
    if (!session) { loadedFor = null; show("gate"); return; }
    if (loadedFor === session.user.id) return;
    loadedFor = session.user.id;
    show("boot"); $("boot").textContent = "Loading maps…";
    const results = await Promise.all(MAPS.map(async (m) => {
      const { data, error } = await sb.storage.from(cfg.bucket || "estate-map").download(m.object);
      if (error || !data) return null;
      try { return { meta: m, model: JSON.parse(await data.text()) }; } catch (err) { return null; }
    }));
    available = results.filter(Boolean);
    if (!available.length) {
      $("boot").innerHTML = "Signed in as " + esc(session.user.email) + ", but this account can't read any map. Ask the owner to add it to the viewer list.<br><br><button type=\"button\" id=\"bootOut\">Sign out</button>";
      $("bootOut").addEventListener("click", () => sb.auth.signOut());
      return;
    }
    $("who").textContent = session.user.email;
    const picker = $("mapSel");
    picker.innerHTML = available.map((a) => `<option value="${esc(a.meta.id)}">${esc(a.model.header.title || a.meta.title)}</option>`).join("");
    $("mapPick").hidden = available.length < 2;
    const saved = store.get("estateMap");
    const first = available.find((a) => a.meta.id === saved) || available[0];
    picker.value = first.meta.id;
    render(first.model);
    show("app");
    requestAnimationFrame(drawVisible);
  }
  $("mapSel").addEventListener("change", () => {
    const a = available.find((x) => x.meta.id === $("mapSel").value);
    if (!a) return;
    store.set("estateMap", a.meta.id);
    render(a.model);
    requestAnimationFrame(drawVisible);
  });
  sb.auth.getSession().then(({ data }) => onSession(data.session));
  sb.auth.onAuthStateChange((_evt, session) => { setTimeout(() => onSession(session), 0); });

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
        </dl>`;
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
  const TABS = ["estate", "p2p", "r2r", "fnd", "dash", "onboard", "close", "ints"];
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
    document.querySelectorAll("nav.tabs button").forEach((b) => { b.textContent = labels[b.dataset.tab]; b.hidden = !has[b.dataset.tab]; });
    const current = TABS.find((k) => !$("tab-" + k).hidden) || "estate";
    showTab(has[current] ? current : "estate");

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
      $(ids.chain).innerHTML = p.stages.map((s) => `<div class="stage"><span class="n">Stage ${esc(s.n)}</span><h4>${esc(s.title)}</h4><span class="sys">${esc(s.system)}</span>${badge(s, suffix)}<ul>${(s.points || [s.what]).filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${(s.entries || []).map(je).join("")}</div>`).join("");
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
