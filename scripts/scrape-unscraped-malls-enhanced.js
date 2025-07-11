const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { getSpecializedScraper } = require('./specialized-mall-scrapers');

// Import base scrapers
const { NaverScraper, CysoScraper, GenericScraper } = require('./scrape-unscraped-malls');

// Load mall status report
const statusReport = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mall-scraping-status-report.json'), 'utf8')
);

// Filter unscraped malls
const unscrapedMalls = statusReport.mall_details.filter(mall => !mall.scraped);

// Enhanced scraping function that uses specialized scrapers when available
async function scrapeWithBestStrategy(mall) {
  console.log(`\n🎯 Selecting best strategy for ${mall.name} (ID: ${mall.id})`);
  
  // Check if there's a specialized scraper for this mall
  const specializedScraper = getSpecializedScraper(mall);
  if (specializedScraper) {
    console.log(`   Using specialized scraper for ${mall.name}`);
    try {
      await specializedScraper.scrape();
      return {
        scraper: specializedScraper,
        strategy: 'specialized',
        products: specializedScraper.products
      };
    } catch (error) {
      console.log(`   Specialized scraper failed, falling back to generic strategy`);
    }
  }
  
  // Use platform-specific scrapers
  let scraper;
  let strategy;
  
  if (mall.url.includes('smartstore.naver.com')) {
    scraper = new NaverScraper(mall);
    strategy = 'naver';
  } else if (mall.url.includes('cyso.co.kr')) {
    scraper = new CysoScraper(mall);
    strategy = 'cyso';
  } else {
    scraper = new GenericScraper(mall);
    strategy = 'generic';
  }
  
  console.log(`   Using ${strategy} scraper`);
  await scraper.scrape();
  
  return {
    scraper: scraper,
    strategy: strategy,
    products: scraper.products
  };
}

