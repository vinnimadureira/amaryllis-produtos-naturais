import os
import io
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
    
    # Soft drop shadow
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

catalog_new_20 = {
    # NOW Foods (5 itens)
    'now-chlorella-500mg-200tabs': 'https://drogariasp.vteximg.com.br/arquivos/ids/2249335/Chlorella-500mg-com-200-tabletes-Veganos-Now-Food.jpg',
    'now-l-tryptophan-500mg-60caps': 'https://s3.images-iherb.com/now/now00166/v/14.jpg',
    'now-liquid-melatonin-59ml': 'https://s3.images-iherb.com/now/now03261/v/18.jpg',
    'now-nac-600mg-100caps': 'https://s3.images-iherb.com/now/now00694/l/1.jpg',
    'now-vitamin-d3-k2-120caps': 'https://s3.images-iherb.com/now/now00373/l/5.jpg',

    # Forever Living (3 itens)
    'forever-aloe-vera-gel-1l': 'https://acdn-us.mitiendanube.com/stores/006/882/708/products/texto-do-seu-paragrafo-3-d9e0360989d435522317711126515292-1024-1024.webp',
    'forever-aloe-berry-nectar-1l': 'https://acdn-us.mitiendanube.com/stores/006/882/708/products/berry-2-0ad4064b1d699edf2717697195033695-1024-1024.webp',
    'forever-aloe-peaches-1l': 'https://acdn-us.mitiendanube.com/stores/006/882/708/products/pessego-e2b11c8c55fb9b642517675386806590-1024-1024.webp',

    # Alere Gourmet (3 itens)
    'alere-biscoito-banana-canela-30g': 'https://acdn-us.mitiendanube.com/stores/007/255/837/products/3e1dedc68e3f7888028161c9bbbfe678-688b437706338b86b017891698793913-1024-1024.webp',
    'alere-biscoito-castanha-quinoa-70g': 'https://mambodelivery.vteximg.com.br/arquivos/ids/220840/244748Biscoito-de-Castanha-e-Quinoa-Defumado-Alere-Gourmet-70g.jpg',
    'alere-biscoito-tomate-ora-pro-nobis-70g': 'https://mambodelivery.vteximg.com.br/arquivos/ids/216964/270698-Biscoito-de-Tomate-e-Ora-Pro-Nobis-Alere-Gourmet-70g.jpg',

    # Casarão Massas (1 item)
    'casarao-penne-espinafre-berinjela-300g': 'https://dcdn-us.mitiendanube.com/stores/006/901/025/products/penne-espinafre-casarao-0f743ab86cd034f97617938157763775-1024-1024.webp',

    # Crock Cereal (1 item)
    'crock-cereal-aveia-sem-gluten-flocos-finos-200g': 'https://images.tcdn.com.br/img/img_prod/1520166/aveia_flocos_finos_sem_gluten_200g_leve_crock_235_1_3037210ae3534af73ad267cde23b2ca8.jpg',

    # Feita Croc (1 item)
    'feita-croc-apple-40g': 'https://santaluzia.vteximg.com.br/arquivos/ids/989157/667986.jpg?v=638243729750070000',

    # Color Andina Foods (6 itens)
    'color-andina-cacau-selvagem-200g': 'https://santaluzia.vteximg.com.br/arquivos/ids/1001369/3226298.png',
    'color-andina-curcuma-longa-100g': 'https://santaluzia.vteximg.com.br/arquivos/ids/1001311/586579 -16-.png',
    'color-andina-red-maca-100g': 'https://images.tcdn.com.br/img/img_prod/1280804/maca_peruana_red_color_andina_food_100g_1_20261007103507_a2e3d4c9b5be.jpg',
    'color-andina-stevia-liquida-30ml': 'https://santaluzia.vteximg.com.br/arquivos/ids/998803/3226417.jpg',
    'color-andina-stevia-saches-50un': 'https://santaluzia.vteximg.com.br/arquivos/ids/998791/3226310.jpg',
    'color-andina-urucum-do-pilao-50g': 'https://atacadosuplemento.com.br/wp-content/uploads/urucum-do-pilao-50g-color-andina.webp'
}

sess = new_session('u2net')
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'}

success = 0
for pid, url in catalog_new_20.items():
    try:
        r = requests.get(url, headers=headers, timeout=12)
        if r.status_code == 200 and len(r.content) > 1000:
            raw_img = Image.open(io.BytesIO(r.content))
            out_img = standardize_packshot(raw_img, session=sess)
            out_path = os.path.join('public', 'products', f"{pid}.webp")
            out_img.save(out_path, 'WEBP', quality=95)
            fsize = os.path.getsize(out_path)
            print(f"[SUCCESS] {pid} -> {out_path} ({fsize} bytes)")
            success += 1
        else:
            print(f"[FAIL] {pid}: status {r.status_code}, len {len(r.content)}")
    except Exception as e:
        print(f"[ERROR] {pid}: {e}")

print(f"\nProcessing finished: {success}/{len(catalog_new_20)} standardized successfully.")
