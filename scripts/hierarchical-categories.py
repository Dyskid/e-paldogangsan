#!/usr/bin/env python3
import json

# Define hierarchical category structure
CATEGORY_HIERARCHY = {
    "식품": {
        "농산물": {
            "쌀/곡물": ["쌀/곡물류"],
            "채소": ["채소", "채소/나물류", "나물/산채"],
            "과일": ["과일/채소"],
            "버섯": ["버섯류", "버섯"],
            "기타농산물": ["농산물", "곶감", "구기자"]
        },
        "축산물": {
            "한우": ["한우", "한우/육류"],
            "돼지고기": ["육류"],
            "기타육류": ["축산물", "정육류", "순대/가공육"]
        },
        "수산물": {
            "생선": ["수산물"],
            "전복": ["완도전복"],
            "해조류": ["해조류", "김"],
            "젓갈": ["젓갈"]
        },
        "가공식품": {
            "장류": ["김치/장/절임", "발효식품", "전통발효식품", "장류/조미료", "양념/장류", "장류/가공식품"],
            "조미료": ["조미료", "기름/참깨", "소금"],
            "절임류": ["장아찌"],
            "즉석/간편식": ["만두/떡/간편식", "간편식품", "간편식"],
            "떡/한과": ["떡류", "전통떡", "전통한과", "과자"],
            "베이커리": ["베이커리/간식"],
            "음료": ["음료/차/주류", "차/음료", "전통주"],
            "건강식품": ["건강식품", "꿀/홍삼", "인삼/홍삼", "양봉제품", "즙류/식초"],
            "기타가공": ["가공식품", "가공상품", "전통식품", "식품", "반찬", "건과류", "유제품"]
        }
    },
    "비식품": {
        "생활용품": {
            "주방/생활": ["생활용품", "생활/리빙"],
            "가구/인테리어": ["가구/인테리어"],
            "위생용품": ["위생용품"],
            "사무용품": ["사무용품"]
        },
        "취미/문화": {
            "공예품": ["공예품"],
            "원예": ["원예/화훼"],
            "교육": ["교육/취미", "체험/교육"]
        },
        "기타상품": {
            "선물세트": ["선물세트"],
            "디지털": ["디지털/가전"],
            "패션": ["패션/뷰티"],
            "반려동물": ["반려동물용품"],
            "서비스": ["서비스"],
            "기타": ["기타", "신상품", "신선식품"]
        }
    }
}

def find_category_hierarchy(current_category):
    """Find the hierarchical path for a category"""
    for major, mid_dict in CATEGORY_HIERARCHY.items():
        for mid, minor_dict in mid_dict.items():
            for minor, categories in minor_dict.items():
                if current_category in categories:
                    return major, mid, minor
    return "기타", "미분류", "미분류"

def main():
    # Load products
    with open('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    # Add hierarchical categories to each product
    for product in products:
        current_category = product.get('category', '기타')
        major, mid, minor = find_category_hierarchy(current_category)
        
        # Add new hierarchical fields
        product['categoryMajor'] = major
        product['categoryMid'] = mid
        product['categoryMinor'] = minor
        # Keep original category for now
        product['categoryOriginal'] = current_category
    
    # Save updated products
    with open('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    # Print statistics
    print("Category Hierarchy Statistics:")
    print("="*50)
    
    category_stats = {}
    for product in products:
        major = product.get('categoryMajor', '')
        mid = product.get('categoryMid', '')
        minor = product.get('categoryMinor', '')
        
        if major not in category_stats:
            category_stats[major] = {}
        if mid not in category_stats[major]:
            category_stats[major][mid] = {}
        if minor not in category_stats[major][mid]:
            category_stats[major][mid][minor] = 0
        
        category_stats[major][mid][minor] += 1
    
    total_products = 0
    for major, mid_dict in sorted(category_stats.items()):
        major_total = sum(sum(minor_dict.values()) for minor_dict in mid_dict.values())
        print(f"\n{major} ({major_total} products)")
        print("-" * 30)
        
        for mid, minor_dict in sorted(mid_dict.items()):
            mid_total = sum(minor_dict.values())
            print(f"  {mid} ({mid_total} products)")
            
            for minor, count in sorted(minor_dict.items()):
                print(f"    {minor}: {count} products")
                total_products += count
    
    print(f"\nTotal products: {total_products}")

if __name__ == "__main__":
    main()