# 대전사랑몰 (Daejeon Love Mall) Scraper

Web scraper for 대전사랑몰, an online shopping platform for Daejeon local products.

## Mall Information
- **Mall ID**: 4
- **Mall Name**: 대전사랑몰
- **URL**: https://ontongdaejeon.ezwel.com/onnuri/main
- **Region**: 대전 (Daejeon)
- **Platform**: EzWel

## Features
- Scrapes products from all main categories
- Handles dynamic content loading via AJAX
- Extracts product details including seller information
- Supports pagination with configurable items per page
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

# Build TypeScript files
npm run build
```

## Output

The scraper generates two files:
- `products-4.json` - Complete product listing
- `summary-4.json` - Summary statistics by category

## Configuration

Settings can be modified in `config.json`:
- `itemsPerPage`: Number of items per page (max: 100)
- `timeout`: Page load timeout in milliseconds
- `requestDelay`: Delay between requests
- `selectors`: CSS selectors for data extraction

## Technical Details

- **Technology**: Dynamic content scraping with Puppeteer
- **Loading Method**: AJAX-based product loading
- **Pagination**: Page number based with configurable page size
- **JavaScript Required**: Yes (content loads dynamically)

## Category Structure

The mall organizes products into these main categories:
1. **대전 로컬상품관** - Daejeon local products showcase
2. **특가 ON** - Special offers
3. **농산물** - Agricultural products
4. **수산물** - Seafood products
5. **대전우수 상품판매장** - Daejeon premium products

## Special Features

- Dynamic product loading requires JavaScript rendering
- Seller/market information included for each product
- Flexible pagination (20, 40, 60, 80, 100 items per page)
- Hierarchical category structure support

## Error Handling

The scraper includes:
- Timeout handling for slow-loading pages
- Retry logic for failed requests
- Graceful degradation when categories fail
- Detailed error logging

## Performance Considerations

- Uses headless Chrome for JavaScript rendering
- Implements delays between requests to avoid overloading
- Processes categories sequentially to manage resources
- Closes pages after scraping to prevent memory leaks

## Notes

- The mall uses the EzWel platform which requires JavaScript
- Product IDs are extracted from data attributes when available
- Images use lazy loading (data-src attribute)
- Seller information helps identify local businesses