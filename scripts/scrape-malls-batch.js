const fs = require('fs').promises;
const path = require('path');

// Function to safely load a scraper
async function loadScraper(scraperType) {
  const scraperPath = path.join(__dirname, 'scrapers', scraperType + '-scraper.js');
  
  try {
    await fs.access(scraperPath);
    return require(scraperPath);
  } catch (error) {
    console.error(`Scraper ${scraperType} not found at ${scraperPath}`);
    return null;
  }
}

// Function to scrape a single mall
async function scrapeMall(mall, mapping) {
  const scraper = await loadScraper(mapping.scraperType);
  
  if (!scraper || !scraper.scrape) {
    return {
      success: false,
      error: `Scraper ${mapping.scraperType} not found or invalid`,
      products: []
    };
  }
  
  try {
    console.log(`[${new Date().toISOString()}] Scraping ${mall.name} (ID: ${mall.id})...`);
    
    const products = await scraper.scrape(mall.url, {
      mallId: mall.id,
      mallName: mall.name,
      mallEngName: mall.engname,
      region: mall.region
    });
    
    return {
      success: true,
      products: Array.isArray(products) ? products : []
    };
  } catch (error) {
    console.error(`Error scraping ${mall.name}:`, error.message);
    return {
      success: false,
      error: error.message,
      products: []
    };
  }
}

// Main function with batch processing
async function scrapeMallsBatch(startId = 1, endId = null, batchSize = 5) {
  try {
    // Read data files
    const mallsData = JSON.parse(
      await fs.readFile(path.join(__dirname, '../src/data/malls/malls.json'), 'utf8')
    );
    
    const scraperMappings = JSON.parse(
      await fs.readFile(path.join(__dirname, 'data/scraper-mappings.json'), 'utf8')
    );
    
    // Create mapping lookup
    const mappingsByMallId = {};
    scraperMappings.forEach(mapping => {
      mappingsByMallId[mapping.mallId] = mapping;
    });
    
    // Filter malls by ID range
    const mallsToProcess = mallsData.filter(mall => {
      if (endId) {
        return mall.id >= startId && mall.id <= endId;
      }
      return mall.id >= startId;
    });
    
    console.log(`Processing ${mallsToProcess.length} malls from ID ${startId}${endId ? ' to ' + endId : ''}...`);
    
    const outputDir = path.join(__dirname, '../src/data/products');
    const results = [];
    
    // Process in batches
    for (let i = 0; i < mallsToProcess.length; i += batchSize) {
      const batch = mallsToProcess.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} (${batch.length} malls)...`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (mall) => {
        const mapping = mappingsByMallId[mall.id];
        
        if (!mapping) {
          console.warn(`No scraper mapping for mall ${mall.id} - ${mall.name}`);
          return {
            mall,
            result: { success: false, error: 'No scraper mapping', products: [] }
          };
        }
        
        const result = await scrapeMall(mall, mapping);
        
        // Save product data
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
        
        const filename = `${mall.id}-${mall.engname}-products.json`;
        const filepath = path.join(outputDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(productData, null, 2));
        
        console.log(`✓ ${mall.name}: ${result.products.length} products saved`);
        
        return {
          mall,
          result,
          filename
        };
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Delay between batches
      if (i + batchSize < mallsToProcess.length) {
        console.log('Waiting 5 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Generate summary
    const summary = {
      processedRange: { startId, endId: endId || mallsToProcess[mallsToProcess.length - 1]?.id },
      totalProcessed: results.length,
      successful: results.filter(r => r.result.success).length,
      failed: results.filter(r => !r.result.success).length,
      totalProducts: results.reduce((sum, r) => sum + r.result.products.length, 0),
      timestamp: new Date().toISOString(),
      results: results.map(r => ({
        mallId: r.mall.id,
        mallName: r.mall.name,
        success: r.result.success,
        productCount: r.result.products.length,
        error: r.result.error,
        filename: r.filename
      }))
    };
    
    // Save batch summary
    const summaryFilename = `scrape-summary-batch-${startId}-${endId || 'end'}.json`;
    await fs.writeFile(
      path.join(outputDir, summaryFilename),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n=== Batch Summary ===');
    console.log(`Processed: ${summary.totalProcessed} malls`);
    console.log(`Successful: ${summary.successful}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Total products: ${summary.totalProducts}`);
    console.log(`Summary saved to: ${summaryFilename}`);
    
    return summary;
    
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const startId = parseInt(args[0]) || 1;
  const endId = args[1] ? parseInt(args[1]) : null;
  const batchSize = parseInt(args[2]) || 5;
  
  console.log('Mall Batch Scraper');
  console.log('==================');
  console.log(`Start ID: ${startId}`);
  console.log(`End ID: ${endId || 'all'}`);
  console.log(`Batch size: ${batchSize}`);
  console.log('');
  
  scrapeMallsBatch(startId, endId, batchSize)
    .then(() => {
      console.log('\nBatch scraping completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nBatch scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeMallsBatch };