import requests
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

vtex_stores = [
    ("RelvaVerde", "https://www.relvaverde.com.br/api/catalog_system/pub/products/search?ft="),
    ("ChaeCia", "https://www.chaecia.com.br/api/catalog_system/pub/products/search?ft="),
    ("Hortifruti", "https://www.hortifruti.com.br/api/catalog_system/pub/products/search?ft="),
    ("ZonaCerealista", "https://www.zonacerealista.com.br/api/catalog_system/pub/products/search?ft="),
    ("MundoVerde", "https://www.mundoverde.com.br/api/catalog_system/pub/products/search?ft="),
    ("DrogariaSaoPaulo", "https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search?ft="),
    ("Panvel", "https://www.panvel.com/api/catalog_system/pub/products/search?ft=")
]

queries = [
    "panizza",
    "color andina",
    "now foods",
    "greenbios",
    "alere",
    "casarao penne espinafre",
    "crock cereal",
    "feita croc"
]

for name, base_url in vtex_stores:
    print(f"\n--- Checking {name} ---")
    for q in queries[:3]:
        try:
            r = requests.get(base_url + requests.utils.quote(q), headers=headers, timeout=5)
            if r.status_code == 200:
                data = r.json()
                print(f"[{name}] '{q}' -> found {len(data)} items")
                if data:
                    item = data[0]
                    pname = item.get('productName')
                    img = item.get('items', [{}])[0].get('images', [{}])[0].get('imageUrl')
                    print(f"     Sample: {pname} | {img}")
            else:
                print(f"[{name}] '{q}' -> status {r.status_code}")
        except Exception as e:
            print(f"[{name}] '{q}' -> err: {e}")
            break
