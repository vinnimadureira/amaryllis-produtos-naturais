import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

url = 'https://www.phytocare.com.br'
try:
    r = requests.get(url, headers=headers, timeout=10)
    print("Phytocare status:", r.status_code, "Length:", len(r.text))
    # Look for sitemaps or search or platform
    for kw in ['vtex', 'shopify', 'tray', 'nuvemshop', 'tiendanube', 'lojadaintegrada', 'cartx', 'woocommerce']:
        if kw in r.text.lower():
            print("  Platform match:", kw)
    
    # Try searching for tintura
    search_url = 'https://www.phytocare.com.br/buscar?q=tintura+panizza'
    sr = requests.get(search_url, headers=headers, timeout=10)
    print("Search status:", sr.status_code, "Length:", len(sr.text))
    imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', sr.text)
    print("Images in search:", len(imgs))
    for i in set(imgs[:8]):
        print("  Img:", i)
except Exception as e:
    print("Error:", e)
