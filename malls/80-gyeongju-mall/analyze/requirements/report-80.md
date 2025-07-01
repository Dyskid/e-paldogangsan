# Analysis Report for Mall 80 - 경주몰 (Gyeongju Mall)

## Status: ✅ SUCCESS

## Summary
Successfully analyzed the Gyeongju Mall website structure. The mall uses the CYSO platform, which is a common e-commerce platform for Korean local government shopping malls.

## Key Findings

### Platform Type
- **Type**: CYSO_PLATFORM
- **Base URL**: https://gjmall.cyso.co.kr

### URL Patterns
- **Product URLs**: `https://gjmall.cyso.co.kr/shop/item.php?it_id={productId}`
  - Example: https://gjmall.cyso.co.kr/shop/item.php?it_id=1746878496
- **Category URLs**: `https://gjmall.cyso.co.kr/shop/list.php?ca_id={categoryId}`
  - Example: https://gjmall.cyso.co.kr/shop/list.php?ca_id=gj10

### Sample Categories Found
1. 농수산품 (Agricultural Products) - ID: gj10
2. 농산물 (Farm Products) - ID: gj1060
3. 곡류 (Grains) - ID: gj1010
4. 채소 (Vegetables) - ID: gj1020
5. 과일 (Fruits) - ID: gj1030
6. 가공식품 (Processed Foods) - ID: gj20
7. 장류 (Fermented Pastes) - ID: gj2010
8. 김치/절임류 (Kimchi/Pickled Foods) - ID: gj2020

### Sample Products Found
1. [농부가 간다] 달달방토, 대추방울토마토 3kg - ID: 1746878496
   - Price: 19,000원 (Member price with 50% discount)
   - Original price: 38,000원

### Data Location Selectors
- **Category List**: `.all_menu_list, .gnb_al_ul`
- **Product List**: `.sct_10`
- **Product Info**:
  - Name: `.it_name`
  - Price: `.member_price`
  - Image: `.img img`

### JavaScript Requirement
- **Required**: No
- The website content is server-side rendered and accessible without JavaScript execution.

## Files Generated
1. `analyze-80.ts` - TypeScript analysis file
2. `analyze-80.js` - JavaScript analysis file
3. `analysis-80.json` - Generated JSON output
4. `report-80.md` - This report file

## Notes
- The mall shows member-only discounted prices prominently
- Products use numeric IDs (Unix timestamp format)
- Categories use alphanumeric IDs with "gj" prefix
- The platform structure is consistent with other CYSO-based malls