import requests
import json

headers = {'User-Agent': 'Mozilla/5.0'}

r = requests.get("https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search?ft=now%20foods&_from=0&_to=49", headers=headers, timeout=6)
if r.status_code == 200:
    items = r.json()
    print(f"Total NOW items on Drogaria SP: {len(items)}")
    for it in items:
        pname = it.get('productName')
        img = it.get('items', [{}])[0].get('images', [{}])[0].get('imageUrl')
        print(f"  * {pname}: {img}")
