import requests

headers = {'User-Agent': 'Mozilla/5.0'}

vtex_supermarkets = [
    ("Mambo", "https://www.mambo.com.br"),
    ("StMarche", "https://www.marche.com.br"),
    ("Hirota", "https://www.hirota.com.br"),
    ("Giga", "https://www.giga.com.br"),
    ("NaturaldaTerra", "https://www.naturaldaterra.com.br")
]

targets = [
    "banana canela alere",
    "feita croc",
    "cacau selvagem",
    "curcuma color andina",
    "maca color andina",
    "urucum color andina",
    "stevia saches color andina"
]

for sname, base in vtex_supermarkets:
    print(f"\n--- Checking {sname} ---")
    for t in targets:
        try:
            url = f"{base}/api/catalog_system/pub/products/search?ft={requests.utils.quote(t)}"
            r = requests.get(url, headers=headers, timeout=4)
            if r.status_code == 200:
                data = r.json()
                if data:
                    print(f"[{sname}] '{t}' -> {data[0].get('productName')} | {data[0]['items'][0]['images'][0]['imageUrl']}")
        except Exception as e:
            pass
