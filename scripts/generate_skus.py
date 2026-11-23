"""Gera códigos (SKU) por categoria para todos os produtos.

Formato: PREFIXO-0001 (prefixo da categoria + sequencial de 4 dígitos).
Fonte da verdade: Cloudflare D1 (categorias reais). A ordem dentro de cada
categoria segue a ordem do catálogo em amaryllisFallbackData.ts (marcas agrupadas).
Saídas:
  - scripts/sku_migration.sql   (ALTER + UPDATEs + índice único)
  - scripts/sku_map.json        (id -> sku)
  - src/lib/amaryllisFallbackData.ts atualizado com `sku:` em cada produto
"""
import json
import re
import subprocess

PREFIXES = {
    "Essential Nutrition": "ESS",
    "Suplementos & Essential": "SUP",
    "Suplementos & Proteínas": "SUP",
    "Sem Glúten & Sem Lactose": "SGL",
    "Granel & Castanhas": "GRN",
    "Fitoterápicos & Chás": "FIT",
    "Orgânicos & Integrais": "ORG",
    "Dietéticos & Zero Açúcar": "DIE",
}

TS_PATH = "src/lib/amaryllisFallbackData.ts"

out = subprocess.run(
    'npx wrangler d1 execute amaryllis-db --remote --json '
    '--command="SELECT id, category FROM products"',
    shell=True, capture_output=True, text=True, encoding="utf-8",
)
rows = json.loads(out.stdout)[0]["results"]
print(f"Produtos no D1: {len(rows)}")

with open(TS_PATH, "r", encoding="utf-8") as f:
    ts = f.read()
ts_order = {pid: i for i, pid in enumerate(re.findall(r'^\s{4}id:\s*"([^"]+)"', ts, re.M))}

unknown = sorted({r["category"] for r in rows if r["category"] not in PREFIXES})
if unknown:
    raise SystemExit(f"Categorias sem prefixo definido: {unknown}")

rows.sort(key=lambda r: (PREFIXES[r["category"]], ts_order.get(r["id"], 10_000), r["id"]))

counters: dict[str, int] = {}
sku_map: dict[str, str] = {}
for r in rows:
    p = PREFIXES[r["category"]]
    counters[p] = counters.get(p, 0) + 1
    sku_map[r["id"]] = f"{p}-{counters[p]:04d}"

print("Códigos por prefixo:", counters)

# SQL migration
sql = ["ALTER TABLE products ADD COLUMN sku TEXT;"]
for pid, sku in sku_map.items():
    sql.append(f"UPDATE products SET sku = '{sku}' WHERE id = '{pid.replace(chr(39), chr(39) * 2)}';")
sql.append("CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku);")
with open("scripts/sku_migration.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql) + "\n")

with open("scripts/sku_map.json", "w", encoding="utf-8") as f:
    json.dump(sku_map, f, indent=2, ensure_ascii=False)

# Fallback TS: insere/atualiza `sku:` logo após o `id:` de cada produto
def add_sku(m: re.Match) -> str:
    indent, pid = m.group(1), m.group(2)
    sku = sku_map.get(pid)
    return m.group(0) if not sku else f'{m.group(0)}\n{indent}sku: "{sku}",'

ts = re.sub(r'\n\s{4}sku:\s*"[^"]*",', "", ts)  # idempotente
ts, n = re.subn(r'^(\s{4})id:\s*"([^"]+)",', add_sku, ts, flags=re.M)
with open(TS_PATH, "w", encoding="utf-8") as f:
    f.write(ts)

missing_ts = [pid for pid in sku_map if pid not in ts_order]
print(f"SKUs gerados: {len(sku_map)} | Fallback TS atualizado ({len(ts_order)} produtos no arquivo)")
if missing_ts:
    print("Produtos no D1 que não estão no fallback TS:", missing_ts)
