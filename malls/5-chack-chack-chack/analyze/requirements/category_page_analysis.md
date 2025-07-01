# 착착착 Category Page Analysis

## 1. Product Listing Structure (HTML)

### Container Structure
- Main container: `<div class="gallery_list column4 pdBtnBoxWrap wrap">`
- Products are wrapped in a `<ul>` element
- Each product is an `<li>` item with class structure

### Individual Product Structure
```html
<li>
    <div class="con liWrap">
        <!-- Main product link wrapper -->
        <a href="/shop/shopdetail.html?branduid=317258&..." class="pdLink"></a>
        
        <!-- Product image -->
        <div class="cutImgBox" style="overflow: hidden;">
            <a href="/shop/shopdetail.html?branduid=317258&..." class="pdImg">
                <img class="MS_prod_img_m" src="/shopimages/kgcbrand1/0010060000592.jpg?1710222271" alt="">
            </a>
        </div>
        
        <!-- Product details -->
        <div class="timerestBox_height">
            <a href="/shop/shopdetail.html?branduid=317258&..." class="link"></a>
            <div class="txt">
                <!-- Brand/Category -->
                <dl>
                    <dt class="pro_type">건강보조식품</dt>
                </dl>
                
                <!-- Product name -->
                <dl>
                    <dt>
                        <a href="..." title="[product full name]">
                            <span>[Product Name]</span>
                        </a>
                    </dt>
                    <!-- Original price (if discounted) -->
                    <dd><del class="marketprice consumer">30,000<span class="mwon">원</span></del></dd>
                </dl>
                
                <!-- Current price -->
                <div class="price_wrap">
                    <span class="dis"><span class="pct"></span><em class="m_per">%</em></span>
                    <strong class="normal"><span>30,000<span class="mwon">원</span></span></strong>
                </div>
            </div>
        </div>
    </div>
</li>
```

## 2. Pagination Structure

### URL Parameters
- Base URL: `/shop/shopbrand.html`
- Key parameters:
  - `type=X` - Category type
  - `xcode=001` - Main category code
  - `mcode=` - Middle category code (optional)
  - `scode=` - Sub category code (optional)
  - `sort=` - Sorting parameter
  - `page=` - Page number

### Pagination HTML Structure
```html
<div class="paging_box">
    <div class="paging">
        <a href="/shop/shopbrand.html?type=X&xcode=001&sort=&page=1" class="on">1</a>
        <a href="/shop/shopbrand.html?type=X&xcode=001&sort=&page=2">2</a>
        <!-- ... more page numbers ... -->
        <a href="/shop/shopbrand.html?type=X&xcode=001&sort=&page=10">10</a>
        <a href="/shop/shopbrand.html?type=X&xcode=001&sort=&page=11" class="direction next"><span></span></a>
    </div>
</div>
```

## 3. Products Per Page
- **40 products per page** based on the analysis

## 4. Sorting Options

### Available Sort Options
1. **인기상품순** (Popular) - `sort=sellcnt`
2. **신상품순** (New products) - `sort=order`
3. **낮은가격순** (Low price) - `sort=price`
4. **높은가격순** (High price) - `sort=price2`
5. **상품후기순** (Reviews) - `sort=review`

### Sorting Implementation
JavaScript function `sendsort(temp)` handles sorting:
```javascript
function sendsort(temp) {
    var filter_keyword_ids = "";
    // ... filter handling ...
    location.href = "/shop/shopbrand.html?xcode=001&mcode=&type=X&scode=&sort=" + temp + "&filter_keyword_ids="+filter_keyword_ids;
}
```

## 5. Product Data Available

For each product, the following data is available:
1. **Product ID** (`branduid`) - Unique identifier
2. **Product Image** - Full URL to product image
3. **Product Name** - Full product title
4. **Brand/Category** - Product type/category (e.g., "건강보조식품")
5. **Original Price** - If product is on sale (shown with strikethrough)
6. **Current Price** - Active selling price
7. **Discount Percentage** - If applicable (though often empty in the sample)
8. **Product URL** - Direct link to product detail page

### Product URL Structure
```
/shop/shopdetail.html?branduid=[ID]&xcode=[X]&mcode=[M]&scode=[S]&type=X&sort=[SORT]&cur_code=[CODE]&search=&GfDT=[TOKEN]
```

## 6. AJAX/JavaScript Loading

### No AJAX for Product Loading
- Products are server-side rendered (no AJAX calls for loading products)
- Page navigation is done through full page reloads
- Sorting also triggers full page reloads

### JavaScript Functions
1. `sendsort(temp)` - Handles sorting
2. `pagemove(temp)` - Handles pagination (though not used in current implementation)
3. `go_hashtag(search)` - Handles hashtag search

## Key Findings for Scraping

1. **Static HTML**: All products are in the initial HTML response - no need to handle dynamic loading
2. **Consistent Structure**: Each product follows the same HTML pattern
3. **Clear Pagination**: Simple page-based navigation with clear URL parameters
4. **40 Products/Page**: Fixed number of products per page
5. **Product IDs**: Each product has a unique `branduid` identifier
6. **Category Navigation**: Uses `xcode`, `mcode`, `scode` parameters for category filtering
7. **No Anti-Scraping**: No obvious JavaScript-based protections or dynamic content loading

## Recommended Scraping Approach

1. Start with category URL: `/shop/shopbrand.html?type=X&xcode=001`
2. Parse the total product count from: `<p class="total_cont">총 <em>440</em>개의 상품이 있습니다.</p>`
3. Calculate total pages: `total_products / 40`
4. Iterate through pages using `page` parameter
5. For each page, extract products from `<div class="gallery_list">` > `<ul>` > `<li>` elements
6. Extract product details from each `<li>` element following the structure above