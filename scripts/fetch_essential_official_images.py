import urllib.request
import re
import json
import os
import time
from test_official_standardization import standardize_packshot
from rembg import new_session
from PIL import Image

# Load all Essential Nutrition products from catalog
from build_amaryllis_master_catalog import PRODUCTS

essential_prods = [p for p in PRODUCTS if p['category'] == 'Essential Nutrition']
print(f"Total Essential products to fetch: {len(essential_prods)}")

# Load sitemap URLs
with open('scripts/essential_product_urls.txt', 'r', encoding='utf-8') as f:
    all_urls = [line.strip() for line in f if line.strip()]

# Mapping from catalog ID to URL keywords or exact slug
# Let's inspect each product ID and match with the sitemap URL
def find_url_for_id(pid):
    # normalize keywords
    parts = pid.replace('essential-', '').split('-')
    # Filter out dose or size descriptors like 900g, 960g, 30doses, 120caps
    core_parts = [p for p in parts if not re.match(r'^\d+(g|doses|caps|ml)$', p)]
    
    # Try exact or partial matches
    matches = []
    for u in all_urls:
        slug = u.split('/')[-1]
        score = sum(1 for cp in core_parts if cp in slug)
        if score > 0:
            matches.append((score, u))
    
    matches.sort(key=lambda x: x[0], reverse=True)
    if matches:
        return matches[0][1]
    return None

sess = new_session('u2net')
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for idx, p in enumerate(essential_prods):
    pid = p['id']
    u = find_url_for_id(pid)
    print(f"[{idx+1}/{len(essential_prods)}] {pid} -> {u}")
    if not u:
        continue
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode('utf-8', errors='ignore')
            imgs = re.findall(r'https://d3eomlzmsu8e9b\.cloudfront\.net/media/catalog/product/[^\s"\'<>]+\.(?:jpg|png|webp)', html)
            valid = [i for i in imgs if 'tabela' not in i and 'small_image' not in i and 'thumbnail' not in i]
            if not valid:
                print(f"  No valid image on page: {u}")
                continue
            best_img_url = valid[0]
            print(f"  Downloading: {best_img_url}")
            img_req = urllib.request.Request(best_img_url, headers=headers)
            with urllib.request.urlopen(img_req, timeout=10) as ir:
                import io
                orig_img = Image.open(io.BytesIO(ir.read()))
                std_img = standardize_packshot(orig_img, session=sess)
                out_path = f"public/products/{pid}.webp"
                std_img.save(out_path, 'WEBP', quality=95)
                print(f"  Saved standardized packshot: {out_path}")
    except Exception as e:
        print(f"  Error on {pid}: {e}")
