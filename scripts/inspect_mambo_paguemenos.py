import requests
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

# 1. Inspect Mambo Alere
r_mambo = requests.get('https://www.mambo.com.br/api/catalog_system/pub/products/search?ft=alere', headers=headers)
print("=== MAMBO ALERE ITEMS ===")
if r_mambo.status_code == 200:
    for it in r_mambo.json():
        pname = it.get('productName')
        img = it['items'][0]['images'][0]['imageUrl']
        print(f"  {pname} -> {img}")

# 2. Inspect Pague Menos Color Andina
r_pm = requests.get('https://www.paguemenos.com.br/api/catalog_system/pub/products/search?ft=color%20andina', headers=headers)
print("\n=== PAGUE MENOS COLOR ANDINA ITEMS ===")
if r_pm.status_code == 200:
    for it in r_pm.json():
        pname = it.get('productName')
        img = it['items'][0]['images'][0]['imageUrl']
        print(f"  {pname} -> {img}")
