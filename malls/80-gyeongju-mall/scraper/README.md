# Scraper for gyeongju-mall (Mall ID: 80)

## Overview
This scraper is designed to collect product information from https://gjmall.cyso.co.kr/

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
The scraper saves products to `output/products-80.json`

## Configuration
See `config.json` for scraping parameters and selectors.
