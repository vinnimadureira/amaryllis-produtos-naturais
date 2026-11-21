import requests
import re
import urllib.parse
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}
query = 'panizza tintura vegetal espinheira santa 100ml'
url = f"https://www.google.com/search?q={urllib.parse.quote(query)}&tbm=isch&asearch=ichnk&async=_fmt:jspb"
r = requests.get(url, headers=headers)
print("Google response status:", r.status_code, "Length:", len(r.text))

# Find original image URLs in Google search
# Google images JSON contains [\"https://...\", width, height]
urls = re.findall(r'\[\"(https://[^\"]+)\",\s*\d+,\s*\d+\]', r.text)
print("Direct image URLs found:", len(urls))
for u in urls[:5]:
    # unescape unicode
    clean_u = u.encode().decode('unicode-escape')
    if not any(x in clean_u for x in ['gstatic.com', 'google.com']):
        print("  Found:", clean_u)
