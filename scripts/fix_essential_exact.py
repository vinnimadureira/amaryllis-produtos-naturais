import urllib.request
import re
from test_official_standardization import standardize_packshot
from rembg import new_session
from PIL import Image
import io

exact_map = {
    "essential-fiberbime-laranja-30doses": "https://www.essentialnutrition.com.br/fiber-biome-blend-fibras-laranja",
    "essential-fiberbime-neutro-30doses": "https://www.essentialnutrition.com.br/fiber-biome-blend-fibras",
    "essential-fe-complex-90caps": "https://www.essentialnutrition.com.br/ferro-quelado-30-mg-com-vitamina-c",
    "essential-aminogreens-30doses": "https://www.essentialnutrition.com.br/amino-greens-limao",
    "essential-veggie-protein-cacau-450g": "https://www.essentialnutrition.com.br/veggie-protein-cacao-chocolate",
    "essential-collagen-2-joint-limao-30doses": "https://www.essentialnutrition.com.br/collagen-2-joint-limao-siciliano-lata"
}

sess = new_session('u2net')
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for pid, url in exact_map.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode('utf-8', errors='ignore')
            imgs = re.findall(r'https://d3eomlzmsu8e9b\.cloudfront\.net/media/catalog/product/[^\s"\'<>]+\.(?:jpg|png|webp)', html)
            valid = [i for i in imgs if 'tabela' not in i and 'small_image' not in i and 'thumbnail' not in i]
            if valid:
                img_url = valid[0]
                print(f"Downloading {pid} from {img_url}")
                img_req = urllib.request.Request(img_url, headers=headers)
                with urllib.request.urlopen(img_req, timeout=10) as ir:
                    img = Image.open(io.BytesIO(ir.read()))
                    std = standardize_packshot(img, session=sess)
                    out_path = f"public/products/{pid}.webp"
                    std.save(out_path, 'WEBP', quality=95)
                    print(f"  Fixed {pid}")
    except Exception as e:
        print(f"Error on {pid}: {e}")
