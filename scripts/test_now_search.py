import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

now_items = [
    ("now-chlorella-500mg-200tabs", "chlorella 500mg"),
    ("now-l-tryptophan-500mg-60caps", "triptofano"),
    ("now-liquid-melatonin-59ml", "melatonina liquida"),
    ("now-nac-600mg-100caps", "nac 600mg"),
    ("now-vitamin-d3-k2-120caps", "d3 k2")
]

for pid, q in now_items:
    try:
        u = f"https://nowfoodsbrasil.com.br/search/?q={requests.utils.quote(q)}"
        r = requests.get(u, headers=headers, timeout=8)
        print(f"NOW {pid} -> status {r.status_code}")
        # find product images
        imgs = re.findall(r'(https://cdn\.awsli\.com\.br/[^\s"\'<>]+\.(?:jpg|png|webp))', r.text)
        if imgs:
            # find largest resolution (usually has /1000x1000/ or /800x800/ or /produto/)
            hires = imgs[0]
            for img in imgs:
                if '1000x1000' in img or '800x800' in img or 'produto' in img:
                    hires = img
                    break
            print(f"   [FOUND NOW] {pid} -> {hires}")
        else:
            print(f"   [NO IMG] {pid}")
    except Exception as e:
        print(f"NOW {pid} err: {e}")
