import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
u = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFDlBacryX4Vtbpkya5glai6vZkexrooGyutujrM3bWrKAxcyiup5r3pRHNLXK9yVlxSKubcDeMFkbZe06teOjZOZUNzFjkpqIVAuuGYfC9Ey8kvSDD-mji93bzaatFF4_gJ2_CHXj1onUS_2ZmRSboMgMUVX_bkRSqI5SxGqM="
r = requests.get(u, headers=headers)
print("Final URL:", r.url)
imgs = re.findall(r'(https?://[^\s"\'<>]+\.(?:jpg|png|webp))', r.text)
for img in imgs:
    if 'urucum' in img.lower() or 'colorau' in img.lower():
        print("  URUCUM IMG:", img)
        break
