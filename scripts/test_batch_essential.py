import urllib.request
import re

samples = [
    'https://www.essentialnutrition.com.br/beef-protein-cacao-proteina-hidrolisada',
    'https://www.essentialnutrition.com.br/crealift-creatina-mono-hidratada-creapure',
    'https://www.essentialnutrition.com.br/collagen-skin-neutro',
    'https://www.essentialnutrition.com.br/brainstorm-coffee-cafe',
    'https://www.essentialnutrition.com.br/super-omega-3-tg-capsulas'
]

for s in samples:
    try:
        req = urllib.request.Request(s, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode('utf-8', errors='ignore')
            # Extract main product image
            imgs = re.findall(r'https://d3eomlzmsu8e9b\.cloudfront\.net/media/catalog/product/[^\s"\'<>]+\.(?:jpg|png|webp)', html)
            # Find the best one (usually the largest or not small/thumbnail)
            valid = [i for i in imgs if 'tabela' not in i and 'small_image' not in i and 'thumbnail' not in i]
            print(f"Product: {s.split('/')[-1]}")
            if valid:
                print(f"  Main image: {valid[0]}")
            else:
                print("  No image found!")
    except Exception as e:
        print(f"Error on {s}: {e}")
