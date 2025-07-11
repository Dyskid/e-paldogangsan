#!/bin/bash

# Phase 4: Clean Up
# This script archives old files and updates import paths

echo "Phase 4: Cleaning up and finalizing reorganization..."

# Archive old files
echo "Archiving old files..."

# Move old documentation to archive
mv scripts/*.md assets/archive/ 2>/dev/null
mv scripts/mall-scraping-status-summary.txt assets/archive/ 2>/dev/null

# Archive old/duplicate mall data from assets
mv assets/malls.txt assets/archive/ 2>/dev/null
mv assets/malls-clean.txt assets/archive/ 2>/dev/null
mv assets/*.txt assets/archive/ 2>/dev/null

# Create script to update import paths
cat > scripts/utilities/update-import-paths.ts << 'EOF'
#!/usr/bin/env ts-node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Map of old paths to new paths
const pathMappings: Record<string, string> = {
  '../data/malls.json': '../../../config/malls.json',
  '../data/categories.json': '../../../config/categories.json',
  '../data/regions.json': '../../../config/regions.json',
  './scrapers/': '../scrapers/core/',
  '../enhanced-scrapers': '../scrapers/core/enhanced-scrapers',
  '../scraper-manager': '../scrapers/core/scraper-manager',
};

function updateImportPaths(filePath: string) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    // Update import paths
    for (const [oldPath, newPath] of Object.entries(pathMappings)) {
      const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.match(regex)) {
        content = content.replace(regex, newPath);
        modified = true;
      }
    }

    if (modified) {
      writeFileSync(filePath, content);
      console.log(`Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

function walkDirectory(dir: string) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      walkDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      updateImportPaths(filePath);
    }
  }
}

// Update all script files
console.log('Updating import paths in scripts...');
walkDirectory('./scripts');

// Update src files
console.log('Updating import paths in src...');
walkDirectory('./src');

console.log('Import paths updated!');
EOF

# Create summary report
cat > reorganization-summary.md << 'EOF'
# File Reorganization Summary

## What Changed

### Directory Structure
- Created clear separation between config, data, scripts, and documentation
- Organized scripts into logical subdirectories
- Consolidated all product data into `data/products/`
- Created proper backup and report directories

### Naming Conventions
- Standardized on kebab-case for all files and directories
- Applied consistent naming pattern for mall products: `mall-{id}-{name}/`
- Renamed scripts to be more descriptive and consistent

### Data Organization
- Moved all configuration to `config/`
- Organized products by mall in `data/products/`
- Separated scraped data, backups, and reports
- Created clear data flow structure

## Next Steps

1. **Test the application** to ensure all paths are correctly updated
2. **Review and remove** any remaining duplicate files
3. **Update documentation** to reflect new structure
4. **Create automation scripts** for common tasks with new structure

## Benefits Achieved

✓ Clear, intuitive file organization
✓ Consistent naming conventions
✓ Better separation of concerns
✓ Easier maintenance and scalability
✓ Improved developer experience

EOF

echo "Created reorganization summary"

# Create final directory listing
echo "Generating final directory structure..."
tree -d -L 3 > directory-structure.txt 2>/dev/null || {
    echo "Note: 'tree' command not found. Install it for better directory visualization."
    find . -type d -not -path '*/\.*' -not -path '*/node_modules*' | sort > directory-structure.txt
}

echo "Phase 4 complete! Cleanup finished."
echo ""
echo "=== REORGANIZATION COMPLETE ==="
echo ""
echo "Please review:"
echo "1. reorganization-summary.md - Summary of changes"
echo "2. directory-structure.txt - New directory structure"
echo ""
echo "Next steps:"
echo "1. Make scripts executable: chmod +x scripts/**/*.sh"
echo "2. Run import path updater: cd scripts/utilities && ts-node update-import-paths.ts"
echo "3. Test the application to ensure everything works"
echo "4. Commit the reorganized structure to git"