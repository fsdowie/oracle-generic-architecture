#!/usr/bin/env python3
"""Build manufacturing/integrations/rest-apis.json from Oracle's published REST endpoint lists.

Fetches the "All REST Endpoints" page of each guide below, keeps the top-level resources (child
resources, lists of values and flexfields are reached through their parent), and assigns each one
to a module on the Manufacturing map. Run it again when Oracle publishes a new release:

    python tools/rest_catalog.py            # fetch from docs.oracle.com
    python tools/rest_catalog.py --cache D  # read <D>/fin.html, scm.html, prc.html instead
"""
import html, json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "manufacturing/integrations/rest-apis.json")
GUIDES = {
    "fin": ("Financials", "REST API for Oracle Fusion Cloud Financials 26C",
            "https://docs.oracle.com/en/cloud/saas/financials/26c/farfa/"),
    "scm": ("SCM", "REST API for Oracle Fusion Cloud SCM 26B",
            "https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26b/fasrp/"),
    "prc": ("Procurement", "REST API for Oracle Fusion Cloud Procurement 25C",
            "https://docs.oracle.com/en/cloud/saas/procurement/25c/fapra/"),
}

# (guide, regex on "<area>/<resource name> <root path>") → map node id. First match wins.
RULES = [
    ("fin", r"/erp(integrations|BusinessEvents|Processes)\b|/integrations/resources/", "intg"),
    ("fin", r"receivables|autoInvoice|standardReceipts|receiptMethod|collection|dataPointValues|creditAndCollections|debitAuthorizations|revenue|sourceDocumentLines|alternateNameMapping|salespersonReference|billManagement", "ar"),
    ("fin", r"paymentProcessRequests|payablesPayments|paymentsExternalPayees|instrumentAssignments|externalBankAccounts|EarlyPaymentOffers", "pay"),
    ("fin", r"invoices|invoiceHolds|invoiceApprovals|payables|interimDocumentsPayables|invoiceTolerances", "ap"),
    ("fin", r"/cashBanks$|/cashBankBranches$|/cashBankAccounts$|bankAccountUserRules", "banktax"),
    ("fin", r"/cash", "ce"),
    ("fin", r"brazilianFiscal", "other"),
    ("fin", r"tax|Fiscal|withholding", "banktax"),
    ("fin", r"/expense", "exm"),
    ("fin", r"intercompany", "ic"),
    ("fin", r"accountingSetupMappingSets|attributeDerivation", "sla"),
    ("fin", r"journalBatches|ledgerBalances|currencyRates|chartOfAccountsFilters|fxRevaluation|fxTransfer", "coa"),
    ("fin", r"leaseAccounting", "fa"),
    ("prc", r"supplierNegotiation|SupplierNegotiation", "po"),
    ("prc", r"/supplier|/assessmentsInSupplierPortal|/qualificationsInSupplierPortal|/questionResponsesInSupplierPortal|/questionnaireResponses|AddressGeographies|approvedSupplierList|ApprovedSupplierList", "supp"),
    ("prc", r"requisition|Requisition|shopping|Shopping|punchout|contentZones|browsingCategories|catalogCategory|specialHandling", "req"),
    ("prc", r"purchaseOrder|PurchaseOrder|purchaseAgreement|purchasingDocument|procurementAgents|workConfirmations|externalPurchasePrices|massReplacement|MassReplacement", "po"),
    ("scm", r"^Inventory Management/.*(/receivingReceiptRequests|/receivingReceiptTransactionRequests|/receivingTransactions|/receivingReturns|/receivingDockLogs|/receipts$|/receiptAdviceLines|/inboundShipments|/supplierReturns|/validate(Receive|Inspect|PutAway|Return|Corrected|ReceivingTransaction))", "rcv"),
    ("scm", r"^Inventory Management/.*(/receiptCosts|invoiceMatchingReceiptQuantity|intransitValuation)", "rcvacct"),
    ("scm", r"^Inventory Management/.*(financialOrchestration|transferCharge)", "scfo"),
    ("scm", r"^Inventory Management/.*(/supplyRequests|/supplyLineDetails|/availableSupplySources)", "sco"),
    ("scm", r"^Inventory Management/.*(/shipment|/shipping|/shipConfirm|[pP]ick|/releaseRules|/releaseSequenceRules|/transportationSchedules|/printLabel)", "ship"),
    ("scm", r"^Inventory Management/.*([cC]ost|/resourceRates|/standardOverheadRates|valuationUnit|LandedCost|landedCost|chargeReferences|tradeOperations|chargeLinesForInvoice)", "cst"),
    ("scm", r"^Inventory Management/.*(fiscal|Fiscal|intrastat)", "other"),
    ("scm", r"^Inventory Management/", "inv"),
    ("scm", r"^Manufacturing/.*(assetSystemOptions|maintenance)", "other"),
    ("scm", r"^Manufacturing/", "mfg"),
    ("scm", r"^Order Management/.*/(channel|customerTradeProfiles|supplierTradeProfiles)", "other"),
    ("scm", r"^Order Management/.*/createCustomer$", "cust"),
    ("scm", r"^Order Management/", "om"),
    ("scm", r"^Product Lifecycle Management/.*/(items|itemStructures|itemCategories|itemCatalogs|itemClasses|itemStatuses|itemTemplates|itemBatches|newItemRequests|itemCategoryAssignments|itemOperationalAttributeControlLevels|tradingPartnerItems|tradingPartnerItemRelationships|manufacturers|crossReferenceRelationships|GTINRelationships|relatedItem\w*|spokeSystemItemRelationships|productUploads|supplierProducts)$", "item"),
    ("scm", r"^Supply Chain Planning/", "plan"),
    ("scm", r"^SCM Common/.*/b2b", "edi"),
    ("scm", r"^SCM Common/.*/(carriers|transitTimes)$", "ship"),
    ("scm", r"^SCM Common/.*/(inventoryOrganizations|schedules|scheduleExceptions|shifts|workdayPatterns|productionCalendarShiftExceptions)$", "ent"),
    ("scm", r"^SCM Common/.*([uU]nitOfMeasure|unitsOfMeasure|UnitOfMeasure|/packagingStrings$)", "item"),
    ("scm", r"^SCM Common/.*/workCenterResourceExceptions$", "mfg"),
]


