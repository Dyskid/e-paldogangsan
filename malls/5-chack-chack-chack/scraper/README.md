# 착착착 (Chack Chack Chack) Scraper

Web scraper for 착착착, a social economy shopping mall in Gyeonggi Province.

## Mall Information
- **Mall ID**: 5
- **Mall Name**: 착착착
- **URL**: https://www.chack3.com/
- **Region**: 경기 (Gyeonggi)
- **Special Focus**: Social economy products

## Features
- Scrapes products from both regular and social economy categories
- Handles EUC-KR encoding (Korean text)
- Extracts original and discounted prices
- Server-side rendered content (no JavaScript required)
- Pagination support (40 products per page)
- Saves results in JSON format

## Installation

```bash
npm install
```

## Usage

```bash
# Run the scraper
npm start

# Development mode with auto-reload
npm run dev

# Build TypeScript files
npm run build
```

## Output

The scraper generates two files:
- `products-5.json` - Complete product listing
- `summary-5.json` - Summary statistics by category

## Configuration

Settings can be modified in `config.json`:
- `encoding`: Character encoding (EUC-KR)
- `itemsPerPage`: Products per page (40)
- `requestDelay`: Delay between requests
- `selectors`: CSS selectors for data extraction

## Technical Details

- **Encoding**: EUC-KR (requires iconv-lite for conversion)
- **Technology**: Static HTML scraping
- **Libraries**: axios, cheerio, iconv-lite
- **Pagination**: Page number based
- **No JavaScript**: Server-side rendered content

## Category Structure

### Regular Categories (Type: X)
1. 농산물 (Agricultural Products) - 001
2. 수산물 (Seafood) - 002
3. 축산물 (Livestock Products) - 003
4. 가공식품 (Processed Foods) - 004
5. 반찬/김치 (Side Dishes/Kimchi) - 005
6. 떡/빵/과자 (Rice Cakes/Bread/Snacks) - 006
7. 음료/차류 (Beverages/Tea) - 007
8. 양념/소스 (Seasonings/Sauces) - 008
9. 선물세트 (Gift Sets) - 009
10. 공예/민예품 (Crafts/Folk Art) - 012
11. 관광/숙박/체험 (Tourism/Accommodation/Experience) - 013
12. 기타상품 (Other Products) - 015

### Social Economy Categories (Type: P)
1. 경기도 일자리재단 (Gyeonggi Job Foundation) - 022
2. 중증장애생산품 (Severe Disability Products) - 023
3. 사회적경제기업 제품 (Social Economy Enterprise Products) - 025
4. 친환경인증 (Eco-Certified) - 026
5. 로컬인증 (Local Certified) - 027
6. 착한소비 (Ethical Consumption) - 028

## Special Features

- **Social Economy Focus**: Dedicated categories for social enterprises
- **Certification Tracking**: Eco and local certifications
- **Disability Support**: Products from disabled workers
- **URL Structure**: Uses type (X/P) and xcode parameters
- **Price Display**: Shows both original and discounted prices

## Character Encoding

This site uses EUC-KR encoding for Korean text. The scraper:
1. Fetches raw bytes from the server
2. Converts from EUC-KR to UTF-8 using iconv-lite
3. Processes the converted HTML with cheerio

## Notes

- Product IDs are extracted from the branduid parameter
- Images may use lazy loading
- Prices include won (원) symbol and comma separators
- Category types: X (regular), P (social economy), Y (special)
- Mobile version available at /m path