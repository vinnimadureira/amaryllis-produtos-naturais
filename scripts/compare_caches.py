import urllib.request
from PIL import Image
import io

u1 = "https://d3eomlzmsu8e9b.cloudfront.net/media/catalog/product/cache/6517c62f5899ad6aa0ba23ceb3eeff97/c/a/cacao_whey_lata_media_1308x1636px.jpg"
u2 = "https://d3eomlzmsu8e9b.cloudfront.net/media/catalog/product/cache/eab5220233fe066c9213546c1caa0012/c/a/cacao_whey_lata_media_1308x1636px.jpg"

req1 = urllib.request.Request(u1, headers={'User-Agent': 'Mozilla/5.0'})
req2 = urllib.request.Request(u2, headers={'User-Agent': 'Mozilla/5.0'})

with urllib.request.urlopen(req1) as r1:
    img1 = Image.open(io.BytesIO(r1.read()))
    print("img1 (6517c62f):", img1.size)

with urllib.request.urlopen(req2) as r2:
    img2 = Image.open(io.BytesIO(r2.read()))
    print("img2 (eab52202):", img2.size)
