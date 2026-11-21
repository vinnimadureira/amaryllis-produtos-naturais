import os, io, requests
from PIL import Image
from test_official_standardization import standardize_packshot
from rembg import new_session

sess = new_session('u2net')
url = 'https://hortifrutibr.vteximg.com.br/arquivos/ids/178331/Bebida%20Vegetal%20Original%20sem%20Acucar%20Not%20Milk%201L.jpg'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
if r.status_code == 200:
    img = Image.open(io.BytesIO(r.content))
    out = standardize_packshot(img, session=sess)
    out_path = 'public/products/notco-notmilk-original-1l.webp'
    out.save(out_path, 'WEBP', quality=95)
    print(f"Saved NotMilk: {out_path} ({os.path.getsize(out_path)} bytes)")
