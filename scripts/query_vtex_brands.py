import requests
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

searches = [
    ('b12-vitafor', 'https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search?ft=b12%20vitafor'),
    ('nac-vitafor', 'https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search?ft=nac%20vitafor'),
    ('resveratrol-vitafor', 'https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search?ft=resveratrol%20vitafor'),
    ('alere-sl', 'https://www.santaluzia.com.br/api/catalog_system/pub/products/search?ft=alere'),
    ('crock-zc', 'https://www.zonacerealista.com.br/api/catalog_system/pub/products/search?ft=leve%20crock'),
    ('urbano-sl', 'https://www.santaluzia.com.br/api/catalog_system/pub/products/search?ft=urbano'),
    ('harts-sl', 'https://www.santaluzia.com.br/api/catalog_system/pub/products/search?ft=hart%27s'),
    ('tal-da-castanha-sl', 'https://www.santaluzia.com.br/api/catalog_system/pub/products/search?ft=tal%20da%20castanha')
]

for label, url in searches:
    try:
        r = requests.get(url, headers=headers, timeout=6)
        if r.status_code == 200:
            data = r.json()
            print(f"=== {label} ({len(data)} items) ===")
            for item in data[:5]:
                pname = item.get('productName')
                img = item.get('items', [{}])[0].get('images', [{}])[0].get('imageUrl')
                print(f"  * {pname}: {img}")
    except Exception as e:
        print(f"Err {label}: {e}")
