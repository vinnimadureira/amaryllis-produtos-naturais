import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}

url = 'https://www.belivebegood.com.br'
try:
    r = requests.get(url, headers=headers, timeout=8)
    print("Belive Be Good status:", r.status_code, "len:", len(r.text))
    # look for platform
    for kw in ['vtex', 'shopify', 'tray', 'nuvemshop', 'tiendanube', 'lojadaintegrada']:
        if kw in r.text.lower():
            print("  Platform:", kw)
    
    # Check sitemap
    sr = requests.get('https://www.belivebegood.com.br/sitemap.xml', headers=headers, timeout=8)
    print("Sitemap status:", sr.status_code, "len:", len(sr.text))
    urls = re.findall(r'<loc>(https?://[^<]+)</loc>', sr.text)
    print("Sitemap URLs:", len(urls))
    for u in urls[:10]:
        print(" ", u)
except Exception as e:
    print("Error:", e)
