import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
r = requests.get('https://konjacmassamf.com.br/produtos', headers=headers)

for term in ['bucatini', 'lasanha', 'lasagna']:
    matches = [m for m in re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', r.text) if term in m.lower()]
    print(f"Term '{term}': {len(matches)}")
    for m in set(matches):
        print(" ", m)
