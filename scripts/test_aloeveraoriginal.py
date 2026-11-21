import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
r = requests.get('https://aloeveraoriginal.com.br/', headers=headers)
print('Aloe status:', r.status_code)
imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
for img in set(imgs):
    if any(k in img.lower() for k in ['aloe', 'gel', 'berry', 'peaches', '715', '734', '777']):
        print('  ', img)
