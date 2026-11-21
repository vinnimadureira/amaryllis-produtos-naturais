import requests

redirects = [
    ('stevia_liquida', 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEGn8T80vwTrhacaT6k1tVUBrCDgd29z5M2skq97xnsDpKz5w8uAOvfKY9UxTFyeP2RuOmrFcuY4kn8oJ0m1RWHp2tF9FiHkszOtVX0xPZw5frieu-Vv0cLDZSlJQFxdK6HzfSjOIKe3f5oAH6eQNkEahh8vtWjua8='),
    ('cacau_selvagem', 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQF_WcCnKmA2k4X5VJA82_QO7DHwGhHnZAgNvO6XTobaeMAzp74M_mP2XAInZMIn2Eq1fMGuC1csMIE-dIvgd9H1OvZfigzcCkMD0rW_j0HjnboxQYr5i-mGqmvhxceSesv6y_P4CghZByBvcXP7u5ecMLtpuebRiA=='),
    ('curcuma_longa', 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGU8CL2Lcd_E8Mgj0cGc9sJHbbFi8YV52YkdjLTDrQQBIGSY8Ju0DCatGDchPJypmPA1EYjQTApa7oPTSRjdr2KYnEFfzjRf27GImbXUOp4vzzAHasWmsAcSeMKevZqMHtpgB8q_j0fZP3UI6Lrd6GC')
]

for name, u in redirects:
    r = requests.get(u, allow_redirects=False)
    print(name, "->", r.headers.get('Location'))
