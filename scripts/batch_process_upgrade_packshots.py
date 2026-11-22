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

official_upgrades = {
    # Vitafor Oficial (Direct from vitafor.com.br / drogariasp)
    'vitafor-glutamax-300g': 'https://vitafor.vteximg.com.br/arquivos/ids/610574/GM300-01.jpg',
    'vitafor-isofort-wpi-chocolate-900g': 'https://vitafor.vteximg.com.br/arquivos/ids/611190/IU900CA-01.jpg',
    'vitafor-omegafor-vegan-60caps': 'https://vitafor.vteximg.com.br/arquivos/ids/611583/OV60-01.jpg',
    'vitafor-coq10-200mg-60caps': 'https://vitafor.vteximg.com.br/arquivos/ids/611314/CQ60-01.jpg',
    'vitafor-vitamina-b12-gotas-30ml': 'https://vitafor.vteximg.com.br/arquivos/ids/611488/B1220-01.jpg',
    'vitafor-omegafor-plus-60caps': 'https://drogariasp.vteximg.com.br/arquivos/ids/1002237/3239837.png',

    # Belive (Santa Luzia VTEX)
    'belive-cookies-baunilha-chocolate-67g': 'https://santaluzia.vteximg.com.br/arquivos/ids/986653/3079783.jpg',
    'belive-protein-brownie-double-chocolate': 'https://santaluzia.vteximg.com.br/arquivos/ids/987383/1307789.jpg',
    'belive-pao-de-mel-zero-45g': 'https://santaluzia.vteximg.com.br/arquivos/ids/973347/3048985.jpg',
    'belive-bolinho-cenoura-chocolate-40g': 'https://santaluzia.vteximg.com.br/arquivos/ids/1008392/3266060.png',
    'belive-bolinho-double-chocolate-40g': 'https://santaluzia.vteximg.com.br/arquivos/ids/964398/1221493.jpg',
    'belive-bolinho-coco-chocolate-40g': 'https://santaluzia.vteximg.com.br/arquivos/ids/962984/1260596.jpg',
    'belive-bolinho-laranja-chocolate-40g': 'https://santaluzia.vteximg.com.br/arquivos/ids/985531/3127079.jpg',

    # Hart's Natural (Santa Luzia VTEX)
    'harts-natural-granola-keto-low-carb-300g': 'https://santaluzia.vteximg.com.br/arquivos/ids/1008223/3227030.png',
    'harts-natural-granola-keto-protein-sal-marinho-200g': 'https://santaluzia.vteximg.com.br/arquivos/ids/1008224/3227030.png',

    # A Tal da Castanha (Drogaria SP VTEX)
    'a-tal-da-castanha-original-1l': 'https://drogariasp.vteximg.com.br/arquivos/ids/666552/image-c8e590efecfc45c8b31adc3f612a666e.jpg',
    'a-tal-da-castanha-amendoa-1l': 'https://drogariasp.vteximg.com.br/arquivos/ids/2224366/Bebida-Barista-A-Tal-da-Castanha-1L.jpg',
    'a-tal-da-castanha-mixed-nuts-1l': 'https://drogariasp.vteximg.com.br/arquivos/ids/666671/image-c38c7bf802e34f8fb17c400f7e3b6620.jpg',

    # NotCo (Santa Luzia VTEX)
    'notco-notmilk-original-1l': 'https://santaluzia.vteximg.com.br/arquivos/ids/979637/3020452.png',

    # Copra (Santa Luzia VTEX)
    'copra-leite-de-coco-beber-900ml': 'https://santaluzia.vteximg.com.br/arquivos/ids/980353/1253905.jpg',

    # Konjac Massa MF (Drogaria SP VTEX)
    'konjac-massa-mf-bucatini-270g': 'https://drogariasp.vteximg.com.br/arquivos/ids/2056007/Massa-Tipo-Bucatini-Konjac-270G.jpg',

    # Nazinha (Santa Luzia VTEX)
    'nazinha-sequilhos-coco-300g': 'https://santaluzia.vteximg.com.br/arquivos/ids/969114/1077640.jpg',

    # Casarão (Santa Luzia VTEX)
    'casarao-lasanha-caseira-tradicional-300g': 'https://santaluzia.vteximg.com.br/arquivos/ids/1002200/3185449.jpg'
}

def main():
    sess = new_session('u2net')
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    print(f"Starting upgrade of {len(official_upgrades)} products to official supplier packshots...")
    success = 0
    fail = 0
    
    for pid, url in official_upgrades.items():
        try:
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code == 200 and len(r.content) > 1000:
                raw_img = Image.open(io.BytesIO(r.content))
                out_img = standardize_packshot(raw_img, session=sess)
                out_path = os.path.join('public', 'products', f"{pid}.webp")
                out_img.save(out_path, 'WEBP', quality=95)
                fsize = os.path.getsize(out_path)
                print(f"[UPGRADED] {pid} -> {out_path} ({fsize} bytes)")
                success += 1
            else:
                print(f"[FAIL HTTP {r.status_code}] {pid}")
                fail += 1
        except Exception as e:
            print(f"[ERR] {pid}: {e}")
            fail += 1
            
    print(f"\nUpgrade complete! Success: {success}, Failed: {fail}")

if __name__ == '__main__':
    main()
