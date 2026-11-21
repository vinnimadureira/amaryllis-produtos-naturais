import json
from build_amaryllis_master_catalog import PRODUCTS

# Read current fallback data
with open('src/lib/amaryllisFallbackData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Generate TypeScript array of products
ts_products = ["export const AMARYLLIS_PRODUCTS = ["]

for p in PRODUCTS:
    p_id = p["id"]
    name = json.dumps(p["name"], ensure_ascii=False)
    # clean HTML tags for short description in fallback list or preserve full
    desc = json.dumps(p["short_desc"], ensure_ascii=False)
    price = p["price"]
    price_display = json.dumps(p["price_display"], ensure_ascii=False)
    image_url = json.dumps(f"/products/{p_id}.webp")
    category = json.dumps(p["category"], ensure_ascii=False)
    featured = "true" if p.get("featured", 0) else "false"
    weight = p.get("weight_grams", 300)
    
    ts_item = f"""  {{
    id: "{p_id}",
    name: {name},
    description: {desc},
    price: {price},
    price_display: {price_display},
    image_url: {image_url},
    category: {category},
    featured: {featured},
    active: true,
    allow_direct_purchase: true,
    weight_grams: {weight},
    height_cm: 18,
    width_cm: 12,
    length_cm: 12,
    material: "Curadoria Amaryllis",
    created_at: "2026-10-15T10:00:00Z",
    updated_at: "2026-11-21T10:00:00Z",
  }},"""
    ts_products.append(ts_item)

ts_products.append("];")
new_products_block = "\n".join(ts_products)

# Find start of export const AMARYLLIS_PRODUCTS and end before export const AMARYLLIS_TESTIMONIALS
import re
pattern = r"export const AMARYLLIS_PRODUCTS = \[.*?\];"
replacement = new_products_block

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Also clean testimonials of city mentions
new_content = new_content.replace("Dra. Camila Azevedo — Nutricionista (Campinas)", "Dra. Camila Azevedo — Nutricionista Clínica")
new_content = new_content.replace("Sempre indico a Amaryllis no Jardim Guanabara para meus pacientes.", "Sempre indico a Amaryllis para meus pacientes.")
new_content = new_content.replace("Fernanda M. — Jardim Guanabara", "Fernanda M. — Cliente Fiel")

with open('src/lib/amaryllisFallbackData.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Updated src/lib/amaryllisFallbackData.ts with {len(PRODUCTS)} real products.")
