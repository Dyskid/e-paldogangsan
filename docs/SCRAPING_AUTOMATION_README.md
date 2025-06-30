# E-paldogangsan Scraping Automation System

This system automates the process of analyzing and scraping products from 93 Korean local government shopping malls.

## System Overview

The automation follows this workflow for each mall:
1. **Analyze** - Understand the mall's structure (categories, selectors, pagination)
2. **Generate Scraper** - Create a custom scraper based on the analysis
3. **Execute** - Run the scraper to collect product data
4. **Validate** - Check data quality and required fields
5. **Register** - Add products to the main products.json file

## File Structure

```
e-paldogangsan/
├── malls-clean.txt           # List of all malls (ID|Name|URL|Region)
├── analyze-template.txt      # Template for mall analysis
├── scraper-template.txt      # Template for scraper generation
├── process-mall-batch.sh     # Main automation script
├── check-status.sh          # Status checking script
├── mall-scraping-status.json # Tracking file (auto-generated)
├── scripts/
│   ├── register-products.js  # Product registration script
│   ├── update-status.js     # Status update script
│   ├── validate-products.js # Product validation script
│   └── scrapers/           # Generated scrapers (auto-created)
│       └── mall_*-scraper.ts
└── scraped-data/           # Scraped data storage (auto-created)
    ├── mall_*-analysis.json
    └── mall_*-products.json
```

## Usage

### Process a batch of malls
```bash
# Process 10 malls starting from index 1
./process-mall-batch.sh 1

# Process 5 malls starting from index 11
./process-mall-batch.sh 11 5

# Process specific batch size
./process-mall-batch.sh 21 15
```

### Check status
```bash
./check-status.sh
```

### Manual steps for each mall

When running the automation, you'll need to:

1. **Analyze the mall** when prompted:
   - Visit the mall website
   - Identify product categories and their URLs
   - Find CSS selectors for products
   - Note any special requirements

2. **Generate the scraper** based on analysis:
   - Create a TypeScript scraper in `scripts/scrapers/`
   - Implement category traversal and pagination
   - Handle the specific mall's structure

3. The script will then automatically:
   - Execute the scraper
   - Validate the results
   - Register products if valid

## Tracking System

The `mall-scraping-status.json` file tracks:
- Mall processing status (pending/analyzing/scraping/completed/failed)
- Analyzer and scraper creation status
- Number of products scraped and registered
- Last update timestamp
- Error messages for failed malls

## Templates

### analyze-template.txt
Used to guide the analysis of each mall's structure. Includes:
- Category identification
- Selector discovery
- Pagination analysis
- Technical requirements

### scraper-template.txt
Used to generate scrapers with:
- Proper TypeScript structure
- Error handling
- Progress logging
- Data validation

## Best Practices

1. **Batch Processing**
   - Process 10-15 malls per batch
   - Allow 2-3 hours per batch for analysis and scraper creation
   - Run validation before moving to next batch

2. **Error Handling**
   - Check failed malls with `./check-status.sh`
   - Fix scrapers and re-run for failed malls
   - Keep logs of common issues

3. **Performance**
   - Add delays between requests (built into scrapers)
   - Respect robots.txt
   - Monitor server responses

## Regional Batches

Suggested processing order:
1. **Batch 1-10**: 대구, 광주, 대전, 경기 (Major cities)
2. **Batch 11-27**: 강원 (Gangwon province)
3. **Batch 28-39**: 충북, 충남 (Chungcheong)
4. **Batch 40-50**: 전북 (Jeonbuk)
5. **Batch 51-67**: 전남 (Jeonnam)
6. **Batch 68-89**: 경북 (Gyeongbuk)
7. **Batch 90-98**: 경남 (Gyeongnam)
8. **Batch 99-100**: 제주 (Jeju)

## Troubleshooting

### Mall analysis issues
- Some malls may require login - note this in analysis
- JavaScript-heavy sites need Puppeteer scrapers
- Check for API endpoints in Network tab

### Scraper failures
- Verify selectors are correct
- Check if site structure changed
- Add better error handling
- Increase timeout for slow sites

### Validation errors
- Ensure all required fields are present
- Check price parsing logic
- Verify URL construction
- Handle missing data gracefully

## Next Steps

After completing all mall scraping:
1. Run final validation on all products
2. Remove duplicates across malls
3. Standardize categories
4. Update mall configurations with scraper IDs
5. Set up scheduled scraping