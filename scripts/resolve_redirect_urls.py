import requests
import re
from PIL import Image
import io

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

# 1. Alere URLs from search
alere_links = [
    ("alere-biscoito-banana-canela-30g", "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEBsQf5P6YJqOtl3Q2zk3IwpkFMd_xBoM195-3TnUuwDBpFFlTQnt9LlTlZbQpe-t5OCgYTLAGriW1Y9SYdRn121gWfgLlB9uKp6VGlsxNc5ht4M7B6BNlwNvOPry6oMvrowqtBzzTJlKzi5lX24X57F2VbeXq2mzg="),
    ("alere-biscoito-castanha-quinoa-70g", "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG_lJa9SaXtpTsmDPYpz0-0ma6DcPurEhG2n5njVtzH3XNhHGRKikR_xQ6B2rhww8N8oXTVZ65WeZJbQHi-gkEyj5xbwEHDIFd5EYphjJ0dohwwZuvP-wVou-WPBllJA8ZZ-TerUO3CvFEZOTV8YyGi-cyKmedi3zdItahVG2Q8KS4="),
    ("alere-biscoito-tomate-ora-pro-nobis-70g", "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG_ctOPHCWbQvaeIGOrfoqp9RLLFY3WzmxzXYPZBxiVmk5r9YXCfxhr7xRkTz9awkSjW8LtXKcNZeCqswocUJLYQzzSrV5cp56Ktmo-tvmgQvLVNf3EvODZOTj98675gAJTtcWLCltNTLocFBfWwonGqMH6M0OmxWyUD7dQFg==")
]

print("=== RESOLVING ALERE GOURMET ===")
for pid, red in alere_links:
    try:
        r = requests.get(red, headers=headers, timeout=10, allow_redirects=True)
        print(f"[{pid}] final URL: {r.url} (status {r.status_code})")
        # Extract images
        imgs = re.findall(r'(https://aleregourmet\.com\.br/wp-content/uploads/[^\s"\'<>]+\.(?:jpg|png|webp))', r.text)
        if imgs:
            # find original (not resized like -300x300)
            orig = [img for img in imgs if not re.search(r'-\d+x\d+\.', img)]
            chosen = orig[0] if orig else imgs[0]
            print(f"   ALERE IMG: {chosen}")
    except Exception as e:
        print(f"[{pid}] err: {e}")

# 2. Casarão Penne
print("\n=== RESOLVING CASARAO PENNE ===")
casarao_link = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFwB0OYns-QUKeIa9raX_7t7c9boTMJfC1zM12Skp3hsYBM82_tAsSZn4Alosk0d3I4x_aGOScW5crj52BqS0NtsLZ0XkUyOqEtRwEJbPiyMrrL1Mp06V8tKRADYyC4R0R2mAinthAJagkQg0roNvTJiiAELEwsbD37kdAbq_wGrrKRXCIx9YLOE_PwhnKfDgCylGBGXKF1pBKZCAeDg_Q="
try:
    r = requests.get(casarao_link, headers=headers, timeout=10)
    print("Casarao final:", r.url)
    imgs = re.findall(r'(https://[^\s"\'<>]+\.(?:jpg|png|webp))', r.text)
    for img in imgs:
        if 'casarao' in img.lower() or 'penne' in img.lower():
            print("   CASARAO IMG:", img)
            break
except Exception as e:
    print("Casarao err:", e)

# 3. Crock Cereal Aveia
print("\n=== RESOLVING CROCK CEREAL ===")
crock_link = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFsQxTdHMvO9cT07C_MG2iT3ZM5C08wtvok3sBBQDxru_wwGx0DRDZ8-VFyTxaAlUJv4lAvAurCESwsxiR6i8qqtmcRMCE9J0MatKdoFjQu2OEaTZC-NLv73UlAXDMj1rWWK-6TaY_W_qCFemTRJXMhbBEw6EZUrsl7i4v3JkXtzP08E3o_3nduXJLKJwU="
try:
    r = requests.get(crock_link, headers=headers, timeout=10)
    print("Crock final:", r.url)
    imgs = re.findall(r'(https://[^\s"\'<>]+\.(?:jpg|png|webp))', r.text)
    for img in imgs:
        if 'crock' in img.lower() or 'aveia' in img.lower():
            print("   CROCK IMG:", img)
            break
except Exception as e:
    print("Crock err:", e)

# 4. Feita Croc
print("\n=== RESOLVING FEITA CROC ===")
feita_link = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEzCGF9Kyb6pek-aSX8zVCKcwg0nK9CZhqmYfzFgEJEgUu0SHq9hQnVvbwjgTOc86DBFr1vLwW760gN5bvho86rnQ01kM2h1ApBlGeyKrb3A7WdKAaxrXJoKeZFivNhqbG1gPu3QE4Or36Db6M7eJrAAKBct3js_zVzyHlelZOX-We6BZYB5KkQen5nHhRu526qILwU="
try:
    r = requests.get(feita_link, headers=headers, timeout=10)
    print("Feita final:", r.url)
    imgs = re.findall(r'(https://[^\s"\'<>]+\.(?:jpg|png|webp))', r.text)
    for img in imgs:
        if 'croc' in img.lower() or 'apple' in img.lower() or 'maca' in img.lower():
            print("   FEITA IMG:", img)
            break
except Exception as e:
    print("Feita err:", e)
