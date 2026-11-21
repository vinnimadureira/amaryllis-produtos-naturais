import requests, re, os, io
from PIL import Image
from test_official_standardization import standardize_packshot
from rembg import new_session

headers = {'User-Agent': 'Mozilla/5.0'}
prods = {
    'essential-creatine-action-gummy-30doses': 'https://www.essentialnutrition.com.br/creatina-em-goma-sabor-laranja',
    'essential-melatonin-duo-gotas-menta': 'https://www.essentialnutrition.com.br/melatonin-duo-melatonina'
}

sess = new_session('u2net')
for pid, url in prods.items():
    r = requests.get(url, headers=headers, timeout=10)
    imgs = re.findall(r'https://d3eomlzmsu8e9b\.cloudfront\.net/media/catalog/product/[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
    master = None
    for img in imgs:
        if '1308x1636' in img:
            master = re.sub(r'cache/[a-f0-9]+/', '', img)
            break
    if not master and imgs:
        master = re.sub(r'cache/[a-f0-9]+/', '', imgs[0])
    if master:
        ir = requests.get(master, headers=headers, timeout=10)
        if ir.status_code == 200:
            raw = Image.open(io.BytesIO(ir.content))
            out = standardize_packshot(raw, session=sess)
            out_path = os.path.join('public', 'products', f"{pid}.webp")
            out.save(out_path, 'WEBP', quality=95)
            print(f"[OK] {pid} -> {out_path} ({os.path.getsize(out_path)} bytes)")
