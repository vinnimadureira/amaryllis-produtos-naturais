import requests
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

searches = [
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
            for item in data[:6]:
                pname = item.get('productName')
                img = item.get('items', [{}])[0].get('images', [{}])[0].get('imageUrl')
                print(f"  * {pname}: {img}")
    except Exception as e:
        print(f"Err {label}: {e}")
