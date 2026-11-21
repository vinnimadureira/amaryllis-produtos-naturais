import requests
import re
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

# 1. Check Panizza on Phytocare (we already have a search script!)
targets_panizza = [
    ('panizza-tintura-artemisia-100ml', 'artemisia'),
    ('panizza-tintura-babosa-100ml', 'babosa'),
    ('panizza-tintura-calendula-100ml', 'calendula'),
    ('panizza-tintura-canela-de-velho-100ml', 'canela de velho'),
    ('panizza-tintura-cavalinha-100ml', 'cavalinha'),
    ('panizza-tintura-confrei-100ml', 'confrei'),
    ('panizza-tintura-ginkgo-biloba-100ml', 'ginkgo biloba')
]

for pid, q in targets_panizza:
    u = f"https://www.phytocare.com.br/search/?q={q}"
    r = requests.get(u, headers=headers, timeout=8)
    imgs = re.findall(r'https?://acdn-us\.mitiendanube\.com/stores/007/972/803/products/[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
    if imgs:
        # replace size with 1024-1024
        hires = re.sub(r'-\d+-\d+\.webp', '-1024-1024.webp', imgs[0])
        print(f"PANIZZA {pid} -> {hires}")
    else:
        print(f"PANIZZA NOT FOUND {pid}")
