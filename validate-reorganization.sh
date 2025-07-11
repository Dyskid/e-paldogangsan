#!/bin/bash

# Validation Script for File Reorganization
# This script checks if the reorganization was successful

echo "====================================="
echo "Validating File Reorganization"
echo "====================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for issues
issues=0

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Directory exists: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Directory missing: $1"
        ((issues++))
        return 1
    fi
}

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} File missing: $1"
        ((issues++))
        return 1
    fi
}

# Check new directory structure
echo "Checking directory structure..."
echo "------------------------------"
check_dir "config"
check_dir "data/products"
check_dir "data/scraped"
check_dir "data/backups"
check_dir "data/reports"
check_dir "scripts/scrapers/core"
check_dir "scripts/scrapers/mall-specific"
check_dir "scripts/data-processing"
check_dir "scripts/analysis"
check_dir "docs"

echo ""
echo "Checking configuration files..."
echo "------------------------------"
check_file "config/malls.json"
check_file "config/categories.json"
check_file "config/regions.json"

echo ""
echo "Checking for product data..."
echo "----------------------------"
product_count=$(find data/products -name "products.json" -type f 2>/dev/null | wc -l)
if [ $product_count -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Found $product_count mall product files"
else
    echo -e "${RED}✗${NC} No product files found in data/products/"
    ((issues++))
fi

echo ""
echo "Checking for orphaned files..."
echo "-----------------------------"
old_scripts=$(find scripts -maxdepth 1 -name "*.js" -o -name "*.ts" 2>/dev/null | grep -v reorganize | wc -l)
if [ $old_scripts -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} Found $old_scripts scripts in root scripts/ directory that should be organized"
    find scripts -maxdepth 1 -name "*.js" -o -name "*.ts" | grep -v reorganize | head -5
    echo "..."
else
    echo -e "${GREEN}✓${NC} No orphaned scripts in root scripts/ directory"
fi

echo ""
echo "Checking for common issues..."
echo "----------------------------"

# Check for Korean filenames
korean_files=$(find . -name "*[가-힣]*" -type f 2>/dev/null | grep -v node_modules | wc -l)
if [ $korean_files -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} Found $korean_files files with Korean characters"
    find . -name "*[가-힣]*" -type f | grep -v node_modules | head -3
else
    echo -e "${GREEN}✓${NC} No files with Korean characters found"
fi

# Check for inconsistent naming
underscore_files=$(find scripts data -name "*_*" -type f 2>/dev/null | grep -v node_modules | wc -l)
if [ $underscore_files -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} Found $underscore_files files with underscores (should use kebab-case)"
else
    echo -e "${GREEN}✓${NC} Naming convention looks consistent"
fi

echo ""
echo "====================================="
echo "Validation Summary"
echo "====================================="

if [ $issues -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo "The reorganization appears to be successful."
else
    echo -e "${RED}✗ Found $issues issues${NC}"
    echo "Please review the issues above and run the appropriate reorganization phase again."
fi

echo ""
echo "Additional recommendations:"
echo "1. Run 'npm run build' to check for any import errors"
echo "2. Test key functionality in the application"
echo "3. Review git status for any untracked files"
echo "4. Consider running the import path updater script"