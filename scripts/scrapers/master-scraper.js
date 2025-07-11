const fs = require('fs').promises;
const path = require('path');

// Import platform-specific scrapers
const { scrapeAllCysoMalls } = require('./cyso-platform-scraper');
const { scrapeAllNaverMalls } = require('./naver-smartstore-scraper');
const { scrapeAllCustomMalls } = require('./custom-platform-scraper');

// Master scraper that coordinates all platform scrapers
async function scrapeAllUnscrapedMalls() {
  console.log('='.repeat(80));
  console.log('MASTER SCRAPER - Scraping All Unscraped Malls');
  console.log('='.repeat(80));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log();

  const startTime = Date.now();
  const results = {
    platforms: {},
    totalProducts: 0,
    totalSuccess: 0,
    totalFailed: 0
  };

  try {
    // 1. Scrape CYSO Platform Malls
    console.log('\n' + '='.repeat(50));
    console.log('PHASE 1: CYSO Platform Malls');
    console.log('='.repeat(50));
    
    await scrapeAllCysoMalls();
    
    // Load CYSO results
    const cysoReport = JSON.parse(
      await fs.readFile(path.join(__dirname, '..', 'output', 'cyso-platform-scraping-report.json'), 'utf-8')
    );
    results.platforms['CYSO'] = cysoReport;
    results.totalProducts += cysoReport.totalProducts;
    results.totalSuccess += cysoReport.successCount;
    results.totalFailed += cysoReport.failedCount;

    // 2. Scrape Custom Platform Malls
    console.log('\n' + '='.repeat(50));
    console.log('PHASE 2: Custom Platform Malls');
    console.log('='.repeat(50));
    
    await scrapeAllCustomMalls();
    
    // Load custom platform results
    const customReport = JSON.parse(
      await fs.readFile(path.join(__dirname, '..', 'output', 'custom-platform-scraping-report.json'), 'utf-8')
    );
    results.platforms['Custom'] = customReport;
    results.totalProducts += customReport.totalProducts;
    results.totalSuccess += customReport.successCount;
    results.totalFailed += customReport.failedCount;

    // 3. Scrape Naver Smart Store Malls (with caution)
    console.log('\n' + '='.repeat(50));
    console.log('PHASE 3: Naver Smart Store Malls');
    console.log('='.repeat(50));
    console.log('WARNING: Naver has strict rate limiting. This may fail.');
    
    await scrapeAllNaverMalls();
    
    // Load Naver results
    const naverReport = JSON.parse(
      await fs.readFile(path.join(__dirname, '..', 'output', 'naver-smartstore-scraping-report.json'), 'utf-8')
    );
    results.platforms['Naver'] = naverReport;
    results.totalProducts += naverReport.totalProducts;
    results.totalSuccess += naverReport.successCount;
    results.totalFailed += naverReport.failedCount;

  } catch (error) {
    console.error('Error in master scraper:', error);
  }

  // Generate master report
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  const masterReport = {
    timestamp: new Date().toISOString(),
    duration: `${Math.floor(duration / 60)}m ${duration % 60}s`,
    summary: {
      totalMallsProcessed: results.totalSuccess + results.totalFailed,
      successfulMalls: results.totalSuccess,
      failedMalls: results.totalFailed,
      totalProductsCollected: results.totalProducts
    },
    platformBreakdown: results.platforms,
    recommendations: generateRecommendations(results)
  };

  const reportPath = path.join(__dirname, '..', 'output', 'master-scraping-report.json');
  await fs.writeFile(reportPath, JSON.stringify(masterReport, null, 2));

  // Print final summary
  console.log('\n' + '='.repeat(80));
  console.log('MASTER SCRAPER - FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`Completed at: ${new Date().toISOString()}`);
  console.log(`Total duration: ${masterReport.duration}`);
  console.log(`\nMalls processed: ${masterReport.summary.totalMallsProcessed}`);
  console.log(`Successful: ${masterReport.summary.successfulMalls}`);
  console.log(`Failed: ${masterReport.summary.failedMalls}`);
  console.log(`Total products collected: ${masterReport.summary.totalProductsCollected}`);
  console.log(`\nMaster report saved to: ${reportPath}`);

  // List failed malls
  if (results.totalFailed > 0) {
    console.log('\n' + '='.repeat(50));
    console.log('FAILED MALLS REQUIRING ATTENTION');
    console.log('='.repeat(50));
    
    Object.entries(results.platforms).forEach(([platform, report]) => {
      if (report.results && report.results.failed && report.results.failed.length > 0) {
        console.log(`\n${platform} Platform:`);
        report.results.failed.forEach(failure => {
          console.log(`  - ${failure.mall}: ${failure.reason}`);
        });
      }
    });
  }

  return masterReport;
}

function generateRecommendations(results) {
  const recommendations = [];

  // Check Naver failures
  if (results.platforms.Naver && results.platforms.Naver.failedCount > 0) {
    recommendations.push({
      platform: 'Naver Smart Store',
      issue: 'Rate limiting (HTTP 429)',
      solutions: [
        'Use proxy rotation service',
        'Scrape during off-peak hours (2-6 AM KST)',
        'Implement manual browser automation with human-like delays',
        'Consider contacting store owners for product data export'
      ]
    });
  }

  // Check for malls with no products found
  Object.entries(results.platforms).forEach(([platform, report]) => {
    if (report.results && report.results.failed) {
      const noProductsMalls = report.results.failed.filter(f => f.reason === 'No products found');
      if (noProductsMalls.length > 0) {
        recommendations.push({
          platform: platform,
          issue: 'No products found',
          malls: noProductsMalls.map(m => m.mall),
          solutions: [
            'Verify the mall URL is correct',
            'Check if the site structure has changed',
            'Implement site-specific scrapers',
            'Check if products are loaded via AJAX/API'
          ]
        });
      }
    }
  });

  return recommendations;
}

// Run the master scraper
if (require.main === module) {
  scrapeAllUnscrapedMalls()
    .then(() => {
      console.log('\nMaster scraper completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nMaster scraper failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeAllUnscrapedMalls };