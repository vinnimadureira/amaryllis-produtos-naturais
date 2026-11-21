import requests
import re
import json

# NOW Foods US site search API or product page
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
r = requests.get('https://www.nowfoods.com/search?search_api_fulltext=vitamin+d3+k2', headers=headers, timeout=10)
print("NOW Foods US search status:", r.status_code, "Length:", len(r.text))
imgs = re.findall(r'https://[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
now_imgs = [i for i in imgs if 'files' in i or 'product' in i]
print("Found NOW images:", len(now_imgs))
for i in set(now_imgs[:5]):
    print(" ", i)
