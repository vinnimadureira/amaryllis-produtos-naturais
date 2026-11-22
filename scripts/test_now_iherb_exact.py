import requests

headers = {'User-Agent': 'Mozilla/5.0'}

now_tests = [
    # Vitamin E-400
    "https://s3.images-iherb.com/now/now00850/l/34.jpg",
    "https://s3.images-iherb.com/now/now00850/v/34.jpg",
    "https://s3.images-iherb.com/now/now00850/l/20.jpg",
    "https://s3.images-iherb.com/now/now00850/v/20.jpg",
    # Garlic Oil
    "https://s3.images-iherb.com/now/now01780/l/20.jpg",
    "https://s3.images-iherb.com/now/now01780/v/20.jpg",
    # Inositol
    "https://s3.images-iherb.com/now/now00475/l/20.jpg",
    "https://s3.images-iherb.com/now/now00475/v/20.jpg",
    # CoQ10
    "https://s3.images-iherb.com/now/now03160/l/20.jpg",
    "https://s3.images-iherb.com/now/now03160/v/20.jpg",
]

# Let's brute force valid numbers 0 to 40 for each sku
skus = [('now-e400', 'now00850'), ('now-garlic', 'now01780'), ('now-inositol', 'now00475'), ('now-coq10', 'now03160')]

for name, sku in skus:
    found = False
    for folder in ['l', 'v']:
        for i in range(0, 45):
            u = f"https://s3.images-iherb.com/now/{sku}/{folder}/{i}.jpg"
            try:
                r = requests.head(u, headers=headers, timeout=1.5)
                if r.status_code == 200:
                    print(f"FOUND {name} -> {u} ({r.headers.get('content-length')} bytes)")
                    found = True
                    break
            except:
                pass
        if found:
            break
    if not found:
        print(f"MISS {name}")
