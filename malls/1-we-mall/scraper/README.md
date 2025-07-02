# 우리몰 (We Mall) Scraper

Web scraper for 우리몰, a shopping mall based in Daegu.

## Mall Information
- **Mall ID**: 1
- **Mall Name**: 우리몰
- **URL**: https://wemall.kr
- **Region**: 대구 (Daegu)

## Features
- Scrapes products from all categories
- Handles pagination
- Extracts product details (name, price, image, seller)
- Saves results in JSON format
- Generates summary statistics

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
```

## Output

The scraper generates two files:
- `products-1.json` - Complete product listing
- `summary-1.json` - Summary statistics

## Configuration

Settings can be modified in `config.json`:
- `itemsPerPage`: Number of items per page (default: 12)
- `requestDelay`: Delay between requests in milliseconds (default: 1000)
- `maxRetries`: Maximum retry attempts for failed requests (default: 3)

## Technical Details

- **Technology**: Static HTML scraping (no JavaScript rendering required)
- **Libraries**: axios for HTTP requests, cheerio for HTML parsing
- **Pagination**: Offset-based using `start` parameter

## Category Structure

The mall has the following main categories:
1. 식품/농산품 (Food/Agricultural Products)
2. 생활용품 (Living Supplies)
3. 사무용품 (Office Supplies)
4. 디지털/가전 (Digital/Electronics)
5. 공사/인쇄 (Construction/Printing)
6. 청소용품 (Cleaning Supplies)
7. 스포츠/건강 (Sports/Health)
8. 아동용품/취미 (Children's Items/Hobbies)

## Notes

- The scraper respects rate limits with built-in delays
- Special categories exist for government and group purchases
- Products for disabled-owned businesses have dedicated categories