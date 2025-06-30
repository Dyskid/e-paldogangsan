#!/bin/bash

# Check scraping status for all malls

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATUS_FILE="$PROJECT_ROOT/mall-scraping-status.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== E-paldogangsan Scraping Status ===${NC}"
echo ""

if [ ! -f "$STATUS_FILE" ]; then
    echo -e "${YELLOW}No status file found. Run process-mall-batch.sh to start.${NC}"
    exit 0
fi

# Overall statistics
total_malls=$(cat "$PROJECT_ROOT/data/raw/malls-clean.txt" | wc -l)
completed=$(jq '[.malls | to_entries | .[] | select(.value.status == "completed")] | length' "$STATUS_FILE")
failed=$(jq '[.malls | to_entries | .[] | select(.value.status == "failed")] | length' "$STATUS_FILE")
analyzing=$(jq '[.malls | to_entries | .[] | select(.value.status == "analyzing")] | length' "$STATUS_FILE")
scraping=$(jq '[.malls | to_entries | .[] | select(.value.status == "scraping")] | length' "$STATUS_FILE")
pending=$((total_malls - completed - failed - analyzing - scraping))

echo "Total malls: $total_malls"
echo -e "Completed: ${GREEN}$completed${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo -e "In Progress: ${YELLOW}$((analyzing + scraping))${NC} (Analyzing: $analyzing, Scraping: $scraping)"
echo -e "Pending: $pending"
echo ""

# Progress bar
progress=$((completed * 100 / total_malls))
echo -n "Progress: ["
for i in $(seq 1 20); do
    if [ $((i * 5)) -le $progress ]; then
        echo -n "█"
    else
        echo -n "░"
    fi
done
echo "] $progress%"
echo ""

# Show recent activity
echo -e "${BLUE}Recent Activity:${NC}"
jq -r '.malls | to_entries | sort_by(.value.last_updated) | reverse | .[0:5] | .[] | 
    "\(.value.last_updated | split("T")[0]) \(.value.last_updated | split("T")[1] | split(".")[0]) - \(.value.name // .key): \(.value.status) (\(.value.products_registered // 0) products)"' \
    "$STATUS_FILE" 2>/dev/null || echo "No recent activity"

echo ""

# Show failed malls if any
if [ "$failed" -gt 0 ]; then
    echo -e "${RED}Failed Malls:${NC}"
    jq -r '.malls | to_entries | .[] | select(.value.status == "failed") | 
        "- \(.value.name // .key): \(.value.error // "Unknown error")"' "$STATUS_FILE"
    echo ""
fi

# Recommendations
echo -e "${BLUE}Recommendations:${NC}"
if [ "$failed" -gt 0 ]; then
    echo "- Review and fix failed scrapers"
fi
if [ "$pending" -gt 0 ]; then
    next_index=$((completed + failed + analyzing + scraping + 1))
    echo "- Continue with: ./process-mall-batch.sh $next_index"
fi
if [ "$completed" -eq "$total_malls" ]; then
    echo -e "${GREEN}✓ All malls have been processed!${NC}"
fi