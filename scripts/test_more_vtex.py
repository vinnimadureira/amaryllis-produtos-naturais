import requests

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

stores = [
    ("PagueMenos", "https://www.paguemenos.com.br/api/catalog_system/pub/products/search?ft="),
    ("Araujo", "https://www.araujo.com.br/api/catalog_system/pub/products/search?ft="),
    ("Extrafarma", "https://www.extrafarma.com.br/api/catalog_system/pub/products/search?ft="),
    ("Bistek", "https://www.bistek.com.br/api/catalog_system/pub/products/search?ft="),
    ("Mambo", "https://www.mambo.com.br/api/catalog_system/pub/products/search?ft="),
    ("StMarche", "https://www.marche.com.br/api/catalog_system/pub/products/search?ft=")
]

queries = ["color andina", "panizza", "greenbios", "alere"]

for store_name, base_url in stores:
    for q in queries:
        try:
            url = base_url + requests.utils.quote(q)
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code == 200:
                data = r.json()
                if data:
                    print(f"[{store_name}] '{q}' -> found {len(data)} items!")
                    print(f"   Sample: {data[0].get('productName')} | {data[0]['items'][0]['images'][0]['imageUrl']}")
        except:
            pass
