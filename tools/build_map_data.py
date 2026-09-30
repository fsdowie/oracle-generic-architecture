#!/usr/bin/env python3
"""Build build/map.json for the protected estate map.

Merges site/model/map-model.json (layout, nodes, flows, process text) with
integrations/integration-register.yaml (the integration table) so the map always
reflects the knowledge pack. The output is uploaded to the private Supabase bucket
by .github/workflows/deploy-map.yml. It is never deployed to Vercel.
"""
import json, os, sys
try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required: pip install pyyaml")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model = json.load(open(os.path.join(ROOT, "site/model/map-model.json"), encoding="utf-8"))
reg = yaml.safe_load(open(os.path.join(ROOT, "integrations/integration-register.yaml"), encoding="utf-8"))

ints = []
for group, items in reg["groups"].items():
    for i in items:
        ints.append({k: i.get(v, "") or "" for k, v in
                     dict(id="id", name="name", source="source", target="target", direction="direction",
                          lane="lane", cadence="cadence", workstream="workstream", notes="notes").items()})
        ints[-1]["group"] = group

model.pop("_about", None)
model["integrations"]["rows"] = ints
for f in model["header"]["facts"]:
    f["value"] = f["value"].replace("{{integration_count}}", str(len(ints)))

ids = {n["id"] for n in model["nodes"]}
bad = [e for e in model["edges"] if e["from"] not in ids or e["to"] not in ids]
if bad:
    sys.exit(f"edges reference unknown nodes: {bad}")
if model.get("default_node") not in ids:
    sys.exit("default_node is not a node id")

os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
out = os.path.join(ROOT, "build/map.json")
json.dump(model, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"wrote {out}: {len(model['nodes'])} nodes, {len(model['edges'])} edges, {len(ints)} integrations")
