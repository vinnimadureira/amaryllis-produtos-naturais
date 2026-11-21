import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
u = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEUpTMbeF5P1I38cDZcVPYV_KVAJ-ImR8k629ec9rAr3n1A_51buILwLnyHjl-z8mcvssmhTgLMncxsZkH-cbEHjYNC9ybry2TNkijcTo0nay_VLPZkjfE2njuLsK6Jfd0irpbxSzeI-eu1E3htQGJOQl8v29caZXg6BlHyhFH3Fqq5lHE62MNOS43bExneB8odQKC-EiSYJDoDQw=="
r = requests.get(u, headers=headers)
print("ML final:", r.url)
imgs = re.findall(r'(https?://http2\.mlstatic\.com/D_NQ_NP_[^\s"\'<>]+\.(?:jpg|webp))', r.text)
for img in set(imgs):
    hires = img.replace('-V.', '-O.').replace('-I.', '-O.')
    print("  ML URUCUM IMG:", hires)
