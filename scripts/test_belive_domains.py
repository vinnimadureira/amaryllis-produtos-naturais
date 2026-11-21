import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

urls = [
    "https://belive.com.br",
    "https://www.belive.com.br",
    "https://loja.belive.com.br",
    "https://belivealimentos.com.br",
    "https://www.belivealimentos.com.br"
]

for u in urls:
    try:
        r = requests.get(u, headers=headers, timeout=6)
        print(u, r.status_code, len(r.text))
        if r.status_code == 200:
            for kw in ['vtex', 'shopify', 'tray', 'nuvemshop', 'tiendanube', 'awsli']:
                if kw in r.text.lower():
                    print("  platform:", kw)
    except Exception as e:
        print(u, e)
