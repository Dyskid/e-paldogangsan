const fs = require('fs').promises;
const path = require('path');

// Files in batch-scrape directory that need to be moved
const batchFiles = {
  'dangjin-farm-products.json': 'dangjinfarm',
  'danpoong-mall-products.json': 'danpoong',
  'hampyeong-cheonji-products.json': 'hampyeong',
  'hamyang-mall-products.json': 'hamyang'
};

// Files in retry-scrape directory
const retryFiles = {
  'jps-mall-products.json': 'jps'
};

// Debug directory files that need to be moved
const debugFiles = {
  'ejeju-cat26-page1.html': 'ejeju',
  'ejeju-cat27-page1.html': 'ejeju',
  'ejeju-cat28-page1.html': 'ejeju',
  'ejeju-cat29-page1.html': 'ejeju',
  'ejeju-cat30-page1.html': 'ejeju',
  'ejeju-cat31-page1.html': 'ejeju',
  'ejeju-cat31008-page1.html': 'ejeju',
  'ejeju-cat32-page1.html': 'ejeju',
  'ontongdaejeon-product-1750420391361.html': 'ontongdaejeon',
  'ontongdaejeon-product-1750420393867.html': 'ontongdaejeon',
  'ontongdaejeon-product-1750420396332.html': 'ontongdaejeon',
  'ontongdaejeon-product-1750420399656.html': 'ontongdaejeon',
  'ontongdaejeon-product-1750420402178.html': 'ontongdaejeon'
};

// Jeju-related files in root output directory
const jejuFiles = [
  'jeju-image-fallback-summary.json',
  'jeju-image-fix-summary.json',
  'jeju-listing-titles.json',
  'jeju-price-fix-summary.json',
  'jeju-products-removal-summary.json',
  'jeju-real-images-summary.json',
  'jeju-real-titles.json',
  'jeju-title-update-report.json'
];

async function moveRemainingFiles() {
  const outputDir = path.join(__dirname, 'output');
  
  try {
    // Move batch-scrape files
    console.log('Moving batch-scrape files...');
    const batchScrapeDir = path.join(outputDir, 'batch-scrape');
    
    for (const [file, mall] of Object.entries(batchFiles)) {
      const sourcePath = path.join(batchScrapeDir, file);
      const targetPath = path.join(outputDir, mall, file);
      
      try {
        await fs.rename(sourcePath, targetPath);
        console.log(`Moved batch-scrape/${file} to ${mall}/`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`Error moving ${file}:`, err.message);
        }
      }
    }
    
    // Move retry-scrape files
    console.log('\nMoving retry-scrape files...');
    const retryScrapeDir = path.join(outputDir, 'retry-scrape');
    
    for (const [file, mall] of Object.entries(retryFiles)) {
      const sourcePath = path.join(retryScrapeDir, file);
      const targetPath = path.join(outputDir, mall, file);
      
      try {
        await fs.rename(sourcePath, targetPath);
        console.log(`Moved retry-scrape/${file} to ${mall}/`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`Error moving ${file}:`, err.message);
        }
      }
    }
    
    // Move debug files
    console.log('\nMoving debug files...');
    const debugDir = path.join(outputDir, 'debug');
    
    for (const [file, mall] of Object.entries(debugFiles)) {
      const sourcePath = path.join(debugDir, file);
      const targetPath = path.join(outputDir, mall, file);
      
      try {
        await fs.rename(sourcePath, targetPath);
        console.log(`Moved debug/${file} to ${mall}/`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`Error moving ${file}:`, err.message);
        }
      }
    }
    
    // Move jeju files from root
    console.log('\nMoving jeju files from root...');
    for (const file of jejuFiles) {
      const sourcePath = path.join(outputDir, file);
      const targetPath = path.join(outputDir, 'ejeju', file);
      
      try {
        await fs.rename(sourcePath, targetPath);
        console.log(`Moved ${file} to ejeju/`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`Error moving ${file}:`, err.message);
        }
      }
    }
    
    // Clean up empty directories
    console.log('\nCleaning up empty directories...');
    const dirsToCheck = ['batch-scrape', 'retry-scrape', 'debug'];
    
    for (const dir of dirsToCheck) {
      const dirPath = path.join(outputDir, dir);
      try {
        const files = await fs.readdir(dirPath);
        if (files.length === 0) {
          await fs.rmdir(dirPath);
          console.log(`Removed empty directory: ${dir}/`);
        } else {
          console.log(`Directory ${dir}/ still has ${files.length} files`);
        }
      } catch (err) {
        // Directory might not exist
      }
    }
    
    console.log('\nRemaining file organization complete!');
    
  } catch (error) {
    console.error('Error organizing remaining files:', error);
  }
}

// Run the organization
moveRemainingFiles();