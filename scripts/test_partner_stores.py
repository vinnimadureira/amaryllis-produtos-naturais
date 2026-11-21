import requests
import json
import urllib.parse

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

stores = [
    ("Relva Verde", "https://www.relvaverde.com.br/api/catalog_system/pub/products/search?ft=panizza"),
    ("Cha e Cia", "https://www.chaecia.com.br/api/catalog_system/pub/products/search?ft=panizza"),
    ("Drogaria SP", "https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search?ft=panizza"),
    ("Panvel", "https://www.panvel.com/api/catalog_system/pub/products/search?ft=panizza"),
]

for name, url in stores:
    try:
        r = requests.get(url, headers=headers, timeout=6)
        print(f"{name}: status {r.status_code}, len {len(r.text)}")
        if r.status_code == 200:
            data = r.json()
            print(f"  Found {len(data)} items!")
            if data:
                print(f"  Sample: {data[0]['productName']}")
                print(f"  Img: {data[0]['items'][0]['images'][0]['imageUrl']}")
    except Exception as e:
        print(f"{name} error: {e}")
