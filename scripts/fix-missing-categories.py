#!/usr/bin/env python3
import json

def classify_product(product):
    """Classify a product based on its name, description, and tags"""
    name = product.get('name', '').lower()
    description = product.get('description', '').lower()
    tags = [tag.lower() for tag in product.get('tags', [])]
    text = f"{name} {description} {' '.join(tags)}"
    
    # Classification rules based on keywords
    classification_rules = {
        '쌀/곡물류': ['쌀', '곡물', '현미', '백미', '찹쌀', '흑미', '오대미', '햅쌀', '누룽지', '잡곡', '보리', '조', '기장', '수수', '귀리'],
        '축산물': ['한우', '돼지', '닭', '계란', '소고기', '돼지고기', '닭고기', '육류', '고기', '정육', '갈비', '등심', '삼겹살', '염소', '흑염소'],
        '수산물': ['생선', '어', '새우', '게', '조개', '멸치', '명태', '코다리', '건어물', '해산물', '수산', '전복', '오징어', '굴', '미역', '다시마', '김'],
        '채소': ['채소', '산채', '배추', '무', '당근', '양파', '마늘', '생강', '고추', '파프리카', '브로콜리', '상추', '시금치', '버섯', '표고', '새송이', '느타리'],
        '과일/채소': ['과일', '사과', '배', '딸기', '포도', '감', '귤', '오렌지', '복숭아', '자두', '키위', '바나나', '수박', '참외', '토마토'],
        '김치/장/절임': ['김치', '된장', '고추장', '간장', '장아찌', '젓갈', '절임', '묵은지', '백김치', '깍두기'],
        '발효식품': ['막장', '쌈장', '청국장', '메주', '발효', '효소', '식초', '흑초'],
        '꿀/홍삼': ['꿀', '홍삼', '인삼', '벌꿀', '아카시아꿀', '잡화꿀', '꿀스틱'],
        '건강식품': ['영양제', '건강', '비타민', '미네랄', '보약', '건강보조식품', '진액', '엑기스'],
        '음료/차/주류': ['차', '음료', '커피', '녹차', '홍차', '허브차', '식혜', '주스', '막걸리', '술', '주류', '와인', '맥주', '소주'],
        '과자': ['과자', '스낵', '쿠키', '비스킷', '크래커', '칩', '한과', '유과', '약과'],
        '만두/떡/간편식': ['만두', '떡', '라면', '즉석', '간편식', '냉동식품', '떡국', '송편'],
        '베이커리/간식': ['빵', '케이크', '파이', '도넛', '머핀', '베이커리', '카스테라'],
        '조미료': ['소금', '설탕', '후추', '향신료', '양념', '조미료', '다시마', '멸치육수', '기름', '참기름', '들기름'],
        '가공식품': ['잼', '통조림', '병조림', '소스', '드레싱', '가공품', '가공식품'],
        '농산물': ['농산물', '감자', '고구마', '옥수수', '콩', '팥', '녹두', '땅콩', '호두', '잣', '밤', '대추', '도라지', '더덕']
    }
    
    # Score each category
    scores = {}
    for category, keywords in classification_rules.items():
        score = 0
        for keyword in keywords:
            if keyword in name:
                score += 2
            elif keyword in description:
                score += 1.5
            elif keyword in ' '.join(tags):
                score += 1
        if score > 0:
            scores[category] = score
    
    # Return the category with highest score, or '기타' if no match
    if scores:
        best_category, best_score = max(scores.items(), key=lambda x: x[1])
        if best_score >= 1:
            return best_category
    
    return '기타'

def main():
    # Load products
    with open('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    fixed_count = 0
    category_counts = {}
    
    for product in products:
        if 'category' not in product or product.get('category') is None:
            name = product.get('name', 'Unknown')
            new_category = classify_product(product)
            product['category'] = new_category
            fixed_count += 1
            
            category_counts[new_category] = category_counts.get(new_category, 0) + 1
            print(f"Fixed '{name}' -> '{new_category}'")
    
    # Save updated products
    with open('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    print(f"\nFixed {fixed_count} products without categories")
    if category_counts:
        print("\nDistribution of fixed products:")
        for category, count in sorted(category_counts.items()):
            print(f"  {category}: {count} products")

if __name__ == "__main__":
    main()