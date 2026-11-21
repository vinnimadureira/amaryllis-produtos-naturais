import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
r = requests.get('https://www.pontodoatleta.com.br/busca?busca=urucum', headers=headers)
print('PontoAtleta urucum:', r.status_code)
imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
for img in set(imgs):
    if 'urucum' in img.lower() or 'colorau' in img.lower():
        print(' ', img)
