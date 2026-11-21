import json
import re

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inventory = json.load(f)

# 1. Inspect Greenbios (photos 95 to 149)
print("=== INSPECTING GREENBIOS / CHÁS PHOTOS ===")
chas_found = set()
for item in inventory:
    txt = item['combined_text']
    # Check if it has tea name
    m = re.findall(r'(?:CHA|CHÁ|ERVA)\s+(?:DE\s+)?([A-ZÀ-Ú\s]{3,25})', txt.upper())
    for tea in m:
        t_clean = tea.strip().split('\n')[0].strip()
        if len(t_clean) > 3 and not any(w in t_clean for w in ['NATURAL', 'DO VALE', 'GREENBIOS', 'PARTE USADA']):
            chas_found.add(t_clean)

print("Unique tea names mentioned in OCR:", len(chas_found))
for c in sorted(chas_found):
    print("  Tea:", c)

# 2. Inspect Panizza (photos 56 to 95)
print("\n=== INSPECTING PANIZZA PHOTOS ===")
panizza_found = set()
for item in inventory:
    txt = item['combined_text']
    if 'PANIZZA' in txt.upper() or 'PNZ' in txt.upper() or 'TINTURA' in txt.upper():
        m = re.findall(r'(?:TINTURA\s+VEGETAL\s*20%|TINTURA\s+DE|TINTURA|PNZ)\s*([A-ZÀ-Ú\s]{3,25})', txt.upper())
        for pnz in m:
            p_clean = pnz.strip().split('\n')[0].strip()
            if len(p_clean) > 3 and not any(w in p_clean for w in ['PARTE USADA', '100ML', 'VEGETAL']):
                panizza_found.add(p_clean)

print("Unique Panizza tinturas mentioned in OCR:", len(panizza_found))
for p in sorted(panizza_found):
    print("  Tintura:", p)
