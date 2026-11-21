import urllib.request
import json
import re

def test_url(name, url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = r.read()
            print(f"{name}: SUCCESS ({len(data)} bytes)")
            return data
    except Exception as e:
        print(f"{name}: FAILED ({e})")
        return None

test_url("NOW Foods BR", "https://www.nowfoods.com.br/")
test_url("Panizza", "https://panizza.com.br/")
test_url("Belive", "https://www.belivebefree.com.br/")
test_url("Color Andina", "https://colorandinafoods.com.br/")
test_url("Souly", "https://souly.com.br/")
test_url("Konjac", "https://www.konjacmassamf.com/")
