import os
import io
import urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from rembg import remove, new_session
import numpy as np

def standardize_packshot(img_pil, target_size=(1000, 1000), session=None):
    # If image is RGBA and already has transparent background, check alpha bbox
    # Otherwise run rembg to get a perfectly transparent cutout of the packshot
    img_pil = img_pil.convert('RGBA')
    arr = np.array(img_pil)
    has_transparency = (arr[:, :, 3] < 250).sum() > 500
    
    if not has_transparency:
        # Check if background is already solid pure white
        # If border pixels are white (>245 in RGB), we can threshold or use rembg
        if session:
            nobg = remove(img_pil, session=session)
        else:
            nobg = remove(img_pil)
    else:
        nobg = img_pil
        
    bbox = nobg.getbbox()
    if bbox:
        nobg = nobg.crop(bbox)
        
    # Scale to 82% of target canvas height/width
    max_w = int(target_size[0] * 0.82)
    max_h = int(target_size[1] * 0.82)
    nobg.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new('RGBA', target_size, (255, 255, 255, 255))
    pw, ph = nobg.size
    
    # Subtle soft contact shadow underneath
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

# Test with 2 official URLs
sess = new_session('u2net')

urls = [
    ("cacao_whey_official", "https://d3eomlzmsu8e9b.cloudfront.net/media/catalog/product/cache/eab5220233fe066c9213546c1caa0012/c/a/cacao_whey_lata_media_1308x1636px.jpg"),
    ("creafort_official", "https://vitafor.vteximg.com.br/arquivos/ids/610832/CR300-01.jpg?v=638856954693430000")
]

os.makedirs('test_official', exist_ok=True)

for name, u in urls:
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        img = Image.open(io.BytesIO(resp.read()))
        out = standardize_packshot(img, session=sess)
        out_path = f"test_official/{name}.webp"
        out.save(out_path, 'WEBP', quality=95)
        print(f"Created standardized official packshot: {out_path} ({os.path.getsize(out_path)} bytes)")
