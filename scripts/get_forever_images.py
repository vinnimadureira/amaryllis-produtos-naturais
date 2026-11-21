import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

aloe_pages = [
    ('forever-aloe-vera-gel-1l', 'https://www.aloeveraoriginal.com.br/produtos/forever-aloe-vera-gel/'),
    ('forever-aloe-berry-nectar-1l', 'https://www.aloeveraoriginal.com.br/produtos/forever-aloe-berry-nectar/'),
    ('forever-aloe-peaches-1l', 'https://www.aloeveraoriginal.com.br/produtos/forever-aloe-bits-n-peaches/')
]

for pid, url in aloe_pages:
    r = requests.get(url, headers=headers)
    print(f"[{pid}] status: {r.status_code}")
    imgs = re.findall(r'https://acdn-us\.mitiendanube\.com/stores/006/882/708/products/[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
    if imgs:
        hires = re.sub(r'-\d+-\d+\.webp', '-1024-1024.webp', imgs[0])
        print(f"   FOREVER HIRES: {hires}")
