import requests
import json
import re
import urllib.parse

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

def search_bing_image(query):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&qft=+filterui:aspect-square+filterui:photo-photo&form=HDRSC2&first=1"
    try:
        r = requests.get(url, headers=headers, timeout=8)
        # Bing embeds high-res image URLs in m="{...murl:\"http...\"...}"
        murls = re.findall(r'murl&quot;:&quot;(https?://[^&]+)&quot;', r.text)
        if not murls:
            murls = re.findall(r'\"murl\":\"(https?://[^\"]+)\"', r.text)
        return murls[:5]
    except Exception as e:
        print(f"Error searching {query}: {e}")
        return []

# Test with one from each brand
tests = [
    ("now-chlorella", "now foods certified organic chlorella 500mg 200 tablets packshot white background"),
    ("forever-aloe", "forever living aloe vera gel 1l packshot"),
    ("color-andina-cacau", "color andina foods cacau selvagem 200g"),
    ("panizza-artemisia", "tintura panizza artemisia 100ml"),
    ("alere-banana", "alere biscoito banana canela 30g"),
    ("greenbios-alecrim", "cha greenbios alecrim 30g"),
    ("casarao-penne", "massa casarao penne espinafre berinjela 300g")
]

for name, q in tests:
    res = search_bing_image(q)
    print(f"=== {name} ===")
    for u in res[:2]:
        print("  ->", u)
