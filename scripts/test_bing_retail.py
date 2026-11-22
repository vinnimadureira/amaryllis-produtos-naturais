import requests
import json
import re
import urllib.parse

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

def search_bing_retail(query):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&qft=+filterui:aspect-square&form=HDRSC2&first=1"
    try:
        r = requests.get(url, headers=headers, timeout=6)
        murls = re.findall(r'murl&quot;:&quot;(https?://[^&]+)&quot;', r.text)
        if not murls:
            murls = re.findall(r'\"murl\":\"(https?://[^\"]+)\"', r.text)
        # Filter for retail/ecommerce CDNs
        good = [u for u in murls if any(d in u.lower() for d in [
            'vteximg', 'iherb', 'santaluzia', 'drogariasp', 'drogasil', 'drogaraia',
            'mambo', 'zonacerealista', 'atacadosuplemento', 'nowfoods', 'vitafor', 'belive'
        ])]
        return good[:3]
    except Exception as e:
        print(f"Err {query}: {e}")
        return []

queries = [
    ("now-e400", "site:iherb.com now foods vitamin e 400"),
    ("now-garlic", "site:iherb.com now foods garlic oil 1500"),
    ("now-inositol", "site:iherb.com now foods inositol 500mg"),
    ("now-coq10", "site:iherb.com now foods coq10 50mg"),
    ("urbano-parafuso", "site:santaluzia.com.br macarrao parafuso arroz urbano"),
    ("notmilk", "site:santaluzia.com.br notmilk original"),
    ("alere-cacau", "site:santaluzia.com.br biscoito cacau avela alere")
]

for name, q in queries:
    res = search_bing_retail(q)
    print(f"=== {name} ({q}) ===")
    for u in res[:2]:
        print("   ->", u)
