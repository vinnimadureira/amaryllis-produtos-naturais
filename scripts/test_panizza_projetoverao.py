import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
r = requests.get('https://www.lojaprojetoverao.com.br/busca?busca=tintura+panizza', headers=headers)
print('Projeto verao status:', r.status_code)
imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
panizza_imgs = [img for img in imgs if 'panizza' in img.lower() or 'tintura' in img.lower()]
print('Panizza imgs found:', len(panizza_imgs))
for img in set(panizza_imgs[:10]):
    print('  ', img)
