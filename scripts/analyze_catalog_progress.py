import glob
import os
import subprocess

all_webp = sorted(glob.glob("public/products/*.webp"))
print(f"Total webp in public/products: {len(all_webp)}")

# Get git diff status
modified_files = set()
try:
    res = subprocess.run(["git", "diff", "--name-only", "public/products/"], capture_output=True, text=True)
    for line in res.stdout.strip().splitlines():
        if line:
            modified_files.add(os.path.normpath(line))
except Exception as e:
    print("Error getting git diff:", e)

print(f"Modified (already processed with official): {len(modified_files)}")

remaining = []
for p in all_webp:
    norm = os.path.normpath(p)
    if norm not in modified_files:
        remaining.append(p)

print(f"Remaining to process: {len(remaining)}")

# Group remaining by brand/prefix
brands = {}
for r in remaining:
    basename = os.path.basename(r).replace(".webp", "")
    prefix = basename.split("-")[0]
    brands.setdefault(prefix, []).append(basename)

for b, items in sorted(brands.items(), key=lambda x: -len(x[1])):
    print(f"\n--- {b.upper()} ({len(items)} items) ---")
    for item in items:
        print(f"  {item}")
