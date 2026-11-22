import requests
import json
import concurrent.futures

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

with open('scripts/target_41_upgrade.json', 'r', encoding='utf-8') as f:
    targets = json.load(f)

vtex_stores = [
    ('SantaLuzia', 'https://www.santaluzia.com.br/api/catalog_system/pub/products/search?ft='),
    ('DrogariaSP', 'https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search?ft='),
    ('Mambo', 'https://www.mambodelivery.com.br/api/catalog_system/pub/products/search?ft=')
]

# Query map tailored to exact keywords
query_map = {
    "belive-cookies-baunilha-chocolate-67g": ["cookies baunilha chocolate belive 67g", "cookies baunilha belive"],
    "belive-protein-brownie-double-chocolate": ["brownie proteico double chocolate belive 40g", "brownie double chocolate belive"],
    "belive-pao-de-mel-zero-45g": ["pao de mel zero acucar belive 45g", "pao de mel belive"],
    "belive-paozinho-batata-198g": ["paozinho batata belive 198g", "pao batata belive"],
    "belive-mandioca-chips-sal-rosa-50g": ["chips mandioca sal rosa belive 50g", "chips mandioca belive"],
    "belive-bolinho-cenoura-chocolate-40g": ["bolinho cenoura chocolate belive", "bolo mini cenoura belive"],
    "belive-bolinho-double-chocolate-40g": ["bolinho double chocolate belive", "muffin chocolate belive"],
    "belive-bolinho-coco-chocolate-40g": ["bolinho coco chocolate belive", "muffin coco belive"],
    "belive-bolinho-laranja-chocolate-40g": ["bolinho laranja chocolate belive", "bolinho laranja belive"],
    "belive-paozinho-cenoura-200g": ["paozinho cenoura belive 200g", "pao cenoura belive"],
    "belive-mandioca-chips-chimichurri-50g": ["chips mandioca chimichurri belive", "chips mandioca belive"],
    "belive-snack-pizza-50g": ["snack pizza belive 50g", "snack arroz quinoa belive pizza"],

    "vitafor-glutamax-300g": ["glutamax 300g vitafor", "glutamina vitafor 300g"],
    "vitafor-isofort-wpi-chocolate-900g": ["isofort chocolate 900g vitafor", "isofort 900g vitafor"],
    "vitafor-omegafor-plus-60caps": ["omegafor plus 60 capsulas vitafor", "omegafor plus vitafor 60"],
    "vitafor-omegafor-vegan-60caps": ["omegafor vegan vitafor 60 capsulas", "omegafor vegan vitafor"],
    "vitafor-coq10-200mg-60caps": ["coq10 200mg vitafor 60", "coq 10 200mg vitafor"],
    "vitafor-vitamina-b12-gotas-30ml": ["vitamina b12 gotas vitafor 30ml", "b12 gotas vitafor"],

    "now-vitamin-e-400-100softgels": ["vitamin e 400 now foods", "vitamina e 400 now foods"],
    "now-garlic-oil-1500mg-100softgels": ["garlic oil 1500 now foods", "oleo de alho now foods"],
    "now-inositol-500mg-100caps": ["inositol 500mg now foods", "inositol now foods 500"],
    "now-coq10-50mg-50softgels": ["coq10 50mg now foods", "coenzima q10 now foods"],

    "a-tal-da-castanha-amendoa-1l": ["bebida amendoa a tal da castanha 1l", "leite amendoa a tal da castanha"],
    "a-tal-da-castanha-original-1l": ["bebida castanha de caju original a tal da castanha 1l", "castanha original a tal da castanha 1l"],
    "a-tal-da-castanha-mixed-nuts-1l": ["bebida mixed nuts a tal da castanha 1l", "mixed nuts a tal da castanha"],
    "a-tal-da-castanha-caju-para-1l": ["bebida caju e para a tal da castanha 1l", "caju para a tal da castanha 1l"],

    "harts-natural-granola-keto-low-carb-300g": ["granola keto harts natural", "granola keto vanilla almond harts"],
    "harts-natural-granola-keto-protein-sal-marinho-200g": ["granola keto sal marinho harts", "granola keto protein harts"],

    "urbano-massa-arroz-penne-500g": ["macarrao arroz penne urbano 500g", "penne arroz urbano 500g"],
    "urbano-massa-arroz-parafuso-500g": ["macarrao arroz parafuso urbano 500g", "parafuso arroz urbano 500g"],

    "crock-cereal-aveia-flocos-grossos-200g": ["aveia flocos grossos sem gluten leve crock 200g", "aveia flocos grossos leve crock"],
    "crock-cereal-farinha-aveia-sem-gluten-200g": ["farinha aveia sem gluten leve crock 200g", "farinha aveia leve crock"],

    "konjac-massa-mf-bucatini-270g": ["konjac bucatini 270g", "massa konjac bucatini"],
    "konjac-massa-mf-lasanha-270g": ["konjac lasanha 270g", "massa konjac lasanha"],

    "notco-notmilk-original-1l": ["notmilk original 1l", "leite notmilk original 1l"],
    "copra-leite-de-coco-beber-900ml": ["leite coco vegano beber copra 900ml", "leite de coco para beber copra 900ml"],

    "nazinha-sequilhos-coco-300g": ["sequilhos coco nazinha 300g", "sequilhos de coco nazinha"],
    "nazinha-sequilhos-maracuja-zero-120g": ["sequilhos maracuja zero nazinha 120g", "sequilhos maracuja nazinha"],

    "alere-biscoito-cacau-avela-30g": ["biscoito cacau avela alere gourmet 30g", "biscoito alere cacau"],
    "alere-biscoito-castanha-cebolinha-70g": ["biscoito castanha cebolinha alere gourmet 70g", "biscoito alere cebolinha"],

    "casarao-lasanha-caseira-tradicional-300g": ["massa lasanha arroz casarao 300g", "lasanha caseira casarao 300g"]
}

def resolve_item(item):
    pid = item['id']
    name = item['name']
    queries = query_map.get(pid, [name])
    for q in queries:
        for sname, base_url in vtex_stores:
            try:
                r = requests.get(base_url + requests.utils.quote(q), headers=headers, timeout=2.5)
                if r.status_code == 200:
                    data = r.json()
                    if data and len(data) > 0 and 'items' in data[0] and len(data[0]['items']) > 0:
                        pname = data[0].get('productName', '')
                        img = data[0]['items'][0]['images'][0]['imageUrl']
                        return pid, {'title': pname, 'url': img, 'source': sname, 'query': q}
            except:
                pass
    return pid, None

results = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    future_to_pid = {executor.submit(resolve_item, item): item['id'] for item in targets}
    for future in concurrent.futures.as_completed(future_to_pid):
        pid, res = future.result()
        if res:
            results[pid] = res
            print(f"[FOUND {res['source']}] {pid} -> {res['title']} | {res['url'][:60]}...", flush=True)
        else:
            print(f"[MISS] {pid}", flush=True)

print(f"\nDone! Resolved {len(results)} of {len(targets)} from VTEX.", flush=True)
with open('scripts/fast_resolved_41.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
