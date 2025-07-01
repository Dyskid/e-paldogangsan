# Chack-chack-chack Homepage Analysis

## 1. Main Navigation Menu Structure and Product Categories

### Top Navigation Bar
- **회원가입** (Join) - `/shop/idinfo.html?type=new`
- **로그인** (Login) - `/shop/member.html?type=login`
- **고객센터** (Customer Center) - `/shop/faq.html`

### Quick Access Menu
- **마이페이지** (My Page) - `/shop/member.html?type=mynewmain`
- **주문/배송조회** (Order/Delivery Tracking) - `/shop/confirm_login.html?type=myorder`
- **장바구니** (Cart) - `/shop/basket.html`

### Main Navigation Menu
- **전체카테고리** (All Categories) - Dropdown menu
- **브랜드스토리** (Brand Story) - `/shop/page.html?id=1`
- **이달의 기획세트** (Monthly Special Sets) - `/shop/plan_list.html`
- **이벤트공지** (Event Notice) - `/board/board.html?code=kgcbrand1_board2`
- **쇼핑안내** (Shopping Guide) - `/shop/page.html?id=2`

### Product Categories (from dropdown)
Main categories use the pattern `/shop/shopbrand.html?type=X&xcode=XXX`:

1. **Special Categories**:
   - 이달의 탈출 기획전 - `?type=Y&xcode=033`
   - 전체상품 - `?type=Y&xcode=030`

2. **Regular Categories**:
   - 식품/음료/건강식품 - `?type=X&xcode=001`
   - 생활/주방 - `?type=X&xcode=002`
   - 뷰티/미용 - `?type=X&xcode=003`
   - 패션잡화/신발 - `?type=X&xcode=004`
   - 디지털/사무 - `?type=X&xcode=005`
   - 건강/의료 - `?type=X&xcode=006`
   - 스포츠/레저/여행 - `?type=X&xcode=007`
   - 가구/침구 - `?type=X&xcode=008`
   - 유아/출산/아동 - `?type=X&xcode=009`
   - 도서/컴퓨터/휴대폰 - `?type=X&xcode=010`
   - 공예/취미/악기 - `?type=X&xcode=014`
   - 기타 - `?type=X&xcode=015`

### Social Economy Product Categories
Special section with pattern `/shop/shopbrand.html?xcode=XXX&type=P`:
- 장애인생산품 - `?xcode=022&type=P`
- 청년기업 - `?xcode=023&type=P`
- 여성기업 - `?xcode=024&type=P`
- 사회적기업/마을기업/협동조합 - `?xcode=025&type=P`
- 자활기업/표준사업장 - `?xcode=026&type=P`
- 중증장애인생산시설 - `?xcode=027&type=P`
- 지역특산품 - `?xcode=028&type=P`

## 2. URL Patterns

### Product Listing URLs
- **Category browsing**: `/shop/shopbrand.html`
  - Parameters:
    - `type`: X (regular category), Y (special category), P (social economy)
    - `xcode`: Category code (001-015, 022-028, 030, 033)
    - `search`: Search query
    - `refer`: Referrer protocol

### Product Detail URLs
- **Pattern**: `/shop/shopdetail.html`
  - Key parameters:
    - `branduid`: Unique product ID (e.g., 316584, 12230790)
    - `xcode`: Major category code
    - `mcode`: Minor category code
    - `scode`: Sub-category code
    - `special`: Special product flag (1, 2)
    - `search`: Search query
    - `GfDT`: Encoded parameter

### Other Important URLs
- **Search results**: `/shop/shopbrand.html?search=[query]`
- **Shopping cart**: `/shop/basket.html`
- **Member pages**: `/shop/member.html?type=[page_type]`
- **Event board**: `/board/board.html?code=kgcbrand1_board2`

## 3. JavaScript Functions Related to Search and Navigation

### Search Functions
```javascript
// Main search function
function prev_search() {
    var encdata = jQuery('input[name="search"]', jQuery('form[name="search"]')).val().replace(/%/g, encodeURIComponent('%'));
    document.search.action = '/shop/shopbrand.html?search=' + decodeURIComponent(encdata) + '&refer=' + window.location.protocol;
}

// Check for Enter key in search box
function CheckKey_search() {
    key = event.keyCode;
    if (key == 13) {
        prev_search();
        document.search.submit();
    }
}

// Submit search form
function search_submit() {
    var oj = document.search;
    if (oj.getAttribute('search') != 'null') {
        var reg = /\s{2}/g;
        oj.search.value = oj.search.value.replace(reg, '');
        oj.submit();
    }
}

// Hashtag search
function go_hashtag(search) {
    document.hashtagform.search.value = search;
    document.hashtagform.submit();
}
```

### Navigation Functions
- Dropdown menu toggle on hover
- Fixed header on scroll (activates when scroll > 145px)
- Category menu show/hide functionality

## 4. HTML Structure for Product Displays

### Product List Item Structure
```html
<li class="pro_list_box">
    <div class="pro_icon"><span class='MK-product-icons'></span></div>
    <div class="pro_img">
        <a href="/shop/shopdetail.html?branduid=XXX">
            <img class="MS_prod_img_m" src="/shopimages/kgcbrand1/XXX.jpg">
        </a>
    </div>
    <div class="pro_info_box">
        <p class="pro_type">카테고리명</p>
        <p class="pro_name">
            <a href="/shop/shopdetail.html?branduid=XXX">
                <span style="-webkit-line-clamp: 2;">상품명</span>
            </a>
        </p>
        <ul class="pro_price clearfix">
            <li class="pro_discount">
                <div class="per">
                    <span class="pct">할인율</span>
                    <span class="m_per">%</span>
                </div>
            </li>
            <li class="pro_price02">
                <p class="price consumer">
                    <span class="mkprc">정가<span class="mwon">원</span></span>
                </p>
                <p class="normal">
                    <span>판매가<span class="mwon">원</span></span>
                </p>
            </li>
        </ul>
    </div>
</li>
```

### Key CSS Classes
- `.pro_list_box`: Product container
- `.pro_img`: Product image wrapper
- `.pro_info_box`: Product information container
- `.pro_type`: Category label
- `.pro_name`: Product name (with 2-line clamp)
- `.pro_price`: Price information container

## 5. Pagination Elements

Based on the analysis, pagination elements were not found in the homepage HTML. This suggests:
- The homepage displays featured/popular products without pagination
- Pagination likely appears on category listing pages (`/shop/shopbrand.html`)
- The site may use lazy loading or "Load More" functionality for product lists

## Additional Findings

### Character Encoding
- The site uses **EUC-KR** encoding, which is important for handling Korean text

### Search Implementation
- Search form submits to `/shop/shopbrand.html` with search parameter
- Search input has auto-completion functionality (class: `search_auto_completion`)

### Mobile Considerations
- Mobile version available at `https://www.chack3.com/m`
- Responsive design elements present

### Session/Cookie Management
- Various cookie functions for user tracking and preferences
- Basket quantity updated dynamically via AJAX

### Third-party Integrations
- Social login support (Naver, Kakao)
- Analytics/logging system (MSLOG)
- Lazy loading for images

This analysis provides a comprehensive understanding of the chack-chack-chack e-commerce platform's structure, which can be used to develop automated scraping or integration tools.