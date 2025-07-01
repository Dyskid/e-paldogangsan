# Analysis Report for Mall 78 - Yeongdeok Market (영덕장터)

## Status: ✅ SUCCESS

## Summary
Successfully analyzed the Yeongdeok Market (영덕장터) shopping mall website. The mall uses the CYSO platform with a standard structure for categories and products.

## Key Findings

### Platform
- **Platform Type**: CYSO
- **Homepage**: https://ydmall.cyso.co.kr
- **JavaScript Required**: No (data available in HTML)

### URL Structure
- **Product URLs**: `/shop/item.php?it_id={product_id}`
  - Example: `https://ydmall.cyso.co.kr/shop/item.php?it_id=1599026122`
- **Category URLs**: `/shop/list.php?ca_id={category_id}`
  - Example: `https://ydmall.cyso.co.kr/shop/list.php?ca_id=yd10`

### Category Structure
The mall uses a hierarchical category system with custom IDs prefixed with "yd":
- Main categories: yd10, yd20, yd30, yd40, yd50, yd60, yd70, yd80
- Subcategories: yd1010, yd1020, yd2010, yd2020, etc.

### Sample Categories Found
1. **쌀/잡곡** (Rice/Grains) - ID: yd10
2. **과일류** (Fruits) - ID: yd20
3. **채소류** (Vegetables) - ID: yd30
4. **축산물** (Livestock Products) - ID: yd40
5. **선물세트** (Gift Sets) - ID: yd80

### Sample Products Found
1. **[더동쪽 바다가는길] 홍영의 어간장 선물세트 1호** - 22,000원
2. **[영어농조합법인]영덕게 한가득 세트** - 45,000원
3. **[대부호] 산모미역 영덕 청정 돌미역 400g** - 45,000원
4. **[동양미곡처리장] 해풍미 20kg (2024년산)** - 57,900원
5. **[더동쪽 바다가는길] 홍영의 붉은대게백간장** - 12,000원
6. **영덕 게간장 500ml** - 8,000원

### Key Selectors
- **Product Name**: `.sct_txt a`
- **Product Price**: `.sct_cost`
- **Product Image**: `.sct_img img`
- **Category Name**: `.gnb_al_a`

### Notable Features
- The mall features local Yeongdeok specialties including seafood products (crab sauce, seaweed)
- Products are organized by seller/brand
- Price display includes member discount information for some products
- Clean CYSO platform implementation with standard selectors

## Files Generated
1. `analyze-78.ts` - TypeScript analysis configuration
2. `analyze-78.js` - JavaScript executable version
3. `analysis-78.json` - JSON output with mall configuration
4. `report-78.md` - This report

## Recommendations
The mall structure is standard and straightforward to scrape. No special handling required for JavaScript as all data is available in the HTML source.