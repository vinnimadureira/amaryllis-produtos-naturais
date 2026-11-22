import requests
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

queries = [
    ("now-e400", "site:s3.images-iherb.com now00850"),
    ("now-e400-alt", "site:s3.images-iherb.com now0085"),
    ("now-garlic", "site:s3.images-iherb.com now01780"),
    ("now-inositol", "site:s3.images-iherb.com now00475"),
    ("now-coq10", "site:s3.images-iherb.com now03160")
]

for name, q in queries:
    try:
        url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(q)}"
        r = requests.get(url, headers=headers, timeout=5)
        matches = re.findall(r'(https://s3\.images-iherb\.com/now/[^\s"\'&]+)', r.text)
        print(f"[{name}] {q} -> found {len(matches)}")
        for m in set(matches[:3]):
            print(f"   -> {m}")
    except Exception as e:
        print(f"[{name}] err: {e}")
