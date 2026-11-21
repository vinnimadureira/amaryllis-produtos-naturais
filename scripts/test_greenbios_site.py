import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}

for domain in ['https://wordgreen.com.br/', 'https://grbios.com.br/']:
    try:
        r = requests.get(domain, headers=headers, timeout=6)
        print(domain, "status:", r.status_code)
        imgs = re.findall(r'(https?://[^\s"\'<>]+\.(?:jpg|png|webp))', r.text)
        print("  Images count:", len(imgs))
        for img in set(imgs[:10]):
            print("   ", img)
    except Exception as e:
        print(domain, "err:", e)
