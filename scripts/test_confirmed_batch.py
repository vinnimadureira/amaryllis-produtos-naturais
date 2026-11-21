import requests
import io
from PIL import Image

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

confirmed_urls = {
    'forever-aloe-vera-gel-1l': 'https://foreverliving.com/img/products/715.png',
    'forever-aloe-berry-nectar-1l': 'https://foreverliving.com/img/products/734.png',
    'forever-aloe-peaches-1l': 'https://foreverliving.com/img/products/777.png',
    'now-chlorella-500mg-200tabs': 'https://drogariasp.vteximg.com.br/arquivos/ids/2249335/Chlorella-500mg-com-200-tabletes-Veganos-Now-Food.jpg',
    'now-l-tryptophan-500mg-60caps': 'https://s3.images-iherb.com/now/now00166/v/14.jpg',
    'now-liquid-melatonin-59ml': 'https://s3.images-iherb.com/now/now03261/v/18.jpg',
    'casarao-penne-espinafre-berinjela-300g': 'https://dcdn-us.mitiendanube.com/stores/006/901/025/products/penne-espinafre-casarao-0f743ab86cd034f97617938157763775-1024-1024.webp',
    'crock-cereal-aveia-sem-gluten-flocos-finos-200g': 'https://images.tcdn.com.br/img/img_prod/1520166/aveia_flocos_finos_sem_gluten_200g_leve_crock_235_1_3037210ae3534af73ad267cde23b2ca8.jpg'
}

for pid, url in confirmed_urls.items():
    try:
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            img = Image.open(io.BytesIO(r.content))
            print(f"[OK] {pid}: {img.size}, mode {img.mode}, {len(r.content)} bytes")
        else:
            print(f"[FAIL] {pid}: status {r.status_code}")
    except Exception as e:
        print(f"[ERR] {pid}: {e}")
