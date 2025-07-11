#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define the target directory structure
const NEW_STRUCTURE = {
  config: 'config',
  dataProducts: 'data/products',
  dataMalls: 'data/malls',
  scriptsScrapers: 'scripts/scrapers',
  scriptsUtilities: 'scripts/utilities',
  docs: 'docs',
  archive: 'archive'
};

// Create directory if it doesn't exist
function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
}

// Sanitize filename by removing Korean characters and normalizing
function sanitizeFilename(filename) {
  // Replace Korean characters with empty string
  let sanitized = filename.replace(/[\u3131-\uD79D]/g, '');
  
  // Replace multiple hyphens with single hyphen
  sanitized = sanitized.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  // Ensure the file has a proper name
  if (!sanitized || sanitized === '.json' || sanitized === '.js' || sanitized === '.ts') {
    // Extract ID from original filename if possible
    const idMatch = filename.match(/^(\d+)/);
    if (idMatch) {
      sanitized = `mall-${idMatch[1]}${path.extname(filename)}`;
    } else {
      sanitized = `unnamed-${Date.now()}${path.extname(filename)}`;
    }
  }
  
  return sanitized;
}

// Move file with logging
function moveFile(source, destination) {
  try {
    // Ensure destination directory exists
    ensureDirectory(path.dirname(destination));
    
    // Check if source exists
    if (!fs.existsSync(source)) {
      console.log(`⚠️  Source not found: ${source}`);
      return false;
    }
    
    // Check if destination already exists
    if (fs.existsSync(destination)) {
      console.log(`⚠️  Destination exists, skipping: ${destination}`);
      return false;
    }
    
    // Copy and remove (safer than rename across drives)
    fs.copyFileSync(source, destination);
    fs.unlinkSync(source);
    console.log(`📁 Moved: ${path.basename(source)} → ${destination}`);
    return true;
  } catch (error) {
    console.error(`❌ Error moving ${source}: ${error.message}`);
    return false;
  }
}

