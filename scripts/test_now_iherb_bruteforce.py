import requests

headers = {'User-Agent': 'Mozilla/5.0'}

# Test now00857 (NAC 600mg) and now00373 (D3 K2)
for sku, name in [('now00857', 'NAC 600mg'), ('now00373', 'D3 K2')]:
    found = False
    for folder in ['l', 'v']:
        for i in range(0, 30):
            u = f"https://s3.images-iherb.com/now/{sku}/{folder}/{i}.jpg"
            try:
                r = requests.head(u, headers=headers, timeout=2)
                if r.status_code == 200:
                    print(f"FOUND {name} -> {u} ({r.headers.get('content-length')} bytes)")
                    found = True
                    break
            except:
                pass
        if found:
            break
    if not found:
        print(f"NOT FOUND on s3.images-iherb: {name}")
