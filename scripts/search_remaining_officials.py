import requests
import re
import urllib.parse
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# 1. Test NOW Foods on nowfoods.com / iherb CDN
# NOW Foods products:
# chlorella 500mg 200 tabs (code 2627)
# l-tryptophan 500mg 60 caps (code 0166 / 0167)
# liquid melatonin 59ml (code 3261)
# nac 600mg 100 caps (code 0857)
# vitamin d3 k2 120 caps (code 0373)
now_queries = [
    ("now-chlorella-500mg-200tabs", "now foods chlorella 500mg 200 tablets 2627"),
    ("now-l-tryptophan-500mg-60caps", "now foods l-tryptophan 500mg 60 veg capsules 0166"),
    ("now-liquid-melatonin-59ml", "now foods liquid melatonin 59ml 3261"),
    ("now-nac-600mg-100caps", "now foods nac 600mg 100 veg capsules 0857"),
    ("now-vitamin-d3-k2-120caps", "now foods vitamin d-3 k-2 120 veg capsules 0373")
]

# 2. Test Forever Living
# Aloe vera gel 1L (sku 715)
# Aloe berry nectar 1L (sku 734)
# Aloe peaches 1L (sku 777)
forever_queries = [
    ("forever-aloe-vera-gel-1l", "forever living aloe vera gel 1 litro 715"),
    ("forever-aloe-berry-nectar-1l", "forever living aloe berry nectar 1 litro 734"),
    ("forever-aloe-peaches-1l", "forever living aloe peaches 1 litro 777")
]

# 3. Test Color Andina
# colorandinafoods.com.br
color_queries = [
    ("color-andina-cacau-selvagem-200g", "cacau selvagem 200g"),
    ("color-andina-curcuma-longa-100g", "curcuma longa 100g"),
    ("color-andina-red-maca-100g", "red maca 100g"),
    ("color-andina-stevia-liquida-30ml", "stevia liquida 30ml"),
    ("color-andina-stevia-saches-50un", "stevia saches"),
    ("color-andina-urucum-do-pilao-50g", "urucum pilao colorau 50g")
]

print("Script template ready.")
