# Missing Malls Scraper

This directory contains focused scrapers for the 13 missing malls identified in the scraping report.

## Target Malls

### 경남 (7개)
- 김해온몰 (ID: 92)
- 남해몰 (ID: 86)
- 진주드림 (ID: 90)
- 산엔청 (ID: 87)
- 공룡나라 (ID: 88)
- 함양몰 (ID: 89)
- 함안몰 (ID: 91)

### 제주 (1개)
- 이제주몰 (ID: 93)

### 전남 (3개)
- 기찬들영암몰 (ID: 53)
- 순천로컬푸드함께가게 (ID: 50)
- 장흥몰 (ID: 52)

### 경북 (1개)
- 영주장날 (ID: 65)

### 충남 (1개)
- 농사랑 (ID: 30)

## Usage

### JavaScript Version (Simple)
```bash
npm run scrape:missing
# or
node scripts/scrape-missing-malls.js
```

### TypeScript Version (Comprehensive)
```bash
npm run scrape:missing-ts
# or
tsx scripts/scrape-missing-malls-comprehensive.ts
```

## Features

### JavaScript Version (`scrape-missing-malls.js`)
- Simple HTTP requests with axios
- Basic product extraction
- Multiple URL attempts per mall
- Lightweight and fast

### TypeScript Version (`scrape-missing-malls-comprehensive.ts`)
- Advanced scraping strategies
- Category page exploration
- Search functionality testing
- Enhanced product extraction
- Better error handling
- Detailed logging

## Scraping Approach

1. **Multiple URL Patterns**: Each mall has 4-5 different URL variations to try
2. **Smart Selectors**: Uses both generic and mall-specific CSS selectors
3. **Category Discovery**: Automatically explores category pages if main page has few products
4. **Search Fallback**: Tries search functionality if direct scraping yields few results
5. **Robust Extraction**: Multiple methods to extract product information

## Output

Results are saved in `scripts/output/missing-malls/`:
- Individual mall files: `{mall-id}-{mall-name}-products.json`
- Summary report: `scraping-summary.json`

## Product Data Structure

```json
{
  "id": "mall_92_12345",
  "name": "Product Name",
  "price": "10000원",
  "imageUrl": "https://...",
  "productUrl": "https://...",
  "description": "김해온몰에서 판매하는 Product Name",
  "tags": ["김해온몰", "경남", "특산품"],
  "mallId": 92,
  "mallName": "김해온몰",
  "region": "경남"
}
```

## Debugging Tips

1. **Check Network**: Some malls may block automated requests
2. **Verify URLs**: Mall URLs may have changed
3. **Inspect HTML**: Use browser DevTools to verify selectors
4. **Try Different Times**: Some malls may have rate limiting
5. **Check Encoding**: Some Korean sites use non-UTF8 encoding

## Next Steps

After scraping:
1. Review the summary report
2. Manually verify failed malls
3. Register successful products using registration scripts
4. Update the main scraping status report