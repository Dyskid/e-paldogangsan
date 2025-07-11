#!/bin/bash

# Phase 3: Consolidate Data
# This script organizes all data files into the new structure

echo "Phase 3: Consolidating data files..."

# Function to extract mall ID from filename
get_mall_id() {
    echo "$1" | grep -oE '^[0-9]+' | head -1
}

# Function to extract mall name from filename
get_mall_name() {
    # Remove number prefix and extension
    name=$(echo "$1" | sed 's/^[0-9]*-//' | sed 's/\.json$//')
    # Convert to lowercase and replace spaces/special chars with hyphens
    echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9가-힣]/-/g' | sed 's/-\+/-/g' | sed 's/^-//' | sed 's/-$//'
}

# Move configuration files
echo "Moving configuration files..."
cp src/data/malls.json config/malls.json 2>/dev/null
cp src/data/categories.json config/categories.json 2>/dev/null
cp src/data/regions.json config/regions.json 2>/dev/null
cp src/data/category-mapping.json config/category-mapping.json 2>/dev/null
cp src/data/tag-mapping.json config/tag-mapping.json 2>/dev/null

# Also check assets directory
cp assets/malls.json config/malls.json 2>/dev/null

echo "Configuration files moved to config/"

# Organize product files from scripts/output
echo "Organizing product files..."

for file in scripts/output/*-products.json; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Extract mall ID and name
        mall_id=$(get_mall_id "$filename")
        
        # Extract mall name from the filename
        if [[ $filename =~ ^[0-9]+-(.+)-products\.json$ ]]; then
            mall_name="${BASH_REMATCH[1]}"
            mall_name=$(echo "$mall_name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9가-힣]/-/g' | sed 's/-\+/-/g')
            
            # Create mall directory
            if [ ! -z "$mall_id" ]; then
                mall_dir="data/products/mall-$(printf "%03d" $mall_id)-$mall_name"
            else
                mall_dir="data/products/$mall_name"
            fi
            
            mkdir -p "$mall_dir"
            cp "$file" "$mall_dir/products.json"
            echo "Moved: $file -> $mall_dir/products.json"
        fi
    fi
done

# Move scraped data
echo "Moving scraped data..."
if [ -d "data/scraped-products" ]; then
    cp -r data/scraped-products/* data/scraped/latest/ 2>/dev/null
fi

# Copy any scraped data from scripts/output
for file in scripts/output/*scrape*.json scripts/output/*raw*.json; do
    if [ -f "$file" ]; then
        cp "$file" data/scraped/2025-01/ 2>/dev/null
        echo "Copied scraped data: $file"
    fi
done

# Move backup files
echo "Moving backup files..."
for file in src/data/products-backup-*.json; do
    if [ -f "$file" ]; then
        cp "$file" data/backups/2025-01/ 2>/dev/null
        echo "Moved backup: $file"
    fi
done

# Move reports
echo "Moving report files..."

# Scraping reports
for file in scripts/output/*-scrape-summary.json scripts/output/*-analysis.json scripts/output/*-structure-analysis.json; do
    if [ -f "$file" ]; then
        cp "$file" data/reports/scraping/ 2>/dev/null
        echo "Moved scraping report: $file"
    fi
done

# Validation reports
for file in scripts/output/*-verification-report.json scripts/output/*-validation-report.json; do
    if [ -f "$file" ]; then
        cp "$file" data/reports/validation/ 2>/dev/null
        echo "Moved validation report: $file"
    fi
done

# Move status reports
cp scripts/mall-scraping-status-report.json data/reports/ 2>/dev/null
cp scripts/output/final-scraping-report.json data/reports/ 2>/dev/null
cp scripts/output/true-scraping-status.json data/reports/ 2>/dev/null

# Create main products.json symlink for app
echo "Creating symlink for main products.json..."
ln -sf ../data/products src/data/products 2>/dev/null

echo "Phase 3 complete! Data files consolidated."
echo "Next: Run reorganize-phase4-cleanup.sh to clean up old files"