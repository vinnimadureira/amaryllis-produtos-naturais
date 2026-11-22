import json
import os
import re

# 1. Parse products from src/lib/amaryllisFallbackData.ts
with open('src/lib/amaryllisFallbackData.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

# Match each product block
pattern = re.compile(r'{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*description:\s*"((?:[^"\\]|\\.)*)",\s*price:\s*([^,]+),\s*price_display:\s*"([^"]+)",\s*image_url:\s*"([^"]+)",\s*category:\s*"([^"]+)"', re.DOTALL)

products = []
for m in pattern.finditer(ts_content):
    pid, name, desc, price, price_disp, img, cat = m.groups()
    products.append({
        'id': pid,
        'name': name,
        'image_url': img,
        'category': cat
    })

print(f"Total parsed products: {len(products)}")

# 2. Check which images exist and identify origin
# Known official sources list:
# Essential Nutrition (all 47) -> official
# Wave 1 official batch (20 items) -> official
# Wave 2 official batch (10 items) -> official
# Let's inspect scripts/batch_process_new_20_officials.py and scripts/fetch_essential_official_images.py

official_ids = set()

# Essential
for p in products:
    if p['id'].startswith('essential-'):
        official_ids.add(p['id'])

# Wave 1 officials
with open('scripts/batch_process_new_20_officials.py', 'r', encoding='utf-8') as f:
    b_content = f.read()
    wave1_ids = re.findall(r"'([a-z0-9\-]+)':\s*'http", b_content)
    official_ids.update(wave1_ids)

# Wave 2 mapped catalog
with open('scripts/wave2_mapped_catalog.json', 'r', encoding='utf-8') as f:
    w2 = json.load(f)
    for it in w2:
        if it.get('source_type') == 'official_web':
            official_ids.add(it['id'])

# Vitafor wave 1
for p in products:
    if p['id'].startswith('vitafor-') and p['id'] in [
        'vitafor-isofort-900g', 'vitafor-creafort-300g', 'vitafor-glutafort-300g',
        'vitafor-colagentek-300g', 'vitafor-simfort-30saches', 'vitafor-omega-3-120caps'
    ]:
        official_ids.add(p['id'])

official_count = 0
store_photo_count = 0
store_photo_products = []

for p in products:
    if p['id'] in official_ids:
        official_count += 1
    else:
        store_photo_count += 1
        store_photo_products.append(p)

print(f"\n--- AUDIT OF 172 PRODUCTS ---")
print(f"Official Supplier Studio Packshots: {official_count} ({official_count/len(products)*100:.1f}%)")
print(f"Store Photo (Rembg 1000x1000 WebP): {store_photo_count} ({store_photo_count/len(products)*100:.1f}%)")

# Group store_photo_products by brand/type
by_brand = {}
for p in store_photo_products:
    brand = p['name'].split('—')[-1].strip() if '—' in p['name'] else p['category']
    by_brand.setdefault(brand, []).append(p)

print(f"\nStore photo products by brand/group:")
for b, items in sorted(by_brand.items(), key=lambda x: len(x[1]), reverse=True):
    print(f"  * {b}: {len(items)} produtos")
    for it in items[:3]:
        print(f"      - {it['name']}")
    if len(items) > 3:
        print(f"      ... e mais {len(items)-3}")

# 3. Analyze the 308 photos in products_ocr_inventory.json
with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inv = json.load(f)

print(f"\n--- AUDIT OF 308 PHOTOS IN ZIP ---")
print(f"Total photos in inventory: {len(inv)}")

# Classify photos
# Section 0-52: Essential Nutrition (53 photos)
# Section 53-112: Panizza (60 photos)
# Section 113-155: Snacks / Leites / Belive / Alere / Casarão (43 photos)
# Section 156-171: NOW Foods (16 photos)
# Section 172-195: Vitafor (24 photos)
# Section 196-265: Chás e Ervas Vale do Ribeira / Greenbios (70 photos)
# Section 266-307: Massas / Granolas / Geleias / Crock / Urbano / Hart's / Aecia (42 photos)

sections = {
    "Essential Nutrition": (0, 52),
    "Panizza Fitoterápicos & Tinturas": (53, 112),
    "Snacks & Leites (Belive, Alere, Casarão, RisoVita, Tal da Castanha)": (113, 155),
    "NOW Foods": (156, 171),
    "Vitafor": (172, 195),
    "Chás & Ervas Medicinais (Vale do Ribeira / Greenbios)": (196, 265),
    "Massas, Granolas, Aveias & Geleias (Crock, Konjac, Urbano, Hart's, Aecia)": (266, 307)
}

for sname, (start, end) in sections.items():
    count = end - start + 1
    print(f"\nSeção: {sname} -> {count} fotos (índices {start} a {end})")

with open('scripts/audit_summary.json', 'w', encoding='utf-8') as f:
    json.dump({
        'total_products': len(products),
        'official_packshots_count': official_count,
        'store_photo_count': store_photo_count,
        'store_photo_products_by_brand': {b: [x['id'] for x in items] for b, items in by_brand.items()}
    }, f, indent=2, ensure_ascii=False)
