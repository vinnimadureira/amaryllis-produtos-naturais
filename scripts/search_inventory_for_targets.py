import json

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    inv = json.load(f)

targets = [
    ('vitafor_b12', ['b12', 'vitafor']),
    ('vitafor_nac', ['nac', 'vitafor']),
    ('vitafor_resveratrol', ['resveratrol', 'vitafor']),
    ('now_e400', ['vitamin e', '400', 'now']),
    ('now_garlic', ['garlic', 'now']),
    ('now_inositol', ['inositol', 'now']),
    ('now_coq10', ['coq10', 'coq-10', 'now']),
    ('belive_cenoura', ['cenoura', 'belive']),
    ('belive_double_choco', ['double', 'chocolate', 'belive']),
    ('belive_coco', ['coco', 'belive']),
    ('belive_laranja', ['laranja', 'belive']),
    ('belive_paozinho', ['pãozinho', 'paozinho', 'cenoura']),
    ('belive_chimichurri', ['chimichurri', 'mandioca']),
    ('belive_pizza', ['pizza', 'belive']),
    ('alere_cacau', ['cacau', 'avela', 'alere']),
    ('alere_cebolinha', ['cebolinha', 'alere']),
    ('alere_nutritional', ['nutritional', 'levedura', 'alere']),
    ('crock_grossos', ['grossos', 'aveia', 'crock']),
    ('crock_farinha', ['farinha', 'aveia', 'crock']),
    ('urbano_parafuso', ['urbano', 'parafuso', 'fusilli']),
    ('harts_keto', ['keto', 'harts', 'granola']),
    ('risovita', ['risovita', 'arroz']),
    ('a_tal_da_castanha', ['castanha', 'caju', 'pará', 'leite']),
    ('aecia_figo', ['aecia', 'figo', 'geleia'])
]

for label, terms in targets:
    matches = []
    for idx, item in enumerate(inv):
        comb = item.get('combined_text', '').lower()
        if all(t.lower() in comb for t in terms):
            matches.append((idx, item['file']))
        elif len(terms) >= 3 and sum(1 for t in terms if t.lower() in comb) >= 2:
            matches.append((idx, item['file']))
    print(f"{label}: found {len(matches)} matches -> {matches[:3]}")
