import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}

r1 = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFSu4VrI7fHqGBu4Jo6rNiE_0vGYpjcjX4a1BDCa_iABxjMh_Hf0PEiy9Xg8-QpV-UGM9zTWyiwr0WZJv-vhcfzk4purMm76Ys4M_v3t10fP06eFStccym4EtY_5d_XbyKGw2F3215HKfDXGk7v0kNvO6LEskbm57Hkq39FX8xH3_8="
r3 = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEvnl0Id_xfNgsHrCUdHoc4PpsjPHq3gF8o04vGbojoxOaBLAvirtyeu3MM5wEH-1dBey4PDT-Z8936YHmoftRwlYCOSkXo8_rFkD7T-T4TgzQEWpv0yHBET54vc8EvYK0cFUsz3G4Id09RmWtscqi_y_Hx9krtVn_PDd53IVJyh-Qzq8k0GN8="

for u, name in [(r1, "Red Maca UniNatural"), (r3, "Red Maca PontoAtleta")]:
    try:
        res = requests.get(u, headers=headers, timeout=8)
        print(name, "final:", res.url)
        imgs = re.findall(r'(https?://[^\s"\'<>]+\.(?:jpg|png|webp))', res.text)
        for img in imgs:
            if 'maca' in img.lower() or 'red' in img.lower():
                print("  IMG:", img)
                break
    except Exception as e:
        print(name, "err:", e)
