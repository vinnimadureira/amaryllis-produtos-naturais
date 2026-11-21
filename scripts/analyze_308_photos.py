import json
import os
import re

# 1. Read all 308 items from products_ocr_inventory.json
with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inventory = json.load(f)

print(f"Total photos in inventory: {len(inventory)}")

# 2. Read products from build_amaryllis_master_catalog.py
with open('scripts/build_amaryllis_master_catalog.py', encoding='utf-8') as f:
    builder_content = f.read()

# Extract products list from builder
mapped_photos = set()
products = []
blocks = builder_content.split('{\n        "id":')
for b in blocks[1:]:
    m_id = re.search(r'^\s*["\']([^"\']+)["\']', b)
    m_name = re.search(r'"name":\s*["\']([^"\']+)["\']', b)
    m_photo = re.search(r'"photo":\s*["\']([^"\']+)["\']', b)
    if m_id:
        pid = m_id.group(1)
        pname = m_name.group(1) if m_name else pid
        pphoto = m_photo.group(1) if m_photo else None
        if pphoto:
            mapped_photos.add(pphoto)
        products.append({'id': pid, 'name': pname, 'photo': pphoto})

print(f"Total products defined in master catalog: {len(products)}")
print(f"Unique photos directly assigned as main packshot: {len(mapped_photos)}")

# 3. Analyze all 308 photos:
# Why are there 308 photos and ~110 products?
# Let's inspect duplicate angles / front & back / shelf duplicates
photo_filenames = [item['file'] for item in inventory]

# Check unmapped photos
unmapped = [item for item in inventory if item['file'] not in mapped_photos]
print(f"Photos not directly assigned as main packshot: {len(unmapped)}")

# Let's see what is in unmapped photos
# Group unmapped by brand/product detected
unmapped_summary = {}
for u in unmapped:
    txt = u['combined_text'].upper()
    file = u['file']
    
    brand_guess = "Outros / Desconhecido"
    if 'ESSENTIAL' in txt or 'CACAO WHEY' in txt or 'VANILLA' in txt or 'WHEY' in txt or 'CREALIFT' in txt or 'COLLAGEN' in txt:
        brand_guess = "Essential Nutrition (ângulos adicionais / verso / tabela / frente duplicada)"
    elif 'PANIZZA' in txt or 'TINTURA' in txt or 'PNZ' in txt:
        brand_guess = "Panizza (ângulos adicionais / verso / frascos repetidos)"
    elif 'GREENBIOS' in txt or 'CHA' in txt or 'CHÁ' in txt or 'ERVA' in txt:
        brand_guess = "Greenbios (ângulos adicionais / verso / sachês)"
    elif 'NOW' in txt or 'CHLORELLA' in txt or 'TRYPTOPHAN' in txt:
        brand_guess = "NOW Foods (tabela nutricional / verso / duplicadas)"
    elif 'VITAFOR' in txt or 'ISOFORT' in txt or 'CREAFORT' in txt:
        brand_guess = "Vitafor (ângulos adicionais / verso)"
    elif 'BELIVE' in txt or 'SEM GLÚTEN' in txt or 'SEM GLUTEN' in txt:
        brand_guess = "Sem Glúten (Belive, Casarão, Alere, etc. - verso e tabela)"
    elif 'COLOR ANDINA' in txt or 'ANDINA' in txt:
        brand_guess = "Color Andina (verso e tabela)"
    elif 'FOREVER' in txt or 'ALOE' in txt:
        brand_guess = "Forever Living (ângulos adicionais / verso)"
        
    unmapped_summary.setdefault(brand_guess, []).append((file, u['combined_text'][:80]))

print("\n=== DISTRIBUIÇÃO DAS 198 FOTOS RESTANTES ===")
for category, items in sorted(unmapped_summary.items(), key=lambda x: -len(x[1])):
    print(f"\n{category}: {len(items)} fotos")
    for file, sample in items[:5]:
        print(f"   • [{file}] {sample.replace('\n', ' ')}")
