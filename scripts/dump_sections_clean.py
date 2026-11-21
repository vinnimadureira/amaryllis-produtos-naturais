import json
import re

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inventory = json.load(f)

with open('src/lib/amaryllisFallbackData.ts', encoding='utf-8') as f:
    fb = f.read()

existing_ids = set(re.findall(r'id:\s*["\']([^"\']+)["\']', fb))

# Helper to print section items
def dump_section(name, start, end):
    print(f"\n==========================================")
    print(f"SECTION: {name} (Idx {start} to {end-1})")
    print(f"==========================================")
    for i in range(start, min(end, len(inventory))):
        it = inventory[i]
        txt = " | ".join([line.strip() for line in it['combined_text'].splitlines() if len(line.strip()) > 2][:4])
        print(f"[{i:03d}] {it['file']} -> {txt}")

dump_section("PANIZZA", 53, 113)
dump_section("LEITES & SNACKS", 113, 156)
dump_section("NOW FOODS", 156, 172)
dump_section("VITAFOR", 172, 196)
dump_section("CHAS", 196, 266)
dump_section("OUTROS", 266, len(inventory))
