import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}

r8 = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFMsUejGDp7ewfCn7RZTY97NgXfvj_B63GTzcLuwzMw2qtYOpJlLdwOsBQhCZa3RlI8z9RNamPODmhp8s4SSoblRoUmocj2fhNh0li7wZhsQVRQz74hv48TogJxWPRb2HKYWnSkHBzUfC_W5avEgYEfZKyXD6ltfJ72uw=="
r10 = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEhpDkqy5la1c6rcfUc0UsG7IFGiid_ax9ApQJRwAXuN_gfWCnbBQs_qmfrnjuTHbvReM2QWTykkolxUU-YjNCxrAGu5gYHnsEDNWaWPl-HLmvdXmS0GFp5k7Q4AxUtiCp-mB_KrE599cHCKwv6mIDvkz9oJQ7VSZhnafJQrh1uJg=="

for u, name in [(r8, "Red Maca"), (r10, "Urucum")]:
    res = requests.get(u, headers=headers, timeout=8)
    print(name, "final URL:", res.url)
    imgs = re.findall(r'(https?://[^\s"\'<>]+\.(?:jpg|png|webp))', res.text)
    for img in imgs:
        if 'maca' in img.lower() or 'urucum' in img.lower() or 'colorau' in img.lower() or 'colorandina' in img.lower():
            print("  IMG:", img)
            break
