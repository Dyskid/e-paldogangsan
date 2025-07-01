# K-Kimchi Mall (광주김치몰) Downloaded Pages

This directory contains HTML pages downloaded from https://www.k-kimchi.kr/ for analysis.

## Downloaded Pages

1. **homepage.html** - Main homepage
   - URL: https://www.k-kimchi.kr/
   - Contains: Navigation, featured products, banners, footer

2. **category_page.html** - Category listing page (별미김치/Special Kimchi)
   - URL: https://www.k-kimchi.kr/index.php?cate=004
   - Contains: Product grid, filtering, pagination

3. **product_detail_page.html** - Product detail page (배추김치 1.5kg)
   - URL: https://www.k-kimchi.kr/?cate=005001&type=view&num=228#module
   - Contains: Product images, description, price, add to cart

4. **search_results_page.html** - Search results page
   - URL: https://www.k-kimchi.kr/index.php?cate=000003001&type=search&prodName=김치
   - Contains: Search results grid, search filters

5. **cart_page.html** - Shopping cart page
   - URL: https://www.k-kimchi.kr/index.php?cate=000002004&type=cart#module
   - Contains: Cart items, checkout process

6. **about_page.html** - About page (광주김치 소개)
   - URL: https://www.k-kimchi.kr/index.php?cate=008001
   - Contains: Information about Gwangju Kimchi

## URL Patterns Identified

- Categories: `/index.php?cate={category_id}`
- Product details: `/?cate={category_id}&type=view&num={product_id}#module`
- Search: `/index.php?cate=000003001&type=search&prodName={keyword}`
- Cart: `/index.php?cate=000002004&type=cart#module`

## Key Categories
- 001: 포기김치 (Whole Cabbage Kimchi)
- 003: 묵은지 (Aged Kimchi)
- 004: 별미김치 (Special Kimchi)
- 005: 30%할인전 (30% Discount)
- 006: 명인 명품김치 (Master's Premium Kimchi)
- 002: 반찬가게 (Side Dish Store)
- 015: 선물세트 (Gift Sets)