import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
url = 'https://www.phytocare.com.br/search/?q=tintura'
r = requests.get(url, headers=headers)

imgs = sorted(list(set(re.findall(r'https?://acdn-us\.mitiendanube\.com/stores/007/972/803/products/[^\s"\'<>]+\.(?:jpg|png|webp)', r.text))))
print(f"Total CDN images found: {len(imgs)}")
for img in imgs:
    hires = re.sub(r'-\d+-\d+\.webp', '-1024-1024.webp', img)
    name = img.split('/')[-1].split('-')[0]
    print(f"  {name}: {hires}")
