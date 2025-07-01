# Analysis Report for Wonju Mall (ID: 11)

## Summary
**Status**: ✅ **SUCCESS**

## Details

### Website Information
- **Mall ID**: 11
- **Mall Name**: 원주몰 (Wonju Mall)
- **URL**: https://wonju-mall.co.kr/
- **Region**: 강원 (Gangwon)
- **Platform**: Firstmall

### Analysis Results

The analysis process was **successful**. The website is active and accessible.

### Technical Details

1. **Platform Analysis**:
   - E-commerce Platform: Firstmall
   - Requires JavaScript: Yes
   - Mobile-responsive: Yes
   - Data Location: HTML DOM

2. **URL Structure**:
   - Category pages: `/goods/catalog?code={categoryCode}`
   - Product pages: `/goods/view?no={productId}`
   - Search: `/goods/search?search_text={keyword}`
   - Pagination: `&page={pageNumber}`

3. **Category Structure**:
   - 쌀/잡곡 (Rice/Grains) - Code: 0001
   - 채소/임산물 (Vegetables/Forest Products) - Code: 0003
   - 과일/견과/건과 (Fruits/Nuts/Dried Fruits) - Code: 0002
   - 수산/건어물 (Seafood/Dried Fish) - Code: 0021
   - 정육/계란류 (Meat/Eggs) - Code: 0017

4. **Product Data Structure**:
   - Container selector: `li.gl_item`
   - Product ID extraction: From `onclick` attribute in `display_goods_view()` function
   - Available fields: name, price, original price, discount, seller, purchase count, review count, free shipping indicator

### Key Findings

1. The mall specializes in local Wonju and Gangwon province products
2. Featured products include:
   - 감자 (potatoes) and potato-based products
   - 토종다래 (native kiwi berries)
   - 강원한우 (Gangwon Korean beef)
   - Traditional fermented products
3. The site uses standard Firstmall platform structure
4. Product data is embedded in HTML (not loaded via API)

### Files Generated

1. **analyze-11.ts**: TypeScript analysis script with full structure mapping
2. **analysis-11.json**: JSON output with complete mall structure
3. **HTML samples**: Homepage and search page samples saved in requirements folder

### Last Checked
2025-07-01T09:22:03.031Z