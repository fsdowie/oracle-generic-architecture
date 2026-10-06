#!/usr/bin/env python3
"""Validate the Oracle knowledge pack before merge.

Checks
  1. Every .md file (except repo meta files) has YAML front matter with an `id`.
  2. IDs are unique across the pack.
  3. Every `links:` entry resolves to a known ID.
  4. Backticked relative paths to pack files exist.
  5. YAML files parse (00-index.yaml, integrations/integration-register.yaml).
  6. Every integration in the register has id, name, lane and evidence.
  7. Evidence tags use a known prefix (CO, ORA26C, USER, DATA, INFERRED, UNVERIFIED, CONFLICT).
  8. Warning only: Oracle-module files whose claims carry no ORA26C citation.

Exit code 1 on any error; warnings never fail the build.
"""
import glob, os, re, sys
try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required: pip install pyyaml")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
META = {"README.md", "CONTRIBUTING.md", "CHANGELOG.md", ".github/PULL_REQUEST_TEMPLATE.md"}
TAG_OK = ("CO", "ORA26C", "USER", "DATA", "INFERRED", "UNVERIFIED", "CONFLICT")
DIRS = r"(?:processes|integrations|operations|oracle-modules|external-systems|validation|foundation|governance)"
errors, warnings, ids = [], [], {}

def err(f, m): errors.append(f"{f}: {m}")
def warn(f, m): warnings.append(f"{f}: {m}")

md = [f.replace(os.sep, "/") for f in glob.glob("**/*.md", recursive=True)]
md = [f for f in md
      if f not in META and not f.startswith((".github/", "site/", "tools/"))]
fm = {}
for f in md:
    t = open(f, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---", t, re.S)
    if not m:
        err(f, "missing YAML front matter"); continue
    try:
        d = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError as e:
        err(f, f"front matter does not parse: {e}"); continue
    if not d.get("id"):
        err(f, "front matter has no id"); continue
    if d["id"] in ids:
        err(f, f"duplicate id {d['id']} (also in {ids[d['id']]})")
    ids[d["id"]] = f
    fm[f] = (d, t)

for f, (d, t) in fm.items():
    for l in d.get("links") or []:
        if l not in ids:
            err(f, f"links: unknown id {l}")
    for p in re.findall(r"`(" + DIRS + r"/[\w.\-]+)`", t):
        if not os.path.exists(p):
            err(f, f"referenced path does not exist: {p}")
    for tag in re.findall(r"`\[([A-Z0-9]+)[:\]]", t):
        if tag not in TAG_OK:
            err(f, f"unknown evidence tag prefix [{tag}]")
    if f.startswith("oracle-modules/") and "ORA26C" not in t and "evidence_gap" not in d:
        warn(f, "no ORA26C citation and no evidence_gap declared")

for y in ["00-index.yaml", "integrations/integration-register.yaml", "insurance/integrations/integration-register.yaml"]:
    try:
        data = yaml.safe_load(open(y, encoding="utf-8"))
    except Exception as e:
        err(y, f"does not parse: {e}"); continue
    if y.endswith("register.yaml"):
        seen = set()
        for g, items in data.get("groups", {}).items():
            for i in items:
                for k in ("id", "name", "lane", "evidence"):
                    if not i.get(k):
                        err(y, f"{g}/{i.get('id','?')}: missing {k}")
                if i.get("id") in seen:
                    err(y, f"duplicate integration id {i['id']}")
                seen.add(i.get("id"))

for w in warnings: print("WARN ", w)
for e in errors: print("ERROR", e)
print(f"\n{len(fm)} files, {len(ids)} ids, {len(errors)} errors, {len(warnings)} warnings")
sys.exit(1 if errors else 0)
