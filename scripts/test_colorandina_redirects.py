import requests
import re

redirects = [
    'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEBSHdty4ejX5fYJZXWwxHlC5ZlTtaO1OULaJ5LcE41vcD8Cv01nWXe5qRv1IpR7k6yYyZ6S0Y0AcQA9-HhQGUEomrOLkBiCV6QYvvIQVCInRcsZhCBw_cRBIA=',
    'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEAUTahmSN3ENWwlqwntYh5XNEZ2LlXoqPP6Hi1j9_N_rU9PIark106wgdGMHSCojf95h4s1pGAGBuSbNT-DTs3Xy8QkWcdAUS0X6yKSGWdtuxxYEIdP9BQ0Nd15_ODADLvmeMH',
    'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG0mPO1kCv6bw0DsANltpiaVD7941DhRp7EesvZHmbUSNkiTT2tedBJp9DrtuA67kGWpcM4OFYUAqjaPWjXiNUoioXumk6DxATp_ORzLG1vzFpEGuE5c5xy0dIKUejh9BDYpc93-uZ95tAn5uk='
]

for r_url in redirects:
    try:
        r = requests.get(r_url, allow_redirects=False, timeout=5)
        print("Redirect:", r.headers.get('Location'))
    except Exception as e:
        print("Error:", e)
