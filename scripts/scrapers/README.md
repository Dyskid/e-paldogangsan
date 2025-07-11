# Mall Scrapers Documentation

This directory contains platform-specific scrapers for unscraped Korean local government shopping malls.

## Overview

Based on URL validation, we have identified 26 unscraped malls across different platforms:
- **CYSO Platform**: 8 malls
- **Naver Smart Store**: 2 malls (with rate limiting issues)
- **Custom/Unknown Platforms**: 15 malls
- **Invalid URLs**: 1 mall (Pohang Market)

## Scrapers

### 1. Master Scraper (`master-scraper.js`)
Coordinates all platform-specific scrapers and generates a comprehensive report.

```bash
node scripts/scrapers/master-scraper.js
```

### 2. CYSO Platform Scraper (`cyso-platform-scraper.js`)
Handles 8 malls using the CYSO e-commerce platform.

```bash
node scripts/scrapers/cyso-platform-scraper.js
```

Malls covered:
- 안동장터 (Andong Market)
- 의성장날 (Uiseong Market Day)
- 울진몰 (Uljin Mall)
- 영덕장터 (Yeongdeok Market)
- 경산몰 (Gyeongsan Mall)
- 경주몰 (Gyeongju Mall)
- 구미팜 (Gumi Farm)
- 별빛촌장터(영천) (Starlight Village Market - Yeongcheon)

### 3. Naver Smart Store Scraper (`naver-smartstore-scraper.js`)
Handles Naver Smart Store malls with rate limiting protection.

```bash
node scripts/scrapers/naver-smartstore-scraper.js
```

Malls covered:
- 순창로컬푸드쇼핑몰 (Sunchang Local Food Shopping Mall)
- 해피굿팜 (Happy Good Farm)

**Note**: Naver has strict rate limiting (HTTP 429). This scraper includes delays but may still fail.

### 4. Custom Platform Scraper (`custom-platform-scraper.js`)
Handles various custom Korean e-commerce platforms and unknown platforms.

```bash
node scripts/scrapers/custom-platform-scraper.js
```

Malls covered:
- 광명가치몰 (Gwangmyeong Value Mall) - Mangotree platform
- 임실몰 (Imsil Mall)
- e경남몰 (e-Gyeongnam Mall)
- 남해몰 (Namhae Mall)
- 함양몰 (Hamyang Mall)
- 김해온몰 (Gimhae On Mall)
- And 9 more unknown platform malls

### 5. Pohang Market Checker (`pohang-market-checker.js`)
Investigates the invalid Pohang Market URL issue.

```bash
node scripts/scrapers/pohang-market-checker.js
```

## Output Structure

All scrapers save their results in the `scripts/output/` directory:
- Individual mall products: `{mall-id}-{mall-engname}-products.json`
- Platform reports: `{platform}-scraping-report.json`
- Master report: `master-scraping-report.json`

## Handling Failed Scrapers

### Naver Smart Store (Rate Limiting)
1. Use proxy rotation services
2. Scrape during off-peak hours (2-6 AM KST)
3. Implement manual browser automation
4. Contact store owners for product data export

### No Products Found
1. Verify the mall URL is correct
2. Check if site structure has changed
3. Implement site-specific scrapers
4. Check if products are loaded via AJAX/API

### Invalid URLs
1. Search for alternative URLs
2. Check city official websites
3. Contact platform support
4. Mark as inactive if no alternative found

## Adding New Scrapers

To add support for a new platform:

1. Create a new file: `{platform-name}-scraper.js`
2. Export functions: `scrape{Platform}Mall(mall)` and `scrapeAll{Platform}Malls()`
3. Add platform detection in `validate-unscraped-urls.js`
4. Import and call in `master-scraper.js`

## Running All Scrapers

To scrape all unscraped malls at once:

```bash
# Run the master scraper
node scripts/scrapers/master-scraper.js

# Or run individually
node scripts/scrapers/cyso-platform-scraper.js
node scripts/scrapers/custom-platform-scraper.js
node scripts/scrapers/naver-smartstore-scraper.js
```

## Troubleshooting

1. **Puppeteer Issues**: Install required dependencies
   ```bash
   npm install puppeteer
   ```

2. **Memory Issues**: Scrapers process malls sequentially to avoid memory problems

3. **Network Timeouts**: Increase timeout values in scraper configurations

4. **SSL Certificate Errors**: Scrapers are configured to handle self-signed certificates