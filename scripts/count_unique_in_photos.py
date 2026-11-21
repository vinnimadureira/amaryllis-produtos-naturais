import json
import re

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inventory = json.load(f)

# Load existing 110 products
with open('src/lib/amaryllisFallbackData.ts', encoding='utf-8') as f:
    fb = f.read()

existing_ids = set(re.findall(r'id:\s*["\']([^"\']+)["\']', fb))
print(f"Already in store catalog: {len(existing_ids)} products")

# Let's inspect all items in inventory and classify them
print(f"Total photos in store archive: {len(inventory)}")
