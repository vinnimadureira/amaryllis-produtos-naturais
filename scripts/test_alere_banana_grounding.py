import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}

r2 = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEUiD7pnx_tVtWwKjbu2qV9RiG_ethzQOWoYpdhrfBqQTL8vAV16UEMYUH_18g6nJkVIXAy2-lKLjw9B55xxrLjpO7pQBNqHH7wpmu65M_g2LB6O74JZUTqrDI8rcoiEaU6PST1ElTh1SWSystG9bx2uqRz3YI="
r3 = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGGYZdhYNmO58ePbwWI3RSXdyvBXi93Ns_VwVlFEQ1rmRQhz1VeIiINz5Iu-E7RoPih6HbDvtqR_nOjlrF26mxzzl3nAOWQkoqHNst99WR8b_nSL-YTOixgDNxr3ltWGZGxjcuNpYq0GmndDZqsHoizrNEXt4_LMMRrTARxlUHh-M54wPVO7QqWwE2ZX1L3"

for u in [r2, r3]:
    try:
        res = requests.get(u, headers=headers, timeout=8)
        print("Final URL:", res.url)
        imgs = re.findall(r'(https?://[^\s"\'<>]+\.(?:jpg|png|webp))', res.text)
        for img in imgs:
            if 'alere' in img.lower() or 'banana' in img.lower():
                print("  ALERE BANANA IMG:", img)
                break
    except Exception as e:
        print("Err:", e)
