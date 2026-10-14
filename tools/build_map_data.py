#!/usr/bin/env python3
"""Build build/<map>/map.json for each protected estate map (travel, insurance, manufacturing).

Merges site/model/map-model.json (layout, nodes, flows, process text) with
integrations/integration-register.yaml (the integration table) so the map always
reflects the knowledge pack. The output is uploaded to the private Supabase bucket
by .github/workflows/deploy-map.yml. It is never deployed to Vercel.

Interfaces are shown by name ("INT · <name>"), never by number. Node `integrations`
may list register IDs, which are replaced by their names here. Node `docs` paths are
pack files, turned into links under the model's `docs_base`. The build fails if an
interface number would reach the screen. Open-interface registers (rows with a `table`)
are labelled "<TABLE> · <name>" instead.

A map may name a REST catalogue (`rest_catalog`, built by tools/rest_catalog.py). Node `rest`
lists then name catalogue resources (the last segment of the resource path, e.g. "invoices"),
a view of kind "table" with `"source": "rest_catalog"` receives the catalogue rows, and register
rows with a `rest` value show it in their notes.

A view of kind "workflows" holds scenarios drawn as swimlanes: `lanes` (columns), `steps` (process bubbles placed
in rows by `seq`) and `flows` (labelled arrows between steps). Step `ois` name register rows (shown by label), `rest` names
catalogue resources and `docs` are pack files, as for nodes; `evidence` stays in the pack and is not published.
"""
import json, os, re, sys
try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required: pip install pyyaml")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# One entry per map: (model, register). Usage: build_map_data.py [--map travel|insurance|manufacturing|all]
MAPS = {
    "travel": ("site/model/map-model.json", "integrations/integration-register.yaml"),
    "insurance": ("insurance/site/map-model.json", "insurance/integrations/integration-register.yaml"),
    "manufacturing": ("manufacturing/site/map-model.json", "manufacturing/integrations/open-interfaces.yaml"),
}
which = sys.argv[sys.argv.index("--map") + 1] if "--map" in sys.argv else "all"
if which == "all":
    import subprocess
    for name in MAPS:
        subprocess.run([sys.executable, os.path.abspath(__file__), "--map", name], check=True)
    sys.exit(0)
if which not in MAPS:
    sys.exit(f"unknown map {which}; choose from {', '.join(MAPS)}")
model = json.load(open(os.path.join(ROOT, MAPS[which][0]), encoding="utf-8"))
reg = yaml.safe_load(open(os.path.join(ROOT, MAPS[which][1]), encoding="utf-8"))


def label(i):
    if i.get("table"):  # an Oracle open interface table, e.g. "AP_INVOICES_INTERFACE · Payables invoices"
        return i["table"] + " · " + i["name"]
    return ("API" if i["id"].startswith("API") else "INT") + " · " + i["name"]


ints, by_id = [], {}
for group, items in reg["groups"].items():
    for i in items:
        row = {k: str(i.get(v, "") or "") for k, v in
               dict(id="id", name="name", source="source", target="target", direction="direction",
                    lane="lane", cadence="cadence", workstream="workstream", notes="notes", table="table", rest="rest").items()}
        row["group"] = group
        row["label"] = label(row)
        # pointers to pack files ("See INT955.md") are for agents, not map viewers
        row["notes"] = re.sub(r"\s*[;.]?\s*[Ss]ee [\w./-]+\.md\b\.?", "", row["notes"]).strip(" ;")
        if row["rest"]:
            row["notes"] = (row["notes"] + ". " if row["notes"] else "") + "REST: " + row["rest"]
        ints.append(row)
        by_id[row["id"]] = row

model.pop("_about", None)
model["integrations"]["rows"] = ints
counts = {"{{integration_count}}": str(len(ints)),
          "{{oic_count}}": str(sum("OIC" in r["lane"] for r in ints))}


def fill(s):
    for k, v in counts.items():
        s = s.replace(k, v)
    return s


for f in model["header"]["facts"]:
    f["value"] = fill(f["value"])

base = model.pop("docs_base", "")
# Every diagram on the map: the estate, plus optional dashboards and close-process diagrams.
diagrams = [("estate", model)]
if model.get("dashboards"):
    diagrams.append(("dashboards", model["dashboards"]))
if (model.get("close") or {}).get("process"):
    diagrams.append(("close.process", model["close"]["process"]))
# REST catalogue: resources by the last segment of their path
rest, cat = {}, None
if model.get("rest_catalog"):
    cat = json.load(open(os.path.join(ROOT, model.pop("rest_catalog")), encoding="utf-8"))
    for r in cat["rows"]:
        rest.setdefault(r["path"].rstrip("/").rsplit("/", 1)[-1], r)
titles = {n["id"]: n["title"] for n in model["nodes"]}
# extra tabs (model.views): each needs id, label, kind and data; their diagrams are checked like the others
for v in model.get("views", []):
    if not (v.get("id") and v.get("label") and v.get("data")) or v.get("kind") not in ("chain", "diagram", "table", "workflows"):
        sys.exit(f"view {v.get('id')}: needs id, label, data and kind chain|diagram|table|workflows")
    if v["kind"] == "diagram":
        diagrams.append((f"views.{v['id']}", v["data"]))
    if v["kind"] == "table":
        if v["data"].get("source") != "rest_catalog" or not cat:
            sys.exit(f"view {v['id']}: a table view needs source rest_catalog and a model rest_catalog")
        v["data"]["sources"] = cat["sources"]
        v["data"]["rows"] = [dict(r, module=titles.get(r["module"], "Not on this map")) for r in cat["rows"]]


