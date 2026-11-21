import json
import re

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inventory = json.load(f)

# Existing registered products
with open('src/lib/amaryllisFallbackData.ts', encoding='utf-8') as f:
    fb = f.read()

existing_names = set(re.findall(r'name:\s*["\']([^"\']+)["\']', fb))

# Analyze the inventory by sections
print(f"Total photos: {len(inventory)}")

# Scan sections:
# 1. Essential (0-55) -> 47 registered (essentially 100% of unique Essential products were registered, the other 8 photos were duplicate angles/back of cans)
# 2. Panizza (56-112) -> only 12 registered! ~18 additional tinturas exist!
# 3. Chás (196-260) -> only 5 registered! ~35 additional medicinal teas exist!
# 4. Vitafor (172-195) -> 6 registered! ~6 additional Vitafor supplements exist!
# 5. NOW Foods (156-171) -> 5 registered! ~4 additional NOW products exist!
# 6. Belive & Snacks (136-155) -> 5 registered! ~6 additional Belive snacks exist!
# 7. Other brands (RisoVita, Doces, Geleias, Adoçantes Stevia Dul-C, etc.)

additional_panizza = []
additional_chas = []
additional_vitafor = []
additional_now = []
additional_belive = []
additional_others = []

for idx, item in enumerate(inventory):
    txt = item['combined_text'].upper()
    file = item['file']
    
    # Check if Panizza
    if 56 <= idx <= 112:
        # extract tintura name
        lines = [l.strip() for l in txt.splitlines() if len(l.strip()) > 3]
        clean_desc = " ".join(lines[:3])
        additional_panizza.append((idx, file, clean_desc))
    elif 196 <= idx <= 265:
        lines = [l.strip() for l in txt.splitlines() if len(l.strip()) > 3]
        clean_desc = " ".join(lines[:3])
        additional_chas.append((idx, file, clean_desc))
    elif 172 <= idx <= 195:
        lines = [l.strip() for l in txt.splitlines() if len(l.strip()) > 3]
        clean_desc = " ".join(lines[:3])
        additional_vitafor.append((idx, file, clean_desc))
    elif 156 <= idx <= 171:
        lines = [l.strip() for l in txt.splitlines() if len(l.strip()) > 3]
        clean_desc = " ".join(lines[:3])
        additional_now.append((idx, file, clean_desc))
    elif 136 <= idx <= 155:
        lines = [l.strip() for l in txt.splitlines() if len(l.strip()) > 3]
        clean_desc = " ".join(lines[:3])
        additional_belive.append((idx, file, clean_desc))
    elif idx > 265:
        lines = [l.strip() for l in txt.splitlines() if len(l.strip()) > 3]
        clean_desc = " ".join(lines[:3])
        additional_others.append((idx, file, clean_desc))

print(f"\nPanizza section: {len(additional_panizza)} photos")
print(f"Chás Medicinais section: {len(additional_chas)} photos")
print(f"Vitafor section: {len(additional_vitafor)} photos")
print(f"NOW Foods section: {len(additional_now)} photos")
print(f"Belive & Snacks section: {len(additional_belive)} photos")
print(f"Outros produtos seção final: {len(additional_others)} photos")
