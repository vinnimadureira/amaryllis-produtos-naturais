import json
import os
import re

# Let's inspect the exact products to create in Wave 2:

new_products = [
    # ══════════════════════════════════════════════════════════════════
    # 1. VITAFOR SUPLEMENTOS ADICIONAIS
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "vitafor-vitamina-b12-gotas-30ml",
        "name": "Vitamina B12 Gotas 9,9mcg 30ml — Vitafor",
        "category": "Suplementos & Proteínas",
        "price": 49.0,
        "price_display": "R$ 49,00",
        "weight_grams": 100,
        "description": "Suplemento alimentar de vitamina B12 (metilcobalamina) em solução gotas de alta absorção. Auxilia no funcionamento do sistema imune, no metabolismo energético e na formação de células vermelhas do sangue. Vegano e prático.",
        "brand": "Vitafor",
        "query": "vitamina b12 gotas vitafor"
    },
    {
        "id": "vitafor-nac-60caps",
        "name": "NAC 600mg 60 Cápsulas — Vitafor",
        "category": "Suplementos & Proteínas",
        "price": 89.0,
        "price_display": "R$ 89,00",
        "weight_grams": 150,
        "description": "N-Acetil L-Cisteína (NAC) isolada de alta pureza em cápsulas vegetais. Precursor direto da glutationa, o antioxidante mestre do organismo. Suporte celular e respiratório.",
        "brand": "Vitafor",
        "query": "nac 600mg vitafor 60 capsulas"
    },
    {
        "id": "vitafor-profem-oleo-primula-60caps",
        "name": "Profem Óleo de Prímula 60 Cápsulas — Vitafor",
        "category": "Suplementos & Proteínas",
        "price": 68.0,
        "price_display": "R$ 68,00",
        "weight_grams": 180,
        "description": "100% puro óleo de prímula rico em Ácido Gama-Linolênico (GLA), um ácido graxo essencial da família ômega-6. Auxilia no equilíbrio e bem-estar feminino, especialmente nos períodos de TPM e menopausa.",
        "brand": "Vitafor",
        "query": "profem vitafor oleo primula"
    },
    {
        "id": "vitafor-resveratrol-plus-60caps",
        "name": "Resveratrol Plus com Ácido Hialurônico e CoQ10 60 Cápsulas — Vitafor",
        "category": "Suplementos & Proteínas",
        "price": 149.0,
        "price_display": "R$ 149,00",
        "weight_grams": 160,
        "description": "Fórmula antioxidante premium combinando trans-resveratrol puro, ácido hialurônico, coenzima Q10 e vitaminas antioxidantes. Suporte anti-aging celular e cardiovascular.",
        "brand": "Vitafor",
        "query": "resveratrol plus vitafor 60 capsulas"
    },
    {
        "id": "vitafor-omega-3-epa-dha-120caps",
        "name": "Ômega 3 EPA DHA 120 Cápsulas — Vitafor",
        "category": "Suplementos & Proteínas",
        "price": 98.0,
        "price_display": "R$ 98,00",
        "weight_grams": 250,
        "description": "Óleo de peixe puro com certificação internacional IFOS, fonte de 540mg EPA e 360mg DHA por dose. Isento de metais pesados, essencial para saúde cardiovascular e cognitiva.",
        "brand": "Vitafor",
        "query": "omega 3 epa dha vitafor 120 capsulas"
    },

    # ══════════════════════════════════════════════════════════════════
    # 2. NOW FOODS SUPLEMENTOS ADICIONAIS
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "now-vitamin-e-400-100softgels",
        "name": "Vitamin E-400 UI 100 Softgels — NOW Foods",
        "category": "Suplementos & Proteínas",
        "price": 169.0,
        "price_display": "R$ 169,00",
        "weight_grams": 200,
        "description": "Vitamina E pura de origem vegetal (d-alfa tocoferol com tocoferóis mistos). Potente antioxidante solúvel em gordura que protege as células contra o estresse oxidativo e apoia a saúde cardiovascular.",
        "brand": "NOW Foods",
        "sku_iherb": "now00850",
        "query": "now foods vitamin e 400 100 softgels"
    },
    {
        "id": "now-garlic-oil-1500mg-100softgels",
        "name": "Garlic Oil 1500mg Concentrado 100 Softgels — NOW Foods",
        "category": "Suplementos & Proteínas",
        "price": 139.0,
        "price_display": "R$ 139,00",
        "weight_grams": 180,
        "description": "Óleo de alho integral equivalente a 1.500mg de dente de alho fresco por cápsula. Tradicionalmente utilizado para apoiar a saúde do coração, circulação e sistema imunológico natural.",
        "brand": "NOW Foods",
        "sku_iherb": "now01780",
        "query": "now foods garlic oil 1500mg"
    },
    {
        "id": "now-inositol-500mg-100caps",
        "name": "Inositol 500mg 100 Cápsulas Vegetais — NOW Foods",
        "category": "Suplementos & Proteínas",
        "price": 159.0,
        "price_display": "R$ 159,00",
        "weight_grams": 200,
        "description": "Mio-Inositol em cápsulas vegetais. Nutriente chave para a sinalização de neurotransmissores (como serotonina e dopamina), equilíbrio hormonal feminino e metabolismo da glicose.",
        "brand": "NOW Foods",
        "sku_iherb": "now00475",
        "query": "now foods inositol 500mg"
    },
    {
        "id": "now-coq10-50mg-50softgels",
        "name": "CoQ10 50mg com Selênio 50 Softgels — NOW Foods",
        "category": "Suplementos & Proteínas",
        "price": 179.0,
        "price_display": "R$ 179,00",
        "weight_grams": 150,
        "description": "Coenzima Q10 de grau farmacêutico combinada com selênio e vitamina E. Fundamental para a produção de energia mitocondrial (ATP) nas células cardíacas e vigor físico.",
        "brand": "NOW Foods",
        "sku_iherb": "now03160",
        "query": "now foods coq10 50mg"
    },

    # ══════════════════════════════════════════════════════════════════
    # 3. BELIVE & SNACKS FUNCIONAIS
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "belive-bolinho-cenoura-chocolate-40g",
        "name": "Bolinho de Cenoura com Recheio de Chocolate 40g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 7.5,
        "price_display": "R$ 7,50",
        "weight_grams": 40,
        "description": "Bolinho fofinho e delicioso sabor cenoura com gotas e recheio cremoso de chocolate. 100% sem glúten, sem leite/lactose e zero adição de açúcares.",
        "brand": "Belive",
        "query": "bolinho cenoura chocolate belive"
    },
    {
        "id": "belive-bolinho-double-chocolate-40g",
        "name": "Bolinho Double Chocolate Zero Açúcar 40g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 7.5,
        "price_display": "R$ 7,50",
        "weight_grams": 40,
        "description": "Massa macia e recheio intenso de cacau para os apaixonados por chocolate. Isento de glúten, leite e açúcares adicionados.",
        "brand": "Belive",
        "query": "bolinho double chocolate belive"
    },
    {
        "id": "belive-bolinho-coco-chocolate-40g",
        "name": "Bolinho de Coco com Gotas de Chocolate 40g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 7.5,
        "price_display": "R$ 7,50",
        "weight_grams": 40,
        "description": "A combinação clássica de coco ralado com gotas de chocolate em versão saudável e sem glúten. Sem leite e zero açúcar.",
        "brand": "Belive",
        "query": "bolinho coco gotas chocolate belive"
    },
    {
        "id": "belive-bolinho-laranja-chocolate-40g",
        "name": "Bolinho de Laranja com Gotas de Chocolate 40g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 7.5,
        "price_display": "R$ 7,50",
        "weight_grams": 40,
        "description": "Toque cítrico natural da laranja com gotas suaves de chocolate nobre. Zero glúten e sem lactose.",
        "brand": "Belive",
        "query": "bolinho laranja gotas chocolate belive"
    },
    {
        "id": "belive-paozinho-cenoura-200g",
        "name": "Pãozinho de Cenoura Super Macio 200g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 22.9,
        "price_display": "R$ 22,90",
        "weight_grams": 200,
        "description": "Pão de cenoura artesanal super macio, formulado sem glúten e sem leite. Ideal para sanduíches e café da manhã nutritivo.",
        "brand": "Belive",
        "query": "paozinho cenoura belive 200g"
    },
    {
        "id": "belive-mandioca-chips-chimichurri-50g",
        "name": "Mandioca Chips Chimichurri 50g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 10.9,
        "price_display": "R$ 10,90",
        "weight_grams": 50,
        "description": "Chips crocantes de mandioca selecionada temperados com ervas aromáticas de chimichurri e sal rosa do Himalaia. Não transgênico e sem glúten.",
        "brand": "Belive",
        "query": "chips mandioca chimichurri belive"
    },
    {
        "id": "belive-snack-pizza-50g",
        "name": "Snack Assado Sabor Pizza com Arroz e Quinoa 50g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 9.9,
        "price_display": "R$ 9,90",
        "weight_grams": 50,
        "description": "Snack assado 100% vegetal com arroz, quinoa e lentilha sabor tradicional de pizza. Crocante, sem glúten e sem leite.",
        "brand": "Belive",
        "query": "snack pizza arroz quinoa belive"
    },

    # ══════════════════════════════════════════════════════════════════
    # 4. ALERE GOURMET BISCOITOS ADICIONAIS
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "alere-biscoito-cacau-avela-30g",
        "name": "Biscoito de Cacau com Avelã 30g — Alere Gourmet",
        "category": "Sem Glúten & Sem Lactose",
        "price": 9.9,
        "price_display": "R$ 9,90",
        "weight_grams": 30,
        "description": "Snack doce feito com biomassa de banana verde, puro cacau e pedacinhos de avelã. Rico em fibras e proteína vegetal, sem adição de açúcares.",
        "brand": "Alere Gourmet",
        "query": "biscoito cacau avela alere 30g"
    },
    {
        "id": "alere-biscoito-castanha-cebolinha-70g",
        "name": "Biscoito Castanha de Caju e Cebolinha 70g — Alere Gourmet",
        "category": "Sem Glúten & Sem Lactose",
        "price": 16.9,
        "price_display": "R$ 16,90",
        "weight_grams": 70,
        "description": "Biscoito salgado à base de biomassa de banana verde com castanha-de-caju torrada e cebolinha fresca. 100% natural e sem glúten.",
        "brand": "Alere Gourmet",
        "query": "biscoito castanha caju cebolinha alere"
    },
    {
        "id": "alere-biscoito-nutritional-yeast-alecrim-70g",
        "name": "Biscoito Nutritional Yeast com Alecrim 70g — Alere Gourmet",
        "category": "Sem Glúten & Sem Lactose",
        "price": 16.9,
        "price_display": "R$ 16,90",
        "weight_grams": 70,
        "description": "Snack funcional elaborado com levedura nutricional (fonte de vitaminas do complexo B) e toque herbal de alecrim. Sabor que remete ao queijo, 100% plant-based.",
        "brand": "Alere Gourmet",
        "query": "biscoito nutritional yeast alecrim alere"
    },
    {
        "id": "alere-biscoito-polvilho-pipoca-40g",
        "name": "Biscoito de Polvilho com Farinha de Pipoca 40g — Alere Gourmet",
        "category": "Sem Glúten & Sem Lactose",
        "price": 11.9,
        "price_display": "R$ 11,90",
        "weight_grams": 40,
        "description": "Releitura saudável do biscoito de polvilho combinando a leveza do polvilho com os polifenóis da farinha de pipoca integral. Super crocante.",
        "brand": "Alere Gourmet",
        "query": "biscoito polvilho farinha pipoca alere"
    },
    {
        "id": "alere-biscoito-alho-poro-55g",
        "name": "Biscoito Proteico com Alho-Poró 55g — Alere Gourmet",
        "category": "Sem Glúten & Sem Lactose",
        "price": 15.9,
        "price_display": "R$ 15,90",
        "weight_grams": 55,
        "description": "Biscoito salgado proteico à base de biomassa de banana verde e aroma autêntico de alho-poró. Sem glúten, vegano e fonte de saciedade.",
        "brand": "Alere Gourmet",
        "query": "biscoito proteico alho poro alere"
    },

    # ══════════════════════════════════════════════════════════════════
    # 5. CROCK CEREAL & MASSAS
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "crock-cereal-farelo-aveia-sem-gluten-200g",
        "name": "Farelo de Aveia Sem Glúten 200g — Crock Cereal",
        "category": "Sem Glúten & Sem Lactose",
        "price": 13.9,
        "price_display": "R$ 13,90",
        "weight_grams": 200,
        "description": "A camada mais nobre da aveia, concentrada em betaglucanas solúveis que auxiliam no controle do colesterol e na saciedade. Certificada sem glúten.",
        "brand": "Crock Cereal",
        "query": "farelo aveia sem gluten crock cereal"
    },
    {
        "id": "crock-cereal-aveia-flocos-grossos-200g",
        "name": "Aveia em Flocos Grossos Sem Glúten 200g — Crock Cereal",
        "category": "Sem Glúten & Sem Lactose",
        "price": 12.9,
        "price_display": "R$ 12,90",
        "weight_grams": 200,
        "description": "Grãos inteiros prensados de aveia selecionada sem contaminação cruzada. Textura perfeita para granolas caseiras, cookies e mingaus rústicos.",
        "brand": "Crock Cereal",
        "query": "aveia flocos grossos sem gluten crock cereal"
    },
    {
        "id": "crock-cereal-farinha-aveia-sem-gluten-200g",
        "name": "Farinha de Aveia Sem Glúten 200g — Crock Cereal",
        "category": "Sem Glúten & Sem Lactose",
        "price": 12.9,
        "price_display": "R$ 12,90",
        "weight_grams": 200,
        "description": "Farinha pura e finamente moída de aveia sem glúten. Substitui a farinha de trigo em bolos, panquecas e pães saudáveis com textura leve.",
        "brand": "Crock Cereal",
        "query": "farinha aveia sem gluten crock cereal"
    },
    {
        "id": "konjac-massa-mf-noodles-270g",
        "name": "Konjac Massa MF Tipo Noodles 270g",
        "category": "Sem Glúten & Sem Lactose",
        "price": 27.9,
        "price_display": "R$ 27,90",
        "weight_grams": 270,
        "description": "Massa alimentar à base de fibra glucomanan de Konjac. Apenas 9 calorias por 100g, zero carboidratos líquidos, sem glúten e sem sódio. Pronta em 2 minutos.",
        "brand": "Konjac Massa MF",
        "query": "konjac massa mf noodles"
    },
    {
        "id": "urbano-massa-arroz-parafuso-500g",
        "name": "Massa de Arroz Parafuso (Fusilli) 500g — Urbano",
        "category": "Sem Glúten & Sem Lactose",
        "price": 11.9,
        "price_display": "R$ 11,90",
        "weight_grams": 500,
        "description": "Macarrão 100% vegetal elaborado com farinha de arroz selecionada. Cozimento uniforme al dente, seguro para celíacos e livre de transgênicos.",
        "brand": "Urbano Alimentos",
        "query": "macarrao arroz parafuso urbano 500g"
    },

    # ══════════════════════════════════════════════════════════════════
    # 6. BEBIDAS VEGETAIS, GRANOLAS & GELEIAS
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "harts-natural-granola-keto-low-carb-300g",
        "name": "Granola Keto Low Carb 300g — Hart's Natural",
        "category": "Orgânicos & Integrais",
        "price": 38.9,
        "price_display": "R$ 38,90",
        "weight_grams": 300,
        "description": "Granola plant-based sem grãos (grain-free), feita com amêndoas, coco, castanha-de-caju, semente de abóbora e chia. Zero adição de açúcares, cetogênica e crocante.",
        "brand": "Hart's Natural",
        "query": "granola keto low carb harts natural"
    },
    {
        "id": "harts-natural-granola-keto-protein-sal-marinho-200g",
        "name": "Granola Keto Protein Sal Marinho 200g — Hart's Natural",
        "category": "Orgânicos & Integrais",
        "price": 32.9,
        "price_display": "R$ 32,90",
        "weight_grams": 200,
        "description": "Granola salgada proteica com 28g de proteína por porção. Castanhas nobres, sal marinho e sementes germinadas para saladas e lanches rápidos.",
        "brand": "Hart's Natural",
        "query": "granola keto protein sal marinho harts"
    },
    {
        "id": "risovita-leite-de-arroz-original-1l",
        "name": "Bebida Vegetal de Arroz Original 1 Litro — RisoVita",
        "category": "Sem Glúten & Sem Lactose",
        "price": 16.9,
        "price_display": "R$ 16,90",
        "weight_grams": 1000,
        "description": "Leite vegetal 100% à base de arroz, enriquecido com cálcio. Naturalmente doce, sem colesterol, sem lactose e sem adição de açúcares.",
        "brand": "RisoVita",
        "query": "bebida arroz risovita 1l"
    },
    {
        "id": "a-tal-da-castanha-caju-para-1l",
        "name": "Bebida Vegetal Caju + Pará 1 Litro — A Tal da Castanha",
        "category": "Sem Glúten & Sem Lactose",
        "price": 21.9,
        "price_display": "R$ 21,90",
        "weight_grams": 1000,
        "description": "Apenas 2 ingredientes: água e castanhas brasileiras orgânicas (caju e castanha-do-pará). Rica em selênio natural, sem gomas e sem espessantes.",
        "brand": "A Tal da Castanha",
        "query": "a tal da castanha caju para 1l"
    },
    {
        "id": "aecia-geleia-organica-figo-200g",
        "name": "Geleia de Figo Orgânica 200g — Aecia Ecovida",
        "category": "Orgânicos & Integrais",
        "price": 26.5,
        "price_display": "R$ 26,50",
        "weight_grams": 200,
        "description": "Geleia artesanal de figos maduros cultivados pela agricultura familiar orgânica certificada (Rede Ecovida). Sabor puro da fruta, sem conservantes químicos.",
        "brand": "Aecia Orgânicos",
        "query": "geleia organica figo aecia ecovida"
    },

    # ══════════════════════════════════════════════════════════════════
    # 7. TINTURAS FITOTERÁPICAS PANIZZA ADICIONAIS
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "panizza-tintura-anis-estrelado-100ml",
        "name": "Tintura de Anis Estrelado 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 42.0,
        "price_display": "R$ 42,00",
        "weight_grams": 100,
        "description": "Extrato vegetal concentrado de Illicium verum. Tradicionalmente utilizado no suporte digestivo, alívio de cólicas e gases, com aroma doce característico.",
        "brand": "Panizza",
        "photo_idx": 56
    },
    {
        "id": "panizza-tintura-dente-de-leao-100ml",
        "name": "Tintura de Dente de Leão 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 42.0,
        "price_display": "R$ 42,00",
        "weight_grams": 100,
        "description": "Extrato de Taraxacum officinale. Excelente suporte para a saúde hepática, desintoxicação natural e diurese suave.",
        "brand": "Panizza",
        "photo_idx": 82
    },
    {
        "id": "panizza-tintura-eucalipto-100ml",
        "name": "Tintura de Eucalipto 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 38.0,
        "price_display": "R$ 38,00",
        "weight_grams": 100,
        "description": "Tintura de Eucalyptus globulus rica em eucaliptol. Auxilia no conforto das vias respiratórias e na respiração livre.",
        "brand": "Panizza",
        "photo_idx": 83
    },
    {
        "id": "panizza-tintura-garcinia-100ml",
        "name": "Tintura de Garcinia Cambogia 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 45.0,
        "price_display": "R$ 45,00",
        "weight_grams": 100,
        "description": "Extrato vegetal concentrado fonte de Ácido Hidroxicítrico (HCA). Auxilia na modulação do apetite e no metabolismo dos carboidratos.",
        "brand": "Panizza",
        "photo_idx": 84
    },
    {
        "id": "panizza-tintura-equinacea-100ml",
        "name": "Tintura de Equinácea 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 46.0,
        "price_display": "R$ 46,00",
        "weight_grams": 100,
        "description": "Extrato concentrado de Echinacea purpurea. Reconhecido pelo suporte imunológico e fortalecimento das defesas naturais do corpo.",
        "brand": "Panizza",
        "photo_idx": 87
    },
    {
        "id": "panizza-tintura-hiperico-100ml",
        "name": "Tintura de Hipérico (Erva de São João) 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 46.0,
        "price_display": "R$ 46,00",
        "weight_grams": 100,
        "description": "Extrato de Hypericum perforatum. Utilizado na fitoterapia para auxiliar no equilíbrio emocional, combate ao desânimo e melhora do humor.",
        "brand": "Panizza",
        "photo_idx": 88
    },
    {
        "id": "panizza-tintura-kava-kava-100ml",
        "name": "Tintura de Kava Kava 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 48.0,
        "price_display": "R$ 48,00",
        "weight_grams": 100,
        "description": "Extrato de Piper methysticum. Famoso por sua potente ação relaxante, alívio do estresse físico e mental e relaxamento muscular.",
        "brand": "Panizza",
        "photo_idx": 91
    },
    {
        "id": "panizza-tintura-melissa-100ml",
        "name": "Tintura de Melissa (Erva Cidreira) 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 39.0,
        "price_display": "R$ 39,00",
        "weight_grams": 100,
        "description": "Extrato botânico de Melissa officinalis. Calmante suave, auxilia no sono reparador e na digestão tranquila.",
        "brand": "Panizza",
        "photo_idx": 94
    },
    {
        "id": "panizza-tintura-menta-piperita-100ml",
        "name": "Tintura de Menta Piperita 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 38.0,
        "price_display": "R$ 38,00",
        "weight_grams": 100,
        "description": "Extrato de Mentha piperita rico em mentol natural. Alívio de desconfortos gástricos, frescor e relaxamento digestivo.",
        "brand": "Panizza",
        "photo_idx": 95
    },
    {
        "id": "panizza-tintura-losna-100ml",
        "name": "Tintura de Losna 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 39.0,
        "price_display": "R$ 39,00",
        "weight_grams": 100,
        "description": "Extrato de Artemisia absinthium. Princípio amargo tradicional para digestão pesada e equilíbrio do trato gastrointestinal.",
        "brand": "Panizza",
        "photo_idx": 96
    },
    {
        "id": "panizza-tintura-oregano-100ml",
        "name": "Tintura de Orégano 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 44.0,
        "price_display": "R$ 44,00",
        "weight_grams": 100,
        "description": "Extrato rico em carvacrol e timol. Conhecido por suas propriedades antimicrobianas e antioxidantes naturais.",
        "brand": "Panizza",
        "photo_idx": 97
    },
    {
        "id": "panizza-tintura-pau-darco-100ml",
        "name": "Tintura de Pau d'Arco (Ipê Roxo) 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 44.0,
        "price_display": "R$ 44,00",
        "weight_grams": 100,
        "description": "Extrato da casca de Tabebuia avellanedae. Tradicionalmente empregado no suporte imunitário e depuração do organismo.",
        "brand": "Panizza",
        "photo_idx": 98
    },
    {
        "id": "panizza-tintura-pfaffia-ginseng-100ml",
        "name": "Tintura de Pfaffia (Ginseng Brasileiro) 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 44.0,
        "price_display": "R$ 44,00",
        "weight_grams": 100,
        "description": "Extrato de raiz de Pfaffia paniculata. Adaptógeno natural que combate a fadiga física e mental e apoia a vitalidade diária.",
        "brand": "Panizza",
        "photo_idx": 101
    },
    {
        "id": "panizza-tintura-quebra-pedra-100ml",
        "name": "Tintura de Quebra Pedra 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 39.0,
        "price_display": "R$ 39,00",
        "weight_grams": 100,
        "description": "Extrato botânico de Phyllanthus niruri. Apoia o conforto do trato urinário e a saúde dos rins.",
        "brand": "Panizza",
        "photo_idx": 103
    },
    {
        "id": "panizza-tintura-roselis-hibisco-100ml",
        "name": "Tintura de Roselis (Hibisco) 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 39.0,
        "price_display": "R$ 39,00",
        "weight_grams": 100,
        "description": "Extrato de flores de Hibiscus sabdariffa. Ação diurética suave, antioxidante e suporte ao controle da retenção de líquidos.",
        "brand": "Panizza",
        "photo_idx": 104
    },
    {
        "id": "panizza-tintura-salsaparrilha-100ml",
        "name": "Tintura de Salsaparrilha 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 42.0,
        "price_display": "R$ 42,00",
        "weight_grams": 100,
        "description": "Extrato botânico de Smilax officinalis. Depurativo tradicional utilizado para apoiar a saúde da pele e o bem-estar articular.",
        "brand": "Panizza",
        "photo_idx": 105
    },
    {
        "id": "panizza-tintura-thuia-100ml",
        "name": "Tintura de Thuia Ocidentalis 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 44.0,
        "price_display": "R$ 44,00",
        "weight_grams": 100,
        "description": "Extrato vegetal de Thuja occidentalis. Uso tradicional consagrado na fitoterapia e homeopatia integrativa.",
        "brand": "Panizza",
        "photo_idx": 107
    },
    {
        "id": "panizza-amidalizza-spray-propolis-30ml",
        "name": "Aromatizante Bucal Amidalizza com Própolis 30ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 28.0,
        "price_display": "R$ 28,00",
        "weight_grams": 50,
        "description": "Spray bucal formulado com extrato purificado de própolis verde e ervas aromáticas. Hálito puro e conforto para a garganta.",
        "brand": "Panizza",
        "photo_idx": 112
    },

    # ══════════════════════════════════════════════════════════════════
    # 8. CHÁS & ERVAS MEDICINAIS EM FOLHAS (VALE DO RIBEIRA / GREENBIOS)
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "cha-abacateiro-folhas-30g",
        "name": "Chá de Abacateiro Folhas e Talos 30g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 12.0,
        "price_display": "R$ 12,00",
        "weight_grams": 30,
        "description": "Folhas secas selecionadas de Persea americana. Ação diurética natural, tradicionalmente utilizada para o equilíbrio renal e retenção hídrica.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 195
    },
    {
        "id": "cha-arruda-30g",
        "name": "Chá de Arruda Erva Pura 30g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 12.0,
        "price_display": "R$ 12,00",
        "weight_grams": 30,
        "description": "Ruta graveolens seca de colheita controlada. Erva tradicional da fitoterapia popular brasileira.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 198
    },
    {
        "id": "cha-bardana-folhas-30g",
        "name": "Chá de Bardana Folhas 30g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 14.0,
        "price_display": "R$ 14,00",
        "weight_grams": 30,
        "description": "Arctium lappa de alta pureza. Excelente depurativo natural que auxilia na saúde cutânea e na eliminação de toxinas.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 200
    },
    {
        "id": "cha-buchinha-do-norte-frutos-30g",
        "name": "Chá de Buchinha do Norte Frutos 30g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 16.0,
        "price_display": "R$ 16,00",
        "weight_grams": 30,
        "description": "Luffa operculata inteira e seca. Utilizada popularmente em inalações tradicionais para desobstrução das vias nasais.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 202
    },
    {
        "id": "cha-chapeu-de-couro-folhas-20g",
        "name": "Chá de Chapéu de Couro Folhas 20g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 13.0,
        "price_display": "R$ 13,00",
        "weight_grams": 20,
        "description": "Echinodorus grandiflorus selecionado. Diurético natural e suporte articular amplamente consagrado.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 204
    },
    {
        "id": "cha-anis-estrelado-frutos-30g",
        "name": "Chá de Anis Estrelado Frutos 30g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 16.0,
        "price_display": "R$ 16,00",
        "weight_grams": 30,
        "description": "Frutos inteiros aromáticos de Illicium verum. Sabor adocicado e digestivo, ideal para infusões e caldos reconfortantes.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 205
    },
    {
        "id": "cha-carqueja-doce-30g",
        "name": "Chá de Carqueja Doce 30g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 12.0,
        "price_display": "R$ 12,00",
        "weight_grams": 30,
        "description": "Baccharis articulata aérea. Planta digestiva suave que apoia a função hepática e a sensação de leveza após as refeições.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 206
    },
    {
        "id": "cha-cardo-mariano-20g",
        "name": "Chá de Cardo Mariano 20g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 16.0,
        "price_display": "R$ 16,00",
        "weight_grams": 20,
        "description": "Silybum marianum rico em silimarina. Potente protetor e regenerador natural das células do fígado.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 207
    },
    {
        "id": "cha-capim-limao-folhas-30g",
        "name": "Chá de Capim Limão Folhas 30g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 12.0,
        "price_display": "R$ 12,00",
        "weight_grams": 30,
        "description": "Cymbopogon citratus aromático. Calmante suave, digestivo e perfeito para relaxar no final da tarde.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 208
    },
    {
        "id": "cha-calendula-flores-30g",
        "name": "Chá de Calêndula Flores Puras 30g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 14.0,
        "price_display": "R$ 14,00",
        "weight_grams": 30,
        "description": "Flores inteiras desidratadas de Calendula officinalis. Propriedades suavizantes, antissépticas e regeneradoras para mucosas e pele.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 210
    },
    {
        "id": "cha-cavalinha-parte-aerea-30g",
        "name": "Chá de Cavalinha Parte Aérea 30g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 13.0,
        "price_display": "R$ 13,00",
        "weight_grams": 30,
        "description": "Equisetum arvense concentrada em silício vegetal orgânico. Auxilia na diurese e na vitalidade de cabelos e unhas.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 212
    },
    {
        "id": "cha-canela-de-velho-folhas-30g",
        "name": "Chá de Canela de Velho Folhas 30g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 15.0,
        "price_display": "R$ 15,00",
        "weight_grams": 30,
        "description": "Miconia albicans autêntica do cerrado. Amplamente utilizada no alívio de dores nas articulações, joelhos e coluna.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 214
    },
    {
        "id": "cha-dente-de-leao-aerea-30g",
        "name": "Chá de Dente de Leão 30g — Vale do Ribeira",
        "category": "Fitoterápicos & Chás",
        "price": 14.0,
        "price_display": "R$ 14,00",
        "weight_grams": 30,
        "description": "Taraxacum officinale aérea. Desintoxicante hepático e estimulante da digestão e do apetite saudável.",
        "brand": "Chás do Vale do Ribeira",
        "photo_idx": 216
    }
]

print(f"Total new products mapped: {len(new_products)}")
with open('scripts/new_products_specs.json', 'w', encoding='utf-8') as f:
    json.dump(new_products, f, indent=2, ensure_ascii=False)
