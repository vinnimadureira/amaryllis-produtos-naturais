import requests
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

now_pages = [
    ("now-e400", "https://www.nowfoods.com/products/supplements/vitamin-e-400-iu-mixed-tocopherols-softgels"),
    ("now-garlic", "https://www.nowfoods.com/products/supplements/garlic-oil-triple-strength-1500-mg-softgels"),
    ("now-inositol", "https://www.nowfoods.com/products/supplements/inositol-500-mg-veg-capsules"),
    ("now-coq10", "https://www.nowfoods.com/products/supplements/coq10-50-mg-softgels")
]

for name, url in now_pages:
    try:
        r = requests.get(url, headers=headers, timeout=6)
        if r.status_code == 200:
            # find images under /sites/default/files/
            matches = re.findall(r'src="(/sites/default/files/[^"]+\.(?:jpg|png|webp))"', r.text)
            if not matches:
                matches = re.findall(r'href="(/sites/default/files/[^"]+\.(?:jpg|png|webp))"', r.text)
            print(f"[{name}] {url}")
            for m in set(matches[:3]):
                print(f"   -> https://www.nowfoods.com{m}")
        else:
            print(f"[{name}] HTTP {r.status_code}")
    except Exception as e:
        print(f"[{name}] ERR: {e}")
