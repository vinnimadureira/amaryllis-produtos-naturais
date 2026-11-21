import glob
import os
import re

# Read fallback products to get human-readable names and categories
prod_meta = {}
try:
    with open('src/lib/amaryllisFallbackData.ts', encoding='utf-8') as f:
        content = f.read()
    
    # Split by product blocks
    raw_blocks = content.split('{\n    id: ')
    for b in raw_blocks[1:]:
        m_id = re.search(r'^["\']([^"\']+)["\']', b)
        m_name = re.search(r'name:\s*["\']([^"\']+)["\']', b)
        m_cat = re.search(r'category:\s*["\']([^"\']+)["\']', b)
        m_price = re.search(r'price_display:\s*["\']([^"\']+)["\']', b)
        if m_id:
            pid = m_id.group(1)
            prod_meta[pid] = {
                'name': m_name.group(1) if m_name else pid,
                'category': m_cat.group(1) if m_cat else 'Geral',
                'price': m_price.group(1) if m_price else ''
            }
except Exception as e:
    print("Error reading fallback:", e)

official_map = {}

# 1. Essential masters from batch_master_essential.py
if os.path.exists('scripts/batch_master_essential.py'):
    with open('scripts/batch_master_essential.py', encoding='utf-8') as f:
        content = f.read()
        for m in re.finditer(r'["\'](essential-[a-z0-9\-]+)["\']\s*:\s*["\']([^"\']+)["\']', content):
            official_map[m.group(1)] = {
                'brand': 'Essential Nutrition',
                'source': f"Essential Nutrition CDN Oficial (Magento Master: {m.group(2).split('/')[-1]})",
                'type': 'Fabricante Oficial'
            }

# 2. Fix remaining essential
for fname in ['scripts/fix_remaining_essential.py', 'scripts/fix_creatine_melatonin.py', 'scripts/fix_final_4_essential.py']:
    if os.path.exists(fname):
        with open(fname, encoding='utf-8') as f:
            content = f.read()
            for m in re.finditer(r'["\'](essential-[a-z0-9\-]+)["\']\s*:\s*["\']([^"\']+)["\']', content):
                official_map[m.group(1)] = {
                    'brand': 'Essential Nutrition',
                    'source': f"Essential Nutrition CDN Oficial ({m.group(2).split('/')[-1][:35]}...)",
                    'type': 'Fabricante Oficial'
                }

# 3. Vitafor
if os.path.exists('scripts/fetch_vitafor_official_images.py'):
    with open('scripts/fetch_vitafor_official_images.py', encoding='utf-8') as f:
        content = f.read()
        for m in re.finditer(r'["\'](vitafor-[a-z0-9\-]+)["\']\s*:\s*["\']([^"\']+)["\']', content):
            official_map[m.group(1)] = {
                'brand': 'Vitafor',
                'source': 'Site Oficial Vitafor Nutrientes (E-commerce)',
                'type': 'Fabricante Oficial'
            }

# 4. Wave 2 (Souly, Belive, Konjac, NotCo, Urbano, Panizza)
if os.path.exists('scripts/batch_process_second_wave.py'):
    with open('scripts/batch_process_second_wave.py', encoding='utf-8') as f:
        content = f.read()
        for m in re.finditer(r'["\']([a-z0-9\-]+-[0-9a-z\-]+)["\']\s*:\s*["\'](http[^"\']+)["\']', content):
            pid, url = m.group(1), m.group(2)
            b = pid.split('-')[0].capitalize()
            s = 'Site Oficial do Fabricante'
            if 'souly' in pid:
                b, s = 'Souly', 'Site Oficial Souly (TiendaNube HD)'
            elif 'belive' in pid:
                b, s = 'Belive Be Free', 'Site Oficial Belive (Packshot Oficial)'
            elif 'konjac' in pid:
                b, s = 'Konjac Massa MF', 'Shopify Oficial Konjac Massa MF'
            elif 'notco' in pid:
                b, s = 'NotCo', 'Site Oficial NotCo Brasil'
            elif 'urbano' in pid:
                b, s = 'Urbano Alimentos', 'Portal Institucional Urbano'
            elif 'panizza' in pid:
                b, s = 'Panizza', 'Catálogo Oficial Panizza / Phytocare HD'
            official_map[pid] = {'brand': b, 'source': s, 'type': 'Fabricante Oficial'}

# 5. Wave 3 (A Tal da Castanha, Copra, Casarão, Ceres, Nazinha)
if os.path.exists('scripts/batch_wave3.py'):
    with open('scripts/batch_wave3.py', encoding='utf-8') as f:
        content = f.read()
        for m in re.finditer(r'["\']([a-z0-9\-]+-[0-9a-z\-]+)["\']\s*:\s*["\'](http[^"\']+)["\']', content):
            pid, url = m.group(1), m.group(2)
            b = pid.split('-')[0].capitalize()
            s = 'Packshot Oficial do Fabricante / VTEX'
            if 'a-tal-da-castanha' in pid:
                b, s = 'A Tal da Castanha', 'Mockup Oficial da Marca em Alta Resolução'
            elif 'copra' in pid:
                b, s = 'Copra Alimentos', 'Packshot Oficial Copra'
            elif 'casarao' in pid:
                b, s = 'Casarão', 'Packshot Oficial Casarão Massas'
            elif 'ceres' in pid:
                b, s = 'Ceres Brasil', 'Packshot Oficial Ceres Brasil'
            elif 'nazinha' in pid:
                b, s = 'Nazinha', 'Site Oficial Nazinha Alimentos'
            official_map[pid] = {'brand': b, 'source': s, 'type': 'Fabricante Oficial'}

