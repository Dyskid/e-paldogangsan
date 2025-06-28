#!/usr/bin/env python3
import json
import re

def classify_product(product):
    """Classify a product based on its name, description, and tags"""
    name = product.get('name', '').lower()
    description = product.get('description', '').lower()
    tags = [tag.lower() for tag in product.get('tags', [])]
    text = f"{name} {description} {' '.join(tags)}"
    
    # Classification rules based on keywords
    classification_rules = {
        '쌀/곡물류': ['쌀', '곡물', '현미', '백미', '찹쌀', '흑미', '오대미', '햅쌀', '누룽지', '잡곡', '보리', '조', '기장', '수수', '귀리'],
        '축산물': ['한우', '돼지', '닭', '계란', '소고기', '돼지고기', '닭고기', '육류', '고기'],
        '수산물': ['생선', '어', '새우', '게', '조개', '멸치', '명태', '코다리', '건어물', '해산물', '수산'],
        '채소': ['채소', '산채', '배추', '무', '당근', '양파', '마늘', '생강', '고추', '파프리카', '브로콜리'],
        '과일/채소': ['과일', '사과', '배', '딸기', '포도', '감', '귤', '오렌지', '복숭아', '자두', '키위', '바나나'],
        '김치/장/절임': ['김치', '된장', '고추장', '간장', '장아찌', '젓갈', '절임', '발효'],
        '발효식품/장류': ['막장', '쌈장', '청국장', '메주', '발효'],
        '꿀/홍삼': ['꿀', '홍삼', '인삼', '벌꿀', '아카시아꿀'],
        '건강식품': ['영양제', '건강', '비타민', '미네랄', '보약', '건강보조식품'],
        '차/음료': ['차', '음료', '커피', '녹차', '홍차', '허브차', '식혜', '주스'],
        '음료/차/주류': ['막걸리', '술', '주류', '와인', '맥주', '소주'],
        '과자': ['과자', '스낵', '쿠키', '비스킷', '크래커', '칩'],
        '만두/떡/간편식': ['만두', '떡', '라면', '즉석', '간편식', '냉동식품'],
        '베이커리/간식': ['빵', '케이크', '파이', '도넛', '머핀', '베이커리'],
        '조미료': ['소금', '설탕', '후추', '향신료', '양념', '조미료', '다시마', '멸치육수'],
        '생활/리빙': ['세제', '비누', '샴푸', '화장품', '생활용품', '주방용품'],
        '가구/인테리어': ['가구', '인테리어', '소파', '침대', '책상', '의자']
    }
    
    # Score each category
    scores = {}
    for category, keywords in classification_rules.items():
        score = 0
        for keyword in keywords:
            if keyword in text:
                score += 1
        if score > 0:
            scores[category] = score
    
    # Return the category with highest score, or '기타' if no match
    if scores:
        return max(scores.items(), key=lambda x: x[1])[0]
    else:
        return '기타'

def main():
    # Load products
    with open('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    reclassified_count = 0
    category_counts = {}
    
    for product in products:
        if product.get('category') == '전체상품':
            new_category = classify_product(product)
            product['category'] = new_category
            reclassified_count += 1
            
            # Track counts
            category_counts[new_category] = category_counts.get(new_category, 0) + 1
            
            print(f"Reclassified '{product.get('name', 'Unknown')}' to '{new_category}'")
    
    # Save updated products
    with open('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    print(f"\nSuccessfully reclassified {reclassified_count} products from '전체상품' category")
    print("\nDistribution by new category:")
    for category, count in sorted(category_counts.items()):
        print(f"  {category}: {count} products")

if __name__ == "__main__":
    main()