def expand_rest(where, names):
    out = []
    for x in names:
        if x not in rest:
            sys.exit(f"{where}: REST resource not in the catalogue: {x}")
        out.append({k: rest[x][k] for k in ("name", "path", "methods", "actions", "url")})
    return out


def expand_docs(where, docs):
    for d in docs:
        if not os.path.exists(os.path.join(ROOT, d["path"])):
            sys.exit(f"{where}: doc path does not exist: {d['path']}")
        d["url"] = base + d.pop("path")


# workflow scenarios: lanes, steps placed by column, flows between steps
for v in model.get("views", []):
    if v["kind"] != "workflows":
        continue
    sc_ids = set()
    for sc in v["data"]["scenarios"]:
        w = f"view {v['id']} scenario {sc.get('id')}"
        if not (sc.get("id") and sc.get("label")) or sc["id"] in sc_ids or not re.fullmatch(r"[a-z0-9-]+", sc["id"]):
            sys.exit(f"{w}: needs a unique lowercase id and a label")
        sc_ids.add(sc["id"])
        lanes = [L["id"] for L in sc["lanes"]]
        if len(set(lanes)) != len(lanes):
            sys.exit(f"{w}: duplicate lane ids")
        steps, cells = {}, set()
        for s in sc["steps"]:
            if s["id"] in steps or s["lane"] not in lanes or not isinstance(s.get("seq"), int) or s["seq"] < 1:
                sys.exit(f"{w} step {s['id']}: duplicate id, unknown lane or bad seq")
            if (s["lane"], s["seq"]) in cells:
                sys.exit(f"{w} step {s['id']}: two steps in the same lane and row")
            cells.add((s["lane"], s["seq"]))
            steps[s["id"]] = s
            unknown = [x for x in s.get("ois", []) if x not in by_id]
            if unknown:
                sys.exit(f"{w} step {s['id']}: open interfaces not in the register: {unknown}")
            if s.get("ois"):
                s["open_interfaces"] = [by_id[x]["label"] for x in s.pop("ois")]
            if s.get("rest"):
                s["rest"] = expand_rest(f"{w} step {s['id']}", s["rest"])
            expand_docs(f"{w} step {s['id']}", s.get("docs", []))
            s.pop("evidence", None)
        bad = [f for f in sc["flows"] if f["from"] not in steps or f["to"] not in steps]
        if bad:
            sys.exit(f"{w}: flows reference unknown steps: {bad}")

for _, dg in diagrams:
  for n in dg["nodes"]:
    seen, shown = set(), []
    for x in n.get("integrations", []):
        x = by_id[x]["label"] if x in by_id else fill(x)
        if x not in seen:
            seen.add(x)
            shown.append(x)
    n["integrations"] = shown
    for d in n.get("docs", []):
        if not os.path.exists(os.path.join(ROOT, d["path"])):
            sys.exit(f"node {n['id']}: doc path does not exist: {d['path']}")
        d["url"] = base + d.pop("path")
    shown_rest = []
    for x in n.get("rest", []):
        if x not in rest:
            sys.exit(f"node {n['id']}: REST resource not in the catalogue: {x}")
        r = rest[x]
        shown_rest.append({k: r[k] for k in ("name", "path", "methods", "actions", "url")})
    if shown_rest:
        n["rest"] = shown_rest
    n.pop("failure_modes", None)
    n.pop("evidence", None)

for name, dg in diagrams:
    ids = {n["id"] for n in dg["nodes"]}
    layers = {L["id"] for L in dg["layers"]}
    bad = [e for e in dg["edges"] if e["from"] not in ids or e["to"] not in ids]
    if bad:
        sys.exit(f"{name}: edges reference unknown nodes: {bad}")
    if dg.get("default_node") not in ids:
        sys.exit(f"{name}: default_node is not a node id")
    stray = [n["id"] for n in dg["nodes"] if n["layer"] not in layers]
    if stray:
        sys.exit(f"{name}: nodes on unknown layers: {stray}")

# No interface number may reach the screen. Row ids (used only for search) and link URLs are not displayed.
NUM = re.compile(r"\b(?:INT|API)\s?\d{3}|INT#")


def scan(o, path=""):
    if isinstance(o, dict):
        for k, v in o.items():
            if not (k == "id" and path.endswith("rows[]")) and k != "url":
                yield from scan(v, f"{path}.{k}")
    elif isinstance(o, list):
        for v in o:
            yield from scan(v, path + "[]")
    elif isinstance(o, str) and NUM.search(o):
        yield f"{path}: {o[:100]}"


leaks = list(scan(model))
if leaks:
    sys.exit("interface numbers would be shown on the map:\n  " + "\n  ".join(leaks))

model["map"] = which
os.makedirs(os.path.join(ROOT, "build", which), exist_ok=True)
out = os.path.join(ROOT, "build", which, "map.json")
json.dump(model, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"wrote build/{which}/map.json: {len(model['nodes'])} nodes, {len(model['edges'])} edges, {len(ints)} integrations")
