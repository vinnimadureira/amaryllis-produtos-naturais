import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

# 1. Phytoshop (Panizza official store)
try:
    r = requests.get('http://www.phytoshop.com.br/tinturas-vegetais-panizza', headers=headers, timeout=10)
    print("Phytoshop status:", r.status_code, "len:", len(r.text))
    # find images
    imgs = re.findall(r'(https?://[^\s"\'<>]+\.(?:jpg|png|webp))', r.text)
    print("Phytoshop images found:", len(imgs))
    for img in set(imgs[:15]):
        if 'tintura' in img.lower() or 'panizza' in img.lower() or 'produto' in img.lower() or 'upload' in img.lower():
            print("  Phytoshop img:", img)
except Exception as e:
    print("Phytoshop error:", e)

# 2. Souly product pages
souly_prods = [
    ('souly-canela-do-ceilao-120g', 'https://www.souly.com.br/produtos/canela-do-ceilao-em-po-souly/'),
    ('souly-feno-grego-po-60g', 'https://www.souly.com.br/produtos/feno-grego-em-po-souly/'),
    ('souly-laranja-moro-po-300g', 'https://www.souly.com.br/produtos/laranja-moro-em-po-souly/')
]
for pid, url in souly_prods:
    try:
        r = requests.get(url, headers=headers, timeout=10)
        imgs = re.findall(r'(https?://[^\s"\'<>]+\.(?:jpg|png|webp))', r.text)
        prod_imgs = [i for i in imgs if 'cdn.awsli.com.br' in i or 'cloudfront' in i or 'produtos' in i or 'nuvemshop' in i or 'tiendanube' in i]
        print(f"Souly {pid}: status {r.status_code}, found {len(prod_imgs)} images")
        for i in set(prod_imgs[:3]):
            print("   ", i)
    except Exception as e:
        print(f"Souly {pid} error: {e}")
