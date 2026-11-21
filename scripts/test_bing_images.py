import requests
import re
import urllib.parse
import json

def search_bing_image(query):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&qft=+filterui:photo-photo&form=HDRSC2&first=1"
    r = requests.get(url, headers=headers, timeout=10)
    print(f"Bing search for '{query}' returned status: {r.status_code}, len: {len(r.text)}")
    
    # Bing images has json data in m="{...}" attributes
    m_data = re.findall(r'm="(\{[^"]+\})"', r.text)
    print(f"Found {len(m_data)} image results")
    urls = []
    for m in m_data:
        try:
            # unescape html entities if needed
            clean_m = m.replace('&quot;', '"').replace('&#39;', "'")
            d = json.loads(clean_m)
            if 'murl' in d:
                urls.append(d['murl'])
        except Exception:
            pass
    return urls

urls = search_bing_image("Panizza tintura espinheira santa 100ml fundo branco")
print("Top 3 Bing images:")
for u in urls[:3]:
    print(" ", u)
