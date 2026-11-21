import requests
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

def search_vtex(store_url, query):
    try:
        url = f"{store_url}/api/catalog_system/pub/products/search?ft={requests.utils.quote(query)}"
        r = requests.get(url, headers=headers, timeout=6)
        if r.status_code == 200:
            data = r.json()
            for prod in data:
                pname = prod.get('productName', '')
                if 'items' in prod and len(prod['items']) > 0:
                    for it in prod['items']:
                        if 'images' in it and len(it['images']) > 0:
                            img_url = it['images'][0]['imageUrl']
                            return pname, img_url
    except Exception as e:
        pass
    return None, None

vtex_stores = [
    ('Santa Luzia', 'https://www.santaluzia.com.br'),
    ('Drogaria SP', 'https://www.drogariasaopaulo.com.br'),
    ('Mambo', 'https://www.mambodelivery.com.br'),
    ('Pague Menos', 'https://www.paguemenos.com.br'),
    ('Droga Raia', 'https://www.drogaraia.com.br')
]

test_items = [
    'vitamina b12 gotas vitafor',
    'resveratrol vitafor 60',
    'profem vitafor',
    'omega for vitafor 120',
    'nac vitafor 60',
    'vitamin e 400 now foods',
    'garlic oil now foods',
    'inositol now foods',
    'coq10 now foods',
    'bolinho cenoura belive',
    'bolinho chocolate belive',
    'bolinho coco belive',
    'bolinho laranja belive',
    'paozinho cenoura belive',
    'chips mandioca belive chimichurri',
    'snack pizza belive',
    'biscoito cacau avela alere',
    'biscoito castanha cebolinha alere',
    'biscoito alecrim alere',
    'biscoito pipoca alere',
    'biscoito alho poro alere',
    'farelo aveia crock',
    'aveia flocos grossos crock',
    'farinha aveia crock',
    'konjac noodles',
    'macarrao arroz parafuso urbano',
    'granola keto harts',
    'leite arroz risovita',
    'castanha caju para tal da castanha',
    'geleia figo organica aecia'
]

for t in test_items:
    found = False
    for sname, surl in vtex_stores:
        pname, img = search_vtex(surl, t)
        if pname and img:
            print(f"[{sname}] {t} -> {pname} | {img}")
            found = True
            break
    if not found:
        print(f"[MISS] {t}")
