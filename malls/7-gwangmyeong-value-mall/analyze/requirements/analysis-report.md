# Gwangmyeong Value Mall (광명가치몰) Website Analysis

## Website Overview
- **URL**: https://gmsocial.or.kr/mall/
- **Platform**: Custom PHP-based e-commerce platform
- **Purpose**: Social economy enterprise marketplace for Gwangmyeong City

## 1. Product Category Structure and Navigation

### Main Categories (Top-level):
1. **생활/리빙** (Living/Lifestyle) - Category Code: 0001
   - 생활용품 (00010001)
   - 교육ㆍ완구 (00010002)
   - 주방ㆍ욕실용품 (00010003)
   - 침구류 (00010004)
   - 의료기기ㆍ의약외품 (00010005)
   - 출산ㆍ육아 (00010006)
   - 반려동물 (00010007)
   - 자동차용품 (00010008)
   - 문화 (00010009)

2. **패션/뷰티** (Fashion/Beauty) - Category Code: 0002
   - 패션의류 (00020001)
   - 패션잡화 (00020002)
   - 화장품ㆍ미용 (00020003)
   - 마스크ㆍ팩 (00020004)
   - 뷰티소품 (00020005)

3. **디지털/가전** (Digital/Electronics) - Category Code: 0003
   - SW/e-컨텐츠 (00030001)
   - 산업재료 (00030002)
   - 생활가전 (00030003)
   - 디지털기기 (00030004)
   - 휴대폰용품 (00030005)

4. **가구/인테리어** (Furniture/Interior) - Category Code: 0004
   - 가구 (00040001)
   - 인테리어 소품 (00040002)
   - 침구ㆍ홈데코 (00040003)
   - 커튼ㆍ블라인드 (00040004)
   - DIY자재ㆍ용품 (00040005)

5. **스포츠/레저** (Sports/Leisure) - Category Code: 0005
   - 등산ㆍ캠핑ㆍ낚시 (00050001)
   - 골프용품 (00050002)
   - 스포츠의류 (00050003)
   - 스포츠ㆍ레저용품 (00050004)

6. **식품** (Food) - Category Code: 0006
   - 가공식품ㆍ과자ㆍ빙수 (00060001)
   - 커피ㆍ음료 (00060002)
   - 건강식품 (00060003)
   - 농수산물 (00060004)
   - 냉동ㆍ간편조리식품 (00060005)
   - 반찬ㆍ김치 (00060006)

### Category Code Pattern:
- Main categories: 4-digit codes (0001, 0002, etc.)
- Subcategories: 8-digit codes (00010001, 00010002, etc.)

## 2. URL Patterns

### Category Pages:
- Pattern: `/mall/goods/list.php?category_code={CATEGORY_CODE}`
- Example: `/mall/goods/list.php?category_code=0001` (Living/Lifestyle)
- Example: `/mall/goods/list.php?category_code=00010001` (Subcategory - 생활용품)

### Product Detail Pages:
- Pattern: `/mall/goods/view.php?product_id={PRODUCT_ID}`
- Example: `/mall/goods/view.php?product_id=121`
- Product IDs are numeric

### Pagination:
- Uses `page` parameter in URL
- Pattern: `/mall/goods/list.php?category_code={CODE}&page={PAGE_NUMBER}`

### Sorting Options:
- Pattern: `/mall/goods/list.php?category_code={CODE}&sort={SORT_TYPE}`
- Available sort types:
  - `new` - 신상품 (New products) - Default
  - `review` - 최다리뷰 (Most reviews)
  - `priceH` - 높은가격 (Highest price)
  - `priceL` - 낮은가격 (Lowest price)

### Other Important URLs:
- Login: `https://gmsocial.or.kr/bbs/login.php?url=/mall/`
- Register: `https://gmsocial.or.kr/bbs/register.php`
- Company pages: `/mall/company/sub01.php?partner_no={PARTNER_ID}`
- Event/Special pages: `/mall/goods/list_event.php?event_code={EVENT_CODE}`
- Search: `/mall/goods/list.php?searchText={SEARCH_QUERY}`

## 3. Pagination Methods

Based on the actual category page HTML:
- Pagination is implemented using standard query parameters
- Page parameter: `&page={number}`
- Products per page: **12 products per page** (based on the category sample showing 12 items)
- Total products shown in header: `.item_total` class (e.g., "16개")
- Navigation structure:
  ```html
  <div class="paging_navigation">
    <a href="/mall/goods/list.php?category_code=0001&page=1" class="first">◀ 처음</a>
    <a href="/mall/goods/list.php?category_code=0001&page=0" class="prev">◀ 이전</a>
    <a href="/mall/goods/list.php?category_code=0001&page=1" class="on">1</a>
    <a href="/mall/goods/list.php?category_code=0001&page=2" class="">2</a>
    <a href="/mall/goods/list.php?category_code=0001&page=2" class="next">다음◀ </a>
    <a href="/mall/goods/list.php?category_code=0001&page=2" class="last">마지막 ▶</a>
  </div>
  ```
- Active page has class `on`
- Navigation includes: First (처음), Previous (이전), Page Numbers, Next (다음), Last (마지막)

## 4. JavaScript Rendering Requirements

### JavaScript Libraries Used:
- jQuery 3.6.1
- jQuery UI 1.10.4
- TweenMax (for animations)
- Swiper.js (for carousels/sliders)
- Modernizr (feature detection)
- Various jQuery plugins for animations and effects

