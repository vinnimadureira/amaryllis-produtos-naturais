import json
import os
import re

with open('scripts/wave2_mapped_catalog.json', 'r', encoding='utf-8') as f:
    new_catalog = json.load(f)

# Read current fallback data
with open('src/lib/amaryllisFallbackData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract existing IDs
existing_ids = set(re.findall(r'id:\s*["\']([^"\']+)["\']', content))
print(f"Existing IDs in fallback data: {len(existing_ids)}")

products_to_add = [p for p in new_catalog if p['id'] not in existing_ids]
print(f"New products to add: {len(products_to_add)}")

# Build TypeScript snippets
ts_blocks = []
for p in products_to_add:
    # Ensure correct category name matching AMARYLLIS_CATEGORIES
    # Categories: Suplementos & Essential, Sem Glúten & Sem Lactose, Granel & Castanhas, Fitoterápicos & Chás, Orgânicos & Integrais, Dietéticos & Zero Açúcar
    cat = p.get('category', 'Orgânicos & Integrais')
    if 'suplemento' in cat.lower() or 'prote' in cat.lower():
        cat = 'Suplementos & Essential'
    elif 'glúten' in cat.lower() or 'lactose' in cat.lower():
        cat = 'Sem Glúten & Sem Lactose'
    elif 'fitoterápico' in cat.lower() or 'chá' in cat.lower():
        cat = 'Fitoterápicos & Chás'
    elif 'orgânico' in cat.lower() or 'integral' in cat.lower():
        cat = 'Orgânicos & Integrais'
    elif 'diet' in cat.lower():
        cat = 'Dietéticos & Zero Açúcar'

    # Clean description quotes
    desc = p['description'].replace('"', '\\"')

    block = f"""  {{
    id: "{p['id']}",
    name: "{p['name']}",
    description: "{desc}",
    price: {p['price']},
    price_display: "{p['price_display']}",
    image_url: "/products/{p['id']}.webp",
    category: "{cat}",
    featured: false,
    active: true,
    allow_direct_purchase: true,
    weight_grams: {p.get('weight_grams', 100)},
    height_cm: 18,
    width_cm: 12,
    length_cm: 12,
    material: "Curadoria Amaryllis",
    created_at: "2026-10-15T10:00:00Z",
    updated_at: "2026-11-21T10:00:00Z",
  }},"""
    ts_blocks.append(block)

# Insert before AMARYLLIS_TESTIMONIALS
target_marker = "];\n\nexport const AMARYLLIS_TESTIMONIALS"
if target_marker in content:
    replacement = "\n" + "\n".join(ts_blocks) + "\n" + target_marker
    updated_content = content.replace(target_marker, replacement, 1)
    with open('src/lib/amaryllisFallbackData.ts', 'w', encoding='utf-8') as f:
        f.write(updated_content)
    print("Successfully updated src/lib/amaryllisFallbackData.ts!")
else:
    print("ERROR: Could not find target_marker in src/lib/amaryllisFallbackData.ts")

# Generate D1 SQL
sql_statements = []
for p in products_to_add:
    cat = p.get('category', 'Orgânicos & Integrais')
    if 'suplemento' in cat.lower() or 'prote' in cat.lower():
        cat = 'Suplementos & Essential'
    elif 'glúten' in cat.lower() or 'lactose' in cat.lower():
        cat = 'Sem Glúten & Sem Lactose'
    elif 'fitoterápico' in cat.lower() or 'chá' in cat.lower():
        cat = 'Fitoterápicos & Chás'
    elif 'orgânico' in cat.lower() or 'integral' in cat.lower():
        cat = 'Orgânicos & Integrais'
    elif 'diet' in cat.lower():
        cat = 'Dietéticos & Zero Açúcar'

    pid = p['id'].replace("'", "''")
    name = p['name'].replace("'", "''")
    desc = p['description'].replace("'", "''")
    price = p['price']
    price_disp = p['price_display'].replace("'", "''")
    img = f"/products/{p['id']}.webp"
    weight = p.get('weight_grams', 100)
    
    stmt = f"INSERT OR IGNORE INTO products (id, name, description, price, price_display, image_url, category, featured, active, allow_direct_purchase, weight_grams, height_cm, width_cm, length_cm, material, created_at, updated_at) VALUES ('{pid}', '{name}', '{desc}', {price}, '{price_disp}', '{img}', '{cat}', 0, 1, 1, {weight}, 18, 12, 12, 'Curadoria Amaryllis', '2026-10-15T10:00:00Z', '2026-11-21T10:00:00Z');"
    sql_statements.append(stmt)

with open('scripts/wave2_insert.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_statements))
print(f"Generated {len(sql_statements)} SQL insert statements in scripts/wave2_insert.sql")
