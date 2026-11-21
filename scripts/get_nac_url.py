import requests
import re

url = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFCQ0kSekmnEQP1SU2oKy26Yu1gMmc8YoccSLFyBEj7wXotSR3STP_W1FtW88dJY_J32jrBo-ixg4KPKC_X1mJxW2t7SHe8RIOtIB3KY51D8P7LalPJzc4L83LDaVvZ1Dfd5NxJ6SFIQlSjox-MspYQ4g2J"
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
print("Final URL:", r.url)
imgs = re.findall(r'(https://[^\s"\'<>]+\.jpg)', r.text)
for img in imgs:
    if 'now' in img.lower() or 'nac' in img.lower():
        print("  ->", img)
