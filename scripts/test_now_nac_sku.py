import requests

headers = {'User-Agent': 'Mozilla/5.0'}

# Test sku variants for NOW NAC 600mg
for code in range(850, 865):
    sku = f"now00{code}" if code < 1000 else f"now0{code}"
    for folder in ['l', 'v']:
        for i in range(1, 10):
            u = f"https://s3.images-iherb.com/now/{sku}/{folder}/{i}.jpg"
            try:
                r = requests.head(u, headers=headers, timeout=1.5)
                if r.status_code == 200:
                    print(f"FOUND SKU {sku} -> {u} ({r.headers.get('content-length')} bytes)")
                    break
            except:
                pass
