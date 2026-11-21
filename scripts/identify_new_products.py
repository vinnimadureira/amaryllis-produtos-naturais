import json
import re
import os

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inventory = json.load(f)

# Load existing 110 products
with open('src/lib/amaryllisFallbackData.ts', encoding='utf-8') as f:
    fb = f.read()

existing_ids = set(re.findall(r'id:\s*["\']([^"\']+)["\']', fb))
print(f"Existing catalog count: {len(existing_ids)}")

# Let's inspect all items from 0 to 308 to find products not yet in existing_ids
print(f"Total inventory photos: {len(inventory)}")
