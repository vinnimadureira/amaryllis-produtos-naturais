import json
import re
from collections import defaultdict

with open('d:/ProjetosIA/Amaryllis/products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Loaded {len(data)} images.")

# Print all items cleanly
with open('d:/ProjetosIA/Amaryllis/products_summary.txt', 'w', encoding='utf-8') as out:
    for idx, d in enumerate(data):
        txt = d['combined_text']
        out.write(f"[{idx:03d}] {d['file']} --> {txt}\n")

print("Saved products_summary.txt with all 308 items.")
