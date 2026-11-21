import urllib.request
import re
import json

url = 'https://www.essentialnutrition.com.br/media/sitemap.xml'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    txt = r.read().decode('utf-8', errors='ignore')

urls = re.findall(r'<loc>(https://[^<]+)</loc>', txt)

# Filter out category / landing pages
prod_pages = [u for u in urls if not any(x in u for x in ['/produtos', '/blog', '/receitas', '/institucional', '/termos', '/politica']) and u != 'https://www.essentialnutrition.com.br/']

print(f"Total candidate product URLs in Essential sitemap: {len(prod_pages)}")
for p in prod_pages[:20]:
    print(" ", p)
