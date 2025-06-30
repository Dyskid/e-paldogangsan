#!/bin/bash

# E-paldogangsan Mall Batch Processing Script
# Usage: ./process-mall-batch.sh <start_index> [batch_size]

set -e  # Exit on error

# Configuration
BATCH_SIZE=${2:-10}  # Default batch size is 10
START_INDEX=${1:-1}
END_INDEX=$((START_INDEX + BATCH_SIZE - 1))

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MALLS_FILE="$PROJECT_ROOT/data/raw/malls-clean.txt"
ANALYZE_TEMPLATE="$PROJECT_ROOT/templates/analyze-template.txt"
SCRAPER_TEMPLATE="$PROJECT_ROOT/templates/scraper-template.txt"
SCRAPERS_DIR="$PROJECT_ROOT/scripts/scrapers"
OUTPUT_DIR="$PROJECT_ROOT/data/scraped"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create necessary directories
mkdir -p "$SCRAPERS_DIR"
mkdir -p "$OUTPUT_DIR"

echo -e "${GREEN}=== E-paldogangsan Batch Processing ===${NC}"
echo "Processing malls $START_INDEX to $END_INDEX"
echo "Batch size: $BATCH_SIZE"
echo ""

# Check if malls file exists
if [ ! -f "$MALLS_FILE" ]; then
    echo -e "${RED}Error: malls-clean.txt not found${NC}"
    exit 1
fi

# Process each mall in the batch
for i in $(seq $START_INDEX $END_INDEX); do
    # Get mall info from file
    mall_line=$(sed -n "${i}p" "$MALLS_FILE")
    
    if [ -z "$mall_line" ]; then
        echo -e "${YELLOW}No more malls to process${NC}"
        break
    fi
    
    # Parse mall information
    IFS='|' read -r mall_id mall_name mall_url mall_region <<< "$mall_line"
    
    echo -e "${GREEN}[$i] Processing: $mall_name ($mall_id)${NC}"
    echo "URL: $mall_url"
    echo "Region: $mall_region"
    
    # 1. Update status to analyzing
    node "$SCRIPT_DIR/update-status.js" "$mall_id" "analyzing" \
        "name=$mall_name" "url=$mall_url" "region=$mall_region"
    
    # 2. Analyze mall structure
    echo "Step 1: Analyzing mall structure..."
    analysis_file="$OUTPUT_DIR/${mall_id}-analysis.json"
    
    # Create analysis prompt
    analysis_prompt=$(cat "$ANALYZE_TEMPLATE" | \
        sed "s|{{MALL_ID}}|$mall_id|g" | \
        sed "s|{{MALL_NAME}}|$mall_name|g" | \
        sed "s|{{MALL_URL}}|$mall_url|g" | \
        sed "s|{{MALL_REGION}}|$mall_region|g")
    
    echo "Please analyze: $mall_name"
    echo "URL: $mall_url"
    echo "Save analysis to: $analysis_file"
    
    # Note: This is where Claude would analyze the mall
    # For now, we'll create a placeholder
    echo "{\"mall_id\": \"$mall_id\", \"status\": \"pending_analysis\"}" > "$analysis_file"
    
    # Update status
    node "$SCRIPT_DIR/scripts/update-status.js" "$mall_id" "analyzing" "analyzer_created=true"
    
    # 3. Generate scraper (would be done by Claude)
    echo "Step 2: Generating scraper..."
    scraper_file="$SCRAPERS_DIR/${mall_id}-scraper.ts"
    
    # Note: This is where Claude would generate the scraper
    # For now, we'll note it needs to be created
    echo "// Scraper for $mall_name needs to be generated" > "$scraper_file"
    
    # Update status
    node "$SCRIPT_DIR/scripts/update-status.js" "$mall_id" "scraping" "scraper_created=true"
    
    # 4. Execute scraper
    echo "Step 3: Executing scraper..."
    scraped_file="$OUTPUT_DIR/${mall_id}-products.json"
    
    if [ -f "$scraper_file" ] && grep -q "class" "$scraper_file"; then
        # Run the actual scraper
        npx tsx "$scraper_file" > "$scraped_file"
        
        # Update status with scraped count
        product_count=$(jq length "$scraped_file" 2>/dev/null || echo "0")
        node "$SCRIPT_DIR/scripts/update-status.js" "$mall_id" "scraping" \
            "products_scraped=$product_count"
    else
        echo -e "${YELLOW}Scraper not yet implemented for $mall_name${NC}"
        echo "[]" > "$scraped_file"
    fi
    
    # 5. Validate products
    echo "Step 4: Validating products..."
    if node "$SCRIPT_DIR/scripts/validate-products.js" "$scraped_file"; then
        # 6. Register products if validation passed
        echo "Step 5: Registering products..."
        node "$SCRIPT_DIR/scripts/register-products.js" "$mall_id" "$scraped_file"
        
        echo -e "${GREEN}✓ Successfully processed $mall_name${NC}"
    else
        echo -e "${RED}✗ Validation failed for $mall_name${NC}"
        node "$SCRIPT_DIR/scripts/update-status.js" "$mall_id" "failed" \
            "error=Validation failed"
    fi
    
    echo "---"
    echo ""
    
    # Add delay between malls to avoid overwhelming servers
    sleep 2
done

echo -e "${GREEN}=== Batch Processing Complete ===${NC}"
echo "Processed malls $START_INDEX to $END_INDEX"

# Show summary
echo ""
echo "Summary:"
if [ -f "$SCRIPT_DIR/mall-scraping-status.json" ]; then
    completed=$(jq '[.malls | to_entries | .[] | select(.value.status == "completed")] | length' \
        "$PROJECT_ROOT/mall-scraping-status.json")
    failed=$(jq '[.malls | to_entries | .[] | select(.value.status == "failed")] | length' \
        "$PROJECT_ROOT/mall-scraping-status.json")
    pending=$(jq '[.malls | to_entries | .[] | select(.value.status == "pending")] | length' \
        "$PROJECT_ROOT/mall-scraping-status.json")
    
    echo "Completed: $completed"
    echo "Failed: $failed"
    echo "Pending: $pending"
fi