import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

r = requests.get('https://foreverliving.com/usa/en-us/shop/aloe-vera-gel-715', headers=headers)
print("Forever shop status:", r.status_code)
# find all cdn/image urls
imgs = re.findall(r'(https?://[^\s"\'<>]+\.(?:png|jpg|webp))', r.text)
print("Images found in page:", len(imgs))
for img in set(imgs):
    if 'product' in img.lower() or '715' in img.lower() or 'aloe' in img.lower():
        print("  ->", img)
