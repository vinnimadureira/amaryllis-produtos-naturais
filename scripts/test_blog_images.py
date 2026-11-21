import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
for u in ['https://www.colorandinafoods.com.br/blog/maca-andina-para-que-serve/', 'https://www.colorandinafoods.com.br/blog/descubra-os-beneficios-do-urucum/']:
    r = requests.get(u, headers=headers)
    print("URL:", u, "Status:", r.status_code)
    imgs = re.findall(r'(https?://[^\s"\'<>]+\.(?:jpg|png|webp))', r.text)
    for img in set(imgs):
        if any(k in img.lower() for k in ['maca', 'urucum', 'red', 'colorau', 'produto', 'upload']):
            print('  ->', img)
