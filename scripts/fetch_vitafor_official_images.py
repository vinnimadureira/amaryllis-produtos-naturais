import urllib.request
import json
import urllib.parse
from PIL import Image
from test_official_standardization import standardize_packshot
from rembg import new_session
import io

vitafor_map = {
    "vitafor-creafort-300g": "creafort 300g",
    "vitafor-glutamax-300g": "glutamax 300g",
    "vitafor-isofort-wpi-chocolate-900g": "isofort chocolate",
    "vitafor-omegafor-plus-60caps": "omegafor plus",
    "vitafor-omegafor-vegan-60caps": "omegafor vegan",
    "vitafor-coq10-200mg-60caps": "coenzima q10 200mg",
}

sess = new_session('u2net')
headers = {'User-Agent': 'Mozilla/5.0'}

for pid, term in vitafor_map.items():
    url = f"https://www.vitafor.com.br/api/catalog_system/pub/products/search?ft={urllib.parse.quote(term)}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode('utf-8'))
            if data and data[0].get('items') and data[0]['items'][0].get('images'):
                img_url = data[0]['items'][0]['images'][0]['imageUrl']
                print(f"Vitafor {pid} -> {img_url}")
                img_req = urllib.request.Request(img_url, headers=headers)
                with urllib.request.urlopen(img_req, timeout=10) as ir:
                    img = Image.open(io.BytesIO(ir.read()))
                    std = standardize_packshot(img, session=sess)
                    out_path = f"public/products/{pid}.webp"
                    std.save(out_path, 'WEBP', quality=95)
                    print(f"  Saved {out_path}")
    except Exception as e:
        print(f"Error on {pid}: {e}")
