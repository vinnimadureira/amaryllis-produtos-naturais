import json
import os

with open('scripts/wave2_mapped_catalog.json', encoding='utf-8') as f:
    cat = json.load(f)

exists = [p['id'] for p in cat if os.path.exists(os.path.join('public', 'products', p['id'] + '.webp'))]
print(f"Done {len(exists)} / {len(cat)} packshots")