// Main reorganization function
async function reorganize() {
  console.log('🚀 Starting simple reorganization...\n');
  
  const projectRoot = path.resolve(__dirname, '..');
  let movedCount = 0;
  let errorCount = 0;
  
  // Step 1: Create directory structure
  console.log('📂 Creating directory structure...');
  Object.values(NEW_STRUCTURE).forEach(dir => {
    ensureDirectory(path.join(projectRoot, dir));
  });
  
  // Step 2: Move product JSON files from scripts/output
  console.log('\n📦 Moving product JSON files...');
  const outputDir = path.join(projectRoot, 'scripts/output');
  if (fs.existsSync(outputDir)) {
    const files = fs.readdirSync(outputDir);
    files.forEach(file => {
      if (file.endsWith('-products.json')) {
        const source = path.join(outputDir, file);
        const sanitizedName = sanitizeFilename(file);
        const destination = path.join(projectRoot, NEW_STRUCTURE.dataProducts, sanitizedName);
        
        if (moveFile(source, destination)) {
          movedCount++;
        } else {
          errorCount++;
        }
      }
    });
  }
  
  // Step 3: Move configuration files
  console.log('\n⚙️  Moving configuration files...');
  const configFiles = [
    'next.config.js',
    'tailwind.config.js',
    'tsconfig.json',
    'postcss.config.js',
    'vercel.json'
  ];
  
  configFiles.forEach(file => {
    const source = path.join(projectRoot, file);
    const destination = path.join(projectRoot, NEW_STRUCTURE.config, file);
    
    if (fs.existsSync(source)) {
      if (moveFile(source, destination)) {
        movedCount++;
      } else {
        errorCount++;
      }
    }
  });
  
  // Step 4: Move existing scrapers
  console.log('\n🔧 Organizing scrapers...');
  const scrapersDir = path.join(projectRoot, 'scripts/scrapers');
  if (fs.existsSync(scrapersDir)) {
    const scrapers = fs.readdirSync(scrapersDir);
    scrapers.forEach(file => {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        console.log(`✅ Scraper already in place: ${file}`);
      }
    });
  }
  
  // Step 5: Move utility scripts
  console.log('\n🛠️  Moving utility scripts...');
  const utilityScripts = [
    'check-mall-details.js',
    'check-mall-structure.js',
    'check-price-status.js',
    'convert-scraped-to-individual.js',
    'rename-files-with-ids.js',
    'trigger-rebuild.ts',
    'update-overview.ts'
  ];
  
  utilityScripts.forEach(script => {
    const source = path.join(projectRoot, 'scripts', script);
    const destination = path.join(projectRoot, NEW_STRUCTURE.scriptsUtilities, script);
    
    if (fs.existsSync(source)) {
      if (moveFile(source, destination)) {
        movedCount++;
      } else {
        errorCount++;
      }
    }
  });
  
  // Step 6: Move documentation
  console.log('\n📚 Moving documentation...');
  const docsToMove = [
    'PROJECT_OVERVIEW.md',
    'CRON_SETUP.md',
    'scripts/README.md',
    'scripts/SCRAPER_GUIDE.md',
    'scripts/SCRAPING_README.md',
    'scripts/MISSING_MALLS_SCRAPER_README.md'
  ];
  
  docsToMove.forEach(doc => {
    const source = path.join(projectRoot, doc);
    const destination = path.join(projectRoot, NEW_STRUCTURE.docs, path.basename(doc));
    
    if (fs.existsSync(source)) {
      if (moveFile(source, destination)) {
        movedCount++;
      } else {
        errorCount++;
      }
    }
  });
  
  // Step 7: Archive old and temporary files
  console.log('\n🗄️  Archiving old files...');
  const patternsToArchive = [
    'scripts/output/*.json', // Remaining JSON files
    'scripts/*-backup-*.json',
    'scripts/test-*.js',
    'scripts/debug-*.js',
    'scripts/temp-*.js',
    'scripts/explore-*.ts',
    'scripts/check-*.ts',
    'scripts/verify-*.ts',
    'scripts/remove-*.js',
    'scripts/remove-*.ts'
  ];
  
  let archivedCount = 0;
  patternsToArchive.forEach(pattern => {
    const dir = path.dirname(path.join(projectRoot, pattern));
    const filePattern = path.basename(pattern);
    
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (file.match(filePattern.replace('*', '.*'))) {
          const source = path.join(dir, file);
          const archiveDest = path.join(projectRoot, NEW_STRUCTURE.archive, path.relative(projectRoot, source));
          
          if (moveFile(source, archiveDest)) {
            archivedCount++;
          }
        }
      });
    }
  });
  
  // Step 8: Clean up empty directories
  console.log('\n🧹 Cleaning up empty directories...');
  function removeEmptyDirs(dir) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      let files = fs.readdirSync(dir);
      if (files.length === 0) {
        fs.rmdirSync(dir);
        console.log(`🗑️  Removed empty directory: ${dir}`);
      }
    }
  }
  
  // Check scripts/output directory
  if (fs.existsSync(outputDir)) {
    removeEmptyDirs(outputDir);
  }
  
  // Final report
  console.log('\n📊 Reorganization Complete!');
  console.log('================================');
  console.log(`✅ Files moved: ${movedCount}`);
  console.log(`📦 Files archived: ${archivedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('================================\n');
  
  // Show new structure
  console.log('📂 New Structure:');
  console.log('├── config/           - Configuration files');
  console.log('├── data/');
  console.log('│   ├── products/     - Product JSON files');
  console.log('│   └── malls/        - Mall data');
  console.log('├── scripts/');
  console.log('│   ├── scrapers/     - Scraping scripts');
  console.log('│   └── utilities/    - Utility scripts');
  console.log('├── docs/             - Documentation');
  console.log('└── archive/          - Archived files\n');
}

// Run the reorganization
reorganize().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});