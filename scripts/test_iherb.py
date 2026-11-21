import requests

skus = {
    'now-vitamin-d3-k2-120caps': 'NOW-00373',
    'now-nac-600mg-100caps': 'NOW-00858',
    'now-chlorella-500mg-200tabs': 'NOW-02633',
    'now-l-tryptophan-500mg-60caps': 'NOW-00166',
    'now-liquid-melatonin-59ml': 'NOW-03262'
}

for pid, code in skus.items():
    # test different iherb patterns
    patterns = [
        f"https://images.iherb.com/l/{code}-1.jpg",
        f"https://images.iherb.com/l/{code}-0.jpg",
        f"https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/{code.replace('-', '_')}_1.jpg",
        f"https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/products/{code.lower()}/front.jpg"
    ]
    for url in patterns:
        try:
            r = requests.head(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=4)
            if r.status_code == 200:
                print(f"[SUCCESS] {pid} -> {url} (size {r.headers.get('content-length')})")
                break
        except Exception:
            pass
