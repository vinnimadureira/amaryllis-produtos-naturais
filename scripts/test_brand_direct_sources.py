import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

# 1. Test NOW Foods on iHerb CDN / Now Foods
now_test_urls = [
    ("now-chlorella-500mg-200tabs", "https://images.iherb.com/v/NOW-02627-0.jpg"),
    ("now-chlorella-500mg-200tabs-b", "https://s3.images-iherb.com/now/now02627/v/16.jpg"),
    ("now-l-tryptophan-500mg-60caps", "https://images.iherb.com/v/NOW-00166-0.jpg"),
    ("now-l-tryptophan-500mg-60caps-b", "https://s3.images-iherb.com/now/now00166/v/14.jpg"),
    ("now-liquid-melatonin-59ml", "https://images.iherb.com/v/NOW-03261-0.jpg"),
    ("now-liquid-melatonin-59ml-b", "https://s3.images-iherb.com/now/now03261/v/18.jpg"),
    ("now-nac-600mg-100caps", "https://images.iherb.com/v/NOW-00857-0.jpg"),
    ("now-nac-600mg-100caps-b", "https://s3.images-iherb.com/now/now00857/v/13.jpg"),
    ("now-vitamin-d3-k2-120caps", "https://images.iherb.com/v/NOW-00373-0.jpg"),
    ("now-vitamin-d3-k2-120caps-b", "https://s3.images-iherb.com/now/now00373/v/20.jpg")
]

print("=== TESTING NOW FOODS IHERB MASTER CDN ===")
for name, u in now_test_urls:
    try:
        r = requests.head(u, headers=headers, timeout=5)
        print(f"{name}: status {r.status_code}, length {r.headers.get('content-length')}")
    except Exception as e:
        print(f"{name} err: {e}")

# 2. Test Color Andina sitemap / site
print("\n=== TESTING COLOR ANDINA SITE ===")
try:
    r = requests.get("https://colorandinafoods.com.br/sitemap_products_1.xml", headers=headers, timeout=8)
    print("Color Andina sitemap status:", r.status_code)
    if r.status_code == 200:
        import re
        urls = re.findall(r'<loc>(https://[^<]+)</loc>', r.text)
        print(f"Found {len(urls)} product pages in sitemap:")
        for u in urls[:10]:
            print("  ", u)
except Exception as e:
    print("Color Andina err:", e)

# 3. Test Forever Living
print("\n=== TESTING FOREVER LIVING ===")
forever_tests = [
    "https://foreverliving.com.br/loja/715",
    "https://foreverliving.com/img/products/715.png",
    "https://cdn.foreverliving.com/content/products/images/715.png",
    "https://foreverliving.com/usa/en-us/shop/aloe-vera-gel-715"
]
for u in forever_tests:
    try:
        r = requests.head(u, headers=headers, timeout=5)
        print(f"{u}: status {r.status_code}")
    except Exception as e:
        print(f"{u} err: {e}")
