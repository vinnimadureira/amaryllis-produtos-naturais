import urllib.request
import json
import urllib.parse

samples = ["amendoa", "original", "mixed nuts", "caju para"]

for name in samples:
    url = f"https://www.ataldacastanha.com.br/api/catalog_system/pub/products/search?ft={urllib.parse.quote(name)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode('utf-8'))
            if data:
                print(f"A Tal da Castanha '{name}': {data[0]['productName']}")
                imgs = data[0]['items'][0]['images']
                if imgs:
                    print(f"  Image: {imgs[0]['imageUrl']}")
    except Exception as e:
        print(f"Error on {name}: {e}")
