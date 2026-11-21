import os
import io
import subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from rembg import remove, new_session
import numpy as np

def enhance_and_standardize(img_pil, target_size=(1000, 1000), session=None):
    img_pil = img_pil.convert('RGBA')
    
    # 1. Background removal using u2net
    if session:
        nobg = remove(img_pil, session=session)
    else:
        nobg = remove(img_pil)
        
    bbox = nobg.getbbox()
    if bbox:
        nobg = nobg.crop(bbox)
        
    # 2. Subtle marketplace enhancement: boost color and sharpness
    r, g, b, a = nobg.split()
    rgb = Image.merge('RGB', (r, g, b))
    
    # Slight contrast and color boost
    rgb = ImageEnhance.Color(rgb).enhance(1.08)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.05)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.2)
    
    nr, ng, nb = rgb.split()
    nobg = Image.merge('RGBA', (nr, ng, nb, a))
    
    # 3. Scale to 82% of target canvas height/width
    max_w = int(target_size[0] * 0.82)
    max_h = int(target_size[1] * 0.82)
    nobg.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    
    # 4. Pure white canvas
    canvas = Image.new('RGBA', target_size, (255, 255, 255, 255))
    pw, ph = nobg.size
    
    # 5. Soft elliptical drop shadow
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

# Find all remaining un-modified products
all_webp = sorted([os.path.normpath(f) for f in os.listdir('public/products') if f.endswith('.webp')])

res = subprocess.run(["git", "diff", "--name-only", "public/products/"], capture_output=True, text=True)
modified = set([os.path.normpath(os.path.basename(line)) for line in res.stdout.strip().splitlines() if line])

remaining = [f for f in all_webp if f not in modified]
print(f"Total remaining to standardize: {len(remaining)}")

sess = new_session('u2net')

count = 0
for f in remaining:
    fpath = os.path.join('public', 'products', f)
    try:
        raw_img = Image.open(fpath)
        out = enhance_and_standardize(raw_img, session=sess)
        out.save(fpath, 'WEBP', quality=95)
        count += 1
        print(f"[{count}/{len(remaining)}] Standardized: {f} ({os.path.getsize(fpath)} bytes)")
    except Exception as e:
        print(f"Error on {f}: {e}")

print(f"\nCompleted! Standardized {count} products.")
