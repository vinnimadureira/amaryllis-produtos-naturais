import requests
import json

headers = {'User-Agent': 'Mozilla/5.0'}

stores = [
    ('SantaLuzia', 'https://www.santaluzia.com.br/api/catalog_system/pub/products/search?ft='),
    ('DrogariaSP', 'https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search?ft=')
]

queries = [
    'notmilk',
    'not milk',
    'macarrao arroz urbano',
    'penne arroz urbano',
    'parafuso arroz urbano',
    'leve crock aveia',
    'leve crock flocos'
]

for q in queries:
    for sname, base_url in stores:
        try:
            r = requests.get(base_url + requests.utils.quote(q), headers=headers, timeout=4)
            if r.status_code == 200:
                data = r.json()
                if data:
                    print(f"=== [{sname}] '{q}' ({len(data)} items) ===")
                    for it in data[:3]:
                        print("  *", it.get('productName'), "|", it['items'][0]['images'][0]['imageUrl'])
        except Exception as e:
            pass
