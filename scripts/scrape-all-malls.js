const fs = require('fs').promises;
const path = require('path');

// Function to run a scraper
async function runScraper(mallData, scraperMapping) {
  const scraperPath = path.join(__dirname, 'scrapers', scraperMapping.scraperType + '-scraper.js');
  
  try {
    // Check if scraper file exists
    await fs.access(scraperPath);
    
    // Import and run the scraper
    const scraper = require(scraperPath);
    
    console.log(`Scraping ${mallData.name} (ID: ${mallData.id}) using ${scraperMapping.scraperType}...`);
    
    const products = await scraper.scrape(mallData.url, {
      mallId: mallData.id,
      mallName: mallData.name,
      mallEngName: mallData.engname,
      region: mallData.region
    });
    
    return {
      success: true,
      products: products || []
    };
  } catch (error) {
    console.error(`Error scraping ${mallData.name}:`, error.message);
    return {
      success: false,
      error: error.message,
      products: []
    };
  }
}

// Main function
async function scrapeAllMalls() {
  try {
    // Read necessary data files
    const mallsData = JSON.parse(
      await fs.readFile(path.join(__dirname, '../src/data/malls/malls.json'), 'utf8')
    );
    
    const scraperMappings = JSON.parse(
      await fs.readFile(path.join(__dirname, 'data/scraper-mappings.json'), 'utf8')
    );
    
    // Create mapping object for easier lookup
    const mappingsByMallId = {};
    scraperMappings.forEach(mapping => {
      mappingsByMallId[mapping.mallId] = mapping;
    });
    
    // Output directory
    const outputDir = path.join(__dirname, '../src/data/products');
    
    // Process each mall
    const results = [];
    
    for (const mall of mallsData) {
      const mapping = mappingsByMallId[mall.id];
      
      if (!mapping) {
        console.warn(`No scraper mapping found for mall ${mall.id} - ${mall.name}`);
        continue;
      }
      
      // Run the scraper
      const result = await runScraper(mall, mapping);
      
      // Prepare product data
      const productData = {
        mallId: mall.id,
        mallName: mall.name,
        mallEngName: mall.engname,
        url: mall.url,
        region: mall.region,
        scraperId: mapping.bestScraperId,
        scraperType: mapping.scraperType,
        lastUpdated: new Date().toISOString(),
        totalProducts: result.products.length,
        scrapeSuccess: result.success,
        error: result.error || null,
        products: result.products
      };
      
      // Save to file
      const filename = `${mall.id}-${mall.engname}-products.json`;
      const filepath = path.join(outputDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(productData, null, 2));
      
      results.push({
        mallId: mall.id,
        mallName: mall.name,
        filename: filename,
        productCount: result.products.length,
        success: result.success,
        error: result.error
      });
      
      console.log(`Saved ${result.products.length} products to ${filename}`);
      
      // Add delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Save summary report
    const summaryReport = {
      totalMalls: results.length,
      successfulScrapes: results.filter(r => r.success).length,
      failedScrapes: results.filter(r => !r.success).length,
      totalProducts: results.reduce((sum, r) => sum + r.productCount, 0),
      timestamp: new Date().toISOString(),
      details: results
    };
    
    await fs.writeFile(
      path.join(outputDir, 'scrape-summary.json'),
      JSON.stringify(summaryReport, null, 2)
    );
    
    console.log('\n=== Scraping Summary ===');
    console.log(`Total malls processed: ${summaryReport.totalMalls}`);
    console.log(`Successful: ${summaryReport.successfulScrapes}`);
    console.log(`Failed: ${summaryReport.failedScrapes}`);
    console.log(`Total products scraped: ${summaryReport.totalProducts}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the scraper
if (require.main === module) {
  scrapeAllMalls();
}

module.exports = { scrapeAllMalls };