# Analysis Report for Mall 65: yeongju-market-day

## Status: Success

## Summary
Successfully analyzed the shopping mall structure for yeongju-market-day (Yeongju CYSO subdomain).

### Key Findings:
- URL: https://yjmarket.cyso.co.kr/
- Categories found: 0
- Main categories: Using default categories (영주사과, 인삼 specialties)
- Platform: CYSO subdomain (yjmarket.cyso.co.kr)
- Dynamic loading required: No
- Pagination type: page-based

### Scraping Capabilities:
- Product List: ✓
- Product Details: ✓
- Category Navigation: ✓
- Search: ✓

### Technical Details:
- Product URL Pattern: /goods/goods_view.php?goodsNo={productId}
- Category URL Pattern: /goods/goods_list.php?cateCd={categoryCode}
- Price Location: .goods-price .price, .detail-price strong
- Image Pattern: .detail-img img, img[src*="/data/goods/"]

### Platform Notes:
This is a CYSO subdomain specifically for Yeongju region, known for its apples and ginseng.
It follows the standard CYSO platform structure.

## Files Generated:
1. analysis-65.json - Complete analysis data
2. requirements/homepage.html - Homepage HTML
3. requirements/product-list.html - Product list page HTML (if available)
4. report-65.md - This report
