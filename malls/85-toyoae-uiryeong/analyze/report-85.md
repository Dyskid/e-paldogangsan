# Mall Analysis Report - ID 85: 토요애 (의령)

## Summary
- **Status**: ✅ Success
- **URL**: https://toyoae.com/
- **Platform**: Godomall5 (v5.x)
- **Analysis Date**: 2025-01-01

## Technical Details

### URL Structure
- **Category Pattern**: `/goods/goods_list.php?cateCd={categoryCode}`
  - Example: `https://toyoae.com/goods/goods_list.php?cateCd=001`
- **Product Pattern**: `/goods/goods_view.php?goodsNo={productId}`
  - Example: `https://toyoae.com/goods/goods_view.php?goodsNo=1000000123`

### Category Structure
Main categories identified:
- 019: 베스트상품 (Best products)
- 027: 추천상품 (Recommended products)
- 021: 토요애 브랜드 (Toyoae brand)
  - 021001: 토요애 쌀
  - 021002: 토요애 농산물
  - 021003: 의령 망개떡
- 001: 쌀/잡곡 (Rice/Grains)
  - 001024: 토요애 브랜드 쌀
  - 001025: 친환경 브랜드 쌀
  - 001026: 일반쌀
  - 001027: 현미/찹쌀/잡곡
- 002: 과일/채소 (Fruits/Vegetables)
  - 002026: 과일류
  - 002027: 채소류
  - 002001: 버섯류
- 012: 축산/계란/유제품 (Livestock/Eggs/Dairy)
  - 012003: 한우/한돈
  - 012006: 유정란/메추리알
  - 012004: 유제품

### Dynamic Loading
- **Required**: No
- **Method**: Server-side rendering
- **Implementation**: Traditional PHP-based navigation
- **Pagination**: URL parameter-based (page parameter)

### HTML Structure
- **Product Grid**: `.goods_list`
- **Product Item**: `.goods_list_item`
- **Product Data**:
  - Name: `.item_name`
  - Price: `.item_price`
  - Image: `.item_photo img`
  - Link: `.item_link`

### Platform Features
- Godomall5 e-commerce platform
- PHP-based with server-side rendering
- Multi-level category hierarchy
- Brand-based navigation system
- Traditional page navigation
- Member system with login/registration

## Scraping Recommendations
1. Use traditional web scraping approach
2. Navigate through categories using cateCd parameter
3. Handle pagination via page parameter
4. Parse server-rendered HTML directly
5. Note the brand-focused organization (토요애 brand)

## Issues Encountered
None - Analysis completed successfully

## Files Generated
- `analyze-85.ts` - TypeScript analyzer code
- `analyze-85.js` - JavaScript analyzer code
- `analysis-85.json` - Analysis results
- `homepage.html` - Saved homepage HTML
- `category_001.html` - Sample category page