import requests
import json

queries = [
    "A Tal da Castanha Amendoa 1L",
    "Belive chips sal rosa",
    "Notco NotMilk Original",
    "Copra leite de coco",
    "Konjac Bucatini",
    "Nazinha sequilhos coco",
    "Urbano massa arroz penne"
]

headers = {'User-Agent': 'AmaryllisCatalog/1.0 (vinicius@amaryllisnaturais.com.br)'}

for q in queries:
    url = f"https://br.openfoodfacts.org/cgi/search.pl?search_terms={requests.utils.quote(q)}&search_simple=1&action=process&json=1"
    try:
        r = requests.get(url, headers=headers, timeout=6)
        if r.status_code == 200:
            data = r.json()
            products = data.get('products', [])
            print(f"Query '{q}': found {len(products)} products")
            if products:
                first = products[0]
                print(f"  Title: {first.get('product_name')}")
                print(f"  Image: {first.get('image_url') or first.get('image_front_url')}")
        else:
            print(f"Query '{q}': status {r.status_code}")
    except Exception as e:
        print(f"Error {q}: {e}")
