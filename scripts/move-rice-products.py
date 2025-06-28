#!/usr/bin/env python3
import json
import re

def main():
    # Load products
    with open('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    rice_keywords = [
        '쌀', '찹쌀', '현미', '백미', '흑미', '적미', '오대미', '햅쌀',
        '화순쌀', '강진쌀', '공주쌀', '진천쌀', '양주골쌀', '생거진천쌀'
    ]
    
    moved_count = 0
    
    for product in products:
        # Check if product name or description contains rice keywords
        name = product.get('name', '')
        description = product.get('description', '')
        
        # Skip if already in 쌀/곡물류 category
        if product.get('category') == '쌀/곡물류':
            continue
            
        # Check for rice keywords in name or description
        is_rice_product = False
        for keyword in rice_keywords:
            if keyword in name or keyword in description:
                is_rice_product = True
                break
        
        # Move to 쌀/곡물류 if it's a rice product
        if is_rice_product:
            old_category = product.get('category', 'Unknown')
            product['category'] = '쌀/곡물류'
            moved_count += 1
            print(f"Moved '{name}' from '{old_category}' to '쌀/곡물류'")
    
    # Save updated products
    with open('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully moved {moved_count} rice products to '쌀/곡물류' category")

if __name__ == "__main__":
    main()