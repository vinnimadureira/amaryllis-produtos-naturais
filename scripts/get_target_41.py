import json
import re

with open('scripts/audit_summary.json', 'r', encoding='utf-8') as f:
    audit = json.load(f)

# The groups to upgrade:
upgrade_brands = [
    'Belive', 'Vitafor', 'NOW Foods', 'A Tal da Castanha', "Hart's Natural",
    'Urbano', 'Crock Cereal', 'Konjac Massa MF', 'NotCo', 'Copra', 'Nazinha',
    'Alere Gourmet', 'Casarão'
]

by_brand = audit['store_photo_products_by_brand']

target_ids = []
for b in upgrade_brands:
    if b in by_brand:
        target_ids.extend(by_brand[b])

print(f"Total target products to upgrade: {len(target_ids)}")

with open('src/lib/amaryllisFallbackData.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

pattern = re.compile(r'{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)"')
id_to_name = dict(pattern.findall(ts_content))

targets = []
for pid in target_ids:
    targets.append({
        'id': pid,
        'name': id_to_name.get(pid, pid)
    })

print(json.dumps(targets, indent=2, ensure_ascii=False))

with open('scripts/target_41_upgrade.json', 'w', encoding='utf-8') as f:
    json.dump(targets, f, indent=2, ensure_ascii=False)
