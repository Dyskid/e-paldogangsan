#!/bin/bash

# Phase 1: Create New Directory Structure
# This script creates the new directory structure for the e-Paldogangsan project

echo "Creating new directory structure for e-Paldogangsan project..."

# Create config directory
mkdir -p config
echo "Created: config/"

# Create data directories
mkdir -p data/products
mkdir -p data/scraped/{2025-01,latest}
mkdir -p data/backups/2025-01
mkdir -p data/reports/{scraping,validation}
echo "Created: data/ structure"

# Create scripts directories
mkdir -p scripts/scrapers/{core,mall-specific,utilities}
mkdir -p scripts/data-processing/{cleaners,validators,transformers}
mkdir -p scripts/analysis
mkdir -p scripts/utilities
echo "Created: scripts/ structure"

# Create docs directories
mkdir -p docs/{scrapers,data-formats,processes}
echo "Created: docs/ structure"

# Create assets directory
mkdir -p assets/archive
echo "Created: assets/archive/"

# Create README files for major directories
cat > config/README.md << 'EOF'
# Configuration Files

This directory contains all configuration files for the e-Paldogangsan project.

- `malls.json` - Mall configurations and metadata
- `categories.json` - Product category definitions
- `regions.json` - Korean region data
- `scraper-config.json` - Scraper settings and configurations
EOF

cat > data/README.md << 'EOF'
# Data Directory

This directory contains all data files for the e-Paldogangsan project.

## Structure

- `products/` - Product data organized by mall
- `scraped/` - Raw scraped data organized by date
- `backups/` - Product data backups
- `reports/` - Analysis and validation reports

## Naming Conventions

- Product files: `mall-{id}-{name}/products.json`
- Scraped data: `{date}-{mall-id}-raw.json`
- Reports: `{type}-report-{date}.json`
EOF

cat > scripts/README.md << 'EOF'
# Scripts Directory

This directory contains all executable scripts for the e-Paldogangsan project.

## Structure

- `scrapers/` - Web scraping scripts
  - `core/` - Core scraper modules
  - `mall-specific/` - Mall-specific scrapers
  - `utilities/` - Scraper utilities
- `data-processing/` - Data processing scripts
  - `cleaners/` - Data cleaning scripts
  - `validators/` - Data validation scripts
  - `transformers/` - Data transformation scripts
- `analysis/` - Data analysis scripts
- `utilities/` - General utility scripts

## Naming Conventions

All scripts use kebab-case naming and TypeScript (.ts) extension.
EOF

cat > docs/README.md << 'EOF'
# Documentation

This directory contains all documentation for the e-Paldogangsan project.

## Structure

- `scrapers/` - Scraper documentation and guides
- `data-formats/` - Data format specifications
- `processes/` - Process documentation and workflows
EOF

echo "Created README files for major directories"

# Create .gitignore entries for new structure
cat >> .gitignore << 'EOF'

# Data directories
data/scraped/latest/
data/backups/
*.backup.json

# Temporary files
*.tmp
*.temp

# Archive
assets/archive/
EOF

echo "Updated .gitignore"

echo "Phase 1 complete! New directory structure created."
echo "Next: Run reorganize-phase2-scripts.sh to organize scripts"