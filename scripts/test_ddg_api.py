import requests
import re
import urllib.parse

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

def search_ddg_images(query):
    # Using Duckduckgo image token
    url = f"https://duckduckgo.com/?q={urllib.parse.quote(query)}&t=h_&iar=images&iax=images&ia=images"
    r = requests.get(url, headers=headers)
    vqd = re.search(r'vqd=([\d\-]+)', r.text)
    if not vqd:
        vqd = re.search(r'vqd="([^"]+)"', r.text)
    if not vqd:
        return []
    vqd_token = vqd.group(1)
    
    img_url = f"https://duckduckgo.com/i.js?l=wt-wt&o=json&q={urllib.parse.quote(query)}&vqd={vqd_token}&f=,,,&p=1"
    res = requests.get(img_url, headers=headers)
    try:
        data = res.json()
        results = []
        for it in data.get('results', []):
            results.append(it.get('image'))
        return results
    except Exception as e:
        return []

queries = [
    "tintura panizza artemisia 100ml",
    "tintura panizza calêndula 100ml",
    "tintura panizza ginkgo biloba 100ml",
    "color andina cacau selvagem 200g",
    "color andina stevia sachês",
    "now foods chlorella 500mg 200 tablets",
    "alere biscoito banana canela 30g",
    "cha greenbios alecrim 30g",
    "massa casarao penne espinafre berinjela 300g"
]

for q in queries:
    imgs = search_ddg_images(q)
    print(f"=== {q} ===")
    for img in imgs[:3]:
        print("  *", img)
