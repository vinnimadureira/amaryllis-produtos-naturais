import urllib.request
import re

url = "https://panizza.com.br/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        print(f"Panizza home length: {len(html)}")
        # Check platforms
        for kw in ['woocommerce', 'vtex', 'shopify', 'tray', 'nuvemshop', 'lojadainternet', 'wp-content']:
            if kw in html.lower():
                print("  Platform indicator:", kw)
        # Check image patterns
        imgs = re.findall(r'https://[^\s"\'<>]+\.(?:jpg|png|webp)', html)
        print("  Images found:", len(imgs))
        for img in set(imgs[:5]):
            print("   ", img)
except Exception as e:
    print("Error:", e)
