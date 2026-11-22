import requests
import json
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

test_targets = [
    # NOW Foods
    ('now-vitamin-e-400-100softgels', 'https://drogariasp.vteximg.com.br/arquivos/ids/2232470/'), # test
    # Vitafor
    ('vitafor-vitamina-b12-gotas-30ml', 'b12 gotas vitafor'),
    ('vitafor-glutamax-300g', 'glutamax vitafor 300g'),
    # Belive
    ('belive-cookies-baunilha-67g', 'cookies baunilha gotas chocolate belive 67g'),
    ('belive-brownie-double-chocolate-40g', 'protein brownie double chocolate belive 40g'),
    ('belive-pao-de-mel-45g', 'pao de mel belive 45g'),
    ('belive-bolinho-cenoura-chocolate-40g', 'bolinho cenoura belive 40g'),
    ('belive-bolinho-double-chocolate-40g', 'bolinho double chocolate belive 40g'),
    # A Tal da Castanha
    ('a-tal-da-castanha-amendoa-1l', 'leite amendoa a tal da castanha 1l'),
    ('a-tal-da-castanha-caju-1l', 'bebida castanha caju a tal da castanha 1l'),
    ('a-tal-da-castanha-mixed-nuts-1l', 'bebida mixed nuts a tal da castanha 1l'),
    # Hart's Natural
    ('harts-natural-granola-keto-low-carb-300g', 'granola keto harts natural 300g'),
    # NotCo
    ('notco-notmilk-original-1l', 'notmilk original 1l'),
    # Copra
    ('copra-leite-de-coco-900ml', 'leite coco beber copra 900ml')
]

vtex_stores = [
    ('SantaLuzia', 'https://www.santaluzia.com.br/api/catalog_system/pub/products/search?ft='),
    ('DrogariaSP', 'https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search?ft='),
    ('Mambo', 'https://www.mambodelivery.com.br/api/catalog_system/pub/products/search?ft=')
]

for pid, q in test_targets:
    if q.startswith('http'):
        continue
    found = False
    for sname, base_url in vtex_stores:
        try:
            r = requests.get(base_url + requests.utils.quote(q), headers=headers, timeout=4)
            if r.status_code == 200:
                data = r.json()
                if data and len(data) > 0 and 'items' in data[0] and len(data[0]['items']) > 0:
                    pname = data[0].get('productName')
                    # verify match
                    img = data[0]['items'][0]['images'][0]['imageUrl']
                    print(f"[FOUND {sname}] {pid} -> {pname} | {img}")
                    found = True
                    break
        except Exception as e:
            pass
    if not found:
        print(f"[NOT FOUND] {pid} ({q})")
