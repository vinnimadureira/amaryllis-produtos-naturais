import requests
import re
import urllib.parse
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
query = 'panizza tintura espinheira santa'
url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}"
r = requests.get(url, headers=headers)
m_data = re.findall(r'm="(\{[^"]+\})"', r.text)

for m in m_data[:5]:
    try:
        clean_m = m.replace('&quot;', '"').replace('&#39;', "'")
        d = json.loads(clean_m)
        print("Title:", d.get('t'), "URL:", d.get('murl'))
    except Exception as e:
        print("Error:", e)
