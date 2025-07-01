# Mall Analysis Report - ID 84: e경남몰

## Summary
- **Status**: ✅ Success
- **URL**: https://egnmall.kr
- **Platform**: ABS Platform (Custom PHP)
- **Analysis Date**: 2025-01-01

## Technical Details

### URL Structure
- **Category Pattern**: `/kwa-ABS_goods_l-{categoryId}`
  - Example: `https://egnmall.kr/kwa-ABS_goods_l-1002`
- **Product Pattern**: `/kwa-ABS_goods_v-{productId}-{categoryId}`
  - Example: `https://egnmall.kr/kwa-ABS_goods_v-8056-1009003`

### Category Structure
Main categories identified:
- 1007: 시군관 (Regional halls)
- 1009: 특별관 (Special sections)
- 1030: 선물세트 (Gift sets)
- 1031: 못난이상품 (Imperfect products)
- 1032: 국가인증농식품 (Certified agricultural products)
- 1002: 농산물 (Agricultural products)
- 1003: 수산물 (Seafood)
- 1004: 축산물 (Livestock products)
- 1005: 가공식품 (Processed foods)

### Dynamic Loading
- **Required**: No
- **Method**: Server-side rendering
- **Implementation**: Traditional PHP page navigation
- **Pagination**: URL parameter-based (page parameter)

### HTML Structure
- **Product Grid**: `.goodsListGnmall`
- **Product Item**: `.GoodsWrap-*` (dynamic class names)
- **Product Data**:
  - Name: `.-fdGoodsName a`
  - Price: `.ABS-sell-price`
  - Image: `.-fdThumb img`
  - Link: `.-fdThumb a`

### Platform Features
- Custom PHP-based platform
- Server-side rendering
- Traditional page navigation
- Multi-level category hierarchy
- Integrated search functionality
- Shopping cart system

## Scraping Recommendations
1. Use traditional web scraping approach (no AJAX handling needed)
2. Navigate through categories using URL patterns
3. Handle pagination via page parameter
4. Parse server-rendered HTML directly

## Issues Encountered
None - Analysis completed successfully

## Files Generated
- `analyze-84.ts` - TypeScript analyzer code
- `analyze-84.js` - JavaScript analyzer code
- `analysis-84.json` - Analysis results
- `homepage.html` - Saved homepage HTML