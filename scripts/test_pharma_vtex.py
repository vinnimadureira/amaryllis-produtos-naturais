import requests

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

# Test Mundo Verde VTEX
try:
    r = requests.get('https://www.mundoverde.com.br/api/catalog_system/pub/products/search?ft=panizza', headers=headers, timeout=8)
    print("Mundo Verde:", r.status_code, "Length:", len(r.text))
    if r.status_code == 200:
        data = r.json()
        print("  Found in Mundo Verde:", len(data))
        if data:
            print("  First:", data[0]['productName'], data[0]['items'][0]['images'][0]['imageUrl'])
except Exception as e:
    print("Mundo Verde failed:", e)

# Test Zona Cerealista
try:
    r = requests.get('https://www.zonacerealista.com.br/api/catalog_system/pub/products/search?ft=panizza', headers=headers, timeout=8)
    print("Zona Cerealista:", r.status_code, "Length:", len(r.text))
    if r.status_code == 200:
        data = r.json()
        print("  Found in Zona Cerealista:", len(data))
        if data:
            print("  First:", data[0]['productName'], data[0]['items'][0]['images'][0]['imageUrl'])
except Exception as e:
    print("Zona Cerealista failed:", e)
