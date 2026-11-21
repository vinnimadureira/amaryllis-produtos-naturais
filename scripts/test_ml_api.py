import requests
import json

queries = [
    ('panizza-tintura-acafrao-100ml', 'Tintura Acafrao Panizza 100ml'),
    ('now-chlorella-500mg-200tabs', 'NOW Foods Chlorella 500mg 200 tabs'),
    ('a-tal-da-castanha-amendoa-1l', 'A Tal da Castanha Bebida Amendoa 1L'),
    ('belive-mandioca-chips-sal-rosa-50g', 'Belive mandioca chips sal rosa 50g'),
    ('souly-canela-do-ceilao-120g', 'Souly Canela do Ceilao 120g'),
    ('color-andina-cacau-selvagem-200g', 'Color Andina Cacau Selvagem 200g'),
    ('forever-aloe-vera-gel-1l', 'Forever Living Aloe Vera Gel 1L'),
    ('konjac-massa-mf-bucatini-270g', 'Konjac Massa MF Bucatini 270g')
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for prod_id, q in queries:
    url = f'https://api.mercadolibre.com/sites/MLB/search?q={requests.utils.quote(q)}'
    try:
        r = requests.get(url, headers=headers, timeout=6)
        if r.status_code == 200:
            data = r.json()
            results = data.get('results', [])
            if results:
                first = results[0]
                title = first.get('title')
                thumb = first.get('thumbnail', '')
                hires = thumb.replace('-I.jpg', '-O.jpg').replace('http://', 'https://')
                print(f"[{prod_id}] -> {title}")
                print(f"   Hi-res: {hires}")
            else:
                print(f"[{prod_id}] No results")
        else:
            print(f"[{prod_id}] Status {r.status_code}")
    except Exception as e:
        print(f"[{prod_id}] Error: {e}")
