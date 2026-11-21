import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
r = requests.get('https://www.nazinha.com.br', headers=headers)
links = set(re.findall(r'href="([^"]+)"', r.text))
prod_links = [l for l in links if any(k in l.lower() for k in ['sequilho', 'produto', 'linha', 'catalogo'])]
for l in prod_links:
    print("Link:", l)
