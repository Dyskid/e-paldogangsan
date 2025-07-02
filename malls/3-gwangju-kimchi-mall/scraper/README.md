# 광주김치몰 (Gwangju Kimchi Mall) Scraper

Web scraper for 광주김치몰, specializing in kimchi and fermented foods from Gwangju.

## Mall Information
- **Mall ID**: 3
- **Mall Name**: 광주김치몰
- **URL**: https://www.k-kimchi.kr
- **Region**: 광주 (Gwangju)

## Features
- Scrapes all kimchi and side dish products
- Extracts detailed product information including:
  - Original and discounted prices
  - Discount rates
  - Manufacturer/brand information
  - Product descriptions
  - Ratings and review counts
- Handles category hierarchy
- Pagination support
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
- `products-3.json` - Complete product listing with all details
- `summary-3.json` - Summary statistics including category breakdown

## Configuration

Settings can be modified in `config.json`:
- `requestDelay`: Delay between requests (default: 1000ms)
- `maxRetries`: Maximum retry attempts for failed requests
- `productSelectors`: CSS selectors for extracting product data

## Technical Details

- **Technology**: Static HTML scraping (no JavaScript rendering required)
- **Libraries**: axios for HTTP requests, cheerio for HTML parsing
- **Pagination**: Page number based using `page` parameter
- **Rating System**: Uses Font Awesome stars (counts filled stars)

## Category Structure

The mall specializes in kimchi products with these main categories:
1. 포기김치 (Whole Cabbage Kimchi)
2. 묵은지 (Aged Kimchi)
3. 별미김치 (Special Kimchi) - with 9 subcategories
   - 깍두기 (Cubed Radish Kimchi)
   - 갓김치 (Mustard Leaf Kimchi)
   - 백김치 (White Kimchi)
   - 부추김치 (Chive Kimchi)
   - 석박지 (Seokbakji)
   - 오이소박이 (Cucumber Kimchi)
   - 열무김치 (Young Radish Kimchi)
   - 총각김치 (Ponytail Radish Kimchi)
   - 파김치 (Green Onion Kimchi)
4. 30%할인전 (30% Discount)
5. 명인 명품김치 (Master's Premium Kimchi)
6. 반찬가게 (Side Dishes)
7. 선물세트 (Gift Sets)

## Special Features

- Discount rates are clearly displayed for each product
- Manufacturer/brand information is included
- Review counts and ratings help identify popular products
- Traditional server-side rendering makes scraping straightforward

## Notes

- The scraper respects rate limits with built-in delays
- Products often have both original and discounted prices
- Rating system uses star icons (1-5 scale)
- Most products include detailed descriptions