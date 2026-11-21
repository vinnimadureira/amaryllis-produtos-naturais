import requests

fl_urls = [
    "https://foreverliving.com/img/products/015_01.jpg",
    "https://foreverliving.com/img/products/034_01.jpg",
    "https://foreverliving.com/img/products/077_01.jpg",
    "https://cdn.foreverliving.com/content/products/images/015_01.png",
    "https://cdn.foreverliving.com/content/products/images/034_01.png",
    "https://cdn.foreverliving.com/content/products/images/077_01.png",
    "https://foreverliving.com.br/wp-content/uploads/aloe-vera-gel.png"
]

for u in fl_urls:
    try:
        r = requests.head(u, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
        print(u, r.status_code)
    except Exception as e:
        print(u, e)
