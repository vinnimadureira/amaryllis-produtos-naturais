import urllib.request
import re

url = 'https://www.essentialnutrition.com.br/media/sitemap.xml'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    txt = r.read().decode('utf-8', errors='ignore')

urls = re.findall(r'<loc>(https://[^<]+)</loc>', txt)
prod_urls = [u for u in urls if 'cacao-whey' in u or 'beefprotein' in u or 'crealift' in u or 'collagen-skin' in u]
print('Found prod URLs:', prod_urls)

if prod_urls:
    p_req = urllib.request.Request(prod_urls[0], headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(p_req, timeout=10) as pr:
        p_html = pr.read().decode('utf-8', errors='ignore')
        # Find product gallery images or og:image
        og_img = re.findall(r'<meta property="og:image" content="([^"]+)"', p_html)
        print('og:image:', og_img)
        imgs = re.findall(r'https://[^\s"\'<>]+\.(?:png|jpg|jpeg|webp)', p_html)
        cat_imgs = [img for img in imgs if 'catalog/product' in img or 'media' in img]
        print('Sample images:', set(cat_imgs[:10]))
