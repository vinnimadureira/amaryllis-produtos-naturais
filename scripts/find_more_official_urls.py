import requests
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

queries = {
    'vitafor-vitamina-b12-gotas-30ml': 'vitamina b12 gotas 9,9mcg vitafor 30ml',
    'vitafor-nac-60caps': 'nac 600mg vitafor 60 capsulas',
    'vitafor-resveratrol-plus-60caps': 'resveratrol plus vitafor 60 capsulas',
    'now-vitamin-e-400-100softgels': 'now foods vitamin e 400 d-alpha',
    'now-garlic-oil-1500mg-100softgels': 'now foods garlic oil 1500 mg 100 softgels',
    'now-inositol-500mg-100caps': 'now foods inositol 500 mg 100 veg capsules',
    'now-coq10-50mg-50softgels': 'now foods coq10 50 mg 50 softgels',
    'belive-bolinho-cenoura-chocolate-40g': 'bolinho de cenoura com chocolate belive 40g',
    'belive-bolinho-double-chocolate-40g': 'bolinho double chocolate belive 40g',
    'belive-bolinho-coco-chocolate-40g': 'bolinho coco gotas de chocolate belive 40g',
    'belive-bolinho-laranja-chocolate-40g': 'bolinho laranja gotas de chocolate belive 40g',
    'belive-paozinho-cenoura-200g': 'paozinho de cenoura belive 200g',
    'belive-mandioca-chips-chimichurri-50g': 'chips mandioca chimichurri belive 50g',
    'belive-snack-pizza-50g': 'snack assado pizza belive 50g',
    'alere-biscoito-cacau-avela-30g': 'biscoito cacau avela alere gourmet 30g',
    'alere-biscoito-castanha-cebolinha-70g': 'biscoito castanha caju cebolinha alere 70g',
    'alere-biscoito-nutritional-yeast-alecrim-70g': 'biscoito nutritional yeast alecrim alere 70g',
    'crock-cereal-aveia-flocos-grossos-200g': 'aveia flocos grossos sem gluten leve crock 200g',
    'crock-cereal-farinha-aveia-sem-gluten-200g': 'farinha aveia sem gluten leve crock 200g',
    'urbano-massa-arroz-parafuso-500g': 'macarrao de arroz parafuso urbano 500g',
    'harts-natural-granola-keto-low-carb-300g': 'granola keto harts natural 300g',
    'harts-natural-granola-keto-protein-sal-marinho-200g': 'granola keto sal marinho harts natural 200g',
    'a-tal-da-castanha-caju-para-1l': 'bebida vegetal caju para a tal da castanha 1l',
    'aecia-geleia-organica-figo-200g': 'geleia organica figo aecia 200g'
}

# Mercado Livre search API
results = {}
for pid, q in queries.items():
    try:
        url = f"https://api.mercadolibre.com/sites/MLB/search?q={requests.utils.quote(q)}&limit=3"
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
        if r.status_code == 200:
            data = r.json()
            items = data.get('results', [])
            if items:
                # get highest res image
                first = items[0]
                img_url = first.get('thumbnail', '')
                title = first.get('title', '')
                # replace thumbnail with full size
                img_url = img_url.replace('-I.jpg', '-O.jpg').replace('-V.jpg', '-O.jpg')
                results[pid] = {'title': title, 'url': img_url}
                print(f"[ML FOUND] {pid} -> {title} | {img_url}")
            else:
                print(f"[ML EMPTY] {pid}")
    except Exception as e:
        print(f"[ML ERR] {pid}: {e}")

with open('scripts/ml_found_urls.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
