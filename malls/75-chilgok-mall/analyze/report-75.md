# Mall Analysis Report - Mall #75 (chilgok-mall)

## Summary
- **Status**: ✅ Success
- **Platform**: CYSO
- **Homepage**: https://cgmall.cyso.co.kr
- **Analysis Date**: 2025-07-01

## Platform Details
The mall uses the CYSO e-commerce platform, similar to other malls in the same regional network (고령몰 #71, 예천몰 #73, 문경새재모닝 #74).

## URL Patterns
- **Product URL Pattern**: `https://cgmall.cyso.co.kr/shop/item.php?it_id={productId}`
  - Example: https://cgmall.cyso.co.kr/shop/item.php?it_id=1647325366
- **Category URL Pattern**: `https://cgmall.cyso.co.kr/shop/list.php?ca_id={categoryId}`
  - Example: https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg10

## Category Structure
Successfully extracted 15 main categories including:
- 쌀/잡곡 (cg10)
- 과일류 (cg20)
- 채소류 (cg30)
- 축산물 (cg40)
- 꿀/홍삼 (cg60)
- 가공식품 (cg70)
- 김치/장류/참기름 (cg80)
- 한과/떡/빵류 (cg90)
- 전통주류/와인 (cga0)
- 특산물 (cgb0)

## Product Data
Successfully extracted 10 sample products with:
- Product IDs (e.g., 1647325366, 1623751903)
- Product names with vendor information in brackets
- Prices in Korean won (₩)
- Most products have prices, one product (ID: 1746598260) was missing price information

## Data Location Selectors
- **Product List**: `.sct.sct_30 .sct_li, .sct.sct_40 .sct_li`
- **Product Name**: `.sct_txt a`
- **Product Price**: `.sct_cost`
- **Product Image**: `.sct_img img`
- **Product Link**: `.sct_img > a`

## Technical Notes
- **JavaScript Required**: Yes - The site uses JavaScript for dynamic content loading
- **Mobile/Desktop**: The analyzed page appears to be the mobile version based on CSS references
- **Search Functionality**: Site has search available at `/shop/search.php`

## Files Generated
1. ✅ `analyze-75.ts` - TypeScript analysis definition
2. ✅ `analyze-75.js` - JavaScript runner script
3. ✅ `analysis-75.json` - Final analysis output
4. ✅ `report-75.md` - This report

## Conclusion
The analysis was successful. The chilgok-mall (칠곡몰) follows the standard CYSO platform structure with clear product and category URL patterns. All required data was successfully extracted.