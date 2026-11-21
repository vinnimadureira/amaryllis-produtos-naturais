import requests
import re
import urllib.parse

headers = {'User-Agent': 'Mozilla/5.0'}

targets = [
    ('panizza-tintura-acafrao-100ml', 'acafrao'),
    ('panizza-tintura-arnica-100ml', 'arnica'),
    ('panizza-tintura-artemisia-100ml', 'artemisia'),
    ('panizza-tintura-babosa-100ml', 'babosa'),
    ('panizza-tintura-calendula-100ml', 'calendula'),
    ('panizza-tintura-canela-de-velho-100ml', 'canela de velho'),
    ('panizza-tintura-cavalinha-100ml', 'cavalinha'),
    ('panizza-tintura-confrei-100ml', 'confrei'),
    ('panizza-tintura-espinheira-santa-100ml', 'espinheira santa'),
    ('panizza-tintura-ginkgo-biloba-100ml', 'ginkgo'),
    ('panizza-tintura-mulungu-100ml', 'mulungu'),
    ('panizza-tintura-sucupira-100ml', 'sucupira')
]

found = {}
for pid, query in targets:
    url = f"https://www.phytocare.com.br/search/?q={urllib.parse.quote(query)}"
    try:
        r = requests.get(url, headers=headers, timeout=6)
        imgs = re.findall(r'https?://acdn-us\.mitiendanube\.com/stores/007/972/803/products/[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
        if imgs:
            # pick image that has query in name or first
            match = None
            q_clean = query.replace(' ', '-')
            for img in imgs:
                if q_clean in img.lower():
                    match = img
                    break
            if not match:
                match = imgs[0]
            hires = re.sub(r'-\d+-\d+\.webp', '-1024-1024.webp', match)
            found[pid] = hires
            print(f"[FOUND] {pid} ({query}) -> {hires}")
        else:
            print(f"[NOT FOUND] {pid} ({query})")
    except Exception as e:
        print(f"[ERROR] {pid}: {e}")

print(f"\nTotal Panizza found on Phytocare: {len(found)} / {len(targets)}")
