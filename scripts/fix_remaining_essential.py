import requests
import re
import os
import io
from PIL import Image
from test_official_standardization import standardize_packshot
from rembg import new_session

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

prods = {
    'essential-glutamina-300g': 'https://www.essentialnutrition.com.br/glutamina-60-doses',
    'essential-mct-lift-250ml': 'https://www.essentialnutrition.com.br/mctlift-oleo-de-coco',
    'essential-xylitol-300g': 'https://www.essentialnutrition.com.br/xylitol-adocante-natural',
    'essential-super-omega-3-tg-60caps': 'https://www.essentialnutrition.com.br/super-omega-3-tg-60-caps',
    'essential-super-omega-3-tg-120caps': 'https://www.essentialnutrition.com.br/super-omega-3-tg-120-caps',
    'essential-super-omega-3-tg-comfort': 'https://www.essentialnutrition.com.br/super-omega-3-tg-comfort',
    'essential-dha-tg-90caps': 'https://www.essentialnutrition.com.br/dha-tg-omega-3-ultraconcentrado',
    'essential-hydrolift-limao-30doses': 'https://www.essentialnutrition.com.br/hydrolift-limao',
    'essential-aminolift-tangerina-30doses': 'https://www.essentialnutrition.com.br/aminolift-tangerina',
    'essential-collagen-bodybalance-neutro-30doses': 'https://www.essentialnutrition.com.br/collagen-bodybalance-neutro',
    'essential-collagen-bodybalance-chocolate-25doses': 'https://www.essentialnutrition.com.br/collagen-bodybalance-chocolate',
    'essential-brainstorm-coffee-caramelo-220g': 'https://www.essentialnutrition.com.br/brainstorm-coffee-caramelo-salgado'
}

sess = new_session('u2net')

for pid, url in prods.items():
    try:
        r = requests.get(url, headers=headers, timeout=10)
        # Search for full 1308x1636 or master images
        imgs = re.findall(r'https://d3eomlzmsu8e9b\.cloudfront\.net/media/catalog/product/[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
        master_img = None
        for img in imgs:
            if '1308x1636' in img:
                # remove /cache/.../
                clean = re.sub(r'cache/[a-f0-9]+/', '', img)
                master_img = clean
                break
        if not master_img and imgs:
            for img in imgs:
                clean = re.sub(r'cache/[a-f0-9]+/', '', img)
                master_img = clean
                break
                
        if master_img:
            ir = requests.get(master_img, headers=headers, timeout=10)
            if ir.status_code == 200 and len(ir.content) > 10000:
                raw = Image.open(io.BytesIO(ir.content))
                out = standardize_packshot(raw, session=sess)
                out_path = os.path.join('public', 'products', f"{pid}.webp")
                out.save(out_path, 'WEBP', quality=95)
                print(f"[OK] {pid} -> {out_path} ({os.path.getsize(out_path)} bytes) from {master_img.split('/')[-1]}")
            else:
                print(f"[FAIL DL] {pid}: status {ir.status_code}, len {len(ir.content)}")
        else:
            print(f"[NO MASTER] {pid}")
    except Exception as e:
        print(f"[ERROR] {pid}: {e}")
