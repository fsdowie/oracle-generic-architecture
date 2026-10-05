/* Estate map — client.
 * 1. Signs the viewer in with Supabase Auth (email + password).
 * 2. Downloads map.json from the private Storage bucket. Row-level security on
 *    storage.objects only lets allow-listed users read it (see supabase/setup.sql).
 * 3. Renders the map from that data. Nothing about the architecture is in this file.
 */
(function () {
  "use strict";
  const cfg = window.MAP_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

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

  let loadedFor = null;
  async function onSession(session) {
    if (!session) { loadedFor = null; show("gate"); return; }
    if (loadedFor === session.user.id) return;
    loadedFor = session.user.id;
    show("boot"); $("boot").textContent = "Loading map…";
    const { data, error } = await sb.storage.from(cfg.bucket || "estate-map").download(cfg.object || "map.json");
    if (error || !data) {
      $("boot").innerHTML = "Signed in as " + esc(session.user.email) + ", but this account can't read the map. Ask the owner to add it to the viewer list.<br><br><button type=\"button\" id=\"bootOut\">Sign out</button>";
      $("bootOut").addEventListener("click", () => sb.auth.signOut());
      return;
    }
    try {
      const model = JSON.parse(await data.text());
      $("who").textContent = session.user.email;
      render(model);
      show("app");
      requestAnimationFrame(drawEdges);
    } catch (err) {
      $("boot").textContent = "The map data could not be read: " + err.message;
    }
  }
  sb.auth.getSession().then(({ data }) => onSession(data.session));
  sb.auth.onAuthStateChange((_evt, session) => { setTimeout(() => onSession(session), 0); });

  // ---------- rendering ----------
  let M = null, sel = null, ws = "all";
  const COL = { oic: "var(--oic)", airflow: "var(--airflow)", bulk: "var(--bulk)", extract: "var(--extract)", int: "var(--line)", ret: "var(--ext)" };

  function render(model) {
    M = model; sel = model.default_node; ws = "all";
    const h = model.header;
    $("hEyebrow").textContent = h.eyebrow; $("hTitle").textContent = h.title; $("hLede").textContent = h.lede;
    $("facts").innerHTML = h.facts.map((f) => `<div><b>${esc(f.value)}</b>${esc(f.label)}</div>`).join("");
    $("footer").textContent = model.footer;

    // estate bands
    const bands = $("bands"); bands.innerHTML = "";
    model.layers.forEach((L) => {
      const b = document.createElement("div");
      b.className = "band" + (L.narrow ? " narrow" : "");
      b.innerHTML = `<div class="lab">${esc(L.label)}<b>${esc(L.title)}</b></div><div class="nodes"></div>`;
      model.nodes.filter((n) => n.layer === L.id).forEach((n) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "node" + (n.external ? " ext" : "") + (n.core ? " core" : "");
        el.id = "n-" + n.id;
        el.innerHTML = `${esc(n.title)}<small>${esc(n.subtitle)}</small>`;
        el.addEventListener("click", () => { sel = n.id; renderEstate(); });
        b.querySelector(".nodes").appendChild(el);
      });
      bands.appendChild(b);
    });
    renderEstate();

    // p2p
    const p = model.p2p;
    $("p2pTitle").textContent = p.title; $("p2pLede").textContent = p.lede;
    $("chain").innerHTML = p.stages.map((s) => `<div class="stage"><span class="n">Stage ${esc(s.n)}</span><h4>${esc(s.title)}</h4><span class="sys">${esc(s.system)}</span><span class="acct ${s.accounting === "none" ? "none" : ""}">${s.accounting === "none" ? "no accounting" : esc(s.accounting) + " via XLA"}</span><ul><li>${esc(s.what)}</li></ul></div>`).join("");
    $("p2pNotes").innerHTML = notes(p.notes);

    // onboarding
    const o = model.onboarding;
    $("obTitle").textContent = o.title; $("obLede").textContent = o.lede;
    $("lanes").innerHTML = o.lanes.map((l) => `<div class="lane"><header><h3>${esc(l.title)}</h3><span class="eyebrow">${esc(l.route)}</span></header><div class="steps">${l.steps.map((s) => `<div class="step ${esc(s.kind)}"><b>${esc(s.label)}</b>${esc(s.text)}</div>`).join("")}</div></div>`).join("") + `<div class="rail">${notes(o.notes)}</div>`;

    // close
    const c = model.close;
    $("clTitle").textContent = c.title; $("clLede").textContent = c.lede;
    $("timeline").innerHTML = c.timeline.map((r) => `<div class="trow ${r.consolidation_team ? "cons" : ""}"><span class="when">${esc(r.when)}</span><span>${esc(r.what)}</span><span class="who">${esc(r.owner)}</span></div>`).join("");

    // integrations
    $("inTitle").textContent = model.integrations.title; $("inLede").textContent = model.integrations.lede;
    renderInts();
  }
  const notes = (arr) => (arr || []).map((n) => `<div class="note"><b>${esc(n.title)}</b> ${esc(n.text)}</div>`).join("");

  function renderEstate() {
    M.nodes.forEach((n) => {
      const el = $("n-" + n.id);
      el.classList.toggle("sel", n.id === sel);
      el.classList.toggle("dim", ws !== "all" && !n.workstreams.includes(ws));
      el.setAttribute("aria-pressed", n.id === sel);
    });
    const n = M.nodes.find((x) => x.id === sel);
    const layer = M.layers.find((L) => L.id === n.layer);
    const nb = M.edges.filter((e) => e.from === sel || e.to === sel).map((e) => {
      const o = M.nodes.find((x) => x.id === (e.from === sel ? e.to : e.from));
      return (e.from === sel ? "→ " : "← ") + o.title;
    });
    const tags = (a) => a.map((i) => `<span class="tag">${esc(i)}</span>`).join("");
    const list = (a, cls) => `<ul class="${cls}">${a.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    const fns = n.functions || [], ifs = n.integrations || [], docs = n.docs || [];
    const docLinks = docs.filter((d) => /^https:\/\//.test(d.url))
      .map((d) => `<li><a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.label)}</a></li>`).join("");
    $("detail").innerHTML = `
      <div class="eyebrow">${esc(layer.label)} · ${n.external ? "external system" : "Oracle / platform"}</div>
      <h3>${esc(n.title)}</h3><p>${esc(n.description)}</p>
      <dl>
        ${fns.length ? `<div><dt>What it does</dt><dd>${list(fns, "fn")}</dd></div>` : ""}
        ${ifs.length ? `<div><dt>Interfaces</dt><dd>${list(ifs, "ifs")}</dd></div>` : ""}
        ${nb.length ? `<div><dt>Connected to</dt><dd>${tags(nb)}</dd></div>` : ""}
        ${docLinks ? `<div><dt>Documents</dt><dd><ul class="docs">${docLinks}</ul></dd></div>` : ""}
      </dl>`;
    drawEdges();
  }

  function drawEdges() {
    if (!M || $("app").hidden || $("tab-estate").hidden) return;
    const svg = $("edges"), box = $("diagram").getBoundingClientRect();
    let out = "";
    M.edges.forEach(({ from: a, to: b, kind: k }) => {
      const A = $("n-" + a), B = $("n-" + b); if (!A || !B) return;
      const ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect();
      const na = M.nodes.find((x) => x.id === a), nbb = M.nodes.find((x) => x.id === b);
      const on = a === sel || b === sel;
      const hidden = ws !== "all" && (!na.workstreams.includes(ws) || !nbb.workstreams.includes(ws));
      let x1 = ra.left + ra.width / 2 - box.left, y1 = ra.top + ra.height / 2 - box.top, x2 = rb.left + rb.width / 2 - box.left, y2 = rb.top + rb.height / 2 - box.top;
      const vertical = Math.abs(y1 - y2) > 8;
      if (vertical) { if (y2 > y1) { y1 = ra.bottom - box.top; y2 = rb.top - box.top; } else { y1 = ra.top - box.top; y2 = rb.bottom - box.top; } }
      else { if (x2 > x1) { x1 = ra.right - box.left; x2 = rb.left - box.left; } else { x1 = ra.left - box.left; x2 = rb.right - box.left; } }
      const my = (y1 + y2) / 2;
      const d = vertical ? `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}` : `M${x1},${y1} L${x2},${y2}`;
      out += `<path d="${d}" fill="none" stroke="${COL[k] || "var(--line)"}" stroke-width="${on ? 2.4 : 1.2}" stroke-opacity="${hidden ? 0.06 : on ? 1 : 0.35}" ${k === "ret" ? 'stroke-dasharray="5 4"' : ""}/>`;
    });
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = out;
  }
  new ResizeObserver(drawEdges).observe($("diagram"));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawEdges);

  document.querySelectorAll("#wsFilters .chip").forEach((c) => c.addEventListener("click", () => {
    ws = c.dataset.ws;
    document.querySelectorAll("#wsFilters .chip").forEach((x) => x.setAttribute("aria-pressed", x === c));
    if (M) renderEstate();
  }));

  const laneOf = (l) => /Airflow/.test(l) ? "Airflow" : (/EIB|FBDI/.test(l) && !/OIC/.test(l)) ? "Bulk" : /BICC/.test(l) ? "Extract" : "OIC";
  const laneCol = { OIC: "var(--oic)", Airflow: "var(--airflow)", Bulk: "var(--bulk)", Extract: "var(--extract)" };
  const wsOf = (w) => /Platform/i.test(w) ? "Platform" : /Foundation/i.test(w) ? "Foundation" : /P2P/.test(w) ? "P2P" : "R2R";
  function renderInts() {
    if (!M) return;
    const rows0 = M.integrations.rows;
    const q = $("q").value.trim().toLowerCase(), ln = $("laneSel").value, w = $("wsSel").value;
    const rows = rows0.filter((i) => (!ln || laneOf(i.lane) === ln) && (!w || wsOf(i.workstream) === w) &&
      (!q || [i.id, i.name, i.source, i.target, i.notes].join(" ").toLowerCase().includes(q)));
    $("tbody").innerHTML = rows.map((i) => `<tr><td>${esc(i.label || i.name)}${i.notes ? `<div class="ev">${esc(i.notes)}</div>` : ""}</td><td>${esc(i.source || "—")} → ${esc(i.target || "—")}</td><td><span class="lane-pill" style="color:${laneCol[laneOf(i.lane)]}">${esc(i.lane)}</span></td><td>${esc(i.cadence || "—")}</td><td>${esc(i.workstream)}</td></tr>`).join("");
    $("count").textContent = rows.length + " of " + rows0.length;
  }
  ["q", "laneSel", "wsSel"].forEach((id) => $(id).addEventListener("input", renderInts));

  const TABS = ["estate", "p2p", "onboard", "close", "ints"];
  const tabs = document.querySelectorAll("nav.tabs button");
  function showTab(t) {
    tabs.forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === t));
    TABS.forEach((k) => { $("tab-" + k).hidden = k !== t; });
    if (t === "estate") requestAnimationFrame(drawEdges);
  }
  tabs.forEach((b) => b.addEventListener("click", () => { showTab(b.dataset.tab); try { history.replaceState(null, "", "#" + b.dataset.tab); } catch (e) {} }));
  const h = (location.hash || "").slice(1);
  if (TABS.includes(h)) showTab(h);
})();
