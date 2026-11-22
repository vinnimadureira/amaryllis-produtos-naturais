import requests
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

# 1. Test Belive Shopify / TiendaNube / Nuvemshop / VTEX store
belive_test_urls = [
    "https://www.belivebefree.com.br",
    "https://belivebegood.com.br",
    "https://loja.belivebefree.com.br"
]

print("--- Testing Belive Domains ---")
for u in belive_test_urls:
    try:
        r = requests.get(u, headers=headers, timeout=4)
        print(f"{u} -> status {r.status_code}")
    except Exception as e:
        print(f"{u} -> err: {e}")

# 2. Test Vitafor e-commerce search
print("\n--- Testing Vitafor direct ---")
try:
    r = requests.get("https://www.vitafor.com.br/api/catalog_system/pub/products/search?ft=glutamax", headers=headers, timeout=5)
    print(f"Vitafor VTEX API: status {r.status_code}")
    if r.status_code == 200:
        d = r.json()
        print("Found items on vitafor.com.br:", len(d))
        if d:
            print(d[0].get('productName'), d[0]['items'][0]['images'][0]['imageUrl'])
except Exception as e:
    print("Vitafor VTEX err:", e)

# 3. Test Urbano search on Mambo / Santa Luzia
print("\n--- Testing Urbano on Mambo ---")
try:
    r = requests.get("https://www.mambodelivery.com.br/api/catalog_system/pub/products/search?ft=arroz%20urbano%20500g", headers=headers, timeout=5)
    if r.status_code == 200:
        d = r.json()
        for item in d[:3]:
            print(item.get('productName'), item['items'][0]['images'][0]['imageUrl'])
except Exception as e:
    print("Mambo err:", e)
