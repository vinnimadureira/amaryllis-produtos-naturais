import requests
import re

url = 'https://www.ataldacastanha.com.br/products/bebida-original-1l'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
matches = re.findall(r'cdn\.shopify\.com/s/files/1/0722/4410/1167/[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
print('Total shopify files:', len(matches))
for m in set(matches):
    print('  https://' + m)
