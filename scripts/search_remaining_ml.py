import requests
import json
import time

remaining_targets = [
    # Panizza (7 itens)
    ('panizza-tintura-artemisia-100ml', 'Tintura Vegetal Artemisia Panizza 100ml'),
    ('panizza-tintura-babosa-100ml', 'Tintura Vegetal Babosa Aloe Vera Panizza 100ml'),
    ('panizza-tintura-calendula-100ml', 'Tintura Vegetal Calendula Panizza 100ml'),
    ('panizza-tintura-canela-de-velho-100ml', 'Tintura Canela de Velho Panizza 100ml'),
    ('panizza-tintura-cavalinha-100ml', 'Tintura Vegetal Cavalinha Panizza 100ml'),
    ('panizza-tintura-confrei-100ml', 'Tintura Vegetal Confrei Panizza 100ml'),
    ('panizza-tintura-ginkgo-biloba-100ml', 'Tintura Ginkgo Biloba Panizza 100ml'),

    # Color Andina (6 itens)
    ('color-andina-cacau-selvagem-200g', 'Cacau Selvagem Color Andina 200g'),
    ('color-andina-curcuma-longa-100g', 'Curcuma Longa Color Andina 100g'),
    ('color-andina-red-maca-100g', 'Red Maca Color Andina 100g'),
    ('color-andina-stevia-liquida-30ml', 'Adocante Stevia Liquida Color Andina 30ml'),
    ('color-andina-stevia-saches-50un', 'Stevia Saches Color Andina 50'),
    ('color-andina-urucum-do-pilao-50g', 'Urucum do Pilao Color Andina 50g'),

    # NOW Foods (5 itens)
    ('now-chlorella-500mg-200tabs', 'NOW Foods Chlorella 500mg 200 tabs'),
    ('now-l-tryptophan-500mg-60caps', 'NOW Foods L-Tryptophan 500mg 60 caps'),
    ('now-liquid-melatonin-59ml', 'NOW Foods Liquid Melatonin 59ml'),
    ('now-nac-600mg-100caps', 'NOW Foods NAC 600mg 100 veg caps'),
    ('now-vitamin-d3-k2-120caps', 'NOW Foods Vitamin D-3 K-2 120 veg caps'),

    # Forever Living (3 itens - we already have direct foreverliving.com URLs!)
    ('forever-aloe-vera-gel-1l', 'https://foreverliving.com/img/products/715.png'),
    ('forever-aloe-berry-nectar-1l', 'https://foreverliving.com/img/products/734.png'),
    ('forever-aloe-peaches-1l', 'https://foreverliving.com/img/products/777.png'),

    # Greenbios (5 itens)
    ('greenbios-cha-alecrim-30g', 'Cha Alecrim Greenbios 30g'),
    ('greenbios-cha-camomila-30g', 'Cha Camomila Greenbios 30g'),
    ('greenbios-cha-erva-baleeira-30g', 'Cha Erva Baleeira Greenbios 30g'),
    ('greenbios-cha-espinheira-santa-20g', 'Cha Espinheira Santa Greenbios 20g'),
    ('greenbios-cha-mulungu-30g', 'Cha Mulungu Greenbios 30g'),

    # Alere Gourmet (3 itens)
    ('alere-biscoito-banana-canela-30g', 'Biscoito Alere Banana Canela 30g'),
    ('alere-biscoito-castanha-quinoa-70g', 'Biscoito Alere Castanha Quinoa 70g'),
    ('alere-biscoito-tomate-ora-pro-nobis-70g', 'Biscoito Alere Tomate Ora-pro-nobis 70g'),

    # Unitários (3 itens)
    ('casarao-penne-espinafre-berinjela-300g', 'Massa Penne Espinafre Berinjela Casarao 300g'),
    ('crock-cereal-aveia-sem-gluten-flocos-finos-200g', 'Aveia Sem Gluten Flocos Finos Crock Cereal 200g'),
    ('feita-croc-apple-40g', 'Feita Croc Apple 40g')
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

found_map = {}

for pid, q_or_url in remaining_targets:
    if q_or_url.startswith('http'):
        found_map[pid] = q_or_url
        print(f"[DIRECT FOREVER] {pid} -> {q_or_url}")
        continue
        
    url = f"https://api.mercadolibre.com/sites/MLB/search?q={requests.utils.quote(q_or_url)}"
    try:
        r = requests.get(url, headers=headers, timeout=6)
        if r.status_code == 200:
            data = r.json()
            results = data.get('results', [])
            if results:
                # Find best matching packshot
                chosen = None
                for res in results[:5]:
                    thumb = res.get('thumbnail', '')
                    # check if official store or good seller
                    if thumb:
                        chosen = res
                        break
                if chosen:
                    thumb = chosen.get('thumbnail', '')
                    hires = thumb.replace('-I.jpg', '-O.jpg').replace('http://', 'https://')
                    title = chosen.get('title')
                    found_map[pid] = hires
                    print(f"[FOUND ML] {pid} ({title}) -> {hires}")
                else:
                    print(f"[NO THUMB] {pid}")
            else:
                print(f"[NO RESULTS] {pid} ({q_or_url})")
        else:
            print(f"[STATUS {r.status_code}] {pid}")
    except Exception as e:
        print(f"[ERR] {pid}: {e}")
    time.sleep(0.15)

print(f"\nTotal resolved: {len(found_map)} / {len(remaining_targets)}")
with open('scripts/resolved_32_images.json', 'w', encoding='utf-8') as f:
    json.dump(found_map, f, indent=2, ensure_ascii=False)
