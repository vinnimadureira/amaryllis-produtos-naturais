import requests
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
}

url = 'https://www.iherb.com/pr/now-foods-vitamin-d3-k2-120-capsules/10056'
r = requests.get(url, headers=headers)
print("Status:", r.status_code, "Len:", len(r.text))
imgs = re.findall(r'https://[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
now_imgs = [i for i in imgs if 'images.iherb.com' in i or 'cloudinary' in i or 'u-mercado' in i]
print("Found candidate images:", len(now_imgs))
for i in set(now_imgs[:8]):
    print("  ", i)
