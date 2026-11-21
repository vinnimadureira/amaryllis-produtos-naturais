import requests
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

r = requests.get('https://www.panizza.com.br', headers=headers)
print("Panizza home len:", len(r.text))

# Search for all wix image URLs
wix_imgs = re.findall(r'https?://static\.wixstatic\.com/media/([a-zA-Z0-9_~]+(?:\.(?:png|jpg|jpeg|webp))?)', r.text)
print("Wix images found in home:", len(wix_imgs))
for img in set(wix_imgs[:15]):
    print("  https://static.wixstatic.com/media/" + img)

# Also check Wix thunderbolt/pages JSON
page_jsons = re.findall(r'https?://[^"\']+\.json', r.text)
for pj in page_jsons:
    print("Page JSON:", pj)
    try:
        pr = requests.get(pj, headers=headers)
        imgs = re.findall(r'wixstatic\.com/media/([a-zA-Z0-9_~]+(?:\.(?:png|jpg|jpeg|webp))?)', pr.text)
        print(f"  Images in {pj[:60]}...: {len(imgs)}")
        for img in set(imgs[:10]):
            print("   ", img)
    except Exception as e:
        print("  Error fetching page json:", e)
