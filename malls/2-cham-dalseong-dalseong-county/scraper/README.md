# 참달성 (달성군) Scraper

## Mall Information
- **Mall ID**: 2
- **Mall Name**: 참달성 (달성군)
- **URL**: https://smartstore.naver.com/chamdalseong
- **Platform**: Naver Smart Store
- **Status**: ❌ Failed (Store appears to be closed or inaccessible)

## Current Status

⚠️ **This scraper cannot currently operate** as the target mall appears to be closed or has moved to a different URL. The Naver Smart Store page returns an error when accessed.

### Error Details
- The store page at https://smartstore.naver.com/chamdalseong is not accessible
- This could mean:
  - The store has permanently closed
  - The store has moved to a different URL
  - The store is temporarily unavailable

### Recommended Actions
1. Contact Dalseong County (달성군) to verify the current status of the mall
2. Check if the mall has moved to a different platform or URL
3. Update the configuration once new information is available

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

## Configuration

The scraper configuration is stored in `config.json`. Key settings include:

- **baseUrl**: The target URL for scraping
- **status**: Current operational status (currently "failed")
- **selectors**: CSS selectors for extracting product data
- **pagination**: Settings for handling multiple pages
- **timeout**: Timeout values for various operations

## Output

When operational, the scraper would generate:
- `products.json`: Contains all scraped product data
- `error.json`: Error logs if the scraper fails

## Technical Details

### Dependencies
- **puppeteer**: For handling JavaScript-rendered content
- **typescript**: For type safety
- **tsx**: For running TypeScript files directly

### Structure
- `scraper.ts`: Main scraper implementation
- `config.json`: Scraper configuration
- `package.json`: Node.js dependencies
- `tsconfig.json`: TypeScript configuration

## Error Handling

The scraper includes comprehensive error handling:
- Checks mall accessibility before attempting to scrape
- Logs detailed error information
- Provides recommendations for resolution

## Future Updates

Once the mall's new URL or status is confirmed:
1. Update `config.json` with the new URL
2. Set `status` to "active"
3. Verify selectors match the new page structure
4. Test the scraper thoroughly before deployment