import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
r = requests.get('https://www.colorandinafoods.com.br/', headers=headers)
print("Color Andina Home status:", r.status_code)
# find all links to products
prod_links = set(re.findall(r'href=["\'](/[^"\']+)["\']', r.text))
color_prods = [l for l in prod_links if any(k in l for k in ['cacau', 'curcuma', 'maca', 'stevia', 'urucum'])]
print("Color Andina matched product links:", len(color_prods))
for p in color_prods:
    print("  ", p)

# Find all images
imgs = re.findall(r'(https?://[^\s"\'<>]+\.(?:jpg|png|webp))', r.text)
print("Images count:", len(imgs))
for img in set(imgs[:10]):
    print("   Img:", img)
