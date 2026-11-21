import requests
import json
import re
import urllib.parse
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

def search_bing_image(query):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&qft=+filterui:aspect-square+filterui:photo-photo&form=HDRSC2&first=1"
    try:
        r = requests.get(url, headers=headers, timeout=10)
        murls = re.findall(r'murl&quot;:&quot;(https?://[^&]+)&quot;', r.text)
        if not murls:
            murls = re.findall(r'\"murl\":\"(https?://[^\"]+)\"', r.text)
        cleaned = []
        for u in murls:
            low = u.lower()
            if any(x in low for x in ['shutterstock', 'freepik', 'vector', 'alamy', 'dreamstime', 'depositphotos', '123rf']):
                continue
            cleaned.append(u)
        return cleaned[:5]
    except Exception as e:
        print(f"Error {query}: {e}")
        return []

def main():
    with open('scripts/new_products_specs.json', 'r', encoding='utf-8') as f:
        specs = json.load(f)

    web_prods = [p for p in specs if 'photo_idx' not in p]
    print(f"Searching web packshots for {len(web_prods)} products...")

    results = {}
    for p in web_prods:
        pid = p['id']
        query = p.get('query', p['name'])
        # Try specific search
        search_terms = f"{query} packshot"
        urls = search_bing_image(search_terms)
        if not urls:
            urls = search_bing_image(f"{query} produto fundo branco")
        if urls:
            results[pid] = urls[0]
            print(f"[FOUND] {pid} -> {urls[0]}")
        else:
            print(f"[NOT FOUND] {pid}")
        time.sleep(0.5)

    with open('scripts/web_packshots_urls.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nDone! Found {len(results)} of {len(web_prods)} web packshots.")

if __name__ == '__main__':
    main()
