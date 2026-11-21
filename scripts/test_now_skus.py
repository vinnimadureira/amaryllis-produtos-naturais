import requests
import re

skus = ['0373', '0858', '2633', '0166', '3262']
# Test NOW Foods image patterns
# e.g., https://www.nowfoods.com/sites/default/files/styles/product_primary_full/public/0373.jpg
# or https://images.nowfoods.com/
# or https://www.nowfoods.com/products/supplements/vitamin-d-3-k-2-veg-capsules
headers = {'User-Agent': 'Mozilla/5.0'}

base_urls = [
    'https://www.nowfoods.com/sites/default/files/products/packshot/',
    'https://www.nowfoods.com/sites/default/files/',
    'https://images.nowfoods.com/products/',
]

for sku in skus:
    url = f"https://www.nowfoods.com/products/supplements"
    # let's test if search works or search_web gives the exact nowfoods.com URL
    pass

print("SKU mapping ready")
