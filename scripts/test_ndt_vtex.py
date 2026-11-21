import requests
import urllib.parse

headers = {'User-Agent': 'Mozilla/5.0'}

queries = [
    ('a-tal-da-castanha-original-1l', 'castanha original'),
    ('a-tal-da-castanha-mixed-nuts-1l', 'mixed nuts'),
    ('notco-notmilk-original-1l', 'notmilk'),
    ('copra-leite-de-coco-beber-900ml', 'copra beber'),
    ('nazinha-sequilhos-coco-300g', 'sequilho nazinha'),
    ('nazinha-sequilhos-maracuja-zero-120g', 'nazinha maracuja'),
    ('casarao-lasanha-caseira-tradicional-300g', 'casarao lasanha'),
    ('casarao-penne-espinafre-berinjela-300g', 'casarao penne'),
    ('ceres-talharim-grao-de-bico-200g', 'ceres talharim'),
    ('crock-cereal-aveia-sem-gluten-flocos-finos-200g', 'crock aveia'),
    ('feita-croc-apple-40g', 'croc apple')
]

found = {}
for pid, q in queries:
    url = f"https://www.naturaldaterra.com.br/api/catalog_system/pub/products/search?ft={urllib.parse.quote(q)}&_from=0&_to=5"
    try:
        r = requests.get(url, headers=headers, timeout=6)
        if r.status_code in (200, 206):
            data = r.json()
            if data:
                p = data[0]
                img = p['items'][0]['images'][0]['imageUrl']
                found[pid] = img
                print(f"[FOUND] {pid} ({q}) -> {p['productName']}: {img}")
            else:
                print(f"[EMPTY] {pid} ({q})")
        else:
            print(f"[FAIL {r.status_code}] {pid} ({q})")
    except Exception as e:
        print(f"[ERROR] {pid}: {e}")

print(f"\nTotal found in Natural da Terra VTEX: {len(found)}")
