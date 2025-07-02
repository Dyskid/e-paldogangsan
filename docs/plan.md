1. Preparation Phase

  - Organize shopping mall list (malls.json or malls-clean.txt)
  - Build work status tracking system (to track which malls are completed/failed/pending)
  - Confirm necessary tools are installed (puppeteer, axios, cheerio, etc.)

  2. Analysis Phase (Analyze)

  Understand the structure of each shopping mall:
  - Product category structure
  - URL patterns
  - Pagination methods
  - Dynamic loading status (whether JavaScript rendering is required)
  - Product data location (HTML structure)

2

  Create scrapers tailored to each mall based on analysis results:
  - Static sites: use axios + cheerio
  - Dynamic sites: use playwright or puppeteer
  - Category traversal logic
  - Pagination handling
  - Error handling

  4. Scraping Execution Phase (Execute)

  Run generated scrapers to collect product data:
  - Execute each scraper
  - Save product data as JSON files
  - Log execution results

  5. Data Validation Phase (Validate)

  Verify quality of collected data:
  - Check for required fields (id, title, price, url)
  - Check for duplicate products
  - Validate data format

  6. Data Registration Phase (Register)

  Integrate validated data into products.json:
  - Check for duplicates with existing products
  - Add new products
  - Create backup

  7. Batch Execution Strategy

  # Method 1: Division by Region
  - Seoul/Gyeonggi malls
  - Gangwon-do malls
  - Chungcheong-do malls
  - Jeolla-do malls
  - Gyeongsang-do malls
  - Jeju-do malls

  # Method 2: Batch Division (10-15 each)
  - Batch 1: mall_1 ~ mall_15
  - Batch 2: mall_16 ~ mall_30
  - ...

  # Method 3: Division by Technology
  - Static sites (axios/cheerio)
  - Dynamic sites (puppeteer)

  8. Work Tracking File Structure

  {
    "malls": {
      "mall_1": {
        "name": "OnSeoul Market",
        "status": "pending|analyzing|scraping|completed|failed",
        "analyzer_created": false,
        "scraper_created": false,
        "products_scraped": 0,
        "products_registered": 0,
        "last_updated": "2024-01-01T12:00:00Z",
        "error": null
      }
    }
  }

  9. Automation Script Example

  # process-mall-batch.sh
  #!/bin/bash

  BATCH_SIZE=10
  START_INDEX=$1
  END_INDEX=$((START_INDEX + BATCH_SIZE))

  for i in $(seq $START_INDEX $END_INDEX); do
    mall_info=$(sed -n "${i}p" malls-clean.txt)

    # 1. Analyze
    claude --allowedTools "Bash(*),Read(*),WebFetch(*)" \
      -p "Analyze: $mall_info" < analyze-template.txt

    # 2. Generate scraper
    claude --allowedTools "Bash(*),Edit(*),Read(*),WebFetch(*)" \
      -p "Create scraper: $mall_info" < scraper-template.txt

    # 3. Execute scraper
    npx tsx scripts/scrape-*.ts

    # 4. Register products
    node register-products.js

    # 5. Update tracking file
    node update-status.js "$mall_info" "completed"
  done

  This division approach allows for re-running only failed parts, tracking progress, and distributing server load.