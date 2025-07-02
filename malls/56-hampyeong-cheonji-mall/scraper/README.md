# 함평천지몰 Scraper (ID: 56)

## Overview
Web scraper for 함평천지몰 (https://xn--352bl9yz7b63kj6b.kr/)

## Requirements
- Node.js 16+
- npm or yarn

## Installation
```bash
npm install
```

## Usage
```bash
npm run scrape
```

## Configuration
See `config.json` for scraper settings.

## Output
Scraped data will be saved to the `data/` directory with timestamp.

## Features
- Scrapes 5 categories
- Handles pagination: none
- JavaScript required: No

## Notes
Uses Cafe24 e-commerce platform,Heavy JavaScript usage for dynamic content loading,Product data is embedded in HTML but also loaded via CAFE24API,Multiple product display sections: New Products, Category Best, MD Recommendations,Uses Korean domain (xn--352bl9yz7b63kj6b.kr) which redirects to www.hampyeongm.com,Products have both consumer price (소비자가) and selling price (판매가),Site focuses on regional agricultural products from Hampyeong area
