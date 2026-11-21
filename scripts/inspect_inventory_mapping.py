import json
import os
import re

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f"Total photos in inventory: {len(items)}")

# Let's inspect scripts/build_amaryllis_master_catalog.py or cluster_and_catalog.py
# to see how the 308 photos were processed into the 110 products.
try:
    with open('scripts/build_amaryllis_master_catalog.py', encoding='utf-8') as f:
        c = f.read()
    print("build_amaryllis_master_catalog length:", len(c))
    # look for comments or explanations
    for line in c.splitlines()[:30]:
        print(" ", line)
except Exception as e:
    print("Error:", e)
