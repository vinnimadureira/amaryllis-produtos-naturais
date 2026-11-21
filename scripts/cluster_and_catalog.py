import json
import re

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

# Helper to normalize text
def norm(t):
    return re.sub(r'[^a-zA-Z0-9]', ' ', t.lower())

print(f"Loaded {len(items)} items")

# Let's inspect all items from 0 to 308
# We will identify the unique SKU for each item
categorized = []

for idx, item in enumerate(items):
    text = item['combined_text'].upper()
    file = item['file']
    
    sku = None
    brand = None
    category = None
    
    # Essential Nutrition
    if 'ESSENTIAL' in text or 'CACAOWHEY' in text or 'VANILLAWHEY' in text or 'BEEFPROTEIN' in text or 'CREALIFT' in text or 'COLLAGENSKIN' in text or 'COLLAGEN SKIN' in text or 'CARBOLIFT' in text or 'HYDROLIFT' in text or 'AMINOLIFT' in text or 'MCTLIFT' in text:
        brand = 'Essential Nutrition'
        category = 'Essential Nutrition'
        if 'BEEFPROT' in text:
            if 'BANANA' in text or 'CANELA' in text:
                sku = 'essential-beefprotein-banana-canela'
            else:
                sku = 'essential-beefprotein-cacau'
        elif 'CACAOWHEY' in text or ('CACAO' in text and 'WHEY' in text):
            sku = 'essential-cacaowhey-900g'
        elif 'VANILLAWHEY' in text or ('VANILLA' in text and 'WHEY' in text):
            sku = 'essential-vanillawhey-900g'
        elif 'REDBERRYWHEY' in text or ('REDBERRY' in text and 'WHEY' in text):
            sku = 'essential-redberrywhey-900g'
        elif 'VEGGIEPROTEIN' in text or 'VEGGIE PROTEIN' in text:
            if 'CACAU' in text:
                sku = 'essential-veggieprotein-cacau'
            else:
                sku = 'essential-veggieprotein-neutro'
        elif 'BETA ACTION' in text or 'BETA-ACTION' in text:
            sku = 'essential-beta-action'
        elif 'MUSCLE SYNERGY' in text:
            sku = 'essential-muscle-synergy'
        elif 'COLLAGEN2JOINT' in text or 'COLLAGEN 2 JOINT' in text:
            sku = 'essential-collagen-2-joint'
        elif 'COLLAGENBONES' in text or 'COLLAGEN BONES' in text:
            sku = 'essential-collagen-bones'
        elif 'COLLAGENSKIN' in text or 'COLLAGEN SKIN' in text:
            if 'LIMAO' in text:
                sku = 'essential-collagen-skin-limao'
            else:
                sku = 'essential-collagen-skin-neutro'
        elif 'BODYBALANCE' in text:
            if 'CHOCOLATE' in text or 'CACAU' in text:
                sku = 'essential-collagen-bodybalance-chocolate'
            else:
                sku = 'essential-collagen-bodybalance-neutro'
        elif 'GLUTAMINA' in text:
            sku = 'essential-glutamina-300g'
        elif 'BRAINSTORM COFFEE' in text:
            if 'CARAMELO' in text:
                sku = 'essential-brainstorm-coffee-caramelo'
            else:
                sku = 'essential-brainstorm-coffee-original'
        elif 'CREALIFT' in text:
            sku = 'essential-crealift-creapure-300g'
        elif 'FIBERBIME' in text:
            if 'LARANJA' in text:
                sku = 'essential-fiberbime-laranja'
            else:
                sku = 'essential-fiberbime-neutro'
        elif 'AMINOGREENS' in text:
            sku = 'essential-aminogreens'
        elif 'CARBOLIFT' in text:
            sku = 'essential-carbolift'
        elif 'HYDROLIFT' in text:
            sku = 'essential-hydrolift-limao'
        elif 'AMINOLIFT' in text:
            sku = 'essential-aminolift-tangerina'
        elif 'MCTLIFT' in text or 'MCT LIFT' in text:
            sku = 'essential-mct-lift-250ml'
        elif 'XYLITOL' in text:
            sku = 'essential-xylitol-300g'
        elif 'CREATINE ACTION GUMMY' in text or ('GUMMY' in text and 'CREATINE' in text):
            sku = 'essential-creatine-action-gummy'
        elif 'SUPER QMEGA3' in text or 'SUPER OMEGA3' in text or 'SUPER OMEGA 3' in text or 'QMEGA3' in text:
            if 'COMFORT' in text:
                sku = 'essential-super-omega-3-tg-comfort'
            elif '120' in text:
                sku = 'essential-super-omega-3-tg-120caps'
            else:
                sku = 'essential-super-omega-3-tg-60caps'
        elif 'DHA TG' in text or 'DHA' in text and 'TRIGLYCERIDE' in text:
            sku = 'essential-dha-tg-90caps'
        elif 'CORE' in text and ('OMEGA' in text or 'QMEGA' in text):
            sku = 'essential-omega-core'
        elif 'VISION' in text and ('OMEGA' in text or 'QMEGA' in text or 'LUTEIN' in text):
            sku = 'essential-omega-vision'
        elif 'COQ10' in text and ('OMEGA' in text or 'QMEGA' in text):
            sku = 'essential-coq10-omega3-tg'
        elif 'BRAIN' in text and ('OMEGA' in text or 'QMEGA' in text):
            sku = 'essential-omega-brain'
        elif '[B]COMPLEX' in text or 'B COMPLEX' in text or 'BCOMPLEX' in text:
            sku = 'essential-b-complex-120caps'
        elif '[FE]COMPLEX' in text or 'FE COMPLEX' in text or 'FECOMPLEX' in text:
            sku = 'essential-fe-complex-90caps'
        elif 'VITD3' in text or 'VIT D3' in text:
            sku = 'essential-vit-d3-2000ui-120caps'
        elif 'GAMALIFT' in text:
            sku = 'essential-gamalift'
        elif 'FOCUS' in text:
            sku = 'essential-focus-theanine-caffeine'
        elif 'MELATONIN DUO' in text:
            if 'MENTA' in text:
                sku = 'essential-melatonin-duo-menta'
            else:
                sku = 'essential-melatonin-duo-caps'
        elif '[MG]COMPLEX' in text or 'MG COMPLEX' in text or 'MGCOMPLEX' in text:
            sku = 'essential-mg-complex-90caps'
        elif 'NAC+' in text or ('NAC' in text and 'GLYCINE' in text):
            sku = 'essential-nac-glycine-taurine'
        elif 'COLLAGENGUT' in text or 'COLLAGEN GUT' in text:
            sku = 'essential-collagen-gut'
        elif 'MONDZ' in text:
            sku = 'essential-mondz-almonds'
        else:
            sku = 'essential-nutrition-produto'

    categorized.append({
        'idx': idx,
        'file': file,
        'text': text,
        'brand': brand,
        'category': category,
        'sku': sku
    })

print(f"Sample essential tagged: {sum(1 for c in categorized if c['brand'] == 'Essential Nutrition')}")
