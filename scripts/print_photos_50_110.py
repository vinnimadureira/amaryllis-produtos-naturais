import json

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inventory = json.load(f)

print(f"Total items: {len(inventory)}")

for i in range(50, 110):
    it = inventory[i]
    f = it['file']
    t = it['combined_text'].replace('\n', ' ')[:90]
    print(f"[{i:03d}] {f} -> {t}")
