# Enhanced Mall Scraper Guide

## Overview

This guide documents the enhanced scraping system for e-Paldogangsan, which can handle various types of Korean local government shopping malls.

## Scraper Types

### 1. Enhanced Naver Scraper
- **For:** Naver Smart Store malls
- **Features:**
  - Puppeteer-based for dynamic content
  - Automatic scrolling and "더보기" button clicking
  - Handles lazy-loaded products
  - Multiple selector fallbacks

### 2. Enhanced CYSO Scraper
- **For:** CYSO platform malls
- **Features:**
  - Tries multiple URL patterns (/shop, /product, /mall, etc.)
  - Handles redirects
  - CYSO-specific selectors
  - SSL certificate bypass for development

### 3. Enhanced Generic Scraper
- **For:** All other mall types
- **Features:**
  - URL variation handling (www/non-www)
  - SSL certificate error handling
  - Broad selector patterns
  - Automatic product page discovery

### 4. Specialized Scrapers
- **For:** Specific malls with unique structures
- **Available for:**
  - 안동장터 (ID: 66) - Government site
  - e경남몰 (ID: 84) - Modern e-commerce
  - 김천노다지장터 (ID: 72) - Older style mall

## Usage

### Basic Usage

```javascript
const { getEnhancedScraper } = require('./enhanced-scrapers');

const mall = {
  id: 1,
  name: 'Mall Name',
  url: 'https://mall-url.com'
};

const scraper = getEnhancedScraper(mall);
const products = await scraper.scrape();
```

### Using Scraper Manager

```javascript
const ScraperManager = require('./scraper-manager');

const manager = new ScraperManager();
const results = await manager.scrapeMalls(malls, {
  concurrent: 3,      // Process 3 malls simultaneously
  delay: 2000,        // 2 second delay between batches
  retryFailed: true,  // Retry failed malls
  saveProgress: true  // Save progress to file
});
```

## Testing

### Test Individual Scrapers
```bash
node scripts/test-enhanced-scrapers.js
```

### Test Scraper Manager
```bash
node scripts/test-scraper-manager.js
```

## Common Issues and Solutions

### 1. Naver Smart Store - No Products Found
- **Issue:** Dynamic content not loading
- **Solution:** Enhanced scraper waits for content and scrolls automatically

### 2. CYSO Malls - 404 Errors
- **Issue:** Wrong URL pattern
- **Solution:** Enhanced scraper tries multiple URL patterns

### 3. SSL Certificate Errors
- **Issue:** Self-signed or expired certificates
- **Solution:** Enhanced scraper has relaxed SSL settings for development

### 4. Redirect Issues
- **Issue:** Mall URLs redirect to different domains
- **Solution:** Enhanced scraper follows redirects automatically

## Product Data Structure

```javascript
{
  name: string,        // Product name (max 100 chars)
  price: number,       // Price in won
  image: string,       // Full image URL
  url: string,         // Product page URL
  mall: string,        // Mall name
  category: string,    // Product category
  scrapedAt: string    // ISO timestamp
}
```

## Performance Considerations

1. **Rate Limiting:** Add delays between requests to avoid being blocked
2. **Concurrent Requests:** Limit concurrent scrapers to prevent overwhelming servers
3. **Timeout Settings:** Adjust timeouts based on server response times
4. **Memory Usage:** Close Puppeteer browsers properly to prevent memory leaks

## Error Handling

The system includes multiple levels of error handling:

1. **Primary Scraper:** Uses enhanced scraper based on URL pattern
2. **Specialized Scraper:** Falls back to specialized scraper if available
3. **Fallback Scraper:** Generic fallback for any remaining issues
4. **Error Logging:** All errors are logged with timestamps

## Adding New Scrapers

To add a new specialized scraper:

1. Create a new class in `specialized-mall-scrapers.js`
2. Implement the `scrape()` method
3. Add to the factory function
4. Test thoroughly with real mall data

## Best Practices

1. **Always test with real mall URLs** before bulk scraping
2. **Monitor success rates** and adjust scrapers as needed
3. **Respect robots.txt** and terms of service
4. **Keep user agents updated** to avoid detection
5. **Save progress regularly** for long scraping sessions