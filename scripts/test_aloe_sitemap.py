import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
r = requests.get('https://aloeveraoriginal.com.br/sitemap.xml', headers=headers)
print('Sitemap status:', r.status_code)
prods = re.findall(r'<loc>(https://aloeveraoriginal\.com\.br/produtos/[^<]+)</loc>', r.text)
print(f'Total products: {len(prods)}')
for p in prods:
    print(' ', p)
