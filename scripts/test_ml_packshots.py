import requests
import json

def get_ml_packshot(query):
    headers = {'User-Agent': 'Mozilla/5.0'}
    url = f"https://api.mercadolibre.com/sites/MLB/search?q={requests.utils.quote(query)}&limit=3"
    r = requests.get(url, headers=headers, timeout=10)
    print(f"ML search for '{query}': status {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        results = data.get('results', [])
        for res in results:
            print("  Title:", res.get('title'))
            thumb = res.get('thumbnail')
            # convert thumbnail to high-res (replace -I.jpg with -O.jpg or -F.jpg)
            hi_res = thumb.replace('-I.jpg', '-O.jpg').replace('-I.png', '-O.png') if thumb else None
            print("  Hi-Res Image:", hi_res)
            return hi_res
    return None

get_ml_packshot("panizza tintura espinheira santa 100ml")
get_ml_packshot("belive brownie double chocolate")
get_ml_packshot("a tal da castanha leite de amendoa 1l")
get_ml_packshot("now foods vitamin d3 2000 ui")
get_ml_packshot("forever aloe vera gel 1 litro")
get_ml_packshot("color andina stevia sachês")
