# Analysis Report for Mall 79 - 경산몰

## Status: SUCCESS

## Summary
Successfully analyzed 경산몰 (Gyeongsan Mall) - a CYSO platform-based shopping mall at https://gsmall.cyso.co.kr

## Key Findings

### Platform
- **Platform Type**: CYSO
- **Base URL**: https://gsmall.cyso.co.kr
- **JavaScript Required**: No

### URL Patterns
1. **Product URLs**: `/shop/item.php?it_id={product_id}`
   - Example: https://gsmall.cyso.co.kr/shop/item.php?it_id=1728614449
   - Parameter: `it_id`

2. **Category URLs**: `/shop/list.php?ca_id={category_id}`
   - Example: https://gsmall.cyso.co.kr/shop/list.php?ca_id=gs10
   - Parameter: `ca_id`

### Category Structure
Found 50 categories organized hierarchically:
- Top-level categories include: 쌀/잡곡, 과일류, 채소류, 축산물, 꿀/홍삼, 가공식품, 김치/장류/참기름, 한과/떡/빵류, 전통주류/와인, 특산물, 친환경인증
- Category IDs follow pattern: `gs` + alphanumeric code (e.g., gs10, gs20, gs30)
- Sub-categories maintain parent relationship (e.g., gs1010 under gs10)

### Product Data
Extracted 8 sample products with prices ranging from 0원 to 39,900원:
- 한우 안심 (39,900원)
- 아싸우리막창 (16,000원)
- 흑돼지 막구이 (12,000원)
- 경산대추고추장 various sizes
- 경산대추된장 various sizes

### HTML Structure
- Product container: `.sct.sct_40`
- Product item: `.sct_li`
- Product name: `.sct_txt a`
- Product price: `.sct_cost`
- Product image: `.sct_img img`
- Product link: `.sct_img > a, .sct_txt > a`

## Notes
- 경산시 공식 농특산물 쇼핑몰
- Features local Gyeongsan specialties including jujube-based products (대추고추장, 대추된장)
- Clean CYSO platform structure with consistent selectors
- All product IDs are numeric timestamps