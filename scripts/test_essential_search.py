import urllib.request
import re

query = 'cacao whey'
url = f'https://www.essentialnutrition.com.br/catalogsearch/result/?q={query.replace(" ", "+")}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        print(f"Catalog search result length: {len(html)}")
        # Look for product image URLs
        imgs = re.findall(r'https://d3eomlzmsu8e9b\.cloudfront\.net/media/catalog/product/[^\s"\'<>]+\.(?:jpg|png|webp)', html)
        print("CloudFront product images found in search result:", len(imgs))
        for img in set(imgs[:5]):
            print(" ", img)
except Exception as e:
    print("Search error:", e)
