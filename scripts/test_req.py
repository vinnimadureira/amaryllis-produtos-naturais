import requests

s = requests.Session()
s.headers.update({'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
r = s.get('https://www.essentialnutrition.com.br/catalogsearch/result/?q=cacao+whey', timeout=10)
print('Status:', r.status_code, 'Final URL:', r.url, 'Length:', len(r.text))
