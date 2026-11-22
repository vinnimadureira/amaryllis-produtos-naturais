import requests
import json

headers = {'User-Agent': 'Mozilla/5.0'}

belive_queries = [
    ('belive-cookies-baunilha-chocolate-67g', 'cookies baunilha'),
    ('belive-protein-brownie-double-chocolate', 'brownie double chocolate'),
    ('belive-pao-de-mel-zero-45g', 'pao de mel'),
    ('belive-paozinho-batata-198g', 'paozinho batata'),
    ('belive-mandioca-chips-sal-rosa-50g', 'chips mandioca sal rosa'),
    ('belive-bolinho-cenoura-chocolate-40g', 'bolinho cenoura'),
    ('belive-bolinho-double-chocolate-40g', 'bolinho double chocolate'),
    ('belive-bolinho-coco-chocolate-40g', 'bolinho coco'),
    ('belive-bolinho-laranja-chocolate-40g', 'bolinho laranja'),
    ('belive-paozinho-cenoura-200g', 'paozinho cenoura'),
    ('belive-mandioca-chips-chimichurri-50g', 'chips mandioca chimichurri'),
    ('belive-snack-pizza-50g', 'snack pizza')
]

print("=== BELIVE OFFICIAL VTEX STORE ===")
for pid, q in belive_queries:
    try:
        url = f"https://www.belivebefree.com.br/api/catalog_system/pub/products/search?ft={requests.utils.quote(q)}"
        r = requests.get(url, headers=headers, timeout=4)
        if r.status_code == 200:
            data = r.json()
            if data:
                pname = data[0].get('productName')
                img = data[0]['items'][0]['images'][0]['imageUrl']
                print(f"[BELIVE FOUND] {pid} -> {pname} | {img}")
            else:
                print(f"[BELIVE EMPTY] {pid} ({q})")
        else:
            print(f"[BELIVE HTTP {r.status_code}] {pid}")
    except Exception as e:
        print(f"[BELIVE ERR] {pid}: {e}")
