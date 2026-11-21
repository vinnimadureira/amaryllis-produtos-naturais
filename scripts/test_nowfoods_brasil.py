import requests
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

# Check nowfoodsbrasil.com.br
now_items = [
    ("now-chlorella-500mg-200tabs", "chlorella"),
    ("now-l-tryptophan-500mg-60caps", "triptofano"),
    ("now-liquid-melatonin-59ml", "melatonina"),
    ("now-nac-600mg-100caps", "nac"),
    ("now-vitamin-d3-k2-120caps", "vitamina d3 k2")
]

for pid, q in now_items:
    try:
        u = f"https://www.nowfoodsbrasil.com.br/buscar?q={q}"
        r = requests.get(u, headers=headers, timeout=6)
        print(f"NOW {pid} -> status {r.status_code}")
        imgs = re.findall(r'https://cdn\.awsli\.com\.br/[^\s"\'<>]+\.(?:jpg|png|webp)', r.text)
        if imgs:
            # Look for 1000x1000 or 800x800
            print(f"   Found img: {imgs[0]}")
    except Exception as e:
        print(f"NOW {pid} err: {e}")
