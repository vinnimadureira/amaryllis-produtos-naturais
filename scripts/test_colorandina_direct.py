import requests
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

urls = [
    ("color-andina-cacau-selvagem-200g", "https://colorandinafoods.com.br/produto/cacau-selvagem-200g/"),
    ("color-andina-curcuma-longa-100g", "https://colorandinafoods.com.br/produto/curcuma-pura-100g/"),
    ("color-andina-red-maca-100g", "https://colorandinafoods.com.br/produto/maca-peruana-vermelha-100g/"),
    ("color-andina-stevia-liquida-30ml", "https://colorandinafoods.com.br/produto/adocante-stevia-gotas-30ml/"),
    ("color-andina-stevia-saches-50un", "https://colorandinafoods.com.br/produto/adocante-stevia-saches/"),
    ("color-andina-urucum-do-pilao-50g", "https://colorandinafoods.com.br/produto/colorau-urucum-100g/")
]

for pid, u in urls:
    try:
        r = requests.get(u, headers=headers, timeout=8)
        print(f"[{pid}] {u} -> status {r.status_code}")
        if r.status_code == 200:
            # find og:image or wp-content/uploads image
            og = re.search(r'property="og:image"\s+content="([^"]+)"', r.text)
            if not og:
                og = re.search(r'content="([^"]+)"\s+property="og:image"', r.text)
            if og:
                print(f"   OG IMAGE: {og.group(1)}")
            else:
                imgs = re.findall(r'https://colorandinafoods\.com\.br/wp-content/uploads/[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
                if imgs:
                    print(f"   WP IMAGE: {imgs[0]}")
    except Exception as e:
        print(f"[{pid}] err: {e}")
