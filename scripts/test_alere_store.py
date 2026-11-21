import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
r = requests.get('https://www.emporioquatroestrelas.com.br/buscar?q=alere', headers=headers)
print('Quatro estrelas Alere:', r.status_code)
imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
for img in set(imgs):
    if 'alere' in img.lower() or 'biscoito' in img.lower():
        print(' ', img)
