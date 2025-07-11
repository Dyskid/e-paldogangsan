#!/bin/bash

# Master Reorganization Script
# This script runs all phases of the file reorganization

echo "==================================="
echo "e-Paldogangsan File Reorganization"
echo "==================================="
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "scripts" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

# Function to prompt for confirmation
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# Show what will happen
echo "This script will reorganize the entire project structure:"
echo "- Create new directory structure"
echo "- Move and rename scripts"
echo "- Consolidate data files"
echo "- Archive old files"
echo ""
echo "Please ensure you have:"
echo "1. Committed all current changes to git"
echo "2. Have a backup of important files"
echo ""

if ! confirm "Do you want to proceed?"; then
    echo "Reorganization cancelled."
    exit 0
fi

# Make scripts executable
chmod +x scripts/reorganize-phase*.sh

# Run each phase
echo ""
echo "Starting Phase 1: Create Structure"
echo "---------------------------------"
bash scripts/reorganize-phase1-create-structure.sh
if [ $? -ne 0 ]; then
    echo "Error in Phase 1. Stopping."
    exit 1
fi

echo ""
if confirm "Phase 1 complete. Continue to Phase 2 (Organize Scripts)?"; then
    echo "Starting Phase 2: Organize Scripts"
    echo "---------------------------------"
    bash scripts/reorganize-phase2-scripts.sh
    if [ $? -ne 0 ]; then
        echo "Error in Phase 2. Stopping."
        exit 1
    fi
else
    echo "Stopped after Phase 1."
    exit 0
fi

echo ""
if confirm "Phase 2 complete. Continue to Phase 3 (Consolidate Data)?"; then
    echo "Starting Phase 3: Consolidate Data"
    echo "---------------------------------"
    bash scripts/reorganize-phase3-data.sh
    if [ $? -ne 0 ]; then
        echo "Error in Phase 3. Stopping."
        exit 1
    fi
else
    echo "Stopped after Phase 2."
    exit 0
fi

echo ""
if confirm "Phase 3 complete. Continue to Phase 4 (Cleanup)?"; then
    echo "Starting Phase 4: Cleanup"
    echo "------------------------"
    bash scripts/reorganize-phase4-cleanup.sh
    if [ $? -ne 0 ]; then
        echo "Error in Phase 4. Stopping."
        exit 1
    fi
else
    echo "Stopped after Phase 3."
    exit 0
fi

echo ""
echo "======================================="
echo "Reorganization Complete!"
echo "======================================="
echo ""
echo "Summary of changes:"
echo "- Created new directory structure in config/, data/, docs/"
echo "- Organized scripts into logical subdirectories"
echo "- Consolidated data files"
echo "- Applied consistent naming conventions"
echo ""
echo "Next steps:"
echo "1. Review reorganization-summary.md"
echo "2. Test the application"
echo "3. Update any broken imports"
echo "4. Commit changes to git"
echo ""
echo "If you encounter any issues, check the individual phase scripts"
echo "in scripts/reorganize-phase*.sh"