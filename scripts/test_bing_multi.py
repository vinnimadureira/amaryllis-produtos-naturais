import requests
import re
import urllib.parse
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

queries = [
    "now foods chlorella 500mg 200 tabs",
    "a tal da castanha original 1l",
    "belive chips mandioca sal rosa",
    "copra leite de coco para beber 900ml",
    "notmilk original notco 1l",
    "konjac massa bucatini 270g",
    "nazinha sequilhos coco 300g",
    "forever living aloe vera gel 1l"
]

for q in queries:
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(q)}&first=1"
    try:
        r = requests.get(url, headers=headers, timeout=8)
        m_data = re.findall(r'm="(\{[^"]+\})"', r.text)
        print(f"\nQuery: '{q}' -> found {len(m_data)} results")
        found = 0
        for m in m_data:
            clean_m = m.replace('&quot;', '"').replace('&#39;', "'")
            try:
                d = json.loads(clean_m)
                murl = d.get('murl', '')
                t = d.get('t', '')
                if murl and not any(k in murl for k in ['youtube.com', 'facebook.com', 'wikipedia']):
                    print(f"  [{d.get('ow', 0)}x{d.get('oh', 0)}] {t[:40]}: {murl}")
                    found += 1
                    if found >= 2:
                        break
            except Exception:
                pass
    except Exception as e:
        print(f"Error for '{q}': {e}")
