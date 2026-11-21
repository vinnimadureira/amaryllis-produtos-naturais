import requests
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
}
r = requests.get("https://www.google.com/search?q=now+foods+chlorella&udm=2", headers=headers)
print("Title in HTML:")
import re
print(re.findall(r'<title>([^<]+)</title>', r.text))
print("First 500 chars of body:")
print(r.text[r.text.find('<body'):r.text.find('<body')+500])
