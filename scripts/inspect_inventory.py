import json
import re
from collections import defaultdict

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f"Total photos: {len(items)}")

# We can group photos by product identification
# Let's inspect the names and clusters
for idx, it in enumerate(items):
    it['idx'] = idx

# Group into brand/type buckets
print("First 30 files and texts:")
for i in range(30):
    print(f"[{i:03d}] {items[i]['file']} -> {items[i]['combined_text'][:80]}")
