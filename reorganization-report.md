# Reorganization Report

## Summary
The project has been successfully reorganized with a cleaner, more maintainable structure.

## New Directory Structure

```
e-paldogangsan/
├── config/           - Configuration files (Next.js, TypeScript, etc.)
├── data/            
│   ├── products/     - Product JSON files (moved from scripts/output)
│   └── malls/        - Mall data files
├── scripts/         
│   ├── scrapers/     - Web scraping scripts
│   └── utilities/    - Utility and helper scripts
├── docs/             - All documentation files
├── archive/          - Old and temporary files
├── src/              - Source code (unchanged)
├── public/           - Public assets (unchanged)
└── assets/           - Project assets (unchanged)
```

## Changes Made

### 1. Product Data Organization
- Moved all `*-products.json` files from `scripts/output/` to `data/products/`
- Sanitized filenames by removing Korean characters
- Total product files moved: 124

### 2. Configuration Consolidation
- Moved all config files to `config/` directory:
  - `next.config.js`
  - `tailwind.config.js`
  - `tsconfig.json`
  - `postcss.config.js`
  - `vercel.json`

### 3. Scripts Organization
- Kept scrapers in `scripts/scrapers/`
- Moved utility scripts to `scripts/utilities/`:
  - `check-mall-details.js`
  - `check-mall-structure.js`
  - `check-price-status.js`
  - `convert-scraped-to-individual.js`
  - `rename-files-with-ids.js`
  - `trigger-rebuild.ts`
  - `update-overview.ts`

### 4. Documentation
- Moved all documentation to `docs/`:
  - `PROJECT_OVERVIEW.md`
  - `CRON_SETUP.md`
  - `README.md` (from scripts)
  - `SCRAPER_GUIDE.md`
  - `SCRAPING_README.md`
  - `MISSING_MALLS_SCRAPER_README.md`

### 5. Archiving
- Archived old analysis files, summaries, and temporary scripts to `archive/`
- This includes test files, debug scripts, and intermediate processing files

## Benefits

1. **Clearer Structure**: Related files are now grouped together
2. **Easier Navigation**: Product data is separate from scripts
3. **Better Maintenance**: Configuration is centralized
4. **Clean Working Directory**: Old files archived but preserved

## Next Steps

1. Update any import paths in the codebase that reference moved files
2. Update the build process if needed for the new config location
3. Consider creating a data management script for the organized product files
4. Update documentation to reflect the new structure

## Script Location
The reorganization script is located at: `scripts/reorganize-simple.js`