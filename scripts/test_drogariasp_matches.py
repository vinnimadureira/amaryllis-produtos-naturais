import requests
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

# 1. Drogaria SP
now_queries = [
    ("now-chlorella-500mg-200tabs", "chlorella now foods"),
    ("now-l-tryptophan-500mg-60caps", "triptofano now foods"),
    ("now-liquid-melatonin-59ml", "melatonina liquida now foods"),
    ("now-nac-600mg-100caps", "nac 600mg now foods"),
    ("now-vitamin-d3-k2-120caps", "d3 k2 now foods")
]

print("=== DROGARIA SAO PAULO SEARCH FOR NOW FOODS ===")
for pid, q in now_queries:
    try:
        url = f"https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search?ft={requests.utils.quote(q)}"
        r = requests.get(url, headers=headers, timeout=6)
        if r.status_code == 200:
            data = r.json()
            if data:
                item = data[0]
                img = item['items'][0]['images'][0]['imageUrl']
                print(f"[{pid}] -> {item['productName']} | {img}")
            else:
                print(f"[{pid}] -> no results on Drogaria SP")
    except Exception as e:
        print(f"[{pid}] err: {e}")

# 2. Panizza on Drogaria SP
panizza_queries = [
    ('panizza-tintura-artemisia-100ml', 'tintura artemisia'),
    ('panizza-tintura-babosa-100ml', 'tintura babosa'),
    ('panizza-tintura-calendula-100ml', 'tintura calendula'),
    ('panizza-tintura-canela-de-velho-100ml', 'tintura canela de velho'),
    ('panizza-tintura-cavalinha-100ml', 'tintura cavalinha'),
    ('panizza-tintura-confrei-100ml', 'tintura confrei'),
    ('panizza-tintura-ginkgo-biloba-100ml', 'tintura ginkgo biloba')
]

print("\n=== DROGARIA SAO PAULO SEARCH FOR PANIZZA ===")
for pid, q in panizza_queries:
    try:
        url = f"https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search?ft={requests.utils.quote(q)}"
        r = requests.get(url, headers=headers, timeout=6)
        if r.status_code == 200:
            data = r.json()
            # find panizza
            p_match = None
            for it in data:
                if 'panizza' in it.get('brand', '').lower() or 'panizza' in it.get('productName', '').lower():
                    p_match = it
                    break
            if p_match:
                img = p_match['items'][0]['images'][0]['imageUrl']
                print(f"[{pid}] -> {p_match['productName']} | {img}")
            else:
                print(f"[{pid}] -> no Panizza match")
    except Exception as e:
        print(f"[{pid}] err: {e}")
