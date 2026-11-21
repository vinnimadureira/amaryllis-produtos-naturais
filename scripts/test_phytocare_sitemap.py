import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

r = requests.get('https://www.phytocare.com.br/sitemap.xml', headers=headers)
print("Phytocare sitemap status:", r.status_code)
# find tintura urls
tinturas = re.findall(r'<loc>(https://www\.phytocare\.com\.br/produtos/[^<]*tintura[^<]*)</loc>', r.text)
print(f"Total tinturas in Phytocare sitemap: {len(tinturas)}")
for t in sorted(tinturas):
    print("  ", t)

# Also find all products
all_prods = re.findall(r'<loc>(https://www\.phytocare\.com\.br/produtos/[^<]+)</loc>', r.text)
print(f"Total products in Phytocare: {len(all_prods)}")
matching = [p for p in all_prods if any(k in p for k in ['artemisia', 'babosa', 'calendula', 'canela', 'cavalinha', 'confrei', 'ginkgo'])]
print(f"Matching products: {len(matching)}")
for m in matching:
    print("  *", m)
