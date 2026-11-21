import os
import io
import re
import urllib.request
import requests
from PIL import Image, ImageDraw, ImageFilter
from rembg import remove, new_session
import numpy as np

def standardize_packshot(img_pil, target_size=(1000, 1000), session=None):
    img_pil = img_pil.convert('RGBA')
    arr = np.array(img_pil)
    has_transparency = (arr[:, :, 3] < 250).sum() > 500
    
    if not has_transparency:
        if session:
            nobg = remove(img_pil, session=session)
        else:
            nobg = remove(img_pil)
    else:
        nobg = img_pil
        
    bbox = nobg.getbbox()
    if bbox:
        nobg = nobg.crop(bbox)
        
    max_w = int(target_size[0] * 0.82)
    max_h = int(target_size[1] * 0.82)
    nobg.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new('RGBA', target_size, (255, 255, 255, 255))
    pw, ph = nobg.size
    
    sw = int(pw * 0.76)
    sh = max(8, int(ph * 0.05))
    shadow = Image.new('RGBA', (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse([0, 0, sw, sh], fill=(30, 30, 30, 65))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=sh // 2))
    
    px = (target_size[0] - pw) // 2
    py = (target_size[1] - ph) // 2 - 12
    sx = (target_size[0] - sw) // 2
    sy = py + ph - (sh // 2)
    
    canvas.paste(shadow, (sx, sy), shadow)
    canvas.paste(nobg, (px, py), nobg)
    
    return canvas.convert('RGB')

catalog_wave2 = {
    # SOULY (1024x1024 master WebP from TiendaNube CDN)
    'souly-canela-do-ceilao-120g': 'https://acdn-us.mitiendanube.com/stores/003/284/631/products/413af1f8a1acea44eba6f933ecd705e8-3a310eb8cb7bfa266a17792008058243-1024-1024.webp',
    'souly-feno-grego-po-60g': 'https://acdn-us.mitiendanube.com/stores/003/284/631/products/4314eb9371609692364bc891923fe64f-a9d4cec7d3cda07a1117607020528356-1024-1024.webp',
    'souly-laranja-moro-po-300g': 'https://acdn-us.mitiendanube.com/stores/003/284/631/products/f4d9df0786e18fab5be827cc69a78b42-e8108789cbc760f3ce17727346961736-1024-1024.webp',

    # BELIVE (Master packshots from Belive Be Free WooCommerce)
    'belive-cookies-baunilha-chocolate-67g': 'https://belivebefree.com.br/wp-content/uploads/2021/05/cookie-de-baunilha-e-chocolate-sem-gluten-sem-acucar-sem-leite-belive-1.jpg',
    'belive-mandioca-chips-sal-rosa-50g': 'https://belivebefree.com.br/wp-content/uploads/2021/03/chips-de-mandioca-sem-gluten-belive-temperados-com-sal-rosa-do-himalaia1.webp',
    'belive-pao-de-mel-zero-45g': 'https://belivebefree.com.br/wp-content/uploads/2022/07/pao-de-mel-proteico-sem-gluten-sem-acucar-sem-leite-belive1.webp',
    'belive-paozinho-batata-198g': 'https://belivebefree.com.br/wp-content/uploads/2024/06/pao-de-batata-sem-gluten-sem-lactose-sem-leite-belive.webp',
    'belive-protein-brownie-double-chocolate': 'https://belivebefree.com.br/wp-content/uploads/2020/04/brownie-proteico-chocolate-sem-acucar-sem-gluten-sem-leite-belive-1.webp',

    # KONJAC MASSA MF (Master PNG from Shopify CDN)
    'konjac-massa-mf-bucatini-270g': 'https://cdn.shopify.com/s/files/1/0601/7404/1275/files/Bucatini1.png',
    'konjac-massa-mf-lasanha-270g': 'https://cdn.shopify.com/s/files/1/0601/7404/1275/files/Lasanha_1.png',

    # NOTCO NOTMILK
    'notco-notmilk-original-1l': 'https://cdn2.notco.com/uploads/products/402416/NotMilk-Original-Diagonal-2.webp',

    # URBANO
    'urbano-massa-arroz-penne-500g': 'https://api-urbano-site.azurewebsites.net/imagens/3f51dafc-a05f-49a3-a8a8-0562f5b2ed39.png',

    # PANIZZA TINTURAS (Phytocare official packshots)
    'panizza-tintura-acafrao-100ml': 'https://acdn-us.mitiendanube.com/stores/007/972/803/products/acafrao-c588812cba92c6948d17892370413485-1024-1024.webp',
    'panizza-tintura-arnica-100ml': 'https://acdn-us.mitiendanube.com/stores/007/972/803/products/arnica-b5e3e44f51cfc33ce917892403759111-1024-1024.webp',
    'panizza-tintura-espinheira-santa-100ml': 'https://acdn-us.mitiendanube.com/stores/007/972/803/products/espinheira-santa-60ml-fc1ec43f542cb74bd117892414750873-1024-1024.webp',
    'panizza-tintura-mulungu-100ml': 'https://acdn-us.mitiendanube.com/stores/007/972/803/products/mulungu-f691ba214bc75f812b17892309316129-1024-1024.webp',
    'panizza-tintura-sucupira-100ml': 'https://acdn-us.mitiendanube.com/stores/007/972/803/products/sucupira-e7d559ad98b2b4825017892326251824-1024-1024.webp'
}

sess = new_session('u2net')
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

print(f"Starting wave 2 batch processing for {len(catalog_wave2)} items...")
success_count = 0

for pid, url in catalog_wave2.items():
    try:
        r = requests.get(url, headers=headers, timeout=12)
        if r.status_code == 200 and len(r.content) > 1000:
            raw_img = Image.open(io.BytesIO(r.content))
            out_img = standardize_packshot(raw_img, session=sess)
            out_path = os.path.join('public', 'products', f"{pid}.webp")
            out_img.save(out_path, 'WEBP', quality=95)
            fsize = os.path.getsize(out_path)
            print(f"[OK] {pid} -> {out_path} ({fsize} bytes)")
            success_count += 1
        else:
            print(f"[FAIL] {pid}: status {r.status_code}, len {len(r.content)}")
    except Exception as e:
        print(f"[ERROR] {pid}: {e}")

print(f"\nWave 2 completed: {success_count}/{len(catalog_wave2)} successful.")
