const fs = require('fs').promises;
const path = require('path');

async function updateScrapers() {
  const scrapersDir = path.join(__dirname, '../scripts/scrapers');
  const files = await fs.readdir(scrapersDir);
  
  // Filter only .js files excluding README
  const scraperFiles = files.filter(file => file.endsWith('.js') && file !== 'README.md');
  
  console.log(`Found ${scraperFiles.length} scraper files to update`);
  
  for (const file of scraperFiles) {
    const filePath = path.join(scrapersDir, file);
    console.log(`\nProcessing: ${file}`);
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      // Check if already has module.exports with scrape method
      if (content.includes('module.exports = {') && content.includes('scrape:')) {
        console.log(`✓ ${file} already has scrape method export`);
        continue;
      }
      
      // Find the function name and module.exports line
      let functionName = null;
      let exportMatch = null;
      
      // Common patterns for function names
      const functionPatterns = [
        /async function (scrape\w+)\s*\(/,
        /const (scrape\w+)\s*=\s*async/,
        /function (scrape\w+)\s*\(/
      ];
      
      for (const pattern of functionPatterns) {
        const match = content.match(pattern);
        if (match) {
          functionName = match[1];
          break;
        }
      }
      
      // Find module.exports pattern
      const exportPatterns = [
        /module\.exports\s*=\s*(\w+);?$/m,
        /module\.exports\s*=\s*{\s*(\w+)[,\s}]/m,
        /exports\.(\w+)\s*=\s*\1/m
      ];
      
      for (const pattern of exportPatterns) {
        const match = content.match(pattern);
        if (match) {
          exportMatch = match;
          break;
        }
      }
      
      if (!functionName || !exportMatch) {
        console.log(`⚠ Could not find function name or export in ${file}`);
        continue;
      }
      
      console.log(`Found function: ${functionName}`);
      
      // Replace the export statement
      const oldExport = exportMatch[0];
      const newExport = `module.exports = {
  scrape: ${functionName}
};`;
      
      content = content.replace(oldExport, newExport);
      
      // Write back the file
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✓ Updated ${file} with scrape method export`);
      
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
    }
  }
  
  console.log('\n=== Update Summary ===');
  console.log('All scrapers have been updated to export an object with scrape method');
  console.log('You can now use scraper.scrape() in scrape-all-malls.js and scrape-malls-batch.js');
}

// Run the update
updateScrapers().catch(console.error);