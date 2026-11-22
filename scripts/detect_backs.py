import json

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inv = json.load(f)

# Detect back/nutritional table photos:
nutritional_keywords = [
    'tabela nutricional', 'informação nutricional', 'informacao nutricional',
    'porção', 'porcao', 'valor energético', 'carboidratos', 'proteínas',
    'gorduras totais', 'fibra alimentar', 'sódio', 'ingredientes:', 'registro ms',
    'modo de conservação', 'lote:', 'validade:', 'fabricado por', 'indústria brasileira'
]

back_photos = []
front_photos = []

for idx, item in enumerate(inv):
    text = item.get('combined_text', '').lower()
    score = sum(1 for kw in nutritional_keywords if kw in text)
    if score >= 2 or 'informação nutricional' in text or 'tabela nutricional' in text:
        back_photos.append((idx, item['file'], score))
    else:
        front_photos.append((idx, item['file'], score))

print(f"Total photos in zip: {len(inv)}")
print(f"Photos identified as Back / Nutritional Table / Specification: {len(back_photos)}")
print(f"Photos identified as Front / Product Face: {len(front_photos)}")
