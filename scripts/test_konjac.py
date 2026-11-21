import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
url = 'https://konjacmassamf.com.br'
try:
    r = requests.get(url, headers=headers, timeout=8)
    print("Konjac status:", r.status_code, "len:", len(r.text))
    for kw in ['vtex', 'shopify', 'tray', 'nuvemshop', 'tiendanube', 'awsli', 'woocommerce']:
        if kw in r.text.lower():
            print("  Platform:", kw)
    
    # check sitemap
    sr = requests.get('https://konjacmassamf.com.br/sitemap.xml', headers=headers, timeout=8)
    print("Sitemap status:", sr.status_code, "len:", len(sr.text))
    locs = re.findall(r'<loc>(https?://[^<]+)</loc>', sr.text)
    print("Sitemap URLs:", len(locs))
    for l in locs[:10]:
        print(" ", l)
except Exception as e:
    print("Error:", e)
