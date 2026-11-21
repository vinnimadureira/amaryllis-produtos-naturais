import json

with open('products_ocr_inventory.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

def dump_range(start, end, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        for i in range(start, min(end, len(items))):
            f.write(f"[{i:03d}] {items[i]['file']} :: {items[i]['combined_text']}\n")

dump_range(53, 96, 'scripts/panizza_list.txt')
dump_range(96, 146, 'scripts/greenbios_list.txt')
dump_range(146, 176, 'scripts/now_vitafor_list.txt')
dump_range(176, 275, 'scripts/semgluten_list.txt')
dump_range(275, 308, 'scripts/organicos_list.txt')

print("All sections dumped successfully.")
