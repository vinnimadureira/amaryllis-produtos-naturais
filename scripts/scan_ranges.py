import json
import re

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f"Loaded {len(items)} items")

# Let's inspect items by index ranges to understand the exact sequence in the store:
# The photos were taken walking through sections of the store:
# [0 - 55]: Essential Nutrition
# [56 - 98]: Panizza / PNZ Tinturas
# [99 - 149]: GreenBios Chás Medicinais
# [150 - ...]: NOW Foods, Vitafor, Sem Glúten, Biscoitos, Massas, Molhos, Doces, Geleias, Adoçantes

ranges = [
    (0, 56, "Essential Nutrition"),
    (56, 95, "Panizza / PNZ Fitoterápicos"),
    (95, 145, "GreenBios Chás"),
    (145, 175, "NOW Foods & Vitafor"),
    (175, 230, "Sem Glúten & Snacks (Belive, Alere, A Tal da Castanha)"),
    (230, 275, "Massas & Cereais (Casarão, Urbano, Konjac, Crock, Nazinha)"),
    (275, 308, "Orgânicos, Sucos & Superfoods (Color Andina, Souly, Aecia, Aloe Vera)")
]

for start, end, label in ranges:
    print(f"\n--- {label} (Idx {start} to {end-1}) ---")
    for i in range(start, min(end, len(items))):
        txt = items[i]['combined_text'].strip()
        print(f"[{i:03d}] {items[i]['file']} :: {txt[:70]}")