def fetch(key, cache):
    if cache:
        return open(os.path.join(cache, key + ".html"), encoding="utf-8").read()
    with urllib.request.urlopen(GUIDES[key][2] + "rest-endpoints.html", timeout=120) as r:
        return r.read().decode("utf-8")


def parse(key, s):
    a = s.find('id="summary-sort-grouped"')
    b = s.find('role="tabpanel"', a + 10)
    s = s[a:b if b > 0 else None]
    base = GUIDES[key][2]
    for panel in s.split('<div class="panel panel-default">')[1:]:
        t = re.search(r'heading-title">\s*(.*?)\s*</div>', panel, re.S)
        if not t:
            continue
        name = html.unescape(re.sub(r"<.*?>", "", t.group(1))).strip()
        d = re.search(r'<div class="panel-body">\s*<div>(.*?)</div>', panel, re.S)
        desc = re.sub(r"\s+", " ", html.unescape(re.sub(r"<.*?>", "", d.group(1)))).strip() if d else ""
        ops = re.findall(r'<dt><a href="([^"]+)">.*?</a></dt><dd><div>Method: <span[^>]*>(\w+)</span></div><div>Path: <code>(.*?)</code>', panel, re.S)
        if not ops:
            continue
        parts = name.split("/")
        area, res = (parts[0], parts[1:]) if key == "scm" else (GUIDES[key][0], parts)
        if len(res) != 1 or "List of Values" in name:
            continue  # child resources and lists of values are reached through their parent
        root = min((html.unescape(p) for _, _, p in ops), key=len)
        first = min(ops, key=lambda o: len(o[2]))[0]
        yield {"name": res[0], "area": area, "guide": GUIDES[key][0], "path": root,
               "methods": sorted({m.upper() for _, m, _ in ops}),
               "actions": sorted({html.unescape(p).rsplit("/action/", 1)[1] for _, _, p in ops if "/action/" in p}),
               "description": desc if len(desc) <= 260 else desc[:257].rsplit(" ", 1)[0] + "…",
               "url": base + first}


def module(key, r):
    probe = f"{r['area']}/{r['name']} {r['path']}"
    for g, rx, node in RULES:
        if g == key and re.search(rx, probe):
            return node
    return "other"


def main():
    cache = sys.argv[sys.argv.index("--cache") + 1] if "--cache" in sys.argv else None
    rows = []
    for key in GUIDES:
        for r in parse(key, fetch(key, cache)):
            r["module"] = module(key, r)
            rows.append(r)
    rows.sort(key=lambda r: (r["guide"], r["area"], r["name"].lower()))
    sources = [{"guide": g, "title": t, "url": u + "rest-endpoints.html"} for g, t, u in GUIDES.values()]
    json.dump({"sources": sources, "rows": rows}, open(OUT, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=0)
    by = {}
    for r in rows:
        by[r["module"]] = by.get(r["module"], 0) + 1
    print(f"wrote {os.path.relpath(OUT, ROOT)}: {len(rows)} resources;", ", ".join(f"{k} {v}" for k, v in sorted(by.items())))


if __name__ == "__main__":
    main()
