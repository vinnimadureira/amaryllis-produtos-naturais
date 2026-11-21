import os
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from rembg import remove

def clean_hand_and_skin(img_rgba):
    """
    Remove residual fingers/hand at the bottom of the image.
    Skin tones in RGBA typically have: R > G > B, with R > 140, B < 180, R-G > 15.
    We scan from the bottom upwards. If near the bottom there is a strong cluster of skin-colored pixels,
    we can fade or mask them out.
    """
    arr = np.array(img_rgba).copy()
    h, w, c = arr.shape
    
    # We inspect the lower 25% of the image
    bottom_start = int(h * 0.75)
    
    # Simple skin mask
    r = arr[bottom_start:, :, 0].astype(int)
    g = arr[bottom_start:, :, 1].astype(int)
    b = arr[bottom_start:, :, 2].astype(int)
    a = arr[bottom_start:, :, 3].astype(int)
    
    # Skin heuristic in RGB
    is_skin = (a > 30) & (r > 130) & (g > 80) & (b > 60) & (r > g) & (g > b) & ((r - g) > 15) & ((r - b) > 30)
    
    # Find rows near bottom that are dominated by skin or where product ends
    # We zero out alpha where is_skin is true near the very bottom (last 15%)
    very_bottom = int(h * 0.85) - bottom_start
    arr[bottom_start + very_bottom:, :, 3] = np.where(is_skin[very_bottom:, :], 0, arr[bottom_start + very_bottom:, :, 3])
    
    return Image.fromarray(arr)

def make_marketplace_image(input_path, output_path, target_size=(1000, 1000)):
    orig = Image.open(input_path).convert('RGB')
    
    # 1. Background removal
    nobg = remove(orig)
    
    # 2. Clean hand remnants
    nobg = clean_hand_and_skin(nobg)
    
    # 3. Crop to content bounding box
    bbox = nobg.getbbox()
    if bbox:
        nobg = nobg.crop(bbox)
    
    # 4. Enhance colors & sharpness
    # Slight contrast and color boost
    rgb = nobg.convert('RGB')
    enhancer = ImageEnhance.Color(rgb)
    rgb = enhancer.enhance(1.12)
    enhancer = ImageEnhance.Contrast(rgb)
    rgb = enhancer.enhance(1.08)
    enhancer = ImageEnhance.Sharpness(rgb)
    rgb = enhancer.enhance(1.15)
    
    # Recombine with alpha
    r, g, b = rgb.split()
    nobg = Image.merge('RGBA', (r, g, b, nobg.split()[3]))
    
    # 5. Fit into square canvas (80% of canvas height/width)
    max_w = int(target_size[0] * 0.82)
    max_h = int(target_size[1] * 0.82)
    
    nobg.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    
    # 6. Create clean white marketplace canvas
    canvas = Image.new('RGBA', target_size, (255, 255, 255, 255))
    
    # 7. Add subtle realistic contact drop shadow underneath
    prod_w, prod_h = nobg.size
    shadow_w = int(prod_w * 0.75)
    shadow_h = max(8, int(prod_h * 0.05))
    
    shadow = Image.new('RGBA', (shadow_w, shadow_h), (0, 0, 0, 0))
    # Draw oval shadow
    from PIL import ImageDraw
    draw = ImageDraw.Draw(shadow)
    draw.ellipse([0, 0, shadow_w, shadow_h], fill=(30, 30, 30, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=shadow_h // 2))
    
    # Position product and shadow
    pos_x = (target_size[0] - prod_w) // 2
    pos_y = (target_size[1] - prod_h) // 2 - 10
    
    shadow_x = (target_size[0] - shadow_w) // 2
    shadow_y = pos_y + prod_h - (shadow_h // 2)
    
    canvas.paste(shadow, (shadow_x, shadow_y), shadow)
    canvas.paste(nobg, (pos_x, pos_y), nobg)
    
    final_rgb = canvas.convert('RGB')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_rgb.save(output_path, 'WEBP', quality=90)
    print(f"Created marketplace photo: {output_path}")

if __name__ == '__main__':
    test_samples = [
        (r'd:\ProjetosIA\Amaryllis\unzipped_fotos\Fotos\WhatsApp Image 2026-10-12 at 08.17.28.jpeg', r'd:\ProjetosIA\Amaryllis\test_rembg\beefprotein_marketplace.webp'),
        (r'd:\ProjetosIA\Amaryllis\unzipped_fotos\Fotos\WhatsApp Image 2026-10-12 at 08.17.48.jpeg', r'd:\ProjetosIA\Amaryllis\test_rembg\guacatonga_marketplace.webp'),
        (r'd:\ProjetosIA\Amaryllis\unzipped_fotos\Fotos\WhatsApp Image 2026-10-12 at 08.18.00 (3).jpeg', r'd:\ProjetosIA\Amaryllis\test_rembg\fenogrego_marketplace.webp')
    ]
    for inp, out in test_samples:
        make_marketplace_image(inp, out)
