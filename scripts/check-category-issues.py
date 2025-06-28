#!/usr/bin/env python3
import json

def main():
    # Load products
    with open('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"Total products: {len(products)}")
    
    # Check for products without category field
    no_category = []
    empty_category = []
    null_category = []
    whitespace_category = []
    
    # Count categories
    category_counts = {}
    
    for i, product in enumerate(products):
        # Check if category field exists
        if 'category' not in product:
            no_category.append((i, product.get('id', 'unknown'), product.get('name', 'unknown')))
        else:
            category = product['category']
            
            # Check for various problematic category values
            if category is None:
                null_category.append((i, product.get('id', 'unknown'), product.get('name', 'unknown')))
            elif category == "":
                empty_category.append((i, product.get('id', 'unknown'), product.get('name', 'unknown')))
            elif isinstance(category, str) and category.strip() == "":
                whitespace_category.append((i, product.get('id', 'unknown'), product.get('name', 'unknown')))
            else:
                category_counts[category] = category_counts.get(category, 0) + 1
    
    print(f"\nCategory Issues:")
    print(f"Products without category field: {len(no_category)}")
    print(f"Products with empty category: {len(empty_category)}")
    print(f"Products with null category: {len(null_category)}")
    print(f"Products with whitespace-only category: {len(whitespace_category)}")
    
    if no_category:
        print(f"\nProducts without category field (first 5):")
        for i, (idx, pid, name) in enumerate(no_category[:5]):
            print(f"  {idx}: {pid} - {name}")
    
    if empty_category:
        print(f"\nProducts with empty category (first 5):")
        for i, (idx, pid, name) in enumerate(empty_category[:5]):
            print(f"  {idx}: {pid} - {name}")
    
    if null_category:
        print(f"\nProducts with null category (first 5):")
        for i, (idx, pid, name) in enumerate(null_category[:5]):
            print(f"  {idx}: {pid} - {name}")
    
    if whitespace_category:
        print(f"\nProducts with whitespace-only category (first 5):")
        for i, (idx, pid, name) in enumerate(whitespace_category[:5]):
            print(f"  {idx}: {pid} - {name}")
    
    print(f"\nValid categories found: {len(category_counts)}")
    print(f"Top 10 categories by product count:")
    sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
    for category, count in sorted_categories[:10]:
        print(f"  {category}: {count} products")

if __name__ == "__main__":
    main()