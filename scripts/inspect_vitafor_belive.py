import requests
import json
import re

headers = {'User-Agent': 'Mozilla/5.0'}

# 1. Vitafor official store
vitafor_queries = [
    ('vitafor-glutamax-300g', 'glutamax 300g'),
    ('vitafor-isofort-wpi-chocolate-900g', 'isofort chocolate 900g'),
    ('vitafor-omegafor-plus-60caps', 'omegafor plus 60 capsulas'),
    ('vitafor-omegafor-vegan-60caps', 'omegafor vegan'),
    ('vitafor-coq10-200mg-60caps', 'coq10 200mg'),
    ('vitafor-vitamina-b12-gotas-30ml', 'vitamina b12 gotas')
]

print("=== VITAFOR OFFICIAL ===")
for pid, q in vitafor_queries:
    try:
        r = requests.get(f"https://www.vitafor.com.br/api/catalog_system/pub/products/search?ft={requests.utils.quote(q)}", headers=headers, timeout=4)
        if r.status_code == 200:
            d = r.json()
            if d:
                pname = d[0].get('productName')
                img = d[0]['items'][0]['images'][0]['imageUrl']
                print(f"[FOUND] {pid} -> {pname} | {img}")
    except Exception as e:
        print(f"[ERR] {pid}: {e}")

# 2. Belive platform inspection
print("\n=== BELIVE PLATFORM ===")
try:
    r = requests.get("https://www.belivebefree.com.br", headers=headers, timeout=5)
    print("Belive status:", r.status_code)
    # Check if shopify, vtex, nuvemshop, tray, etc.
    if 'vtex' in r.text.lower():
        print("Belive is VTEX!")
    elif 'shopify' in r.text.lower() or 'cdn.shopify.com' in r.text:
        print("Belive is Shopify!")
    elif 'nuvemshop' in r.text.lower() or 'mitiendanube' in r.text:
        print("Belive is Nuvemshop!")
    elif 'tray' in r.text.lower():
        print("Belive is Tray!")
    else:
        print("Platform not immediately detected, checking sitemap...")
except Exception as e:
    print("Belive err:", e)
