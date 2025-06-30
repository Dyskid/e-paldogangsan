# E-paldogangsan Project Structure

This document describes the organized folder structure of the e-paldogangsan project.

## Directory Structure

```
e-paldogangsan/
├── src/                          # Next.js application source code
│   ├── app/                      # App router pages and API routes
│   │   ├── api/                  # API endpoints
│   │   ├── admin/                # Admin interface
│   │   └── ...                   # Other pages
│   ├── components/               # React components
│   ├── data/                     # Application data files
│   │   ├── malls.json           # Mall information
│   │   ├── products.json        # Product database
│   │   └── sync-status.json     # Sync status tracking
│   ├── lib/                      # Library code
│   │   ├── scrapers/            # Scraper infrastructure
│   │   │   ├── base-scraper.ts
│   │   │   ├── generic-scraper.ts
│   │   │   ├── enhanced-generic-scraper.ts
│   │   │   └── scraper-registry.ts
│   │   ├── product-sync.ts      # Product synchronization
│   │   └── ...                  # Other utilities
│   └── types/                    # TypeScript type definitions
│
├── scripts/                      # All scripts organized by function
│   ├── scraping/                # Scraping automation scripts
│   │   ├── process-mall-batch.sh    # Main batch processing script
│   │   ├── check-status.sh          # Status checking script
│   │   ├── register-products.js     # Product registration
│   │   ├── update-status.js         # Status updates
│   │   └── validate-products.js     # Product validation
│   ├── scrapers/                # Generated scraper files (empty, to be filled)
│   ├── utilities/               # Utility and debug scripts
│   │   ├── analyze-product-names.js
│   │   ├── check-actual-mall-ids.js
│   │   ├── debug-problematic-products.js
│   │   ├── debug-specific-malls.js
│   │   └── test-api.js
│   ├── update-overview.ts       # Overview update script
│   ├── overview-helpers.ts      # Helper functions
│   └── README.md               # Scripts documentation
│
├── data/                        # Data files
│   ├── raw/                     # Raw data files
│   │   ├── malls-clean.txt      # Clean mall list for processing
│   │   ├── malls.txt            # Original mall list
│   │   ├── categories.txt       # Category definitions
│   │   └── jeju-mall-product-urls.txt
│   └── scraped/                 # Scraped data output directory
│       ├── {mall_id}-analysis.json
│       └── {mall_id}-products.json
│
├── templates/                   # Template files
│   ├── analyze-template.txt     # Mall analysis template
│   └── scraper-template.txt     # Scraper generation template
│
├── docs/                        # Documentation
│   ├── PROJECT_OVERVIEW.md      # Project overview
│   ├── PROJECT_STRUCTURE.md     # This file
│   ├── CRON_SETUP.md           # Cron job setup guide
│   ├── SCRAPING_AUTOMATION_README.md  # Scraping automation guide
│   ├── Project Title e-Paldogangsan South.txt
│   ├── claude command for phase1.txt
│   └── e-Paldogangsan Phase 1 MVP Specific.txt
│
├── public/                      # Static assets
│   └── logos/                   # Mall logo images
│
├── assets/                      # Project assets (now cleaned)
│
├── Configuration Files (root)
├── .env.local                   # Environment variables (not in git)
├── .gitignore                   # Git ignore rules
├── CLAUDE.md                    # Claude AI instructions
├── README.md                    # Main project readme
├── next.config.js               # Next.js configuration
├── package.json                 # NPM dependencies
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── vercel.json                  # Vercel deployment configuration
```

## Key Directories Explained

### `/src`
Contains all Next.js application code including pages, components, API routes, and core functionality.

### `/scripts`
Organized into subdirectories:
- **scraping/**: Automation scripts for mall scraping
- **scrapers/**: Generated scraper files (created by automation)
- **utilities/**: Various utility and debugging scripts

### `/data`
Split into:
- **raw/**: Original data files and lists
- **scraped/**: Output from scraping operations

### `/templates`
Contains templates used by the automation system for analyzing malls and generating scrapers.

### `/docs`
All project documentation including setup guides, specifications, and this structure document.

## Usage

### Running Scraping Automation
```bash
cd scripts/scraping
./process-mall-batch.sh 1     # Process first batch
./check-status.sh             # Check progress
```

### Running Utilities
```bash
node scripts/utilities/check-actual-mall-ids.js
node scripts/utilities/debug-problematic-products.js
```

### Updating Overview
```bash
npm run update-overview
```

## Notes

- The `mall-scraping-status.json` file is created in the project root during scraping operations
- Scraped data is stored in `data/scraped/` directory
- All paths in scripts have been updated to reflect this new structure
- The `assets/` directory now only contains application assets, not documentation