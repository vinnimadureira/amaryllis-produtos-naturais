import json
import os

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inv = json.load(f)

with open('scripts/new_products_specs.json', 'r', encoding='utf-8') as f:
    specs = json.load(f)

photo_prods = [p for p in specs if 'photo_idx' in p]
print(f"Total photo products: {len(photo_prods)}")

missing = []
for p in photo_prods:
    idx = p['photo_idx']
    if idx < len(inv):
        item = inv[idx]
        fpath = item['full_path']
        exists = os.path.exists(fpath)
        # check filename or unzipped_fotos path
        if not exists:
            alt = os.path.join('unzipped_fotos', 'Fotos', os.path.basename(fpath))
            if os.path.exists(alt):
                exists = True
                fpath = alt
        print(f"[{'EXISTS' if exists else 'MISSING'}] #{idx} {p['id']} -> {fpath}")
        if not exists:
            missing.append(p)
    else:
        print(f"[OUT OF RANGE] #{idx} {p['id']}")
        missing.append(p)

print(f"\nMissing files count: {len(missing)}")
