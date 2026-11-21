import requests
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

urls = [
    ('amendoa', 'https://www.ataldacastanha.com.br/products/bebida-de-amendoa-1l'),
    ('original', 'https://www.ataldacastanha.com.br/products/bebida-original-1l'),
    ('mixed', 'https://www.ataldacastanha.com.br/products/bebida-mixed-nuts-1l')
]

for name, u in urls:
    try:
        r = requests.get(u, headers=headers, timeout=8)
        print(f"ATDC {name}: status {r.status_code}, len {len(r.text)}")
        cdn_imgs = re.findall(r'//www\.ataldacastanha\.com\.br/cdn/shop/files/[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
        if not cdn_imgs:
            cdn_imgs = re.findall(r'//cdn\.shopify\.com/s/files/[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
        print(f"  Found images: {len(cdn_imgs)}")
        for img in list(set(cdn_imgs))[:3]:
            print("   https:" + img)
    except Exception as e:
        print(f"ATDC {name} error: {e}")
