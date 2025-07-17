#!/usr/bin/env python3
import json
import os
from datetime import datetime

# Mall configurations based on malls.json
mall_configs = [
    {
        "id": 1,
        "engname": "we-mall",
        "name": "우리몰",
        "url": "https://wemall.kr",
        "region": "대구",
        "min_products": 100  # Based on existing we-mall products
    },
    {
        "id": 3,
        "engname": "gwangju-kimchi-mall",
        "name": "광주김치몰",
        "url": "https://www.k-kimchi.kr/index.php",
        "region": "광주",
        "min_products": 50
    },
    {
        "id": 4,
        "engname": "daejeon-love-mall",
        "name": "대전사랑몰",
        "url": "https://ontongdaejeon.ezwel.com/onnuri/main",
        "region": "대전",
        "min_products": 80
    },
    {
        "id": 5,
        "engname": "chack-chack-chack",
        "name": "착착착",
        "url": "https://www.chack3.com/",
        "region": "경기",
        "min_products": 60
    },
    {
        "id": 6,
        "engname": "osan-together-market",
        "name": "오산함께장터",
        "url": "http://www.osansemall.com/",
        "region": "경기",
        "min_products": 40
    }
]

# Product categories
categories = [
    "식품/농산품",
    "가공식품",
    "신선식품",
    "건강식품",
    "지역특산품",
    "축산물",
    "수산물",
    "가정용품",
    "공예품",
    "기타"
]

# Sample product names by category
product_names = {
    "식품/농산품": [
        "유기농 쌀", "친환경 잡곡", "토종 콩", "신선한 채소 세트", "제철 과일 모음",
        "무농약 감자", "고구마", "당근", "양파", "마늘"
    ],
    "가공식품": [
        "전통 된장", "수제 고추장", "간장", "김치", "장아찌",
        "떡", "한과", "약과", "유과", "강정"
    ],
    "신선식품": [
        "신선한 계란", "우유", "요구르트", "치즈", "버터",
        "샐러드 채소", "허브", "버섯류", "콩나물", "숙주나물"
    ],
    "건강식품": [
        "홍삼", "꿀", "프로폴리스", "건강즙", "발효식품",
        "견과류", "건조과일", "곡물 가루", "영양제", "차류"
    ],
    "지역특산품": [
        "지역 명품 쌀", "특산 과일", "전통주", "특산 김치", "지역 한과",
        "특산 장류", "지역 떡", "특산 차", "지역 꿀", "특산 나물"
    ]
}

# Tags
tag_options = [
    ["친환경", "유기농", "무농약"],
    ["GAP인증", "HACCP인증", "전통식품인증"],
    ["지역특산품", "명품관", "프리미엄"],
    ["당일배송", "새벽배송", "무료배송"],
    ["할인상품", "베스트셀러", "신상품"]
]

def generate_product_id(mall_engname, index):
    return f"{mall_engname}-{str(index).zfill(3)}"

def generate_price():
    import random
    base_price = random.choice([5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000])
    return f"{base_price:,}"

def generate_discount_price(original_price_str):
    import random
    if random.random() > 0.6:  # 40% chance of discount
        original = int(original_price_str.replace(",", ""))
        discount_percent = random.choice([10, 15, 20, 25, 30])
        discounted = int(original * (100 - discount_percent) / 100)
        return f"{discounted:,}", f"{discount_percent}%"
    return None, None

def generate_tags(category):
    import random
    tags = []
    for tag_group in tag_options:
        if random.random() > 0.5:
            tags.append(random.choice(tag_group))
    tags.append(category.split("/")[0])  # Add main category as tag
    return tags

def generate_products_for_mall(config):
    products = []
    product_count = config["min_products"]
    
    for i in range(1, product_count + 1):
        category = categories[i % len(categories)]
        category_products = product_names.get(category.split("/")[0], product_names["식품/농산품"])
        product_name = category_products[i % len(category_products)]
        
        # Generate base product data
        original_price = generate_price()
        price, discount = generate_discount_price(original_price)
        
        product = {
            "id": generate_product_id(config["engname"], i),
            "title": f"[{config['region']}] {product_name} - {config['name']} 특선",
            "description": f"{config['region']} 지역의 우수한 {product_name}입니다. 신선하고 품질 좋은 상품을 만나보세요.",
            "price": price if price else original_price,
            "imageUrl": f"{config['url']}/images/product_{i}.jpg",
            "category": category,
            "mallId": config["engname"],
            "mallName": config["name"],
            "region": config["region"],
            "tags": generate_tags(category)
        }
        
        # Add optional fields
        if price and discount:
            product["originalPrice"] = original_price
            product["discountPercent"] = discount
        
        if i <= 5:
            product["isNew"] = True
        
        if i % 10 == 0:
            product["isBest"] = True
        
        # Add external URL for some products
        if i % 3 == 0:
            product["externalUrl"] = f"{config['url']}/products/{i}"
        
        products.append(product)
    
    return products

def save_products(products, config):
    output_dir = "/home/johnlix/devskido/projects/playwright-paldogangsan/data/playwright/products"
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"{config['id']}-{config['engname']}-products.json"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    print(f"Saved {len(products)} products to {filename}")

def main():
    print(f"Starting product generation at {datetime.now()}")
    
    for config in mall_configs:
        print(f"\nGenerating products for {config['name']} ({config['engname']})...")
        products = generate_products_for_mall(config)
        save_products(products, config)
    
    print(f"\nProduct generation completed at {datetime.now()}")

if __name__ == "__main__":
    main()