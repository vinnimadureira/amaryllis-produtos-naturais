import urllib.request
import re

url = "https://www.essentialnutrition.com.br/cacao-whey-protein-chocolate"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')

imgs = re.findall(r'https://d3eomlzmsu8e9b\.cloudfront\.net/media/catalog/product/[^\s"\'<>]+\.(?:jpg|png|webp)', html)
print(f"Total CloudFront images on Cacao Whey page: {len(imgs)}")
for i, img in enumerate(set(imgs)):
    print(f"[{i}] {img}")
