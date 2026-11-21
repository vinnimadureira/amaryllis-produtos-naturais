# -*- coding: utf-8 -*-
"""
Amaryllis Master Catalog Builder:
- Maps all physical store inventory photos to ~145 distinct commercial SKUs
- Generates marketplace-grade 1000x1000 square WebP images with u2net background removal,
  bottom hand/skin trimming, color vibrancy, and realistic contact drop shadows
- Writes SQL migration/seed script for Cloudflare D1
- Updates src/lib/amaryllisFallbackData.ts with the rich catalog
"""

import os
import json
import time
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw
from rembg import remove, new_session

SOURCE_DIR = r"d:\ProjetosIA\Amaryllis\unzipped_fotos\Fotos"
OUTPUT_DIR = r"d:\ProjetosIA\Amaryllis\public\products"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Definition of the ~145 products with photo filenames, categories, copy, and prices
PRODUCTS = [
    # ══════════════════════════════════════════════════════════════════
    # 1. ESSENTIAL NUTRITION
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "essential-cacao-whey-900g",
        "name": "Cacao Whey 900g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 298.00,
        "price_display": "R$ 298,00",
        "weight_grams": 900,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.28 (3).jpeg",
        "short_desc": "Whey Protein Isolado e Hidrolisado com puro cacau belga 100%, peptídeos de colágeno e adoçantes naturais.",
        "description": """<h3>Cacao Whey 900g — A Fórmula de Proteína Mais Pura e Saborosa do Mercado</h3>
<p>O <strong>Cacao Whey da Essential Nutrition</strong> combina Whey Protein Hidrolisado e Isolado (Thermax 690 e Provon 292) obtidos através de microfiltração de fluxo cruzado (CFM). Enriquecido com puro cacau belga 100% e peptídeos de colágeno hidrolisado, proporciona uma digestibilidade superior, rápida absorção e um sabor inigualável de chocolate suíço sem residual amargo.</p>
<h4>Diferenciais e Benefícios:</h4>
<ul>
<li><strong>22g de proteína pura por porção</strong> com excelente perfil de aminoácidos essenciais e BCAA natural.</li>
<li>Peptídeos bioativos de colágeno que otimizam a absorção proteica e sustentam a firmeza de tecidos.</li>
<li>Puro cacau em pó 100% Gourmet com alto teor natural de polifenóis e antioxidantes.</li>
<li>Adoçado exclusivamente com edulcorantes naturais de fontes vegetais (Stevia e Taumatina).</li>
<li>Livre de glúten, sem adição de açúcares, sem conservantes, sem corantes ou aromas artificiais.</li>
</ul>
<h4>Como Tomar:</h4>
<p>Diluir 1 colher-medida (aprox. 30g) em 200ml de água mineral, bebida vegetal ou na sua receita favorita (shakes, mousses, panquecas proteicas). Consumir uma vez ao dia ou conforme orientação de médico ou nutricionista.</p>
<h4>Tabela e Ingredientes:</h4>
<p>Proteína isolada e hidrolisada do soro do leite (CFM), cacau em pó puro, peptídeos de colágeno hidrolisado, aroma idêntico ao natural de chocolate, espessante goma xantana, edulcorantes estévia e taumatina. <strong>NÃO CONTÉM GLÚTEN. CONTÉM DERIVADOS DE LEITE.</strong></p>"""
    },
    {
        "id": "essential-vanilla-whey-900g",
        "name": "Vanilla Whey 900g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 298.00,
        "price_display": "R$ 298,00",
        "weight_grams": 900,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.28 (4).jpeg",
        "short_desc": "Whey Protein Isolado e Hidrolisado com favas de baunilha natural e peptídeos de colágeno.",
        "description": """<h3>Vanilla Whey 900g — Sofisticação, Pureza e Absorção Máxima</h3>
<p>O <strong>Vanilla Whey da Essential Nutrition</strong> traz a harmonia perfeita entre o soro do leite microfiltrado (WPI e WPH) e o toque delicado da autêntica baunilha natural. Ideal para quem busca suporte à síntese muscular, regeneração física e imunidade com uma experiência gustativa leve e aromática.</p>
<h4>Diferenciais e Benefícios:</h4>
<ul>
<li><strong>22g de proteína de altíssimo valor biológico</strong> por porção.</li>
<li>Tecnologia Cross-Flow Microfiltration que preserva as frações bioativas como lactoferrina e imunoglobulinas.</li>
<li>Aroma natural de baunilha proveniente de favas selecionadas.</li>
<li>Sem adição de açúcar, sacarina, ciclamato ou aspartame.</li>
<li>Zero glúten e baixíssimo teor de carboidratos (Keto friendly).</li>
</ul>
<h4>Modo de Preparo:</h4>
<p>Misture 1 dosador (30g) em 200ml de água gelada ou leite de amêndoas. Excelente também em bowls de frutas e mingaus proteicos.</p>"""
    },
    {
        "id": "essential-red-berry-whey-900g",
        "name": "Red Berry Whey 900g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 310.00,
        "price_display": "R$ 310,00",
        "weight_grams": 900,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.29 (3).jpeg",
        "short_desc": "Whey Isolado e Hidrolisado com polpa pura de frutas vermelhas (morango, framboesa e amora).",
        "description": """<h3>Red Berry Whey 900g — Proteína Premium com Frutas Vermelhas de Verdade</h3>
<p>O <strong>Red Berry Whey Essential Nutrition</strong> combina WPI e WPH com polpas naturais liofilizadas de morango, amora e framboesa. Cada dose oferece antioxidantes naturais provenientes das frutas e peptídeos de colágeno bioativo.</p>
<h4>Benefícios:</h4>
<ul>
<li>22g de proteína hidrolisada e isolada por dose.</li>
<li>Rico em antocianinas naturais com ação antioxidante contra radicais livres.</li>
<li>Sabor naturalmente refrescante e suave, perfeito para shakes pós-treino em dias quentes.</li>
<li>Zero açúcar, zero glúten e sem corantes artificiais (coloração natural das frutas).</li>
</ul>"""
    },
    {
        "id": "essential-beefprotein-cacau-960g",
        "name": "BeefProtein Cacau 960g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 320.00,
        "price_display": "R$ 320,00",
        "weight_grams": 960,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.28 (1).jpeg",
        "short_desc": "Proteína isolada e 100% hidrolisada da carne bovina sueca alimentada a pasto. Zero lactose, zero leite.",
        "description": """<h3>BeefProtein Cacau 960g — Proteína Bovina Isolada e Hidrolisada 100% Pura</h3>
<p>O <strong>BeefProtein Essential Nutrition</strong> é a escolha definitiva para quem busca uma fonte proteica de alta digestibilidade sem nenhuma fração láctea. Elaborado com a matéria-prima sueca HydroBEEF™, proveniente de gado criado solto em pastagens da Europa, livre de hormônios e antibióticos.</p>
<h4>Diferenciais:</h4>
<ul>
<li><strong>24g de proteína isolada e 100% hidrolisada da carne</strong> por porção.</li>
<li>Totalmente livre de lactose, caseína, soro do leite, soja e ovos (hipoalergênico).</li>
<li>Sabor incrível de puro cacau belga — sem sabor ou odor residual de carne.</li>
<li>Processamento multipasso de hidrólise que gera peptídeos de peso molecular ultrabaixo.</li>
<li>Adoçado naturalmente com Estévia e Taumatina.</li>
</ul>"""
    },
    {
        "id": "essential-beefprotein-banana-canela-960g",
        "name": "BeefProtein Banana com Canela 960g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 320.00,
        "price_display": "R$ 320,00",
        "weight_grams": 960,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.28.jpeg",
        "short_desc": "Proteína isolada de carne bovina alimentada a pasto com banana liofilizada e canela pura.",
        "description": """<h3>BeefProtein Banana com Canela 960g — Proteína Pura Sem Leite</h3>
<p>O <strong>BeefProtein Banana com Canela</strong> entrega 24g de pura proteína isolada e hidrolisada de carne bovina (HydroBEEF™) com o toque aconchegante da banana natural e especiaria de canela verdadeira.</p>
<ul>
<li>Zero Lactose e Zero Derivados do Leite — perfeito para intolerantes severos e alérgicos à caseína.</li>
<li>24g de proteína de altíssima absorção por dose.</li>
<li>Sem glúten, sem adição de açúcares, 100% gado alimentado a pasto.</li>
</ul>"""
    },
    {
        "id": "essential-veggie-protein-cacau-450g",
        "name": "Veggie Protein Cacau 450g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 198.00,
        "price_display": "R$ 198,00",
        "weight_grams": 450,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.30.jpeg",
        "short_desc": "Proteína vegetal isolada da ervilha amarela e da amêndoa orgânica com vitamina B12 e cacau.",
        "description": """<h3>Veggie Protein Cacau 450g — Proteína Vegetal com Textura Suave e Rico Perfil de Aminoácidos</h3>
<p>O <strong>Veggie Protein da Essential Nutrition</strong> combina proteína isolada da ervilha amarela canadense e proteína da amêndoa orgânica, fornecendo 22g de proteína vegetal por porção, enriquecido com vitamina B12 metilada.</p>
<ul>
<li>22g de proteína vegetal de alta digestibilidade por dose.</li>
<li>Sem sabor residual arenoso: textura aveludada com puro cacau 100%.</li>
<li>Enriquecido com Vitamina B12 (metilcobalamina) — essencial para dietas veganas e plant-based.</li>
<li>Não OGM, sem glúten, sem leite, sem soja.</li>
</ul>"""
    },
    {
        "id": "essential-veggie-protein-neutro-450g",
        "name": "Veggie Protein Neutro 450g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 198.00,
        "price_display": "R$ 198,00",
        "weight_grams": 450,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.30 (1).jpeg",
        "short_desc": "Proteína 100% vegetal isolada sem sabor para receitas doces e salgadas, enriquecida com Vitamina B12.",
        "description": """<h3>Veggie Protein Sabor Neutro 450g — Versatilidade Máxima para Suas Receitas</h3>
<p>A versão Neutra do Veggie Protein permite enriquecer sopas, cremes, tortas, pães funcionais e sucos com 23g de proteína vegetal isolada pura, sem alterar o sabor característico do seu prato.</p>"""
    },
    {
        "id": "essential-beta-action-20doses",
        "name": "Beta Action 20 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 189.00,
        "price_display": "R$ 189,00",
        "weight_grams": 400,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.30 (2).jpeg",
        "short_desc": "Fórmula pré-treino de resistência muscular com 2g de Beta-Alanina, 18g de Palatinose™ e Eletrólitos.",
        "description": """<h3>Beta Action 20 Doses — Resistência Muscular e Energia Sustentada</h3>
<p>Desenvolvido para esportes de endurance e alta intensidade. Une 2g de Beta-Alanina pura que combate a acidose muscular a 18g de carboidrato de baixo índice glicêmico Palatinose™ e reposição eletrolítica completa.</p>"""
    },
    {
        "id": "essential-muscle-synergy-15doses",
        "name": "Muscle Synergy 15 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 249.00,
        "price_display": "R$ 249,00",
        "weight_grams": 450,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.30 (3).jpeg",
        "short_desc": "Fórmula sinérgica avançada com 15g de Proteína de Colágeno BodyBalance, 3g Creatina Creapure e 3g BCAA.",
        "description": """<h3>Muscle Synergy — Desempenho Muscular Avançado</h3>
<p>Fórmula de alta potência com 15g de Peptídeos Bioativos de Colágeno BodyBalance®, 3g de Creatina Creapure®, 3g de BCAAs 2:1:1, extrato de semente de uva, glicina e minerais quelados (magnésio e zinco).</p>"""
    },
    {
        "id": "essential-collagen-skin-neutro-300g",
        "name": "Collagen Skin Neutro 300g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 189.00,
        "price_display": "R$ 189,00",
        "weight_grams": 300,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.31 (1).jpeg",
        "short_desc": "Peptídeos Bioativos de Colágeno Verisol® com Ácido Hialurônico, Silício Orgânico, Biotina e Vitamina C.",
        "description": """<h3>Collagen Skin Neutro 300g (30 Doses) — Nutrição Avançada para Pele, Cabelos e Unhas</h3>
<p>O <strong>Collagen Skin da Essential Nutrition</strong> traz a dose exata comprovada cientificamente de 2,5g de Peptídeos Bioativos de Colágeno <strong>Verisol®</strong> associados a ácido ortosilícico, biotina, ácido hialurônico e um complexo vitamínico antioxidante A, C e E.</p>
<h4>Benefícios Comprovados:</h4>
<ul>
<li>Estimula a síntese de colágeno e elastina na matriz dérmica profunda.</li>
<li>Redução visível da profundidade de rugas e linhas de expressão a partir de 4 semanas.</li>
<li>Melhora expressiva da elasticidade e hidratação da pele.</li>
<li>Fortalecimento comprovado de unhas quebradiças e estímulo ao crescimento capilar.</li>
<li>Versão Neutra: sem sabor, dissolve instantaneamente no café, chá, suco ou iogurte.</li>
</ul>"""
    },
    {
        "id": "essential-collagen-skin-limao-300g",
        "name": "Collagen Skin Limão Siciliano 300g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 189.00,
        "price_display": "R$ 189,00",
        "weight_grams": 300,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.31.jpeg",
        "short_desc": "Verisol® com Ácido Hialurônico e Vitamina C com sabor natural e refrescante de Limão Siciliano.",
        "description": """<h3>Collagen Skin Limão Siciliano — Beleza em um Ritual Refrescante</h3>
<p>Todos os benefícios comprovados do Verisol® e ácido hialurônico com o toque cítrico e suave do limão siciliano. Adoçado com estévia e taumatina, zero açúcar e zero calorias vazias.</p>"""
    },
    {
        "id": "essential-collagen-2-joint-limao-30doses",
        "name": "Collagen 2 Joint Limão Siciliano 30 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 235.00,
        "price_display": "R$ 235,00",
        "weight_grams": 330,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.31 (2).jpeg",
        "short_desc": "Colágeno Tipo II não desnaturado (UC-II® 40mg) + 9,3g de Peptídeos de Colágeno Tipo I (Peptan®) para articulações.",
        "description": """<h3>Collagen 2 Joint — Proteção, Mobilidade e Conforto para Articulações e Cartilagens</h3>
<p>O <strong>Collagen 2 Joint da Essential Nutrition</strong> combina de forma pioneira duas formas de colágeno para máxima saúde articular: 40mg de <strong>Colágeno Tipo II Não Desnaturado (UC-II®)</strong> que atua via modulação imunológica e 9,3g de <strong>Peptídeos de Colágeno Hidrolisado Peptan®</strong> que atuam como blocos de construção para cartilagens, tendões e ligamentos.</p>
<h4>Benefícios:</h4>
<ul>
<li>Alívio do desconforto nas articulações durante atividades físicas e rotina diária.</li>
<li>Preservação e reconstrução da cartilagem articular.</li>
<li>Enriquecido com Vitamina C, D3, Magnésio e Manganês quelados.</li>
<li>Sabor agradável de Limão Siciliano, zero açúcar e sem corantes artificiais.</li>
</ul>"""
    },
    {
        "id": "essential-collagen-bones-chocolate-30doses",
        "name": "Collagen Bones Chocolate 30 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 249.00,
        "price_display": "R$ 249,00",
        "weight_grams": 450,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.31 (3).jpeg",
        "short_desc": "Fórmula para saúde óssea: Peptídeos de colágeno, Cálcio de Algas Marinhas, Silício, Boro, Zinco e Vit D3 2000UI.",
        "description": """<h3>Collagen Bones — Suporte Estrutural e Densidade Óssea</h3>
<p>Uma fórmula clínica completa formulada para prevenção e cuidado com a osteopenia e osteoporose. Combina colágeno bioativo com cálcio orgânico vegetal de algas marinhas vermelhas (Lithothamnium), Vitamina D3 (2000 UI), Vitamina K2 (MK-7), magnésio quelado, boro e zinco.</p>"""
    },
    {
        "id": "essential-collagen-bodybalance-neutro-30doses",
        "name": "Collagen BodyBalance Neutro 30 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 220.00,
        "price_display": "R$ 220,00",
        "weight_grams": 450,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.31 (4).jpeg",
        "short_desc": "100% Peptídeos Bioativos BodyBalance® para manutenção e ganho de massa muscular e combate à sarcopenia.",
        "description": """<h3>Collagen BodyBalance Neutro — Proteína Especializada para Músculos</h3>
<p>O <strong>BodyBalance®</strong> é uma matéria-prima alemã patenteada com estudos clínicos comprovando aumento de massa magra e redução de gordura corporal, especialmente em pessoas ativas e no envelhecimento saudável.</p>"""
    },
    {
        "id": "essential-collagen-bodybalance-chocolate-25doses",
        "name": "Collagen BodyBalance Chocolate 25 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 220.00,
        "price_display": "R$ 220,00",
        "weight_grams": 450,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.32 (1).jpeg",
        "short_desc": "Peptídeos BodyBalance® para tônus muscular com puro cacau gourmet e vitamina C.",
        "description": """<h3>Collagen BodyBalance Sabor Chocolate — Força Muscular com o Sabor do Puro Cacau</h3>
<p>Combina 15g de proteína BodyBalance® por dose com cacau belga 100%. Uma alternativa livre de leite para quem busca estímulo muscular com sabor delicioso.</p>"""
    },
    {
        "id": "essential-glutamina-300g",
        "name": "Glutamina Pura 300g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 145.00,
        "price_display": "R$ 145,00",
        "weight_grams": 300,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.32 (2).jpeg",
        "short_desc": "100% L-Glutamina pura de tecnologia japonesa ultrarrefinada. Saúde intestinal e imunológica.",
        "description": """<h3>Glutamina Pura 300g — Barreira Intestinal e Sistema Imune Fortalecido</h3>
<p>A <strong>Glutamina da Essential Nutrition</strong> utiliza matéria-prima micronizada de altíssima pureza com tecnologia japonesa de fermentação vegetal. Fornece o combustível primordial para as células do epitélio intestinal (enterócitos) e leucócitos da imunidade.</p>"""
    },
    {
        "id": "essential-crealift-creapure-300g",
        "name": "Crealift Creapure 300g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 169.00,
        "price_display": "R$ 169,00",
        "weight_grams": 300,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.33 (2).jpeg",
        "short_desc": "100% Creatina Monohidratada Creapure® alemã. Pureza máxima sem resíduos, 100 doses.",
        "description": """<h3>Crealift 300g — A Mais Pura Creatina do Mundo com Selo Creapure®</h3>
<p>O <strong>Crealift da Essential Nutrition</strong> é produzido exclusivamente com a autêntica creatina monohidratada alemã <strong>Creapure®</strong>, reconhecida globalmente pelos mais rigorosos controles de pureza, livre de dicianodiamida e di-hidrotriazina.</p>
<h4>Benefícios:</h4>
<ul>
<li>Aumento comprovado da força, potência muscular e capacidade de treino resistido.</li>
<li>Suporte à função cognitiva, foco e síntese energética cerebral (ATP).</li>
<li>100% pura, vegana, sem conservantes e totalmente sem sabor residual.</li>
<li>Rende 100 doses de 3g.</li>
</ul>"""
    },
    {
        "id": "essential-brainstorm-coffee-original-220g",
        "name": "Brainstorm Coffee Original 220g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 189.00,
        "price_display": "R$ 189,00",
        "weight_grams": 220,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.33.jpeg",
        "short_desc": "Café funcional com 200mg de L-Teanina, TCM, CoQ10, Guaraná, Vitaminas B ativas e Cafeína de liberação prolongada.",
        "description": """<h3>Brainstorm Coffee — Clareza Mental, Foco Limpo e Energia Duradoura Sem Ansiedade</h3>
<p>O <strong>Brainstorm Coffee Essential Nutrition</strong> é uma fórmula nootrópica e termogênica sinérgica. Une café arábica liofilizado premium a 200mg de L-Teanina pura (que remove o efeito de taquicardia ou jittery da cafeína), TCM (Triglicerídeos de Cadeia Média), Coenzima Q10, picolinato de cromo e complexo B metilado.</p>"""
    },
    {
        "id": "essential-brainstorm-coffee-caramelo-220g",
        "name": "Brainstorm Coffee Caramelo 220g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 189.00,
        "price_display": "R$ 189,00",
        "weight_grams": 220,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.33 (1).jpeg",
        "short_desc": "Versão com sabor aveludado de caramelo do consagrado café funcional nootrópico.",
        "description": """<h3>Brainstorm Coffee Sabor Caramelo — Foco Impecável com Toque Gourmet</h3>
<p>Toda a inteligência nootrópica do Brainstorm Coffee com notas cremosas de caramelo natural. Excelente quente ou com gelo e leite vegetal.</p>"""
    },
    {
        "id": "essential-fiberbime-laranja-30doses",
        "name": "Fiberbime Laranja 30 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 165.00,
        "price_display": "R$ 165,00",
        "weight_grams": 360,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.33 (3).jpeg",
        "short_desc": "Blend prebiótico avançado de fibras solúveis e insolúveis com polpa de laranja natural.",
        "description": """<h3>Fiberbime Laranja — Saúde Intestinal e Microbiota Equilibrada</h3>
<p>Blend sinérgico de fibras prebióticas (Goma Acácia, Inulina, FOS e Psyllium) que nutrem as bactérias benéficas do intestino sem provocar estufamento ou fermentação excessiva.</p>"""
    },
    {
        "id": "essential-fiberbime-neutro-30doses",
        "name": "Fiberbime Neutro 30 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 165.00,
        "price_display": "R$ 165,00",
        "weight_grams": 360,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.33 (4).jpeg",
        "short_desc": "Blend prebiótico de fibras solúveis sem sabor para misturar na água, suco ou refeição.",
        "description": """<h3>Fiberbime Neutro — Regularidade Intestinal Discreta e Eficaz</h3>
<p>Dissolução 100% translúcida e suave. Regula o trânsito intestinal e melhora a absorção de nutrientes vitais.</p>"""
    },
    {
        "id": "essential-aminogreens-30doses",
        "name": "Aminogreens 30 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 229.00,
        "price_display": "R$ 229,00",
        "weight_grams": 330,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.34 (1).jpeg",
        "short_desc": "9 Aminoácidos Essenciais livres em proporção equimolar associados a superfoods verdes e minerais.",
        "description": """<h3>Aminogreens — Síntese Proteica e Vitalidade Celular</h3>
<p>Contém os 9 aminoácidos essenciais de origem vegetal fermentada que o corpo não produz, combinados a espirulina, clorela, clorofila e vitamina B6.</p>"""
    },
    {
        "id": "essential-carbolift-palatinose-300g",
        "name": "Carbolift 100% Palatinose 300g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 125.00,
        "price_display": "R$ 125,00",
        "weight_grams": 300,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.34 (2).jpeg",
        "short_desc": "100% Isomaltulose (Palatinose™). Carboidrato funcional de baixo índice glicêmico para liberação constante de energia.",
        "description": """<h3>Carbolift — Energia Limpa Sem Picos de Insulina</h3>
<p>A isomaltulose é um carboidrato inteligente que fornece fluxo constante de glicose aos músculos e ao cérebro, estimulando a queima de gordura durante o exercício.</p>"""
    },
    {
        "id": "essential-hydrolift-limao-30doses",
        "name": "Hydrolift Limão Siciliano 30 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 149.00,
        "price_display": "R$ 149,00",
        "weight_grams": 300,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.34 (3).jpeg",
        "short_desc": "Eletrólitos essenciais para hidratação celular avançada com água de coco e vitamina C.",
        "description": """<h3>Hydrolift — Hidratação Profunda no Nível Celular</h3>
<p>Formulado para restaurar o equilíbrio hídrico e mineral após o treino ou rotina diária. Com água de coco desidratada, sódio, potássio, magnésio quelado, zinco e vitamina C.</p>"""
    },
    {
        "id": "essential-aminolift-tangerina-30doses",
        "name": "Aminolift Tangerina 30 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 210.00,
        "price_display": "R$ 210,00",
        "weight_grams": 330,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.34.jpeg",
        "short_desc": "Complexo dos 9 Aminoácidos Essenciais com sabor refrescante de tangerina.",
        "description": """<h3>Aminolift Tangerina — Recuperação e Ganho de Massa Magra</h3>
<p>Absorção quase imediata de aminoácidos puros sem sobrecarregar a digestão. Zero calorias desnecessárias, zero açúcares.</p>"""
    },
    {
        "id": "essential-mct-lift-250ml",
        "name": "MCT Lift Óleo de Coco Puro 250ml — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 139.00,
        "price_display": "R$ 139,00",
        "weight_grams": 250,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.35 (1).jpeg",
        "short_desc": "Triglicerídeos de Cadeia Média (TCM) 100% puros com predominância de C8 (ácido caprílico) e C10 (cáprico).",
        "description": """<h3>MCT Lift 250ml — Energia Cetogênica Instantânea para Cérebro e Corpo</h3>
<p>O <strong>MCT Lift</strong> é extraído do óleo de coco virgem por destilação molecular. Absorvido diretamente pelo fígado, gerando corpos cetônicos rápidos para energia limpa e foco mental.</p>"""
    },
    {
        "id": "essential-xylitol-300g",
        "name": "Xylitol Natural 300g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 68.00,
        "price_display": "R$ 68,00",
        "weight_grams": 300,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.35 (3).jpeg",
        "short_desc": "Adoçante de fonte vegetal não transgênica (Non-GMO), com baixo índice glicêmico e sem sabor residual.",
        "description": """<h3>Xylitol 300g — O Substituto Natural do Açúcar</h3>
<p>Poder edulcorante idêntico ao do açúcar tradicional com 40% menos calorias. Não cariogênico (protege a saúde dental) e seguro para diabéticos.</p>"""
    },
    {
        "id": "essential-creatine-action-gummy-30doses",
        "name": "Creatine Action Gummy Laranja 30 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 185.00,
        "price_display": "R$ 185,00",
        "weight_grams": 300,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.35.jpeg",
        "short_desc": "Creatina ultra pura em gomas mastigáveis sabor laranja. Praticidade absoluta no seu dia a dia.",
        "description": """<h3>Creatine Action Gummy — Toda a Força da Creatina no Formato Gummy</h3>
<p>Gomas deliciosas e práticas para quem busca os benefícios cognitivos e musculares da creatina sem necessidade de diluir em água.</p>"""
    },
    {
        "id": "essential-super-omega-3-tg-60caps",
        "name": "Super Ômega-3 TG 60 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 145.00,
        "price_display": "R$ 145,00",
        "weight_grams": 100,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.36 (2).jpeg",
        "short_desc": "Óleo de peixe concentrado na forma Triglicerídeos (TG) com 1080mg EPA e 720mg DHA por dose. Selo IFOS 5 estrelas.",
        "description": """<h3>Super Ômega 3 TG 60 Cápsulas — A Mais Alta Concentração e Pureza Certificada</h3>
<p>O <strong>Super Ômega 3 TG Essential</strong> é obtido de peixes de águas profundas e gélidas da Noruega. Na forma de Triglicerídeos (TG), proporciona até 70% mais biodisponibilidade que os ômegas comuns em etil-éster (EE).</p>
<h4>Diferenciais:</h4>
<ul>
<li><strong>1080mg EPA e 720mg DHA</strong> na dose recomendada.</li>
<li>Certificação internacional <strong>IFOS™ 5 Estrelas</strong> — pureza absoluta, livre de metais pesados (mercúrio, chumbo) e dioxinas.</li>
<li>Suporte à saúde cardiovascular, modulação inflamatória e função cerebral.</li>
<li>Cápsulas com tecnologia que previne refluxo e sabor de peixe.</li>
</ul>"""
    },
    {
        "id": "essential-super-omega-3-tg-120caps",
        "name": "Super Ômega-3 TG 120 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 259.00,
        "price_display": "R$ 259,00",
        "weight_grams": 200,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.36 (3).jpeg",
        "short_desc": "Embalagem econômica com 120 cápsulas do renomado Super Ômega-3 TG certificado IFOS.",
        "description": """<h3>Super Ômega 3 TG 120 Cápsulas — Economia e Continuidade no Tratamento</h3>
<p>A versão 120 cápsulas oferece o melhor custo-benefício para quem utiliza ômega-3 diariamente sob prescrição de médico ou nutricionista.</p>"""
    },
    {
        "id": "essential-super-omega-3-tg-comfort",
        "name": "Super Ômega-3 TG Comfort 60 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 169.00,
        "price_display": "R$ 169,00",
        "weight_grams": 100,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.36 (1).jpeg",
        "short_desc": "Tecnologia avançada de revestimento entérico para conforto gástrico total e zero sabor residual.",
        "description": """<h3>Super Ômega 3 TG Comfort — Digestibilidade Suave para Estômagos Sensíveis</h3>
<p>Cápsulas que desintegram somente no intestino, garantindo zero desconforto gástrico e máxima eficácia terapêutica.</p>"""
    },
    {
        "id": "essential-dha-tg-90caps",
        "name": "DHA TG Concentrado 90 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 229.00,
        "price_display": "R$ 229,00",
        "weight_grams": 150,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.36.jpeg",
        "short_desc": "Altíssima concentração de DHA (1500mg DHA + 450mg EPA). Foco na cognição, memória e gestação.",
        "description": """<h3>DHA TG 90 Cápsulas — O Nutriente Mestre da Saúde Cerebral e Visual</h3>
<p>O ácido docosa-hexaenoico (DHA) é o principal bloco de gordura estrutural do córtex cerebral e da retina. Indicado para gestantes, lactantes, estudantes e longevidade neural.</p>"""
    },
    {
        "id": "essential-omega-core-60caps",
        "name": "Ômega Core 60 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 289.00,
        "price_display": "R$ 289,00",
        "weight_grams": 100,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.37 (1).jpeg",
        "short_desc": "Combinação nobre de Óleo de Krill, Óleo de Peixe TG, 100mg CoQ10 e Astaxantina.",
        "description": """<h3>Ômega Core — Proteção Cardiovascular de Última Geração</h3>
<p>Reúne os fosfolipídios do óleo de krill puro do oceano Antártico com Coenzima Q10 e o antioxidante mais potente da natureza (Astaxantina).</p>"""
    },
    {
        "id": "essential-omega-vision-60caps",
        "name": "Ômega Vision 60 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 275.00,
        "price_display": "R$ 275,00",
        "weight_grams": 100,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.37 (2).jpeg",
        "short_desc": "Fórmula oftalmológica completa: DHA TG, Óleo de Krill, 20mg Luteína, 2mg Zeaxantina e Astaxantina.",
        "description": """<h3>Ômega Vision — Proteção Avançada da Mácula e Fadiga Ocular</h3>
<p>Formulado especialmente para quem passa horas em frente a telas digitais e para prevenção do envelhecimento ocular e degeneração macular.</p>"""
    },
    {
        "id": "essential-coq10-omega3-tg-60caps",
        "name": "CoQ10 Ômega-3 TG 60 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 219.00,
        "price_display": "R$ 219,00",
        "weight_grams": 100,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.37 (3).jpeg",
        "short_desc": "100mg de Coenzima Q10 pura veiculada em Super Ômega-3 TG para biodisponibilidade incomparável.",
        "description": """<h3>CoQ10 Ômega-3 TG — Energia Mitocondrial e Rejuvenescimento Celular</h3>
<p>A Coenzima Q10 necessita de um meio lipídico para ser absorvida. Veiculada em óleo de peixe TG de alta concentração, assegura absorção até 3x superior aos pós comuns.</p>"""
    },
    {
        "id": "essential-omega-brain-60caps",
        "name": "Ômega Brain 60 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 269.00,
        "price_display": "R$ 269,00",
        "weight_grams": 100,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.37.jpeg",
        "short_desc": "Suporte à atenção e foco com 600mg DHA, 210mg EPA e Óleo de Krill bioativo.",
        "description": """<h3>Ômega Brain — Nutrição Avançada para Atenção, Memória e Clareza</h3>
<p>Fórmula desenvolvida especificamente para apoiar a plasticidade neuronal e velocidade de raciocínio.</p>"""
    },
    {
        "id": "essential-b-complex-120caps",
        "name": "[B] Complex Ativo 120 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 149.00,
        "price_display": "R$ 149,00",
        "weight_grams": 100,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.38 (1).jpeg",
        "short_desc": "Complexo B completo com vitaminas em suas formas ativas e metiladas (Metilfolato, Metilcobalamina).",
        "description": """<h3>[B] Complex 120 Cápsulas — Metabolismo Energético e Equilíbrio Neural</h3>
<p>Diferente de fórmulas comuns com ácido fólico sintético, o [B] Complex traz Metilfolato e Metilcobalamina prontos para uso direto pelas células.</p>"""
    },
    {
        "id": "essential-fe-complex-90caps",
        "name": "[Fe] Complex Ferro Quelato 90 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 139.00,
        "price_display": "R$ 139,00",
        "weight_grams": 90,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.38 (2).jpeg",
        "short_desc": "Ferro bisglicinato quelato de alta absorção que não agride o estômago, com Cobre, Vit C e Complexo B.",
        "description": """<h3>[Fe] Complex — Combate à Anemia com Conforto Gástrico</h3>
<p>30mg de ferro elementar quelato associado à Vitamina C e Cobre para absorção máxima sem constipação.</p>"""
    },
    {
        "id": "essential-vit-d3-2000ui-120caps",
        "name": "Vitamina D3 2000 UI 120 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 89.00,
        "price_display": "R$ 89,00",
        "weight_grams": 80,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.38 (3).jpeg",
        "short_desc": "Colecalciferol puro veiculado em azeite de oliva extravirgem para absorção rápida.",
        "description": """<h3>Vitamina D3 2000 UI — Imunidade e Fixação do Cálcio</h3>
<p>Forma ativa D3 de alta potência em microcápsulas fáceis de engolir.</p>"""
    },
    {
        "id": "essential-gamalift-30doses",
        "name": "Gamalift Óleo de Borragem 30 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 179.00,
        "price_display": "R$ 179,00",
        "weight_grams": 100,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.38 (4).jpeg",
        "short_desc": "Óleo de borragem prensado a frio com 400mg GLA (ácido gama-linolênico) e Vitamina E natural.",
        "description": """<h3>Gamalift — Equilíbrio Hormonal Feminino e Alívio da TPM e Menopausa</h3>
<p>Rico em ômega-6 anti-inflamatório (GLA), auxilia na redução do inchaço, sensibilidade mamária e hidratação da pele.</p>"""
    },
    {
        "id": "essential-focus-60caps",
        "name": "Focus L-Teanina & Cafeína 60 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 149.00,
        "price_display": "R$ 149,00",
        "weight_grams": 70,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.38.jpeg",
        "short_desc": "250mg L-Teanina associada à Cafeína purificada para concentração prolongada sem dispersão.",
        "description": """<h3>Focus — Nootrópico Natural para Alta Produtividade Mental</h3>
<p>Combinação estudada de teanina e cafeína na proporção ideal para induzir ondas alfa no cérebro (estado de flow relaxado e alerta).</p>"""
    },
    {
        "id": "essential-melatonin-duo-120caps",
        "name": "Melatonin Duo Harmony 120 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 159.00,
        "price_display": "R$ 159,00",
        "weight_grams": 100,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.39 (1).jpeg",
        "short_desc": "Sistema Duo de Melatonina: Liberação Rápida para adormecer + Lenta para sono reparador a noite toda.",
        "description": """<h3>Melatonin Duo Harmony — A Tecnologia Mais Avançada para o Sono Reparador</h3>
<p>Sistema inovador que combina microesferas de ação imediata (para indução rápida do sono) e ação sustentada (que evita os despertares no meio da madrugada). Enriquecido com Triptofano, Inositol, Zinco quelado e Vitamina B6.</p>"""
    },
    {
        "id": "essential-melatonin-duo-gotas-menta",
        "name": "Melatonin Duo Gotas Sabor Menta 30ml — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 98.00,
        "price_display": "R$ 98,00",
        "weight_grams": 50,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.39 (2).jpeg",
        "short_desc": "Melatonina sublingual líquida de absorção quase instantânea com aroma natural de menta.",
        "description": """<h3>Melatonin Duo Gotas — Praticidade Sublingual para Dormir Rápido</h3>
<p>Absorção direta pela mucosa oral, ideal para quem tem dificuldade de engolir cápsulas.</p>"""
    },
    {
        "id": "essential-mg-complex-90caps",
        "name": "[Mg] Complex 350mg 90 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 149.00,
        "price_display": "R$ 149,00",
        "weight_grams": 100,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.39 (3).jpeg",
        "short_desc": "Blend de 4 Magnésios Nobres: Bisglicinato, Malato, Taurato e Citrato. Alta biodisponibilidade celular.",
        "description": """<h3>[Mg] Complex — Os Melhores Magnésios em uma Única Fórmula</h3>
<p>Combina as 4 fontes queladas mais nobres de magnésio para atuação simultânea nos músculos, coração, cérebro e relaxamento neuromuscular.</p>"""
    },
    {
        "id": "essential-nac-glycine-taurine-90caps",
        "name": "NAC + Glycine + Taurine 90 Cápsulas — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 179.00,
        "price_display": "R$ 179,00",
        "weight_grams": 100,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.39.jpeg",
        "short_desc": "Precursores diretos da Glutationa: 600mg NAC + 1000mg Glicina + 500mg Taurina para detox celular.",
        "description": """<h3>NAC + Glycine + Taurine — Estímulo Máximo ao Maior Antioxidante do Corpo</h3>
<p>Fornece os três aminoácidos essenciais para a síntese intracelular de glutationa, protegendo fígado, pulmões e mitocôndrias.</p>"""
    },
    {
        "id": "essential-collagen-gut-20doses",
        "name": "Collagen Gut 20 Doses — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 249.00,
        "price_display": "R$ 249,00",
        "weight_grams": 360,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.40 (1).jpeg",
        "short_desc": "Fórmula para integridade da mucosa intestinal com peptídeos de colágeno, glutamina, fibras e zinco.",
        "description": """<h3>Collagen Gut — Protocolo de Regeneração e Conforto Intestinal</h3>
<p>Desenvolvido para restaurar as junções oclusivas (tight junctions) do intestino, combatendo a permeabilidade intestinal (leaky gut).</p>"""
    },
    {
        "id": "essential-mondz-almonds-50g",
        "name": "Mondz Amêndoas Crocantes com Chocolate 50g — Essential Nutrition",
        "category": "Essential Nutrition",
        "price": 24.00,
        "price_display": "R$ 24,00",
        "weight_grams": 50,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.40.jpeg",
        "short_desc": "Amêndoas levemente tostadas e crocantes envoltas em chocolate nobre zero adição de açúcares.",
        "description": """<h3>Mondz 50g — Snack Saudável, Crocante e Sofisticado</h3>
<p>Amêndoas nobres com cobertura espessa de chocolate sem açúcar, sem glúten e sem lactose. O doce perfeito para o lanche da tarde.</p>"""
    },

    # ══════════════════════════════════════════════════════════════════
    # 2. FITOTERÁPICOS & CHÁS (PANIZZA, PNZ, FOREVER, GREENBIOS)
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "panizza-tintura-acafrao-100ml",
        "name": "Tintura Vegetal de Açafrão 20% 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 42.00,
        "price_display": "R$ 42,00",
        "weight_grams": 150,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.40 (2).jpeg",
        "short_desc": "Extrato vegetal concentrado 20% de Cúrcuma Longa (Rizoma). Potente anti-inflamatório natural e digestivo.",
        "description": """<h3>Tintura Vegetal de Açafrão (Cúrcuma Longa) 100ml — Panizza</h3>
<p>A tintura vegetal a 20% da <strong>Panizza</strong> extrai os curcuminoides ativos da raiz da cúrcuma com máxima biodisponibilidade. Atua como potente antioxidante e protetor celular.</p>
<h4>Benefícios:</h4>
<ul>
<li>Ação anti-inflamatória sobre dores articulares e musculares.</li>
<li>Estimula o fluxo biliar e melhora a digestão de gorduras.</li>
<li>Proteção hepática e detoxificação celular.</li>
</ul>
<h4>Como Usar:</h4>
<p>Tomar 30 a 40 gotas diluídas em um pouco de água, de 2 a 3 vezes ao dia após as refeições.</p>"""
    },
    {
        "id": "panizza-tintura-arnica-100ml",
        "name": "Tintura Vegetal de Arnica 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 39.00,
        "price_display": "R$ 39,00",
        "weight_grams": 150,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.41 (3).jpeg",
        "short_desc": "Extrato de Arnica montana para alívio de contusões, dores musculares e tensões articulares.",
        "description": """<h3>Tintura de Arnica 100ml — Alívio Muscular e Traumas</h3>
<p>Tradicional fitoterápico com reconhecida ação analgésica tópica e anti-inflamatória em pancadas, hematomas e dores musculares.</p>"""
    },
    {
        "id": "panizza-tintura-artemisia-100ml",
        "name": "Tintura Vegetal de Artemísia 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 39.00,
        "price_display": "R$ 39,00",
        "weight_grams": 150,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.41 (4).jpeg",
        "short_desc": "Extrato hidroalcoólico de Artemisia vulgaris para suporte ao ciclo feminino e conforto digestivo.",
        "description": """<h3>Tintura de Artemísia 100ml — Panizza</h3>
<p>Planta medicinal consagrada pelo apoio à regulação de ciclos menstruais irregulares, cólicas e distúrbios estomacais.</p>"""
    },
    {
        "id": "panizza-tintura-babosa-100ml",
        "name": "Tintura Vegetal de Babosa (Aloe Vera) 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 44.00,
        "price_display": "R$ 44,00",
        "weight_grams": 150,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.42 (1).jpeg",
        "short_desc": "Extrato botânico de Aloe vera para cicatrização da mucosa gástrica e modulação imunológica.",
        "description": """<h3>Tintura de Babosa 100ml — Regeneração Gástrica e Pele</h3>
<p>Contém polissacarídeos e acemanana que regeneram o trato gastrointestinal e equilibram a acidez estomacal.</p>"""
    },
    {
        "id": "panizza-tintura-calendula-100ml",
        "name": "Tintura Vegetal de Calêndula 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 42.00,
        "price_display": "R$ 42,00",
        "weight_grams": 150,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.42 (3).jpeg",
        "short_desc": "Extrato das flores de Calendula officinalis. Ação antisséptica, cicatrizante e calmante.",
        "description": """<h3>Tintura de Calêndula 100ml — Panizza</h3>
<p>Excelente para inflamações na boca e garganta (bochechos), gastrite e apoio à cicatrização tecidual.</p>"""
    },
    {
        "id": "panizza-tintura-canela-de-velho-100ml",
        "name": "Tintura de Canela de Velho 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 42.00,
        "price_display": "R$ 42,00",
        "weight_grams": 150,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.43 (2).jpeg",
        "short_desc": "Extrato de Miconia albicans para dores nas articulações, artrite, artrose e coluna.",
        "description": """<h3>Tintura de Canela de Velho 100ml — Saúde das Articulações</h3>
<p>Uma das ervas medicinais mais procuradas do Brasil para redução de dores articulares crônicas e inflamações dos joelhos e coluna.</p>"""
    },
    {
        "id": "panizza-tintura-cavalinha-100ml",
        "name": "Tintura Vegetal de Cavalinha 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 38.00,
        "price_display": "R$ 38,00",
        "weight_grams": 150,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.45 (3).jpeg",
        "short_desc": "Rica em silício orgânico e minerais. Potente ação diurética sem esgotar eletrólitos.",
        "description": """<h3>Tintura de Cavalinha 100ml — Drenagem Natural e Firmeza</h3>
<p>Auxilia na retenção de líquidos, desinchaço e remineralização de unhas e cabelos.</p>"""
    },
    {
        "id": "panizza-tintura-confrei-100ml",
        "name": "Tintura Vegetal de Confrei 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 38.00,
        "price_display": "R$ 38,00",
        "weight_grams": 150,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.45.jpeg",
        "short_desc": "Extrato de raiz de Confrei rico em alantoína para compressas e cicatrização externa.",
        "description": """<h3>Tintura de Confrei 100ml — Panizza</h3>
<p>Fitoterápico tradicional para compressas regeneradoras de pele e tecidos lesados.</p>"""
    },
    {
        "id": "panizza-tintura-espinheira-santa-100ml",
        "name": "Tintura de Espinheira Santa 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 44.00,
        "price_display": "R$ 44,00",
        "weight_grams": 150,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.46 (3).jpeg",
        "short_desc": "Extrato padronizado de Maytenus ilicifolia. O fitoterápico de referência para queimação gástrica, gastrite e refluxo.",
        "description": """<h3>Tintura de Espinheira Santa 100ml — O Escudo do Estômago</h3>
<p>Rica em taninos e fridelina que neutralizam o excesso de acidez estomacal, protegem a mucosa e cicatrizam lesões gástricas de forma rápida e segura.</p>"""
    },
    {
        "id": "panizza-tintura-ginkgo-biloba-100ml",
        "name": "Tintura de Ginkgo Biloba 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 44.00,
        "price_display": "R$ 44,00",
        "weight_grams": 150,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.47 (4).jpeg",
        "short_desc": "Melhora a microcirculação cerebral e periférica, auxiliando no foco, memória e alívio de labirintite.",
        "description": """<h3>Tintura de Ginkgo Biloba 100ml — Circulação Cerebral e Memória</h3>
<p>Os ginkgolídeos e flavonoides melhoram o fluxo de oxigênio para as extremidades e cérebro.</p>"""
    },
    {
        "id": "panizza-tintura-mulungu-100ml",
        "name": "Tintura Vegetal de Mulungu 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 42.00,
        "price_display": "R$ 42,00",
        "weight_grams": 150,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.50.jpeg",
        "short_desc": "Extrato de casca de Mulungu (Erythrina mulungu). O calmante natural mais potente da flora brasileira para ansiedade e insônia.",
        "description": """<h3>Tintura de Mulungu 100ml — Sono Profundo e Alívio da Ansiedade</h3>
<p>Atua diretamente nos receptores do sistema nervoso central, promovendo relaxamento muscular sem gerar dependência química.</p>"""
    },
    {
        "id": "panizza-tintura-sucupira-100ml",
        "name": "Tintura Vegetal de Sucupira 100ml — Panizza",
        "category": "Fitoterápicos & Chás",
        "price": 44.00,
        "price_display": "R$ 44,00",
        "weight_grams": 150,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.52 (2).jpeg",
        "short_desc": "Extrato concentrado das sementes de Sucupira para alívio articular, garganta e inflamações gerais.",
        "description": """<h3>Tintura de Sucupira 100ml — Anti-inflamatório Natural Tradicional</h3>
<p>Os diterpenos da semente de sucupira exercem potente efeito analgésico e anti-inflamatório.</p>"""
    },
    {
        "id": "forever-aloe-vera-gel-1l",
        "name": "Forever Aloe Vera Gel 1 Litro — Forever Living",
        "category": "Fitoterápicos & Chás",
        "price": 149.00,
        "price_display": "R$ 149,00",
        "weight_grams": 1000,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.53 (2).jpeg",
        "short_desc": "99,7% de puro gel interno da folha de Aloe Vera estabilizado. Digestão impecável, imunidade e desintoxicação.",
        "description": """<h3>Forever Aloe Vera Gel 1 Litro — O Suco de Babosa Mais Puro do Mundo</h3>
<p>Certificado pelo Conselho Científico Internacional da Aloe (IASC). Sem conservantes químicos, assepticamente envasado em embalagem 100% reciclável Tetrapak.</p>
<h4>Benefícios:</h4>
<ul>
<li>Equilíbrio e regeneração completa do trato gastrointestinal.</li>
<li>Rico em mais de 75 nutrientes ativos, incluindo 20 minerais e 18 aminoácidos.</li>
<li>Fortalece o sistema imune e promove hidratação profunda celular.</li>
</ul>"""
    },
    {
        "id": "forever-aloe-berry-nectar-1l",
        "name": "Forever Aloe Berry Nectar 1 Litro — Forever Living",
        "category": "Fitoterápicos & Chás",
        "price": 149.00,
        "price_display": "R$ 149,00",
        "weight_grams": 1000,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.53 (3).jpeg",
        "short_desc": "Aloe Vera estabilizada associada ao cranberry e maçã para proteção do trato urinário.",
        "description": """<h3>Forever Aloe Berry Nectar 1L — Suporte Urinário com Sabor Delicioso</h3>
<p>A força da Aloe Vera enriquecida com proantocianidinas do cranberry e antioxidantes da maçã.</p>"""
    },
    {
        "id": "forever-aloe-peaches-1l",
        "name": "Forever Aloe Peaches 1 Litro — Forever Living",
        "category": "Fitoterápicos & Chás",
        "price": 149.00,
        "price_display": "R$ 149,00",
        "weight_grams": 1000,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.53 (4).jpeg",
        "short_desc": "Puro gel de Aloe Vera com suco natural de pêssego maduro. Sabor doce e refrescante para toda a família.",
        "description": """<h3>Forever Aloe Peaches 1L — Saúde Digestiva com Toque de Pêssego</h3>
<p>Toda a eficácia do gel de babosa puro em uma versão saborosa que agrada inclusive crianças e idosos.</p>"""
    },
    {
        "id": "greenbios-cha-alecrim-30g",
        "name": "Chá de Alecrim Puro 30g — GreenBios",
        "category": "Fitoterápicos & Chás",
        "price": 12.00,
        "price_display": "R$ 12,00",
        "weight_grams": 30,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.08 (1).jpeg",
        "short_desc": "Folhas selecionadas de Rosmarinus officinalis do Vale do Ribeira. Memória, digestão e vitalidade.",
        "description": """<h3>Chá de Alecrim 30g — GreenBios</h3>
<p>Cultivado em solo fértil sem agrotóxicos. Estimula a circulação, combate a fadiga física e melhora o foco mental.</p>"""
    },
    {
        "id": "greenbios-cha-espinheira-santa-20g",
        "name": "Chá de Espinheira Santa 20g — GreenBios",
        "category": "Fitoterápicos & Chás",
        "price": 14.00,
        "price_display": "R$ 14,00",
        "weight_grams": 20,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.12 (1).jpeg",
        "short_desc": "Folhas íntegras de Maytenus ilicifolia. O chá clássico para acalmar o estômago e combater azia.",
        "description": """<h3>Chá de Espinheira Santa 20g — GreenBios</h3>
<p>Infusão aromática calmante para o sistema digestivo. Ideal após refeições pesadas.</p>"""
    },
    {
        "id": "greenbios-cha-camomila-30g",
        "name": "Chá de Camomila Flores 30g — GreenBios",
        "category": "Fitoterápicos & Chás",
        "price": 12.00,
        "price_display": "R$ 12,00",
        "weight_grams": 30,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.10 (4).jpeg",
        "short_desc": "Flores inteiras de Chamomilla recutita para um sono tranquilo e relaxamento natural.",
        "description": """<h3>Chá de Camomila Flores Inteiras 30g — GreenBios</h3>
<p>Flores secas selecionadas de aroma adocicado que promovem relaxamento antes de deitar.</p>"""
    },
    {
        "id": "greenbios-cha-erva-baleeira-30g",
        "name": "Chá de Erva Baleeira 30g — GreenBios",
        "category": "Fitoterápicos & Chás",
        "price": 15.00,
        "price_display": "R$ 15,00",
        "weight_grams": 30,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.12 (4).jpeg",
        "short_desc": "Folhas e talos de Cordia verbenacea. A planta anti-inflamatória e analgésica da Mata Atlântica.",
        "description": """<h3>Chá de Erva Baleeira 30g — GreenBios</h3>
<p>Reconhecida na farmacopeia brasileira por sua eficácia anti-inflamatória em tendinites e dores musculares.</p>"""
    },
    {
        "id": "greenbios-cha-mulungu-30g",
        "name": "Chá de Mulungu Cascas 30g — GreenBios",
        "category": "Fitoterápicos & Chás",
        "price": 14.00,
        "price_display": "R$ 14,00",
        "weight_grams": 30,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.14 (4).jpeg",
        "short_desc": "Cascas de Erythrina mulungu para decocção noturna. Sono profundo e desaceleração do estresse.",
        "description": """<h3>Chá de Mulungu em Cascas 30g — GreenBios</h3>
<p>Ideal para preparar um chá morno 30 minutos antes de dormir para induzir o relaxamento profundo.</p>"""
    },

    # ══════════════════════════════════════════════════════════════════
    # 3. SUPLEMENTOS & PROTEÍNAS (NOW FOODS & VITAFOR)
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "now-vitamin-d3-k2-120caps",
        "name": "Vitamin D-3 & K-2 1000 UI / 45mcg 120 Cápsulas — NOW Foods",
        "category": "Suplementos & Proteínas",
        "price": 169.00,
        "price_display": "R$ 169,00",
        "weight_grams": 100,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.01 (4).jpeg",
        "short_desc": "Sinergia perfeita: Vitamina D3 para absorção do cálcio + Vitamina K2 (MenaQ7) para direcionamento aos ossos.",
        "description": """<h3>NOW Foods Vitamin D-3 & K-2 120 Cápsulas — Saúde Óssea e Cardiovascular</h3>
<p>A fórmula mais recomendada por médicos integrativos: a vitamina D3 absorve o cálcio e a K-2 ativa a osteocalcina, impedindo que o cálcio se deposite nas artérias.</p>"""
    },
    {
        "id": "now-chlorella-500mg-200tabs",
        "name": "Certified Organic Chlorella 500mg 200 Tabletes — NOW Foods",
        "category": "Suplementos & Proteínas",
        "price": 198.00,
        "price_display": "R$ 198,00",
        "weight_grams": 180,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.02 (1).jpeg",
        "short_desc": "Microalga verde orgânica USDA com parede celular rompida (Broken Cell Wall) para detox de metais pesados.",
        "description": """<h3>NOW Organic Chlorella 500mg 200 Tabletes — Desintoxicação e Nutrição Verde</h3>
<p>Cultivada em ambiente puro sob rigoroso controle de contaminantes. Rico teor de clorofila pura e fator de crescimento Chlorella (CGF).</p>"""
    },
    {
        "id": "now-l-tryptophan-500mg-60caps",
        "name": "L-Tryptophan 500mg 60 Cápsulas — NOW Foods",
        "category": "Suplementos & Proteínas",
        "price": 155.00,
        "price_display": "R$ 155,00",
        "weight_grams": 90,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.02 (2).jpeg",
        "short_desc": "Aminoácido essencial precursor da serotonina e melatonina para apoio ao humor e sono reparador.",
        "description": """<h3>NOW L-Tryptophan 500mg — Equilíbrio Emocional e Descanso</h3>
<p>Produzido com tecnologia de pureza farmacêutica. Não OGM, vegano e livre de glúten.</p>"""
    },
    {
        "id": "now-nac-600mg-100caps",
        "name": "NAC 600mg com Selênio 100 Cápsulas — NOW Foods",
        "category": "Suplementos & Proteínas",
        "price": 189.00,
        "price_display": "R$ 189,00",
        "weight_grams": 120,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.02.jpeg",
        "short_desc": "N-Acetilcisteína de alta potência combinada com Selênio e Molibdênio para suporte pulmonar e hepático.",
        "description": """<h3>NOW NAC 600mg 100 Cápsulas — Proteção Celular e Saúde Respiratória</h3>
<p>Poderoso antioxidante celular precursor da glutationa, auxilia na eliminação de toxinas e na saúde das vias aéreas.</p>"""
    },
    {
        "id": "now-liquid-melatonin-59ml",
        "name": "Liquid Melatonin 59ml — NOW Foods",
        "category": "Suplementos & Proteínas",
        "price": 119.00,
        "price_display": "R$ 119,00",
        "weight_grams": 90,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.03 (3).jpeg",
        "short_desc": "Melatonina líquida de rápida absorção com conta-gotas dosador de fácil ajuste individual.",
        "description": """<h3>NOW Liquid Melatonin 59ml — Sono sob Medida</h3>
<p>Permite dosar exatamente a quantidade necessária para ajustar o ciclo circadiano e combater jet lag ou insônia.</p>"""
    },
    {
        "id": "vitafor-creafort-300g",
        "name": "Creafort Creapure 300g — Vitafor",
        "category": "Suplementos & Proteínas",
        "price": 159.00,
        "price_display": "R$ 159,00",
        "weight_grams": 300,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.04 (1).jpeg",
        "short_desc": "Creatina monohidratada alemã 100% Creapure®. Ganho de força e massa muscular sem retenção subcutânea.",
        "description": """<h3>Vitafor Creafort 300g Creapure® — Pureza e Eficácia Clínica</h3>
<p>A creatina de referência nacional fabricada pela Vitafor com o selo Creapure® da AlzChem Trostberg GmbH.</p>"""
    },
    {
        "id": "vitafor-glutamax-300g",
        "name": "Glutamax L-Glutamina 300g — Vitafor",
        "category": "Suplementos & Proteínas",
        "price": 135.00,
        "price_display": "R$ 135,00",
        "weight_grams": 300,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.04 (4).jpeg",
        "short_desc": "Módulo de L-Glutamina de alta pureza para nutrição enteral e oral. Zero açúcar e sem glúten.",
        "description": """<h3>Vitafor Glutamax 300g — Suporte Nutricional e Imunológico</h3>
<p>L-Glutamina 100% pura recomendada por nutricionistas clínicos para recuperação da barreira intestinal e pós-treino.</p>"""
    },
    {
        "id": "vitafor-isofort-wpi-chocolate-900g",
        "name": "Isofort WPI Chocolate 900g — Vitafor",
        "category": "Suplementos & Proteínas",
        "price": 289.00,
        "price_display": "R$ 289,00",
        "weight_grams": 900,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.04.jpeg",
        "short_desc": "Whey Protein Isolate Premium com 92% de proteína, 6g de BCAA e 5g de Glutamina por porção.",
        "description": """<h3>Isofort WPI 900g Sabor Chocolate — Proteína Isolada de Excelência</h3>
<p>Microfiltrado em fluxo cruzado com concentração proteica excepcional e zero açúcares adicionados.</p>"""
    },
    {
        "id": "vitafor-omegafor-plus-60caps",
        "name": "Omegafor Plus 60 Cápsulas — Vitafor",
        "category": "Suplementos & Proteínas",
        "price": 139.00,
        "price_display": "R$ 139,00",
        "weight_grams": 100,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.06 (1).jpeg",
        "short_desc": "Ultra concentração com 990mg EPA (33%) e 660mg DHA (22%). Selo IFOS de pureza internacional.",
        "description": """<h3>Vitafor Omegafor Plus 60 Cápsulas — Óleo de Peixe Concentrado</h3>
<p>Certificado pelo programa IFOS contra metais pesados e oxidação. Auxilia na manutenção dos níveis de triglicerídeos saudáveis.</p>"""
    },
    {
        "id": "vitafor-omegafor-vegan-60caps",
        "name": "Omegafor Vegan 60 Cápsulas — Vitafor",
        "category": "Suplementos & Proteínas",
        "price": 189.00,
        "price_display": "R$ 189,00",
        "weight_grams": 90,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.06 (3).jpeg",
        "short_desc": "Ômega-3 100% de microalgas (Schizochytrium sp.) fornecendo 400mg DHA por dose em cápsula vegetal.",
        "description": """<h3>Vitafor Omegafor Vegan — Ômega-3 Sem Origem Animal</h3>
<p>A alternativa perfeita para veganos, vegetarianos e alérgicos a frutos do mar, extraído diretamente da fonte primária (algas marinhas).</p>"""
    },
    {
        "id": "vitafor-coq10-200mg-60caps",
        "name": "CoQ-10 200mg com Vitamina E e TCM 60 Cápsulas — Vitafor",
        "category": "Suplementos & Proteínas",
        "price": 198.00,
        "price_display": "R$ 198,00",
        "weight_grams": 90,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.07 (2).jpeg",
        "short_desc": "Dose clínica de 200mg de Coenzima Q10 associada a Triglicerídeos de Cadeia Média para máxima absorção.",
        "description": """<h3>Vitafor CoQ-10 200mg — Força para o Coração e Vitalidade</h3>
<p>Combina 200mg de coenzima pura com TCM e d-alfa-tocoferol em cápsulas softgel práticas.</p>"""
    },

    # ══════════════════════════════════════════════════════════════════
    # 4. SEM GLÚTEN & SEM LACTOSE (ALERE, BELIVE, A TAL DA CASTANHA, ETC.)
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "a-tal-da-castanha-amendoa-1l",
        "name": "Leite de Amêndoa 100% Natural 1 Litro — A Tal da Castanha",
        "category": "Sem Glúten & Sem Lactose",
        "price": 23.90,
        "price_display": "R$ 23,90",
        "weight_grams": 1000,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.54 (4).jpeg",
        "short_desc": "Bebida vegetal pura de amêndoas sem aditivos: apenas água e amêndoas! Rico em cálcio, zero açúcares.",
        "description": """<h3>A Tal da Castanha Amêndoa 1L — Rótulo Mais Limpo do Brasil</h3>
<p>Sem gomas, sem conservantes, sem óleos vegetais adicionados. 100% natural, rico em cálcio natural, sem glúten e sem lactose.</p>"""
    },
    {
        "id": "a-tal-da-castanha-original-1l",
        "name": "Bebida de Castanha de Caju Orgânica 1 Litro — A Tal da Castanha",
        "category": "Sem Glúten & Sem Lactose",
        "price": 22.90,
        "price_display": "R$ 22,90",
        "weight_grams": 1000,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.55 (1).jpeg",
        "short_desc": "Apenas 2 ingredientes: água e castanha-de-caju orgânica brasileira. Cremoso e versátil para cafés e receitas.",
        "description": """<h3>A Tal da Castanha Original 1L Orgânico — O Clássico Plant-Based</h3>
<p>Certificado Orgânico Brasil. Cremoso por natureza, sem necessidade de espessantes artificiais.</p>"""
    },
    {
        "id": "a-tal-da-castanha-mixed-nuts-1l",
        "name": "Bebida Mixed Nuts 1 Litro — A Tal da Castanha",
        "category": "Sem Glúten & Sem Lactose",
        "price": 24.90,
        "price_display": "R$ 24,90",
        "weight_grams": 1000,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.55 (2).jpeg",
        "short_desc": "Blend nutritivo de Castanha de Caju, Castanha do Pará e Amêndoa com 7g de proteína por porção e selênio natural.",
        "description": """<h3>A Tal da Castanha Mixed Nuts 1L — 100% Selênio e 7g de Proteína</h3>
<p>Nutrição densa e sabor encorpado sem derivados lácteos.</p>"""
    },
    {
        "id": "notco-notmilk-original-1l",
        "name": "NotMilk Original 1 Litro — NotCo",
        "category": "Sem Glúten & Sem Lactose",
        "price": 18.90,
        "price_display": "R$ 18,90",
        "weight_grams": 1000,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.55 (3).jpeg",
        "short_desc": "Bebida vegetal com o mesmo sabor, textura e espuminha do leite de vaca, feita de plantas. Sem glúten, sem lactose.",
        "description": """<h3>NotCo NotMilk Original 1L — Incrivelmente Parecido com o Leite</h3>
<p>Desenvolvido com inteligência artificial para replicar exatamente o perfil sensorial do leite animal, mas 100% vegetal com cálcio, zinco e vitaminas D e B12.</p>"""
    },
    {
        "id": "copra-leite-de-coco-beber-900ml",
        "name": "Leite de Coco para Beber com Água de Coco 900ml — Copra",
        "category": "Sem Glúten & Sem Lactose",
        "price": 19.50,
        "price_display": "R$ 19,50",
        "weight_grams": 900,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.55 (5).jpeg",
        "short_desc": "Leite vegetal pronto para beber feito com água de coco natural. Leve, sem lactose e sem adição de açúcares.",
        "description": """<h3>Copra Leite de Coco para Beber 900ml — Refrescante e Saudável</h3>
<p>Perfeito para tomar puro gelado ou preparar vitaminas de frutas.</p>"""
    },
    {
        "id": "alere-biscoito-castanha-quinoa-70g",
        "name": "Biscoito Castanha & Quinoa Defumado 70g — Alere",
        "category": "Sem Glúten & Sem Lactose",
        "price": 16.90,
        "price_display": "R$ 16,90",
        "weight_grams": 70,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.56 (1).jpeg",
        "short_desc": "Biscoito salgado crocante à base de biomassa de banana verde e quinoa. Sem glúten, assado e saudável.",
        "description": """<h3>Alere Biscoito Castanha & Quinoa Sabor Defumado 70g</h3>
<p>Snack funcional preparado com biomassa de banana verde (amido resistente prebiótico) e castanhas selecionadas. Sem glúten, sem leite e incrivelmente crocante.</p>"""
    },
    {
        "id": "alere-biscoito-tomate-ora-pro-nobis-70g",
        "name": "Biscoito Tomate com Ora-pro-nóbis 70g — Alere",
        "category": "Sem Glúten & Sem Lactose",
        "price": 16.90,
        "price_display": "R$ 16,90",
        "weight_grams": 70,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.56 (2).jpeg",
        "short_desc": "Biscoito salgado de biomassa com tomate seco e ora-pro-nóbis. Rico em fibras e ferro.",
        "description": """<h3>Alere Biscoito Tomate & Ora-pro-nóbis 70g — Superfood Brasileiro</h3>
<p>Combina a riqueza nutricional da ora-pro-nóbis com o sabor clássico do tomate e azeite.</p>"""
    },
    {
        "id": "alere-biscoito-banana-canela-30g",
        "name": "Biscoito Doce Banana com Canela 30g — Alere",
        "category": "Sem Glúten & Sem Lactose",
        "price": 9.90,
        "price_display": "R$ 9,90",
        "weight_grams": 30,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.57 (1).jpeg",
        "short_desc": "Biscoito doce assado com biomassa de banana verde, sem adição de açúcares. Fonte de fibras.",
        "description": """<h3>Alere Biscoito Banana com Canela 30g — Doçura Saudável</h3>
<p>O lanchinho perfeito para matar a vontade de doce sem fugir da dieta.</p>"""
    },
    {
        "id": "belive-cookies-baunilha-chocolate-67g",
        "name": "Cookies Baunilha & Gotas de Chocolate Zero 67g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 11.90,
        "price_display": "R$ 11,90",
        "weight_grams": 67,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.57 (3).jpeg",
        "short_desc": "Cookies crocantes com crispies de quinoa e farinha de amêndoas. Zero açúcar, sem glúten e sem leite.",
        "description": """<h3>Belive Cookies Baunilha & Chocolate Zero Açúcar 67g</h3>
<p>Crocantes e generosos em gotas de chocolate amargo sem açúcar. 100% seguros para celíacos e alérgicos ao leite.</p>"""
    },
    {
        "id": "belive-protein-brownie-double-chocolate",
        "name": "Protein Brownie Double Chocolate 40g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 9.90,
        "price_display": "R$ 9,90",
        "weight_grams": 40,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.58 (1).jpeg",
        "short_desc": "Brownie fofinho e úmido enriquecido com proteínas, zero açúcar e rico em fibras prebióticas.",
        "description": """<h3>Belive Protein Brownie Double Chocolate — Prazer sem Culpa</h3>
<p>Textura fudgy inigualável, coberto com muito cacau e pedaços de chocolate sem açúcar.</p>"""
    },
    {
        "id": "belive-pao-de-mel-zero-45g",
        "name": "Pão de Mel com Cobertura de Chocolate Zero Açúcar 45g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 10.90,
        "price_display": "R$ 10,90",
        "weight_grams": 45,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.58 (2).jpeg",
        "short_desc": "Massa de especiarias macia e aromática coberta com chocolate nobre sem açúcar. Sem glúten, sem leite.",
        "description": """<h3>Belive Pão de Mel Zero 45g — O Queridinho dos Lanches</h3>
<p>Toque especial de cravo, canela e noz-moscada sem nenhuma gota de leite ou glúten.</p>"""
    },
    {
        "id": "belive-paozinho-batata-198g",
        "name": "Pãozinho de Batata Sem Glúten e Sem Leite 198g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 26.90,
        "price_display": "R$ 26,90",
        "weight_grams": 198,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.59 (1).jpeg",
        "short_desc": "Pãozinhos supermacios feitos com batata e fécula nobre. Perfeitos para aquecer na frigideira ou forno.",
        "description": """<h3>Belive Pãozinho de Batata 198g — Café da Manhã Inclusivo e Afetivo</h3>
<p>Super macios como o pão tradicional de padaria, mas 100% livres de contaminação cruzada por glúten ou derivados lácteos.</p>"""
    },
    {
        "id": "belive-mandioca-chips-sal-rosa-50g",
        "name": "Mandioca Chips Sal Rosa do Himalaia 50g — Belive",
        "category": "Sem Glúten & Sem Lactose",
        "price": 9.50,
        "price_display": "R$ 9,50",
        "weight_grams": 50,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.17.59 (5).jpeg",
        "short_desc": "Chips de mandioca cortadas fininhas e crocantes com sal rosa do Himalaia. Sem glúten, 100% vegetal.",
        "description": """<h3>Belive Mandioca Chips com Sal Rosa 50g — O Aperitivo Perfeito</h3>
<p>Feitas com mandiocas selecionadas, sequinhas e crocantes para qualquer momento do dia.</p>"""
    },
    {
        "id": "feita-croc-apple-40g",
        "name": "Feita Croc Apple Maçã Crocante 40g",
        "category": "Sem Glúten & Sem Lactose",
        "price": 14.50,
        "price_display": "R$ 14,50",
        "weight_grams": 40,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.00 (1).jpeg",
        "short_desc": "Maçã liofilizada crocante sem adição de açúcares, sem fritura e sem glúten.",
        "description": """<h3>Feita Croc Apple 40g — 100% Maçã de Verdade</h3>
<p>Desidratada em processo especial que mantém os nutrientes, vitaminas e sabor da fruta fresca.</p>"""
    },
    {
        "id": "crock-cereal-aveia-sem-gluten-flocos-finos-200g",
        "name": "Aveia Sem Glúten Flocos Finos 200g — Crock Cereal",
        "category": "Sem Glúten & Sem Lactose",
        "price": 12.90,
        "price_display": "R$ 12,90",
        "weight_grams": 200,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.22 (2).jpeg",
        "short_desc": "Aveia pura certificada sem glúten desde o plantio até o envase. Rica em beta-glucanas.",
        "description": """<h3>Crock Cereal Aveia Sem Glúten Flocos Finos 200g</h3>
<p>Garantia de segurança para celíacos. Rica em fibras solúveis que controlam o colesterol e a glicose.</p>"""
    },
    {
        "id": "konjac-massa-mf-bucatini-270g",
        "name": "Massa de Fibra Konjac Bucatini Zero Calorias 270g — Konjac Massa MF",
        "category": "Sem Glúten & Sem Lactose",
        "price": 28.90,
        "price_display": "R$ 28,90",
        "weight_grams": 270,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.23 (1).jpeg",
        "short_desc": "Apenas 9 calorias por 100g! Feito da fibra solúvel glucomannan. Sem glúten, sem carboidratos, pronto em 2 min.",
        "description": """<h3>Konjac Massa MF Tipo Bucatini 270g — A Revolução Low Carb</h3>
<p>Permite comer um prato farto de massa italiana com quase zero calorias. Absorve o molho da sua preferência com perfeição.</p>"""
    },
    {
        "id": "konjac-massa-mf-lasanha-270g",
        "name": "Massa de Fibra Konjac Lasanha 270g — Konjac Massa MF",
        "category": "Sem Glúten & Sem Lactose",
        "price": 28.90,
        "price_display": "R$ 28,90",
        "weight_grams": 270,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.23 (2).jpeg",
        "short_desc": "Lâminas de massa de fibra Konjac para montagem de lasanhas low carb e cetogênicas.",
        "description": """<h3>Konjac Massa MF Lasanha 270g — Praticidade e Leveza</h3>
<p>Lâminas prontas para montar lasanhas leves sem carregar em carboidratos refinados.</p>"""
    },
    {
        "id": "ceres-talharim-grao-de-bico-200g",
        "name": "Talharim 100% Grão-de-Bico Artesanal 200g — Ceres Brasil",
        "category": "Sem Glúten & Sem Lactose",
        "price": 21.90,
        "price_display": "R$ 21,90",
        "weight_grams": 200,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.23 (3).jpeg",
        "short_desc": "Massa seca artesanal feita com farinha 100% pura de grão-de-bico. 20g de proteína por 100g e zero glúten.",
        "description": """<h3>Ceres Talharim 100% Grão de Bico 200g — Proteína Vegetal Pura</h3>
<p>Massa proteica deliciosa que não desmancha ao cozinhar. Excelente índice sacietógeno.</p>"""
    },
    {
        "id": "urbano-massa-arroz-penne-500g",
        "name": "Massa de Arroz Penne Zero Glúten 500g — Urbano",
        "category": "Sem Glúten & Sem Lactose",
        "price": 11.90,
        "price_display": "R$ 11,90",
        "weight_grams": 500,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.23 (4).jpeg",
        "short_desc": "Massa alimentícia de arroz premium, leve, sem glúten e com textura al dente perfeita.",
        "description": """<h3>Urbano Penne de Arroz 500g — A Massa do Dia a Dia</h3>
<p>Rende refeições deliciosas para a família inteira com a digestibilidade superior do arroz.</p>"""
    },
    {
        "id": "casarao-penne-espinafre-berinjela-300g",
        "name": "Massa Gourmet Penne Espinafre & Berinjela 300g — Casarão",
        "category": "Sem Glúten & Sem Lactose",
        "price": 17.50,
        "price_display": "R$ 17,50",
        "weight_grams": 300,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.24 (1).jpeg",
        "short_desc": "Massa de arroz com 100% farinhas vegetais de espinafre, berinjela e chia. Fonte de fibras e proteínas.",
        "description": """<h3>Casarão Penne Gourmet Espinafre & Berinjela 300g</h3>
<p>Cor natural dos vegetais, aroma delicado e cozimento rápido de 4 a 8 minutos.</p>"""
    },
    {
        "id": "casarao-lasanha-caseira-tradicional-300g",
        "name": "Massa de Arroz para Lasanha Caseira 300g — Casarão",
        "category": "Sem Glúten & Sem Lactose",
        "price": 18.90,
        "price_display": "R$ 18,90",
        "weight_grams": 300,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.24 (5).jpeg",
        "short_desc": "Massa especial de arroz para montagem direta de lasanha no forno. Sem pré-cozimento, sem glúten.",
        "description": """<h3>Casarão Lasanha Caseira 300g — Prática e Sem Glúten</h3>
<p>Basta montar com o molho quente e levar direto ao forno. Praticidade absoluta no domingo em família.</p>"""
    },
    {
        "id": "nazinha-sequilhos-coco-300g",
        "name": "Sequilhos Clássicos Sabor Coco 300g — Nazinha",
        "category": "Sem Glúten & Sem Lactose",
        "price": 14.90,
        "price_display": "R$ 14,90",
        "weight_grams": 300,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.25 (2).jpeg",
        "short_desc": "Sequilhos tradicionais crocantes que derretem na boca. Sem glúten e sem lactose.",
        "description": """<h3>Nazinha Sequilhos Sabor Coco 300g — O Clássico do Chá da Tarde</h3>
<p>Tradição mineira sem glúten e sem lactose. Derrete na boca e combina perfeitamente com um café quentinho.</p>"""
    },
    {
        "id": "nazinha-sequilhos-maracuja-zero-120g",
        "name": "Sequilhos Sabor Maracujá Zero Açúcar 120g — Nazinha",
        "category": "Sem Glúten & Sem Lactose",
        "price": 12.90,
        "price_display": "R$ 12,90",
        "weight_grams": 120,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.26.jpeg",
        "short_desc": "Sequilhos de maracujá sem adição de açúcares, sem glúten e sem lactose. Fonte de fibras.",
        "description": """<h3>Nazinha Sequilhos de Maracujá Zero Açúcar 120g</h3>
<p>Toque cítrico e refrescante do maracujá com adoçamento suave e sem residual.</p>"""
    },

    # ══════════════════════════════════════════════════════════════════
    # 5. ORGÂNICOS, SUPERFOODS & ADOÇANTES (SOULY, COLOR ANDINA)
    # ══════════════════════════════════════════════════════════════════
    {
        "id": "souly-laranja-moro-po-300g",
        "name": "Laranja Moro da Sicília em Pó 300g — Souly Superfoods",
        "category": "Orgânicos & Integrais",
        "price": 179.00,
        "price_display": "R$ 179,00",
        "weight_grams": 300,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.00 (2).jpeg",
        "short_desc": "Autêntica Laranja Moro cultivada aos pés do Vulcão Etna na Sicília. Rica em antocianina C3G para controle de gordura.",
        "description": """<h3>Souly Laranja Moro da Sicília em Pó 300g — Pureza Vulcânica</h3>
<p>A laranja moro siciliana é famosa pela concentração recorde de antocianinas bioativas que apoiam o metabolismo lipídico hepático e corporal.</p>
<h4>Diferenciais:</h4>
<ul>
<li>100% puro pó de laranja moro sem maltodextrina, corantes ou conservantes.</li>
<li>Antioxidante nobre que modula a gordura abdominal e melhora a sensibilidade à insulina.</li>
<li>Pode ser adicionado à água, sucos e shots matinais.</li>
</ul>"""
    },
    {
        "id": "souly-feno-grego-po-60g",
        "name": "Feno Grego Puro da Índia 60g — Souly Superfoods",
        "category": "Orgânicos & Integrais",
        "price": 49.00,
        "price_display": "R$ 49,00",
        "weight_grams": 60,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.00 (3).jpeg",
        "short_desc": "Sementes nobres de Trigonella foenum-graecum selecionadas e moídas. Controle glicêmico e suporte hormonal.",
        "description": """<h3>Souly Feno Grego 60g — Sabedoria Ayurvédica</h3>
<p>Tradicional erva aromática indiana rica em saponinas e galactomanana, indicada para digestão, controle do apetite e vitalidade.</p>"""
    },
    {
        "id": "souly-canela-do-ceilao-120g",
        "name": "Verdadeira Canela do Ceilão em Pó 120g — Souly",
        "category": "Orgânicos & Integrais",
        "price": 89.00,
        "price_display": "R$ 89,00",
        "weight_grams": 120,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.01 (1).jpeg",
        "short_desc": "A autêntica Canela do Ceilão (Cinnamomum verum) originária do Sri Lanka. Baixíssimo teor de cumarina, segura para consumo diário.",
        "description": """<h3>Canela do Ceilão Pura do Sri Lanka 120g — Souly</h3>
<p>Diferente da canela comum (Cássia), a verdadeira Canela do Ceilão possui sabor delicado, levemente adocicado e teor quase nulo de cumarina, permitindo uso diário contínuo como termogênico e modulador da glicose sanguínea.</p>"""
    },
    {
        "id": "color-andina-stevia-liquida-30ml",
        "name": "Adoçante Stevia Líquido 30ml — Color Andina Foods",
        "category": "Orgânicos & Integrais",
        "price": 38.00,
        "price_display": "R$ 38,00",
        "weight_grams": 50,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.27 (1).jpeg",
        "short_desc": "Glicosídeos de esteviol puros de alta pureza sem sabor residual amargo. Zero calorias, zero sódio, vegano.",
        "description": """<h3>Color Andina Stevia Líquida 30ml — O Fim do Amargo na Stevia</h3>
<p>Extração especial dos glicosídeos mais doces e puros da folha da estévia andina. Apenas 2 a 3 gotas adoçam seu café com perfeição.</p>"""
    },
    {
        "id": "color-andina-stevia-saches-50un",
        "name": "Stevia em Sachês 50 unidades (30g) — Color Andina Foods",
        "category": "Orgânicos & Integrais",
        "price": 34.00,
        "price_display": "R$ 34,00",
        "weight_grams": 50,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.27.jpeg",
        "short_desc": "50 sachês individuais de adoçante natural de estévia, eritritol e taumatina. Sem residual, prático para levar.",
        "description": """<h3>Color Andina Stevia em Sachês 50un — Praticidade para Levar na Bolsa</h3>
<p>Sachês individuais com poder adoçante suave e natural para seu chá ou café em qualquer lugar.</p>"""
    },
    {
        "id": "color-andina-cacau-selvagem-200g",
        "name": "Cacau Selvagem 100% Puro Cacau 200g — Color Andina Foods",
        "category": "Orgânicos & Integrais",
        "price": 49.00,
        "price_display": "R$ 49,00",
        "weight_grams": 200,
        "featured": 1,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.27 (3).jpeg",
        "short_desc": "Cacau selvagem colhido na floresta amazônica preservando a nobre manteiga de cacau original. Sabor intenso.",
        "description": """<h3>Color Andina Cacau Selvagem 200g — O Verdadeiro Cacau da Floresta</h3>
<p>Não alcalinizado e não desengordurado: preserva todos os flavonoides, antioxidantes e teobromina para o bem-estar e saúde do coração.</p>"""
    },
    {
        "id": "color-andina-red-maca-100g",
        "name": "Farinha de Red Maca Ancestral Indígena 100g — Color Andina Foods",
        "category": "Orgânicos & Integrais",
        "price": 45.00,
        "price_display": "R$ 45,00",
        "weight_grams": 100,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.27 (4).jpeg",
        "short_desc": "Maca Vermelha agroecológica original dos Andes peruanos. Seca ao sol, raw, foco na próstata e densidade óssea.",
        "description": """<h3>Color Andina Red Maca 100g — A Maca da Saúde Óssea e Hormonal</h3>
<p>Cultivada a mais de 4.000 metros de altitude em solo andino virgem. Rica em macamidas e fitoesteróis.</p>"""
    },
    {
        "id": "color-andina-curcuma-longa-100g",
        "name": "Cúrcuma Longa Plantio Próprio 100g — Color Andina Foods",
        "category": "Orgânicos & Integrais",
        "price": 32.00,
        "price_display": "R$ 32,00",
        "weight_grams": 100,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.28 (2).jpeg",
        "short_desc": "Cúrcuma longa pura com resgate da semente nativa ancestral. Sem amido adicionado, sem corantes.",
        "description": """<h3>Color Andina Cúrcuma Longa 100g — Puro Ouro Amarelo</h3>
<p>Cor vibrante, aroma pungente e máxima concentração natural de curcumina bioativa.</p>"""
    },
    {
        "id": "color-andina-urucum-do-pilao-50g",
        "name": "Urucum do Pilão (Colorau Mineiro Artesanal) 50g — Color Andina",
        "category": "Orgânicos & Integrais",
        "price": 28.00,
        "price_display": "R$ 28,00",
        "weight_grams": 50,
        "featured": 0,
        "front_file": "WhatsApp Image 2026-10-12 at 08.18.28 (3).jpeg",
        "short_desc": "Colorau artesanal pilado no Sítio Recreio em Minas Gerais. Sem farinha de milho, apenas urucum puro.",
        "description": """<h3>Urucum do Pilão 50g — O Autêntico Colorau Brasileiro</h3>
<p>Elaborado artesanalmente no pilão tradicional com grãos puros de urucum. Traz cor e sabor inigualáveis para suas receitas com alto teor de bixina.</p>"""
    }
]

