#!/usr/bin/env python3
import json

def main():
    # Load products
    with open('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    changes_made = []
    
    for product in products:
        category = product.get('category', '')
        
        # Handle 농산물/기름 - oil products go to 조미료
        if category == '농산물/기름':
            product['category'] = '조미료'
            changes_made.append(f"Moved '{product.get('name', 'Unknown')}' from '농산물/기름' to '조미료'")
        
        # Handle 농산물/더덕 - 더덕 products go to 농산물
        elif category == '농산물/더덕':
            product['category'] = '농산물'
            changes_made.append(f"Moved '{product.get('name', 'Unknown')}' from '농산물/더덕' to '농산물'")
        
        # Handle 농산물/축산 - eggs go to 축산물
        elif category == '농산물/축산':
            product['category'] = '축산물'
            changes_made.append(f"Moved '{product.get('name', 'Unknown')}' from '농산물/축산' to '축산물'")
    
    # Save updated products
    with open('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    print(f"Made {len(changes_made)} changes:")
    for change in changes_made:
        print(f"  {change}")

if __name__ == "__main__":
    main()