### Dynamic Content:
- Product carousels on homepage use Swiper.js
- Mobile menu navigation uses JavaScript
- Some interactive features require JavaScript
- **However**: Core product data and navigation appear to be server-rendered in PHP

### Conclusion on JavaScript:
- **NOT required for basic scraping** - Product data is available in the HTML
- JavaScript mainly used for UI enhancements and interactive features
- Server-side rendering (PHP) provides all essential data

## 5. Product Data Location in HTML

### Homepage Product Sections:
1. **New Arrival** section
2. **Best Item** section
3. **MD's Pick** section

### Product Data Structure (from actual category page HTML):
```html
<li class="goods_item">
    <div class="goods_info01">
        <a href="/mall/goods/view.php?product_id={ID}" title="{FULL_TITLE}">
            <span class="goods_img"><img src="{IMAGE_URL}" alt="{COMPANY_NAME}"></span>
            <span class="company_name">{COMPANY_NAME}</span>
            <span class="wr_subject">{PRODUCT_NAME}</span>
        </a>
    </div>
    <div class="goods_info02">
        <div class="goods_price">
            <!-- Optional discount percentage -->
            <span class="sales_percent">{DISCOUNT}%</span>
            
            <span class="default_price"><strong>{PRICE}</strong>원</span>
            
            <!-- Optional original price if discounted -->
            <span class="default_consumer_price">{ORIGINAL_PRICE}원</span>
        </div>
        <div class="goods_info_detail">
            <span class="goods_review">
                <i class="fas fa-star product_star" title="별점"></i>
                <span class="product_review_count"><strong>{RATING}</strong>/5</span>
                <span class="product_grade_star">(<span class="blind">리뷰:</span>{REVIEW_COUNT}건)</span>
            </span>
            <!-- Shipping info -->
            <span class="product_naver_delivery"><span class="blind">배송료:</span>{SHIPPING_INFO}</span>
        </div>
        <div class="goods_cuopon">
            <!-- Coupon info if available -->
        </div>
    </div>
</li>
```

### Key Data Elements:
- Product ID: In the URL parameter `product_id`
- Product Name: `.wr_subject` class
- Company Name: `.company_name` class
- Current Price: `.default_price strong` (numeric value)
- Original Price: `.default_consumer_price` (if discounted)
- Discount Percentage: `.sales_percent` (if discounted)
- Product Image: `img` tag within `.goods_img`
- Rating: `.product_review_count strong` (out of 5)
- Review Count: Number in `.product_grade_star`
- Shipping Info: `.product_naver_delivery` text
- Product links to Naver Smart Store (based on image URLs like `https://shop-phinf.pstatic.net/`)

## 6. API Endpoints

### No Visible REST APIs:
- The site appears to use traditional server-side rendering with PHP
- No AJAX/API calls visible in the initial HTML
- All data is rendered server-side

### Form Actions and Data Endpoints:
- Search: Form submission to `/mall/goods/list.php`
- Product views: Direct PHP page loads
- No visible JSON APIs or AJAX endpoints in the source

## Additional Findings

### SEO and Meta Tags:
- Proper meta tags for SEO
- Open Graph tags for social sharing
- Canonical URL specified

### Mobile Support:
- Responsive design with viewport meta tag
- Mobile-specific JavaScript (Swiper for mobile menus)

### Analytics:
- Google Analytics tracking code: `G-XQBKHSCD7P`

### Cache Control:
- Headers indicate no-cache policy
- Version parameters on CSS/JS files for cache busting

## Scraping Recommendations

1. **Use Direct HTTP Requests**: The site doesn't require JavaScript rendering
2. **Follow Category Structure**: Start with main categories, then subcategories
3. **Parse Server-Rendered HTML**: All product data is available in the HTML
4. **Respect Robots.txt**: Check for any crawling restrictions
5. **Handle Pagination**: Implement page parameter handling for complete data collection
6. **Use CSS Selectors**: Target specific classes for data extraction
   - `.goods_item` for product containers
   - `.goods_name` for product names
   - `.company_name` for company names
   - `.price` for prices

## Next Steps for Implementation

1. Create a scraper that follows the category hierarchy
2. Parse product listings from category pages
3. Extract detailed product information from individual product pages
4. Handle pagination to get all products
5. Store data in structured format (JSON/Database)
6. Implement rate limiting to be respectful to the server

## Important Notes

### Platform Integration
- The mall appears to be integrated with **Naver Smart Store**
- Product images are hosted on Naver's CDN (`shop-phinf.pstatic.net`)
- This suggests products might also be available on individual Naver stores

### Data Completeness
- Not all products have reviews or ratings
- Shipping information varies (무료배송 vs 조건부 무료배송)
- Some products have significant discounts (up to 84% off)
- Company names are prominently displayed for each product

### Technical Considerations
- The site uses UTF-8 encoding
- No AJAX loading for product lists - all server-rendered
- Mobile-responsive design with separate navigation for mobile
- SSL certificate is configured for `gmsocial.or.kr` (not the subdomain)

### Scraping Strategy
1. Start with main categories (6 total)
2. For each category, scrape all subcategories
3. For each subcategory, handle pagination
4. Extract all product data from list pages (most data is available here)
5. Only visit product detail pages if additional information is needed
6. Use the `sort=new` parameter to get newest products first