import requests
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

# Test Forever Living 715, 734, 777
for sku, name in [("715", "forever-aloe-vera-gel-1l"), ("734", "forever-aloe-berry-nectar-1l"), ("777", "forever-aloe-peaches-1l")]:
    u = f"https://foreverliving.com/img/products/{sku}.png"
    r = requests.head(u, headers=headers, timeout=5)
    print(f"Forever {name} ({u}): status {r.status_code}")

# Test NOW Foods s3 images
# Let's search nowfoods.com product pages or search iherb product pages via iherb api or web
now_skus = {
    "now-chlorella-500mg-200tabs": "2627",
    "now-l-tryptophan-500mg-60caps": "0166",
    "now-liquid-melatonin-59ml": "3261",
    "now-nac-600mg-100caps": "0857",
    "now-vitamin-d3-k2-120caps": "0373"
}

for pid, sku in now_skus.items():
    # test nowfoods official cdn
    for v in range(10, 25):
        u = f"https://s3.images-iherb.com/now/now{sku}/v/{v}.jpg"
        r = requests.head(u, headers=headers, timeout=3)
        if r.status_code == 200:
            print(f"FOUND NOW {pid} -> {u} ({r.headers.get('content-length')} bytes)")
            break
        u_l = f"https://s3.images-iherb.com/now/now{sku}/l/{v}.jpg"
        r = requests.head(u_l, headers=headers, timeout=3)
        if r.status_code == 200:
            print(f"FOUND NOW {pid} -> {u_l} ({r.headers.get('content-length')} bytes)")
            break
