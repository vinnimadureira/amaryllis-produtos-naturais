import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

# 1. nowfoodsbrasil
r = requests.get('https://nowfoodsbrasil.com.br/', headers=headers)
forms = re.findall(r'<form[^>]+action=["\']([^"\']+)["\']', r.text)
print('Now Foods Forms:', forms)
prods = re.findall(r'href=["\'](/[^"\']+)["\']', r.text)
now_sample = [p for p in prods if any(k in p for k in ['chlorella', 'nac', 'melatonin', 'tryptophan', 'd3', 'k2', 'produto'])]
print('Now sample links:', now_sample[:8])

# 2. Check casarao
r2 = requests.get('https://casarao.ind.br/', headers=headers)
print('Casarao status:', r2.status_code)
casarao_links = [p for p in re.findall(r'href=["\']([^"\']+)["\']', r2.text) if 'penne' in p or 'espinafre' in p or 'massa' in p]
print('Casarao links:', casarao_links[:5])

# 3. Check feita croc
try:
    r3 = requests.get('https://feitacroc.com.br/', headers=headers, timeout=5)
    print('Feita Croc status:', r3.status_code)
    feita_imgs = re.findall(r'src=["\']([^"\']+\.(?:png|jpg|webp))["\']', r3.text)
    print('Feita Croc imgs:', feita_imgs[:5])
except Exception as e:
    print('Feita Croc err:', e)
