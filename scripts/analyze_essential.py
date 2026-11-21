import json
import os
import re

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f"Loaded {len(items)} items")

# Let's inspect unique products by clustering consecutive or brand-related photos
# We will create a rich SKU mapping
sku_map = []

# Range 0 to 55: Essential Nutrition
# Let's see all texts in 0..55
for i in range(0, 56):
    sku_map.append((i, items[i]['file'], items[i]['combined_text']))

with open('scripts/essential_list.txt', 'w', encoding='utf-8') as f:
    for idx, f_name, txt in sku_map:
        f.write(f"[{idx:02d}] {f_name} :: {txt}\n")

print("Saved essential_list.txt")
