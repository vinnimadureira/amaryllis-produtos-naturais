import urllib.request
import re

url = 'https://www.essentialnutrition.com.br/media/sitemap.xml'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    txt = r.read().decode('utf-8', errors='ignore')

urls = re.findall(r'<loc>(https://[^<]+)</loc>', txt)

# In Magento, product URLs don't have '/produtos/' or '/category/'
prods = []
for u in urls:
    # ignore categories and static pages
    if any(x in u for x in ['/produtos', '/catalog/', '/ebook', '/blog', '/faq', '/prescritor', '/nossa-marca', '/regras', '/qualidade', '/compare', '/pro-member', '/protejasuasaude', '/essential-week', '/semana-', '/black-friday', '/eusou', '/privacy', '/assine']):
        continue
    if u == 'https://www.essentialnutrition.com.br/':
        continue
    prods.append(u)

print(f"Total product URLs identified: {len(prods)}")
with open('scripts/essential_product_urls.txt', 'w', encoding='utf-8') as f:
    for p in sorted(prods):
        f.write(p + '\n')
