# Mall Scraping Scripts

This directory contains scripts for scraping product data from Korean local government shopping malls.

## Overview

The scraping system is designed to handle 26 unscraped malls across three different platform types:
- **Naver Smart Store** (3 malls) - Modern e-commerce platform
- **CYSO Platform** (11 malls) - Common mall platform for local governments
- **Individual Websites** (12 malls) - Custom implementations

## Main Scripts

### 1. `scrape-unscraped-malls.js`
Basic batch scraper for all unscraped malls.

```bash
node scrape-unscraped-malls.js
```

### 2. `scrape-unscraped-malls-enhanced.js`
Enhanced version with specialized scrapers and better error handling.

```bash
# Scrape all malls
node scrape-unscraped-malls-enhanced.js

# Scrape only 5 malls
node scrape-unscraped-malls-enhanced.js --max 5

# Skip specific malls
node scrape-unscraped-malls-enhanced.js --skip 66,72

# Scrape specific malls only
node scrape-unscraped-malls-enhanced.js --only 9,43,47
```

### 3. `test-scrape-one-each.js`
Test script that scrapes one mall from each platform type.

```bash
node test-scrape-one-each.js
```

### 4. `specialized-mall-scrapers.js`
Contains custom scrapers for specific malls that need special handling:
- 안동장터 (ID: 66) - Government site
- e경남몰 (ID: 84) - Modern e-commerce
- 김천노다지장터 (ID: 72) - Older style mall

## Output Format

Scraped data is saved in the `output/` directory with the naming convention:
```
{mall_id}-{mall_engname}-products.json
```

Example output structure:
```json
{
  "mall": {
    "id": 9,
    "name": "마켓경기",
    "engname": "market-gyeonggi",
    "url": "https://smartstore.naver.com/marketgyeonggi",
    "region": "경기"
  },
  "scrapedAt": "2025-07-10T12:00:00.000Z",
  "totalProducts": 150,
  "products": [
    {
      "name": "경기미 10kg",
      "price": 35000,
      "image": "https://...",
      "url": "https://...",
      "mall": "마켓경기",
      "category": "곡류",
      "scrapedAt": "2025-07-10T12:00:00.000Z"
    }
  ],
  "errors": []
}
```

## Scraping Strategies

### Naver Smart Store
- Uses Puppeteer for dynamic content
- Handles infinite scroll
- Extracts products from JavaScript-rendered pages

### CYSO Platform
- Uses Cheerio for static HTML parsing
- Handles pagination
- Common selectors across all CYSO malls

### Generic Websites
- Tries multiple URL patterns (/shop, /product, etc.)
- Uses heuristics to find product elements
- Falls back to homepage scraping if needed

## Error Handling

- Automatic retries (3 attempts per page)
- Progress saving (resume from interruption)
- Detailed error logging
- Graceful degradation (saves partial results)

## Performance Considerations

- Respectful delays between requests (1-3 seconds)
- Limited concurrent connections
- Progress saved every 5 malls
- Maximum 500 products per Naver store (configurable)

## Troubleshooting

### Common Issues

1. **Puppeteer fails to launch**
   ```bash
   # Install required dependencies
   sudo apt-get install chromium-browser
   ```

2. **Connection timeouts**
   - Increase timeout in scraper configuration
   - Check if site requires specific headers

3. **No products found**
   - Check if site structure has changed
   - May need specialized scraper

### Debug Mode

Set environment variable for verbose logging:
```bash
DEBUG=scraper node scrape-unscraped-malls-enhanced.js
```

## Mall Status

Current unscraped malls by region:
- 경기: 1 mall
- 전북: 4 malls  
- 전남: 2 malls
- 경북: 11 malls
- 경남: 8 malls

Total: 26 malls

## Development

To add a new specialized scraper:

1. Add scraper class to `specialized-mall-scrapers.js`
2. Update the `getSpecializedScraper` factory function
3. Test with single mall before batch run

## Dependencies

- axios: HTTP requests
- cheerio: HTML parsing
- puppeteer: Browser automation
- fs/path: File system operations

## Notes

- Some government sites may have anti-scraping measures
- CYSO platform malls share common structure
- Naver stores require browser automation
- Always respect robots.txt and rate limits