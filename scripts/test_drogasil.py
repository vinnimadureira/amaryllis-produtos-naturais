import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

urls = [
    ("Drogasil Panizza", "https://www.drogasil.com.br/search?w=tintura+panizza"),
    ("Drogasil NOW", "https://www.drogasil.com.br/search?w=now+foods+chlorella"),
    ("Drogasil Belive", "https://www.drogasil.com.br/search?w=belive+chips"),
]

for name, u in urls:
    try:
        r = requests.get(u, headers=headers, timeout=8)
        print(f"{name}: status {r.status_code}, len {len(r.text)}")
        # Look for product images
        imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
        prod_imgs = [i for i in imgs if any(k in i for k in ['drogasil', 'raia', 'product', 'media', 'catalog'])]
        print(f"  Found {len(prod_imgs)} candidate images")
        for i in set(prod_imgs[:5]):
            print("   ", i)
    except Exception as e:
        print(f"{name} error: {e}")
