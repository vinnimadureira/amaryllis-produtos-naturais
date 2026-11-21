import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request("https://www.nowfoods.com.br/", headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
        print("NOW Foods BR with SSL bypass: SUCCESS", len(r.read()))
except Exception as e:
    print("Failed:", e)
