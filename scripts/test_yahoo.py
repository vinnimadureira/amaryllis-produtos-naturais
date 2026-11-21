import requests
import re
import urllib.parse
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

query = "now foods chlorella 500mg 200 tabs packshot"
url = f"https://images.search.yahoo.com/search/images?p={urllib.parse.quote(query)}"
r = requests.get(url, headers=headers, timeout=8)
print("Yahoo images status:", r.status_code, "len:", len(r.text))

# In Yahoo images, image metadata is stored in HTML attributes: data-src or {"imgurl": ...}
# e.g., "imgurl":"https:\/\/..."
matches = re.findall(r'"imgurl":"(https?:\\/\\/[^"]+)"', r.text)
if not matches:
    matches = re.findall(r'imgurl=(https?%3A%2F%2F[^&]+)&', r.text)
    if matches:
        matches = [urllib.parse.unquote(m) for m in matches]

print("Found Yahoo image URLs:", len(matches))
for m in set(matches[:5]):
    clean = m.replace('\\/', '/')
    print("  ", clean)
