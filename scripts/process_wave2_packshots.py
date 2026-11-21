import os
import io
import json
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

def main():
    with open('scripts/wave2_mapped_catalog.json', 'r', encoding='utf-8') as f:
        catalog = json.load(f)
        
    os.makedirs(os.path.join('public', 'products'), exist_ok=True)
    sess = new_session('u2net')
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    print(f"Starting standardization of {len(catalog)} Wave 2 products...")
    success_count = 0
    fail_count = 0
    
    for idx, item in enumerate(catalog, 1):
        pid = item['id']
        out_path = os.path.join('public', 'products', f"{pid}.webp")
        
        # If already exists and size > 10KB, skip to save time, or overwrite
        if os.path.exists(out_path) and os.path.getsize(out_path) > 10000:
            print(f"[{idx}/{len(catalog)}] [ALREADY EXISTS] {pid}")
            success_count += 1
            continue
            
        try:
            if item.get('source_type') == 'official_web':
                url = item['source_url']
                r = requests.get(url, headers=headers, timeout=12)
                if r.status_code == 200 and len(r.content) > 1000:
                    raw_img = Image.open(io.BytesIO(r.content))
                    out_img = standardize_packshot(raw_img, session=sess)
                    out_img.save(out_path, 'WEBP', quality=95)
                    print(f"[{idx}/{len(catalog)}] [WEB OK] {pid} -> {out_path} ({os.path.getsize(out_path)} bytes)")
                    success_count += 1
                else:
                    raise Exception(f"HTTP error {r.status_code}")
            else:
                photo_file = item['photo_file']
                if not os.path.exists(photo_file):
                    raise Exception(f"File not found: {photo_file}")
                raw_img = Image.open(photo_file)
                out_img = standardize_packshot(raw_img, session=sess)
                out_img.save(out_path, 'WEBP', quality=95)
                print(f"[{idx}/{len(catalog)}] [PHOTO OK] {pid} -> {out_path} ({os.path.getsize(out_path)} bytes)")
                success_count += 1
        except Exception as e:
            print(f"[{idx}/{len(catalog)}] [FAIL] {pid}: {e}")
            fail_count += 1
            
    print(f"\nProcessing Complete! Success: {success_count}, Failed: {fail_count}")

if __name__ == '__main__':
    main()
