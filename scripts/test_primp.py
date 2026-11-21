import primp

client = primp.Client(impersonate="chrome_131")

urls = [
    ("Mercado Livre", "https://api.mercadolibre.com/sites/MLB/search?q=panizza+tintura+espinheira+santa+100ml"),
    ("Drogasil", "https://www.drogasil.com.br/search?w=tintura+panizza"),
    ("iHerb", "https://www.iherb.com/pr/now-foods-vitamin-d3-k2-120-capsules/10056"),
    ("NOW Foods US", "https://www.nowfoods.com/products/supplements/vitamin-d-3-k-2-veg-capsules"),
    ("Belive", "https://belive.com.br/"),
    ("Color Andina", "https://colorandinafoods.com.br/sitemap.xml"),
    ("A Tal da Castanha", "https://www.ataldacastanha.com.br/products.json?limit=5")
]

for name, u in urls:
    try:
        r = client.get(u)
        print(f"{name}: status {r.status_code}, len {len(r.text)}")
    except Exception as e:
        print(f"{name}: error {e}")
