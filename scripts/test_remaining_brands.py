import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

sites = [
    ("Copra", "https://copra.com.br/produto/leite-de-coco-para-beber-original-900ml/"),
    ("NotCo", "https://notco.com/br/produtos/notmilk"),
    ("Nazinha", "https://nazinha.com.br/produtos/"),
    ("Urbano", "https://urbano.com.br/produtos/macarrao-de-arroz-penne-500g/"),
    ("Casarao", "https://casaraoalimentos.com.br/produtos/"),
    ("Crock", "https://crockcereal.com.br/"),
    ("Alere", "https://aleregourmet.com.br/"),
    ("GreenBios", "https://www.greenbios.com.br/")
]

for name, u in sites:
    try:
        r = requests.get(u, headers=headers, timeout=6)
        print(f"{name} ({u[:35]}...): status {r.status_code}, len {len(r.text)}")
        # find images
        imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
        cand = [i for i in imgs if any(k in i.lower() for k in ['upload', 'produto', 'media', 'cdn', 'image', 'pack'])]
        print(f"  Images found: {len(cand)}")
        for i in set(cand[:3]):
            print("   ", i)
    except Exception as e:
        print(f"{name} error: {e}")
