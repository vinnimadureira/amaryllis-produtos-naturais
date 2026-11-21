import json
import os

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inv = json.load(f)

with open('scripts/new_products_specs.json', 'r', encoding='utf-8') as f:
    specs = json.load(f)

# Official VTEX URLs
official_urls = {
    'vitafor-profem-oleo-primula-60caps': 'https://drogariasp.vteximg.com.br/arquivos/ids/1690194/Profem-1000mg-Vitafor-60-Capsulas.jpg',
    'vitafor-omega-3-epa-dha-120caps': 'https://santaluzia.vteximg.com.br/arquivos/ids/1002237/3239837.png',
    'vitafor-nac-60caps': 'https://drogariasp.vteximg.com.br/arquivos/ids/1640833/NAC-600mg-Vitafor-30caps.jpg',
    'vitafor-resveratrol-plus-60caps': 'https://drogariasp.vteximg.com.br/arquivos/ids/1871979/Resveratrol-Plus-Vitafor-60-Capsulas.jpg',
    'konjac-massa-mf-noodles-270g': 'https://santaluzia.vteximg.com.br/arquivos/ids/978819/1208640.jpg',
    'alere-biscoito-polvilho-pipoca-40g': 'https://santaluzia.vteximg.com.br/arquivos/ids/997977/3168387.jpg',
    'alere-biscoito-alho-poro-55g': 'https://santaluzia.vteximg.com.br/arquivos/ids/998014/3210626.jpg',
    'alere-biscoito-nutritional-yeast-alecrim-70g': 'https://santaluzia.vteximg.com.br/arquivos/ids/997971/1258761.jpg',
    'crock-cereal-farelo-aveia-sem-gluten-200g': 'https://drogariasp.vteximg.com.br/arquivos/ids/1506782/Kit-6X--Farelo-de-Aveia-Sem-Gluten-Leve-Crock-200g.jpg',
    'risovita-leite-de-arroz-original-1l': 'https://santaluzia.vteximg.com.br/arquivos/ids/995276/1106589.jpg'
}

# Photo index overrides for products that were previously web_prods without photo_idx
photo_index_overrides = {
    'vitafor-vitamina-b12-gotas-30ml': 180,
    'now-vitamin-e-400-100softgels': 46,
    'now-garlic-oil-1500mg-100softgels': 47,
    'now-inositol-500mg-100caps': 48,
    'now-coq10-50mg-50softgels': 49,
    'belive-bolinho-cenoura-chocolate-40g': 141,
    'belive-bolinho-double-chocolate-40g': 137,
    'belive-bolinho-coco-chocolate-40g': 146,
    'belive-bolinho-laranja-chocolate-40g': 143,
    'belive-paozinho-cenoura-200g': 150,
    'belive-mandioca-chips-chimichurri-50g': 147,
    'belive-snack-pizza-50g': 148,
    'alere-biscoito-cacau-avela-30g': 135,
    'alere-biscoito-castanha-cebolinha-70g': 132,
    'crock-cereal-aveia-flocos-grossos-200g': 271,
    'crock-cereal-farinha-aveia-sem-gluten-200g': 272,
    'urbano-massa-arroz-parafuso-500g': 279,
    'harts-natural-granola-keto-low-carb-300g': 266,
    'harts-natural-granola-keto-protein-sal-marinho-200g': 267,
    'a-tal-da-castanha-caju-para-1l': 123,
    'aecia-geleia-organica-figo-200g': 260
}

mapped_catalog = []
for p in specs:
    item = dict(p)
    pid = item['id']
    if pid in official_urls:
        item['source_type'] = 'official_web'
        item['source_url'] = official_urls[pid]
    else:
        item['source_type'] = 'store_photo'
        idx = item.get('photo_idx', photo_index_overrides.get(pid, 0))
        item['photo_idx'] = idx
        raw_path = inv[idx]['full_path']
        alt = os.path.join('unzipped_fotos', 'Fotos', os.path.basename(raw_path))
        if os.path.exists(alt):
            item['photo_file'] = alt
        else:
            item['photo_file'] = raw_path
    mapped_catalog.append(item)

print(f"Total mapped: {len(mapped_catalog)}")
print("Official web count:", sum(1 for p in mapped_catalog if p['source_type'] == 'official_web'))
print("Store photo count:", sum(1 for p in mapped_catalog if p['source_type'] == 'store_photo'))

with open('scripts/wave2_mapped_catalog.json', 'w', encoding='utf-8') as f:
    json.dump(mapped_catalog, f, indent=2, ensure_ascii=False)
