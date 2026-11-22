import requests
import re
import urllib.parse

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

def search_bing(query):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&qft=+filterui:aspect-square&form=HDRSC2&first=1"
    try:
        r = requests.get(url, headers=headers, timeout=6)
        murls = re.findall(r'murl&quot;:&quot;(https?://[^&]+)&quot;', r.text)
        if not murls:
            murls = re.findall(r'\"murl\":\"(https?://[^\"]+)\"', r.text)
        # ignore watermarked stock images
        good = [u for u in murls if not any(x in u.lower() for x in ['shutterstock', 'alamy', 'freepik', 'vector', 'depositphotos', 'istockphoto'])]
        return good[:5]
    except Exception as e:
        return []

tests = [
    ("now-e400", "now foods vitamin e-400 100 softgels"),
    ("now-garlic", "now foods garlic oil 1500 mg 100 softgels"),
    ("now-inositol", "now foods inositol 500 mg 100 veg capsules"),
    ("now-coq10", "now foods coq10 50 mg 50 softgels"),
    ("notmilk-original", "notmilk original 1l"),
    ("urbano-parafuso", "macarrao de arroz parafuso urbano 500g"),
    ("crock-grossos", "aveia em flocos grossos sem gluten leve crock 200g"),
    ("crock-farinha", "farinha de aveia sem gluten leve crock 200g"),
    ("alere-cacau", "biscoito cacau avela alere gourmet 30g"),
    ("belive-batata", "paozinho de batata belive 198g"),
    ("belive-cenoura-pao", "paozinho de cenoura belive 200g"),
    ("belive-sal-rosa", "chips mandioca sal rosa belive 50g"),
    ("belive-snack-pizza", "snack assado sabor pizza belive 50g")
]

for name, q in tests:
    res = search_bing(q)
    print(f"=== {name} ===")
    for u in res[:3]:
        print("  ->", u)
