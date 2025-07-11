# File Reorganization Plan for e-Paldogangsan Project

## Current Issues Identified

### 1. **Inconsistent Naming Patterns**
- Mixed naming conventions: kebab-case, camelCase, snake_case
- Korean characters mixed with English in filenames
- Numbered prefixes not consistently applied
- Mixed file extensions (.js, .ts) for similar scripts

### 2. **Poor Folder Organization**
- Scripts output mixed with source scripts in `/scripts/`
- Multiple data locations (`/data/`, `/src/data/`, `/assets/`)
- Products scattered across different directories
- No clear separation between configuration, scripts, and data

### 3. **Redundant Files**
- Multiple product backup files with timestamps
- Duplicate mall data in different formats
- Similar scripts with slightly different names

## Proposed New Structure

```
e-paldogangsan/
├── config/                      # Configuration files
│   ├── malls.json              # Mall configurations
│   ├── categories.json         # Category definitions
│   ├── regions.json            # Region data
│   └── scraper-config.json     # Scraper configurations
│
├── data/                        # All data files
│   ├── products/               # Product data by mall
│   │   ├── mall-001-we-mall/
│   │   ├── mall-002-cham-dalseong/
│   │   └── ...
│   ├── scraped/                # Raw scraped data
│   │   ├── 2025-01/
│   │   └── latest/
│   ├── backups/                # Product backups
│   │   └── 2025-01/
│   └── reports/                # Analysis reports
│       ├── scraping/
│       └── validation/
│
├── scripts/                     # All executable scripts
│   ├── scrapers/               # Scraping scripts
│   │   ├── core/              # Core scraper modules
│   │   ├── mall-specific/     # Mall-specific scrapers
│   │   └── utilities/         # Scraper utilities
│   ├── data-processing/        # Data processing scripts
│   │   ├── cleaners/
│   │   ├── validators/
│   │   └── transformers/
│   ├── analysis/               # Analysis scripts
│   └── utilities/              # General utilities
│
├── docs/                        # Documentation
│   ├── scrapers/
│   ├── data-formats/
│   └── processes/
│
├── public/                      # Public assets
│   └── logos/                  # Mall logos
│
├── src/                         # Next.js source code
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
│
└── assets/                      # Development assets
    └── archive/                # Old/reference files
```

## Naming Conventions

### Files
- **Scripts**: `kebab-case.ts` (TypeScript preferred)
- **Data files**: `mall-{id}-{name}.json` or `{category}-{date}.json`
- **Reports**: `{type}-report-{date}.json`
- **Configs**: `{purpose}-config.json`

### Directories
- Always use `kebab-case`
- Plural for collections (e.g., `products`, `scrapers`)
- Singular for specific items (e.g., `product`, `scraper`)

## Migration Steps

### Phase 1: Create New Directory Structure
1. Create all new directories
2. Set up proper .gitignore entries
3. Create README files for each major directory

### Phase 2: Organize Scripts
1. Move all scrapers to `scripts/scrapers/`
2. Separate utility scripts to appropriate subdirectories
3. Convert all .js files to .ts where appropriate
4. Apply consistent naming

### Phase 3: Consolidate Data
1. Move all product data to `data/products/`
2. Organize by mall with consistent naming
3. Move backups to `data/backups/`
4. Move reports to `data/reports/`

### Phase 4: Clean Up
1. Remove duplicate files
2. Archive old/unused files
3. Update all import paths
4. Update documentation

## Benefits
1. **Clarity**: Clear separation of concerns
2. **Maintainability**: Easy to find and update files
3. **Scalability**: Structure supports growth
4. **Consistency**: Uniform naming and organization
5. **Version Control**: Better git history with organized structure