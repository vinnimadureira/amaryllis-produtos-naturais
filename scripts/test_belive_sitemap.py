import requests
import re

r = requests.get('https://belivebefree.com.br/product-sitemap.xml', headers={'User-Agent': 'Mozilla/5.0'})
print("Belive product sitemap len:", len(r.text))

# find all locs and images
locs = re.findall(r'<loc>(https?://[^<]+)</loc>', r.text)
imgs = re.findall(r'<image:loc>(https?://[^<]+)</image:loc>', r.text)
print(f"Products in sitemap: {len(locs)}, Images in sitemap: {len(imgs)}")

# Let's search for our 5 Belive products:
# 1. belive-cookies-baunilha-chocolate-67g
# 2. belive-mandioca-chips-sal-rosa-50g
# 3. belive-pao-de-mel-zero-45g
# 4. belive-paozinho-batata-198g
# 5. belive-protein-brownie-double-chocolate

targets = ['cookie', 'mandioca', 'pao-de-mel', 'batata', 'brownie']
for t in targets:
    for l in locs:
        if t in l.lower():
            print(f"Target '{t}': {l}")
            break
