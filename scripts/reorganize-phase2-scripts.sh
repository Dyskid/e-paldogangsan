#!/bin/bash

# Phase 2: Organize Scripts
# This script moves and renames scripts to follow the new structure

echo "Phase 2: Organizing scripts..."

# Function to convert filename to kebab-case
to_kebab_case() {
    echo "$1" | sed 's/_/-/g' | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//' | tr '[:upper:]' '[:lower:]'
}

# Move scraper files
echo "Moving scraper files..."

# Core scrapers
mv scripts/scrapers/master-scraper.js scripts/scrapers/core/master-scraper.ts 2>/dev/null
mv scripts/scrapers/custom-platform-scraper.js scripts/scrapers/core/custom-platform-scraper.ts 2>/dev/null
mv scripts/scrapers/cyso-platform-scraper.js scripts/scrapers/core/cyso-platform-scraper.ts 2>/dev/null
mv scripts/scrapers/naver-smartstore-scraper.js scripts/scrapers/core/naver-smartstore-scraper.ts 2>/dev/null

# Mall-specific scrapers
for file in scripts/scrape-*.js scripts/scrape-*.ts; do
    if [ -f "$file" ]; then
        basename=$(basename "$file")
        newname=$(to_kebab_case "${basename%.*}").ts
        mv "$file" "scripts/scrapers/mall-specific/$newname" 2>/dev/null
        echo "Moved: $file -> scripts/scrapers/mall-specific/$newname"
    fi
done

# Move data processing scripts
echo "Moving data processing scripts..."

# Cleaners
for file in scripts/clean-*.ts scripts/clean-*.js; do
    if [ -f "$file" ]; then
        basename=$(basename "$file")
        newname=$(to_kebab_case "${basename%.*}").ts
        mv "$file" "scripts/data-processing/cleaners/$newname" 2>/dev/null
        echo "Moved: $file -> scripts/data-processing/cleaners/$newname"
    fi
done

# Validators
for file in scripts/verify-*.ts scripts/verify-*.js scripts/validate-*.js scripts/check-*.ts scripts/check-*.js; do
    if [ -f "$file" ]; then
        basename=$(basename "$file")
        newname=$(to_kebab_case "${basename%.*}").ts
        mv "$file" "scripts/data-processing/validators/$newname" 2>/dev/null
        echo "Moved: $file -> scripts/data-processing/validators/$newname"
    fi
done

# Transformers
for file in scripts/convert-*.js scripts/convert-*.ts scripts/extract-*.ts scripts/integrate-*.ts; do
    if [ -f "$file" ]; then
        basename=$(basename "$file")
        newname=$(to_kebab_case "${basename%.*}").ts
        mv "$file" "scripts/data-processing/transformers/$newname" 2>/dev/null
        echo "Moved: $file -> scripts/data-processing/transformers/$newname"
    fi
done

# Analysis scripts
echo "Moving analysis scripts..."
for file in scripts/generate-*.js scripts/list-*.ts scripts/analyze-*.js scripts/explore-*.ts; do
    if [ -f "$file" ]; then
        basename=$(basename "$file")
        newname=$(to_kebab_case "${basename%.*}").ts
        mv "$file" "scripts/analysis/$newname" 2>/dev/null
        echo "Moved: $file -> scripts/analysis/$newname"
    fi
done

# Utility scripts
echo "Moving utility scripts..."
for file in scripts/download-*.ts scripts/register-*.ts scripts/register-*.js scripts/remove-*.js scripts/remove-*.ts; do
    if [ -f "$file" ]; then
        basename=$(basename "$file")
        newname=$(to_kebab_case "${basename%.*}").ts
        mv "$file" "scripts/utilities/$newname" 2>/dev/null
        echo "Moved: $file -> scripts/utilities/$newname"
    fi
done

echo "Phase 2 complete! Scripts organized."
echo "Next: Run reorganize-phase3-data.sh to consolidate data files"