// Enhanced batch scraping with progress tracking
async function enhancedBatchScrape(options = {}) {
  const {
    maxMalls = Infinity,
    skipMallIds = [],
    onlyMallIds = null,
    saveProgress = true,
    progressInterval = 5
  } = options;
  
  console.log('🚀 Starting enhanced batch scraping');
  
  // Filter malls based on options
  let mallsToScrape = unscrapedMalls;
  
  if (onlyMallIds) {
    mallsToScrape = mallsToScrape.filter(m => onlyMallIds.includes(m.id));
  } else {
    mallsToScrape = mallsToScrape.filter(m => !skipMallIds.includes(m.id));
  }
  
  mallsToScrape = mallsToScrape.slice(0, maxMalls);
  
  console.log(`📊 Will scrape ${mallsToScrape.length} malls`);
  
  const results = [];
  const startTime = Date.now();
  let successCount = 0;
  let totalProducts = 0;
  
  // Create output directory
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Progress file
  const progressFile = path.join(outputDir, 'scraping-progress.json');
  let progress = { completed: [], failed: [] };
  
  if (fs.existsSync(progressFile)) {
    progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
  }
  
  // Scrape each mall
  for (let i = 0; i < mallsToScrape.length; i++) {
    const mall = mallsToScrape[i];
    
    // Skip if already completed
    if (progress.completed.find(m => m.id === mall.id)) {
      console.log(`⏭️  Skipping ${mall.name} (already completed)`);
      continue;
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Processing ${i + 1}/${mallsToScrape.length}: ${mall.name}`);
    console.log(`   Region: ${mall.region} | URL: ${mall.url}`);
    
    try {
      const result = await scrapeWithBestStrategy(mall);
      
      // Save results
      const filename = `${mall.id}-${mall.engname}-products.json`;
      const filepath = path.join(outputDir, filename);
      
      const output = {
        mall: {
          id: mall.id,
          name: mall.name,
          engname: mall.engname,
          url: mall.url,
          region: mall.region
        },
        scrapedAt: new Date().toISOString(),
        strategy: result.strategy,
        totalProducts: result.products.length,
        products: result.products,
        errors: result.scraper.errors || []
      };
      
      fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
      
      successCount++;
      totalProducts += result.products.length;
      
      // Update progress
      progress.completed.push({
        id: mall.id,
        name: mall.name,
        productsCount: result.products.length,
        completedAt: new Date().toISOString()
      });
      
      results.push({
        mall: mall.name,
        id: mall.id,
        strategy: result.strategy,
        status: 'success',
        productsCount: result.products.length,
        filepath: filepath
      });
      
      console.log(`   ✅ Success! Found ${result.products.length} products`);
      
      // Show sample products
      if (result.products.length > 0) {
        console.log('   Sample products:');
        result.products.slice(0, 3).forEach(p => {
          console.log(`     - ${p.name}: ${p.price}원`);
        });
      }
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      
      progress.failed.push({
        id: mall.id,
        name: mall.name,
        error: error.message,
        failedAt: new Date().toISOString()
      });
      
      results.push({
        mall: mall.name,
        id: mall.id,
        status: 'failed',
        error: error.message
      });
    }
    
    // Save progress periodically
    if (saveProgress && (i + 1) % progressInterval === 0) {
      fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
      console.log(`\n💾 Progress saved (${progress.completed.length} completed, ${progress.failed.length} failed)`);
    }
    
    // Delay between malls
    if (i < mallsToScrape.length - 1) {
      console.log(`\n⏳ Waiting 3 seconds before next mall...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Save final progress
  if (saveProgress) {
    fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
  }
  
  // Generate detailed summary report
  const duration = Math.round((Date.now() - startTime) / 1000);
  const summaryReport = {
    runDate: new Date().toISOString(),
    duration: duration,
    durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`,
    totalMalls: mallsToScrape.length,
    successCount: successCount,
    failedCount: results.filter(r => r.status === 'failed').length,
    totalProducts: totalProducts,
    averageProductsPerMall: Math.round(totalProducts / successCount) || 0,
    
    strategyBreakdown: {
      specialized: results.filter(r => r.strategy === 'specialized').length,
      naver: results.filter(r => r.strategy === 'naver').length,
      cyso: results.filter(r => r.strategy === 'cyso').length,
      generic: results.filter(r => r.strategy === 'generic').length
    },
    
    regionalBreakdown: {},
    
    results: results,
    
    topMallsByProducts: results
      .filter(r => r.status === 'success')
      .sort((a, b) => b.productsCount - a.productsCount)
      .slice(0, 5),
    
    failedMalls: results.filter(r => r.status === 'failed')
  };
  
  // Calculate regional breakdown
  mallsToScrape.forEach(mall => {
    if (!summaryReport.regionalBreakdown[mall.region]) {
      summaryReport.regionalBreakdown[mall.region] = {
        attempted: 0,
        success: 0,
        failed: 0,
        totalProducts: 0
      };
    }
    
    summaryReport.regionalBreakdown[mall.region].attempted++;
    
    const result = results.find(r => r.id === mall.id);
    if (result) {
      if (result.status === 'success') {
        summaryReport.regionalBreakdown[mall.region].success++;
        summaryReport.regionalBreakdown[mall.region].totalProducts += result.productsCount;
      } else {
        summaryReport.regionalBreakdown[mall.region].failed++;
      }
    }
  });
  
  // Save summary report
  const summaryPath = path.join(outputDir, `enhanced-batch-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));
  
  // Print detailed summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ENHANCED BATCH SCRAPING COMPLETE');
  console.log('='.repeat(60));
  console.log(`⏱️  Duration: ${summaryReport.durationFormatted}`);
  console.log(`✅ Successful: ${summaryReport.successCount}/${summaryReport.totalMalls} malls`);
  console.log(`📦 Total products: ${summaryReport.totalProducts}`);
  console.log(`📊 Average products/mall: ${summaryReport.averageProductsPerMall}`);
  
  console.log('\n🔧 Strategy Breakdown:');
  Object.entries(summaryReport.strategyBreakdown).forEach(([strategy, count]) => {
    if (count > 0) {
      console.log(`   ${strategy}: ${count} malls`);
    }
  });
  
  console.log('\n🌍 Regional Performance:');
  Object.entries(summaryReport.regionalBreakdown).forEach(([region, stats]) => {
    console.log(`   ${region}: ${stats.success}/${stats.attempted} success, ${stats.totalProducts} products`);
  });
  
  if (summaryReport.topMallsByProducts.length > 0) {
    console.log('\n🏆 Top Malls by Product Count:');
    summaryReport.topMallsByProducts.forEach((mall, i) => {
      console.log(`   ${i + 1}. ${mall.mall}: ${mall.productsCount} products`);
    });
  }
  
  if (summaryReport.failedMalls.length > 0) {
    console.log('\n❌ Failed Malls:');
    summaryReport.failedMalls.forEach(mall => {
      console.log(`   - ${mall.mall}: ${mall.error}`);
    });
  }
  
  console.log(`\n📄 Detailed report: ${summaryPath}`);
  
  return summaryReport;
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--max':
        options.maxMalls = parseInt(args[++i]);
        break;
      case '--skip':
        options.skipMallIds = args[++i].split(',').map(id => parseInt(id));
        break;
      case '--only':
        options.onlyMallIds = args[++i].split(',').map(id => parseInt(id));
        break;
      case '--no-progress':
        options.saveProgress = false;
        break;
      case '--help':
        console.log(`
Enhanced Batch Mall Scraper

Usage: node scrape-unscraped-malls-enhanced.js [options]

Options:
  --max <number>        Maximum number of malls to scrape
  --skip <id1,id2,...>  Skip specific mall IDs
  --only <id1,id2,...>  Only scrape specific mall IDs
  --no-progress         Don't save progress (allows restart from beginning)
  --help                Show this help message

Examples:
  # Scrape all unscraped malls
  node scrape-unscraped-malls-enhanced.js
  
  # Scrape only 5 malls
  node scrape-unscraped-malls-enhanced.js --max 5
  
  # Skip problematic malls
  node scrape-unscraped-malls-enhanced.js --skip 66,72
  
  # Scrape specific malls only
  node scrape-unscraped-malls-enhanced.js --only 9,43,47
        `);
        process.exit(0);
    }
  }
  
  console.log('🚀 Starting Enhanced Batch Mall Scraper\n');
  
  enhancedBatchScrape(options)
    .then(() => {
      console.log('\n✨ All done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  enhancedBatchScrape,
  scrapeWithBestStrategy
};