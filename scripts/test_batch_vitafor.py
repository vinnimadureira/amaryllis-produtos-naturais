import urllib.request
import json
import urllib.parse

vita_samples = ["isofort", "glutamax", "omegafor plus", "coenzima q10 200mg", "omegafor vegan"]

for name in vita_samples:
    url = f"https://www.vitafor.com.br/api/catalog_system/pub/products/search?ft={urllib.parse.quote(name)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode('utf-8'))
            if data:
                print(f"Vitafor '{name}': {data[0]['productName']}")
                imgs = data[0]['items'][0]['images']
                if imgs:
                    print(f"  Image: {imgs[0]['imageUrl']}")
    except Exception as e:
        print(f"Error on {name}: {e}")