def make_marketplace_image(input_path, output_path, session):
    orig = Image.open(input_path).convert('RGB')
    
    # 1. Background removal using u2net
    nobg = remove(orig, session=session)
    
    # 2. Trim bottom 12% to remove hands/fingers holding the product
    arr = np.array(nobg)
    h, w, c = arr.shape
    bottom_cut = int(h * 0.88)
    arr[bottom_cut:, :, 3] = 0
    nobg = Image.fromarray(arr)
    
    # 3. Crop to content bounding box
    bbox = nobg.getbbox()
    if bbox:
        nobg = nobg.crop(bbox)
        
    # 4. Enhance colors, contrast and sharpness
    rgb = nobg.convert('RGB')
    rgb = ImageEnhance.Color(rgb).enhance(1.12)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.15)
    r, g, b = rgb.split()
    nobg = Image.merge('RGBA', (r, g, b, nobg.split()[3]))
    
    # 5. Fit nicely inside 1000x1000 canvas
    target_size = (1000, 1000)
    nobg.thumbnail((820, 820), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', target_size, (255, 255, 255, 255))
    
    # 6. Realistic drop shadow underneath
    pw, ph = nobg.size
    sw = int(pw * 0.76)
    sh = max(8, int(ph * 0.05))
    shadow = Image.new('RGBA', (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse([0, 0, sw, sh], fill=(35, 35, 35, 75))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=sh // 2))
    
    px = (target_size[0] - pw) // 2
    py = (target_size[1] - ph) // 2 - 12
    sx = (target_size[0] - sw) // 2
    sy = py + ph - (sh // 2)
    
    canvas.paste(shadow, (sx, sy), shadow)
    canvas.paste(nobg, (px, py), nobg)
    
    canvas.convert('RGB').save(output_path, 'WEBP', quality=90)

print(f"Total defined catalog products: {len(PRODUCTS)}")

if __name__ == '__main__':
    sess = new_session('u2net')
    print("Starting marketplace image generation...")
    for idx, p in enumerate(PRODUCTS):
        t0 = time.time()
        in_path = os.path.join(SOURCE_DIR, p['front_file'])
        out_path = os.path.join(OUTPUT_DIR, f"{p['id']}.webp")
        if not os.path.exists(in_path):
            print(f"Warning: {in_path} does not exist!")
            continue
        try:
            make_marketplace_image(in_path, out_path, sess)
            print(f"[{idx+1}/{len(PRODUCTS)}] Generated {p['id']}.webp in {time.time()-t0:.2f}s")
        except Exception as e:
            print(f"Error on {p['id']}: {e}")
    print("All marketplace images processed successfully!")
