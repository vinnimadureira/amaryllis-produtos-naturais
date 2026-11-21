import json
import re
import os

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inventory = json.load(f)

# Load existing 110 products
with open('src/lib/amaryllisFallbackData.ts', encoding='utf-8') as f:
    fb = f.read()

existing_ids = set(re.findall(r'id:\s*["\']([^"\']+)["\']', fb))

# Inspect photos 53 to 112 (Panizza)
panizza_photos = []
for i in range(53, 113):
    it = inventory[i]
    panizza_photos.append((i, it['file'], it['combined_text']))

# Inspect photos 113 to 155 (Leites, Snacks, Belive, Alere)
snacks_photos = []
for i in range(113, 156):
    it = inventory[i]
    snacks_photos.append((i, it['file'], it['combined_text']))

# Inspect photos 156 to 171 (NOW Foods)
now_photos = []
for i in range(156, 172):
    it = inventory[i]
    now_photos.append((i, it['file'], it['combined_text']))

# Inspect photos 172 to 195 (Vitafor)
vitafor_photos = []
for i in range(172, 196):
    it = inventory[i]
    vitafor_photos.append((i, it['file'], it['combined_text']))

# Inspect photos 196 to 265 (Chás Vale do Ribeira / Greenbios)
chas_photos = []
for i in range(196, 266):
    it = inventory[i]
    chas_photos.append((i, it['file'], it['combined_text']))

# Inspect photos 266 to 308 (Outros produtos)
outros_photos = []
for i in range(266, len(inventory)):
    it = inventory[i]
    outros_photos.append((i, it['file'], it['combined_text']))

print(f"Panizza photos: {len(panizza_photos)}")
print(f"Snacks/Leites photos: {len(snacks_photos)}")
print(f"NOW Foods photos: {len(now_photos)}")
print(f"Vitafor photos: {len(vitafor_photos)}")
print(f"Chas photos: {len(chas_photos)}")
print(f"Outros photos: {len(outros_photos)}")
