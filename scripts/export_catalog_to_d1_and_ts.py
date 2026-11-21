import json
import os
import re

# Import PRODUCTS from build_amaryllis_master_catalog
from build_amaryllis_master_catalog import PRODUCTS

print(f"Loaded {len(PRODUCTS)} products for D1 and TS export.")

# 1. Generate SQL Seed Script
sql_statements = [
    "-- Amaryllis Real Marketplace Products Seed",
    "DELETE FROM product_images;",
    "DELETE FROM products;"
]

for p in PRODUCTS:
    p_id = p["id"]
    name = p["name"].replace("'", "''")
    desc = p["description"].replace("'", "''")
    price = p["price"]
    price_display = p["price_display"]
    image_url = f"/products/{p_id}.webp"
    category = p["category"].replace("'", "''")
    featured = p.get("featured", 0)
    weight = p.get("weight_grams", 300)
    
    sql = f"""INSERT INTO products (id, name, description, price, price_display, image_url, category, featured, active, allow_direct_purchase, weight_grams, height_cm, width_cm, length_cm)
VALUES ('{p_id}', '{name}', '{desc}', {price}, '{price_display}', '{image_url}', '{category}', {featured}, 1, 1, {weight}, 18, 12, 12);"""
    sql_statements.append(sql)

with open('scripts/seed_marketplace_catalog.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_statements))

print("Saved scripts/seed_marketplace_catalog.sql")
