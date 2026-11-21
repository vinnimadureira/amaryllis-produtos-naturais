import requests
import re
import urllib.parse

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

def search_bing(query):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&first=1"
    try:
        r = requests.get(url, headers=headers, timeout=6)
        murls = re.findall(r'murl&quot;:&quot;(https?://[^&]+)&quot;', r.text)
        return murls[:10]
    except Exception as e:
        return []

test_queries = [
    ("now-nac-600mg-100caps", "now foods nac 600 mg 100 veg capsules"),
    ("now-vitamin-d3-k2-120caps", "now foods vitamin d3 k2 120 veg capsules"),
    ("now-liquid-melatonin-59ml", "now foods liquid melatonin 59 ml"),
    ("now-l-tryptophan-500mg-60caps", "now foods l tryptophan 500 mg 60 veg capsules"),
    ("color-andina-cacau-selvagem-200g", "color andina cacau selvagem 200g"),
    ("color-andina-curcuma-longa-100g", "color andina curcuma longa 100g"),
    ("color-andina-red-maca-100g", "color andina red maca 100g"),
    ("color-andina-stevia-liquida-30ml", "color andina adocante stevia gotas 30ml"),
    ("color-andina-stevia-saches-50un", "color andina stevia saches"),
    ("color-andina-urucum-do-pilao-50g", "color andina urucum do pilao 50g"),
    ("panizza-tintura-artemisia-100ml", "tintura panizza artemisia 100ml"),
    ("panizza-tintura-babosa-100ml", "tintura panizza babosa 100ml"),
    ("panizza-tintura-calendula-100ml", "tintura panizza calendula 100ml"),
    ("panizza-tintura-canela-de-velho-100ml", "tintura panizza canela de velho 100ml"),
    ("panizza-tintura-cavalinha-100ml", "tintura panizza cavalinha 100ml"),
    ("panizza-tintura-confrei-100ml", "tintura panizza confrei 100ml"),
    ("panizza-tintura-ginkgo-biloba-100ml", "tintura panizza ginkgo biloba 100ml"),
    ("greenbios-cha-alecrim-30g", "cha greenbios alecrim 30g"),
    ("greenbios-cha-camomila-30g", "cha greenbios camomila 30g"),
    ("greenbios-cha-erva-baleeira-30g", "cha greenbios erva baleeira 30g"),
    ("greenbios-cha-espinheira-santa-20g", "cha greenbios espinheira santa 20g"),
    ("greenbios-cha-mulungu-30g", "cha greenbios mulungu 30g"),
    ("alere-biscoito-banana-canela-30g", "alere gourmet biscoito banana canela 30g"),
    ("alere-biscoito-castanha-quinoa-70g", "alere biscoito castanha quinoa 70g"),
    ("alere-biscoito-tomate-ora-pro-nobis-70g", "alere biscoito tomate ora-pro-nobis 70g"),
    ("feita-croc-apple-40g", "feita croc apple 40g maca crocante")
]

found = {}
for pid, q in test_queries:
    urls = search_bing(q)
    # filter for images from known good e-commerces or CDNs
    valid = []
    for u in urls:
        u_clean = u.split('?')[0]
        if any(ext in u_clean.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
            valid.append(u)
    if valid:
        found[pid] = valid[0]
        print(f"[FOUND] {pid} -> {valid[0][:90]}")
    else:
        print(f"[NOT FOUND] {pid}")

print(f"\nTotal Bing found: {len(found)} / {len(test_queries)}")
