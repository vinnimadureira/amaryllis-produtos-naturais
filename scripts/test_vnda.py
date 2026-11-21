import requests

headers = {'User-Agent': 'Mozilla/5.0'}

urls = [
    'https://www.colorandinafoods.com.br/api/v2/products',
    'https://www.colorandinafoods.com.br/produtos',
    'https://www.colorandinafoods.com.br/sitemap.xml',
    'https://images.vnda.com.br/'
]

for u in urls:
    try:
        r = requests.get(u, headers=headers, timeout=5)
        print(u, r.status_code, len(r.text))
    except Exception as e:
        print(u, e)