# 6. New 20 Officials (NOW, Forever, Alere, Color Andina, Casarão, Crock, Feita Croc)
if os.path.exists('scripts/batch_process_new_20_officials.py'):
    with open('scripts/batch_process_new_20_officials.py', encoding='utf-8') as f:
        content = f.read()
        for m in re.finditer(r'["\']([a-z0-9\-]+-[0-9a-z\-]+)["\']\s*:\s*["\'](http[^"\']+)["\']', content):
            pid, url = m.group(1), m.group(2)
            b = pid.split('-')[0].capitalize()
            s = 'Packshot Oficial do Fabricante / E-commerce Oficial'
            if 'now' in pid:
                b, s = 'NOW Foods', 'NOW Foods Oficial (iHerb CDN / Drogaria SP VTEX)'
            elif 'forever' in pid:
                b, s = 'Forever Living', 'Forever Living Oficial (E-commerce HD)'
            elif 'alere' in pid:
                b, s = 'Alere Gourmet', 'Alere Gourmet Oficial (Mambo VTEX / TiendaNube HD)'
            elif 'color-andina' in pid:
                b, s = 'Color Andina', 'Color Andina Oficial (Casa Santa Luzia VTEX / Tray)'
            elif 'casarao' in pid:
                b, s = 'Casarão', 'Casarão Massas Oficial (TiendaNube HD)'
            elif 'crock' in pid:
                b, s = 'Crock Cereal', 'Crock Cereal Oficial (Fito Natureza Tray HD)'
            elif 'feita-croc' in pid:
                b, s = 'Feita Croc', 'Feita Croc Oficial (Casa Santa Luzia VTEX HD)'
            official_map[pid] = {'brand': b, 'source': s, 'type': 'Fabricante Oficial'}

all_files = sorted(glob.glob('public/products/*.webp'))
all_pids = [os.path.basename(f).replace('.webp', '') for f in all_files]

official_list = []
user_photo_list = []

for pid in all_pids:
    meta = prod_meta.get(pid, {'name': pid, 'category': 'Geral'})
    if pid in official_map:
        info = official_map[pid]
        official_list.append({
            'id': pid,
            'name': meta['name'],
            'category': meta['category'],
            'brand': info['brand'],
            'source': info['source']
        })
    else:
        brand = pid.split('-')[0].capitalize()
        if pid.startswith('a-tal-da-castanha'):
            brand = 'A Tal da Castanha'
        elif pid.startswith('color-andina'):
            brand = 'Color Andina'
        elif pid.startswith('greenbios'):
            brand = 'Greenbios'
        elif pid.startswith('panizza'):
            brand = 'Panizza'
        elif pid.startswith('alere'):
            brand = 'Alere Gourmet'
        elif pid.startswith('casarao'):
            brand = 'Casarão'
        elif pid.startswith('crock-cereal'):
            brand = 'Crock Cereal'
        elif pid.startswith('feita-croc'):
            brand = 'Feita Croc'
        elif pid.startswith('now'):
            brand = 'NOW Foods'
        elif pid.startswith('forever'):
            brand = 'Forever Living'
            
        user_photo_list.append({
            'id': pid,
            'name': meta['name'],
            'category': meta['category'],
            'brand': brand,
            'source': 'Foto da Prateleira da Loja (Fotos.zip) recortada em fundo branco'
        })

print(f"TOTAL_PRODUTOS: {len(all_pids)}")
print(f"TOTAL_OFICIAIS: {len(official_list)} ({len(official_list)/len(all_pids)*100:.1f}%)")
print(f"TOTAL_FOTOS_LOJA: {len(user_photo_list)} ({len(user_photo_list)/len(all_pids)*100:.1f}%)")

print("\n=== MARCAS COM FOTOS OFICIAIS DO FABRICANTE ===")
by_b_off = {}
for p in official_list:
    by_b_off.setdefault(p['brand'], []).append(p)
for b, items in sorted(by_b_off.items(), key=lambda x: -len(x[1])):
    print(f"- {b}: {len(items)} produtos")

print("\n=== MARCAS QUE AINDA USAM FOTOS TIRADAS NA LOJA ===")
by_b_user = {}
for p in user_photo_list:
    by_b_user.setdefault(p['brand'], []).append(p)
for b, items in sorted(by_b_user.items(), key=lambda x: -len(x[1])):
    print(f"\n* {b} ({len(items)} produtos):")
    for it in items:
        p_info = prod_meta.get(it['id'], {})
        p_name = p_info.get('name', it['id'])
        p_price = p_info.get('price', '')
        p_cat = p_info.get('category', '')
        print(f"    • {p_name} | {p_cat} | {p_price}")
