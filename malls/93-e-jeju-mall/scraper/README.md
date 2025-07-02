# Scraper for e-jeju-mall (Mall ID: 93)

## Overview
This scraper is designed to collect product information from https://mall.ejeju.net/main/index.do

## Features
- Category-based scraping
- Pagination support
- Static HTML scraping with Axios/Cheerio
- Product data extraction (name, price, image, URL)

## Installation
```bash
npm install
```

## Usage
```bash
# Build and run
npm start

# Development mode
npm run dev
```

## Output
The scraper saves products to `output/products-93.json`

## Configuration
See `config.json` for scraping parameters and selectors.
