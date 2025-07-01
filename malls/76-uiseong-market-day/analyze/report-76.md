# Mall Analysis Report - 76-uiseong-market-day

## Status: ✅ Success

## Summary
Successfully analyzed the mall structure for 의성장날 (Uiseong Market Day). The mall is built on the CYSO platform.

## Platform Details
- **Platform**: CYSO
- **Homepage**: https://esmall.cyso.co.kr
- **JavaScript Required**: Yes

## URL Patterns
- **Category URL Pattern**: `https://esmall.cyso.co.kr/shop/list.php?ca_id={categoryId}`
- **Product URL Pattern**: `https://esmall.cyso.co.kr/shop/item.php?it_id={productId}`

## Sample Categories Found
1. 쌀/잡곡 (ID: es10)
2. 과일류 (ID: es20)
3. 의성마늘 (ID: es30)
4. 가공식품 (ID: es90)
5. 채소류 (ID: es40)
6. 김치/장류/양념류 (ID: es50)
7. 한과/떡/빵 류 (ID: es80)
8. 축산물 (ID: es70)
9. 로컬푸드 (ID: esa0)

## Sample Products Found
1. [의성복숭아나라] 햇살어린 말랑이 알찬 백도복숭아 3kg 9과~13과 (ID: 1751250822) - 22,080원
2. [의성복숭아나라] 햇살어린 말랑이 알찬 백도복숭아 3kg 14과~17과 (ID: 1751250811) - 18,630원
3. [샘골도담] 임신선물 유미 복숭아 2.5kg 대과 (ID: 1751125819) - 28,400원
4. 의성장날 베스트상품 (ID: 1690724482) - 13,300원
5. 의성장날 추천상품 (ID: 512907)

## Data Location Selectors
- Category List: `.gnb_al_li`
- Product Name: `.sct_txt`
- Product Price: `.sct_cost`
- Product Image: `.sct_img img`

## Analysis Files Generated
- ✅ analyze-76.ts
- ✅ analyze-76.js
- ✅ output/analysis-76.json

## Notes
- The mall specializes in local agricultural products from Uiseong County
- Features special products like Uiseong garlic and peaches
- Categories use alphanumeric IDs (es10, es20, etc.)
- Product IDs are numeric strings