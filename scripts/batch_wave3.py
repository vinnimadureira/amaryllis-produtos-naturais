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

catalog_wave3 = {
    'a-tal-da-castanha-amendoa-1l': 'https://hortifrutibr.vteximg.com.br/arquivos/ids/175789/MOCKUP-AMENDOA.jpg',
    'a-tal-da-castanha-mixed-nuts-1l': 'https://hortifrutibr.vteximg.com.br/arquivos/ids/175783/',
    'a-tal-da-castanha-original-1l': 'https://hortifrutibr.vteximg.com.br/arquivos/ids/175785/MOCKUP-ORIGINAL.jpg',
    'copra-leite-de-coco-beber-900ml': 'https://hortifrutibr.vteximg.com.br/arquivos/ids/169129/Leite-De-Coco-Pronto-Para-Beber-Copra-900-Ml.jpg',
    'casarao-lasanha-caseira-tradicional-300g': 'https://hortifrutibr.vteximg.com.br/arquivos/ids/163037/MASSA-GOUR-LASANHA-TRAD-CASARAO-300G.jpg',
    'ceres-talharim-grao-de-bico-200g': 'https://hortifrutibr.vteximg.com.br/arquivos/ids/170174/Macarrao-Talharim-Tradicional-200G-Ceres-Brasil.jpg',
    'nazinha-sequilhos-coco-300g': 'https://www.nazinha.com.br/wp-content/uploads/2024/03/Sequilhos-Classico-Coco.png',
    'nazinha-sequilhos-maracuja-zero-120g': 'https://www.nazinha.com.br/wp-content/uploads/2026/05/Ativo-1sequilhos-maracuja-scaled.png'
}

sess = new_session('u2net')
headers = {'User-Agent': 'Mozilla/5.0'}

for pid, u in catalog_wave3.items():
    try:
        r = requests.get(u, headers=headers, timeout=10)
        if r.status_code == 200:
            raw_img = Image.open(io.BytesIO(r.content))
            out_img = standardize_packshot(raw_img, session=sess)
            out_path = os.path.join('public', 'products', f"{pid}.webp")
            out_img.save(out_path, 'WEBP', quality=95)
            print(f"[OK] {pid} -> {out_path} ({os.path.getsize(out_path)} bytes)")
        else:
            print(f"[FAIL] {pid}: {r.status_code}")
    except Exception as e:
        print(f"[ERROR] {pid}: {e}")
