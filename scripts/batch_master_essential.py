import os
import io
import urllib.request
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

essential_masters = {
    "essential-cacao-whey-900g": "c/a/cacao_whey_lata_media_1308x1636px.jpg",
    "essential-vanilla-whey-900g": "v/a/vanilla_whey_lata_grande_1308x1636px.jpg",
    "essential-red-berry-whey-900g": "r/e/red_berry_whey_lata_media_1308x1636px_1_1.jpg",
    "essential-beefprotein-cacau-960g": "b/e/beef_protein_cacau_latao_1308x1636px.jpg",
    "essential-beefprotein-banana-canela-960g": "b/e/beef_protein_banana_canela_lata_1308x1636px_1.jpg",
    "essential-veggie-protein-cacau-450g": "3/5/3574.19.veggie_protein_1308x1636px4_1.jpg",
    "essential-veggie-protein-neutro-450g": "3/5/3574.19.veggie_protein_1308x1636px10.jpg",
    "essential-beta-action-20doses": "b/e/beta_action_jabuticaba_lata.jpg",
    "essential-muscle-synergy-15doses": "m/u/muscle_synergy_lata_media_01.jpg",
    "essential-collagen-skin-neutro-300g": "c/o/collagen_skin_neutro_lata_pequena_1308x1636px.jpg",
    "essential-collagen-skin-limao-300g": "c/o/collagen_skin_limao_siciliano_lata_pequena_1308x1636px_1.jpg",
    "essential-collagen-2-joint-limao-30doses": "c/o/collagen_2_joint_limao_siciliano_lata_pequena_1308x1636px_1_.jpg",
    "essential-collagen-bones-chocolate-30doses": "c/o/collagen_bones_chocolate_lata_media_1308x1636px.jpg",
    "essential-collagen-bodybalance-neutro-30doses": "c/o/collagen_bodybalance_lata_media_neutro.jpg",
    "essential-collagen-bodybalance-chocolate-25doses": "c/o/collagen_bodybalance_chocolate_lata_media_1.jpg",
    "essential-glutamina-300g": "g/l/glutamina_lata_pequena_01.jpg",
    "essential-crealift-creapure-300g": "c/r/crealift_lata_pequena_01.jpg",
    "essential-brainstorm-coffee-original-220g": "b/r/brainstorm_coffee_especiarias_lata_pequena_1308x1636px.jpg",
    "essential-brainstorm-coffee-caramelo-220g": "b/r/brainstorm_caramel_latte_1.jpg",
    "essential-fiberbime-laranja-30doses": "f/i/fiberbiome_lata_laranja-principal.jpg",
    "essential-fiberbime-neutro-30doses": "f/i/fiberbiome_lata_neutro.jpg",
    "essential-aminogreens-30doses": "a/m/aminogreens_lata_pequena_12_1.jpg",
    "essential-carbolift-palatinose-300g": "c/a/carbolift_lata_media_1308x1636px_1.jpg",
    "essential-hydrolift-limao-30doses": "h/y/hydrolift_limao_lata_pequena_1308x1636px_1_1.jpg",
    "essential-aminolift-tangerina-30doses": "a/m/aminolift_tangerina_lata_pequena_1308x1636px_1.jpg",
    "essential-mct-lift-250ml": "m/c/mctlift_250ml_1.jpg",
    "essential-xylitol-300g": "x/y/xylitol_300g_pote_1308x1636px_1.jpg",
    "essential-super-omega-3-tg-60caps": "s/u/super_omega3_60_capsulas_pote_1308x1636px.jpg",
    "essential-super-omega-3-tg-120caps": "s/u/super_omega3_120_capsulas_pote_1308x1636px.jpg",
    "essential-super-omega-3-tg-comfort": "s/u/super_omega_comfort_60_caps_1308x1636px.jpg",
    "essential-dha-tg-90caps": "d/h/dha_tg_90_capsulas_pote_1308x1636px.jpg",
    "essential-omega-core-60caps": "o/m/omega_core_1308x1636px_1.jpg",
    "essential-omega-vision-60caps": "o/m/omega_vision_1308x1636px_1_1.jpg",
    "essential-coq10-omega3-tg-60caps": "c/o/coq10_1308x1636px_logo_nova_1.jpg",
    "essential-omega-brain-60caps": "o/m/omega_brain_1308x1636px_1.jpg",
    "essential-b-complex-120caps": "b/_/b_complex_120_capsulas_pote_1308x1636px.jpg",
    "essential-fe-complex-90caps": "f/e/fe_complex_pote_90_capsulas_01.jpg",
    "essential-vit-d3-2000ui-120caps": "v/i/vit_d3_1308x1636px_logo_nova_1.jpg",
    "essential-gamalift-30doses": "g/a/gamalift_1308x1636px_1.jpg",
    "essential-focus-60caps": "f/o/focus-att.jpg",
    "essential-melatonin-duo-120caps": "m/e/melatonin_duo_harmony_120caps_pote_1.jpg",
    "essential-mg-complex-90caps": "m/g/mg_complex3_90_capsulas_pote_1308x1636px.jpg",
    "essential-nac-glycine-taurine-90caps": "n/a/nac_pote.jpg",
    "essential-collagen-gut-20doses": "c/o/collagen_gut_lata_1_1.jpg",
    "essential-mondz-almonds-50g": "m/o/mondz_sache.jpg"
}

sess = new_session('u2net')
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

print(f"Starting download and standardization of {len(essential_masters)} Essential Nutrition master packshots...")

for idx, (pid, path) in enumerate(essential_masters.items()):
    raw_url = f"https://d3eomlzmsu8e9b.cloudfront.net/media/catalog/product/{path}"
    out_path = f"public/products/{pid}.webp"
    try:
        req = urllib.request.Request(raw_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as r:
            img = Image.open(io.BytesIO(r.read()))
            std = standardize_packshot(img, session=sess)
            std.save(out_path, 'WEBP', quality=95)
            print(f"[{idx+1}/{len(essential_masters)}] OK {pid} ({os.path.getsize(out_path)} bytes)")
    except Exception as e:
        print(f"[{idx+1}/{len(essential_masters)}] Error {pid}: {e}")

print("All Essential Nutrition master packshots standardized successfully!")
