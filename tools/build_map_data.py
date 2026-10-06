#!/usr/bin/env python3
"""Build build/<map>/map.json for each protected estate map (travel, insurance).

Merges site/model/map-model.json (layout, nodes, flows, process text) with
integrations/integration-register.yaml (the integration table) so the map always
reflects the knowledge pack. The output is uploaded to the private Supabase bucket
by .github/workflows/deploy-map.yml. It is never deployed to Vercel.

Interfaces are shown by name ("INT · <name>"), never by number. Node `integrations`
may list register IDs, which are replaced by their names here. Node `docs` paths are
pack files, turned into links under the model's `docs_base`. The build fails if an
interface number would reach the screen.
"""
import json, os, re, sys
try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required: pip install pyyaml")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# One entry per map: (model, register). Usage: build_map_data.py [--map travel|insurance|all]
MAPS = {
    "travel": ("site/model/map-model.json", "integrations/integration-register.yaml"),
    "insurance": ("insurance/site/map-model.json", "insurance/integrations/integration-register.yaml"),
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
    return ("API" if i["id"].startswith("API") else "INT") + " · " + i["name"]


ints, by_id = [], {}
for group, items in reg["groups"].items():
    for i in items:
        row = {k: str(i.get(v, "") or "") for k, v in
               dict(id="id", name="name", source="source", target="target", direction="direction",
                    lane="lane", cadence="cadence", workstream="workstream", notes="notes").items()}
        row["group"] = group
        row["label"] = label(row)
        # pointers to pack files ("See INT955.md") are for agents, not map viewers
        row["notes"] = re.sub(r"\s*[;.]?\s*[Ss]ee [\w./-]+\.md\b\.?", "", row["notes"]).strip(" ;")
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
for n in model["nodes"]:
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
    n.pop("failure_modes", None)
    n.pop("evidence", None)

ids = {n["id"] for n in model["nodes"]}
bad = [e for e in model["edges"] if e["from"] not in ids or e["to"] not in ids]
if bad:
    sys.exit(f"edges reference unknown nodes: {bad}")
if model.get("default_node") not in ids:
    sys.exit("default_node is not a node id")

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
