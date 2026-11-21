import requests
import re
import xml.etree.ElementTree as ET

r = requests.get('https://belivebefree.com.br/product-sitemap.xml', headers={'User-Agent': 'Mozilla/5.0'})

# Parse XML to get each <url> block with its <loc> and <image:loc>
urls_raw = re.findall(r'<url>(.*?)</url>', r.text, re.DOTALL)
print(f"Total URL blocks: {len(urls_raw)}")

belive_mapping = {
    'belive-cookies-baunilha-chocolate-67g': ['cookie', 'baunilha'],
    'belive-mandioca-chips-sal-rosa-50g': ['mandioca'],
    'belive-pao-de-mel-zero-45g': ['pao-de-mel', 'proteico'],
    'belive-paozinho-batata-198g': ['pao', 'batata'],
    'belive-protein-brownie-double-chocolate': ['brownie', 'double', 'chocolate']
}

results = {}

for u in urls_raw:
    loc_m = re.search(r'<loc>(https?://[^<]+)</loc>', u)
    img_m = re.findall(r'<image:loc>(https?://[^<]+)</image:loc>', u)
    if loc_m and img_m:
        loc = loc_m.group(1).lower()
        for pid, kws in belive_mapping.items():
            if all(k in loc for k in kws):
                results[pid] = img_m[0]
                print(f"[BELIVE MATCH] {pid} -> {img_m[0]}")

print("\nMissing Belive:", set(belive_mapping.keys()) - set(results.keys()))
