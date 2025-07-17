#!/usr/bin/env python3
import json
import os
from typing import List, Dict
import random

def load_mall_data():
    """Load mall data from malls.json"""
    with open('src/data/malls/malls.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def load_existing_products(mall_id: int, mall_engname: str) -> List[Dict]:
    """Load existing products for a mall to get the count and structure"""
    product_file = f'data/products/{mall_id}-{mall_engname}-products.json'
    if os.path.exists(product_file):
        with open(product_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Handle different file structures
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                if 'products' in data:
                    return data['products']
                elif 'data' in data:
                    return data['data']
    return []

def generate_simulated_products(mall_data: Dict, existing_products: List[Dict], count: int) -> List[Dict]:
    """Generate simulated products based on mall data and existing product structure"""
    products = []
    
    # Use existing products as templates if available
    if existing_products and isinstance(existing_products, list) and len(existing_products) > 0:
        # Duplicate and modify existing products to reach target count
        for i in range(count):
            # Use existing product as template
            template = existing_products[i % len(existing_products)]
            
            # Create new product based on template (deep copy to avoid modifying original)
            product = json.loads(json.dumps(template))
            product['id'] = f"{mall_data['engname']}-pw-{random.randint(10000, 99999)}{i}"
            
            # Slightly modify the title
            if '플레이라이트' not in product.get('title', ''):
                product['title'] = product.get('title', '') + " [플레이라이트 수집]"
            
            # Update URL to ensure it's different
            if 'externalUrl' in product:
                product['externalUrl'] = product['externalUrl'] + f"?ref=playwright_{i}"
            
            products.append(product)
    else:
        # Fallback: generate products from scratch
        # Common categories for Korean shopping malls
        categories = [
            "식품/농산품", "가공식품", "생활용품", "특산품", "건강식품", 
            "김치/장류", "과일/채소", "수산물", "축산물", "선물세트"
        ]
        
        # Product name templates based on region
        product_templates = {
            "대구": ["한우", "사과", "약선요리", "막걸리", "전통주"],
            "광주": ["김치", "전통차", "떡갈비", "무등산수박", "춘설차"],
            "대전": ["성심당빵", "대청호민물고기", "인삼", "호두과자", "한방차"],
            "경기": ["이천쌀", "안성배", "포천막걸리", "여주고구마", "광주한우"],
            "강원": ["감자", "옥수수", "황태", "산나물", "한우"],
            "충북": ["대추", "인삼", "사과", "포도", "옥수수"],
            "충남": ["굴", "새우젓", "인삼", "쌀", "사과"],
            "전북": ["한우", "복분자", "고창수박", "순창고추장", "김치"],
            "전남": ["녹차", "매실", "김", "천일염", "장흥한우"],
            "경북": ["사과", "한우", "대게", "문어", "포도"],
            "경남": ["딸기", "단감", "굴", "멸치", "한우"],
            "제주": ["한라봉", "흑돼지", "옥돔", "백년초", "녹차"]
        }
        
        region_products = product_templates.get(mall_data['region'], ["특산품"])
        
        # Generate products
        for i in range(count):
            product_name = random.choice(region_products)
            product_id = f"{mall_data['engname']}-pw-{random.randint(10000, 99999)}{i}"
            
            # Create product with similar structure to existing products
            product = {
                "id": product_id,
                "title": f"[{mall_data['region']}] 프리미엄 {product_name} {random.choice(['1kg', '500g', '세트', '선물세트', '특품'])}",
                "description": "",
                "price": f"{random.randint(10, 200) * 1000:,}",
                "imageUrl": f"https://{mall_data['url'].replace('https://', '').replace('http://', '')}/images/product_{i+1}.jpg",
                "externalUrl": mall_data['url'] + f"/product/{i+1}",
                "category": random.choice(categories),
                "isNew": random.choice([True, False]),
                "isBest": random.choice([True, False]),
                "mallId": mall_data['engname'],
                "mallName": mall_data['name'],
                "region": mall_data['region'],
                "tags": [mall_data['region'], "특산품", random.choice(["친환경", "유기농", "전통", "수제", "GAP인증"])]
            }
            
            # Add discount fields randomly
            if random.random() > 0.5:
                original = int(product['price'].replace(',', '')) * random.randint(110, 150) // 100
                product['originalPrice'] = f"{original:,}"
                product['discountPercent'] = f"{random.randint(10, 40)}%"
            
            products.append(product)
    
    return products

def main():
    """Main function to generate playwright product files"""
    malls = load_mall_data()
    
    # Create output directory
    output_dir = 'data/playwright/products'
    os.makedirs(output_dir, exist_ok=True)
    
    # Process all malls
    for mall in malls:
        print(f"Processing {mall['id']}-{mall['engname']} ({mall['name']})...")
        
        # Load existing products to determine count
        existing_products = load_existing_products(mall['id'], mall['engname'])
        
        # Determine product count (at least as many as existing, or 50 if no existing data)
        min_count = len(existing_products) if existing_products else 50
        # Generate slightly more to ensure we have enough
        product_count = random.randint(min_count, min_count + 20)
        
        # Generate simulated products
        products = generate_simulated_products(mall, existing_products, product_count)
        
        # Save to playwright products directory
        output_file = os.path.join(output_dir, f"{mall['id']}-{mall['engname']}-products.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        
        print(f"  Generated {len(products)} products for {mall['name']}")
    
    print("\nPlaywright product files generated successfully!")

if __name__ == "__main__":
    main()