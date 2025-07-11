const fs = require('fs');
const path = require('path');

// Function to read JSON file safely
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Function to get unique mall ID from filename
function getMallIdFromFilename(filename) {
  // Extract mall ID from patterns like "24-chuncheon-mall-products.json"
  const match = filename.match(/^(\d+)-(.+)-products\.json$/);
  if (match) {
    return match[1];
  }
  return null;
}

// Main function to generate the report
function generateScrapingReport() {
  console.log('🔍 Generating Comprehensive Scraping Status Report...\n');

  // Read malls.json
  const mallsPath = path.join(__dirname, '..', 'src', 'data', 'malls.json');
  const mallsData = readJsonFile(mallsPath);
  
  if (!mallsData) {
    console.error('❌ Could not read malls.json');
    return;
  }

  // Create a map of mall ID to mall data
  const mallsMap = new Map();
  mallsData.forEach(mall => {
    // Extract numeric ID from mall.id (e.g., "mall_3_우리몰" -> "3")
    const numericId = mall.id.match(/mall_(\d+)_/)?.[1];
    if (numericId) {
      mallsMap.set(numericId, mall);
    }
  });

  // Read all product files
  const outputDir = path.join(__dirname, 'output');
  const files = fs.readdirSync(outputDir);
  const productFiles = files.filter(f => f.endsWith('-products.json') && !f.includes('all-malls'));

  // Process scraped malls
  const scrapedMalls = new Map();
  let totalProducts = 0;

  productFiles.forEach(file => {
    const mallId = getMallIdFromFilename(file);
    if (mallId) {
      const filePath = path.join(outputDir, file);
      const products = readJsonFile(filePath);
      
      if (products && Array.isArray(products)) {
        const productCount = products.length;
        const mallInfo = mallsMap.get(mallId);
        
        scrapedMalls.set(mallId, {
          filename: file,
          productCount: productCount,
          mallName: mallInfo?.name || 'Unknown',
          region: mallInfo?.region || 'Unknown',
          url: mallInfo?.url || 'Unknown',
          district: mallInfo?.district || ''
        });
        
        totalProducts += productCount;
      }
    }
  });

  // Find missing malls
  const missingMalls = [];
  mallsMap.forEach((mall, mallId) => {
    if (!scrapedMalls.has(mallId)) {
      missingMalls.push({
        id: mallId,
        name: mall.name,
        region: mall.region,
        url: mall.url,
        district: mall.district || ''
      });
    }
  });

  // Calculate regional breakdown
  const regionalBreakdown = new Map();
  const regionalProductCount = new Map();

  // Count scraped malls by region
  scrapedMalls.forEach(mall => {
    const region = mall.region;
    regionalBreakdown.set(region, (regionalBreakdown.get(region) || 0) + 1);
    regionalProductCount.set(region, (regionalProductCount.get(region) || 0) + mall.productCount);
  });

  // Count total malls by region
  const totalMallsByRegion = new Map();
  mallsData.forEach(mall => {
    const region = mall.region;
    totalMallsByRegion.set(region, (totalMallsByRegion.get(region) || 0) + 1);
  });

  // Generate the report
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalMalls: mallsData.length,
      scrapedMalls: scrapedMalls.size,
      missingMalls: missingMalls.length,
      successPercentage: ((scrapedMalls.size / mallsData.length) * 100).toFixed(2) + '%',
      totalProducts: totalProducts,
      averageProductsPerMall: Math.round(totalProducts / scrapedMalls.size)
    },
    regionalBreakdown: [],
    scrapedMalls: [],
    missingMalls: missingMalls
  };

  // Compile regional breakdown
  const regions = new Set([...totalMallsByRegion.keys()]);
  regions.forEach(region => {
    const totalInRegion = totalMallsByRegion.get(region) || 0;
    const scrapedInRegion = regionalBreakdown.get(region) || 0;
    const productsInRegion = regionalProductCount.get(region) || 0;
    
    report.regionalBreakdown.push({
      region,
      totalMalls: totalInRegion,
      scrapedMalls: scrapedInRegion,
      missingMalls: totalInRegion - scrapedInRegion,
      successPercentage: totalInRegion > 0 ? ((scrapedInRegion / totalInRegion) * 100).toFixed(2) + '%' : '0%',
      totalProducts: productsInRegion,
      averageProductsPerMall: scrapedInRegion > 0 ? Math.round(productsInRegion / scrapedInRegion) : 0
    });
  });

  // Sort regional breakdown by region name
  report.regionalBreakdown.sort((a, b) => a.region.localeCompare(b.region));

  // Compile scraped malls list
  scrapedMalls.forEach((mall, mallId) => {
    report.scrapedMalls.push({
      id: mallId,
      name: mall.mallName,
      region: mall.region,
      district: mall.district,
      productCount: mall.productCount,
      url: mall.url,
      filename: mall.filename
    });
  });

  // Sort scraped malls by region and name
  report.scrapedMalls.sort((a, b) => {
    if (a.region !== b.region) return a.region.localeCompare(b.region);
    return a.name.localeCompare(b.name);
  });

  // Sort missing malls by region and name
  report.missingMalls.sort((a, b) => {
    if (a.region !== b.region) return a.region.localeCompare(b.region);
    return a.name.localeCompare(b.name);
  });

  // Save the report
  const reportPath = path.join(outputDir, 'final-scraping-status-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary to console
  console.log('📊 SCRAPING STATUS REPORT');
  console.log('========================\n');
  
  console.log('📈 OVERALL SUMMARY:');
  console.log(`   Total Malls: ${report.summary.totalMalls}`);
  console.log(`   Scraped Malls: ${report.summary.scrapedMalls} (${report.summary.successPercentage})`);
  console.log(`   Missing Malls: ${report.summary.missingMalls}`);
  console.log(`   Total Products: ${report.summary.totalProducts.toLocaleString()}`);
  console.log(`   Average Products/Mall: ${report.summary.averageProductsPerMall}\n`);

  console.log('🗺️  REGIONAL BREAKDOWN:');
  console.log('   Region          | Total | Scraped | Missing | Success % | Products');
  console.log('   ----------------|-------|---------|---------|-----------|----------');
  
  report.regionalBreakdown.forEach(region => {
    console.log(`   ${region.region.padEnd(15)} | ${String(region.totalMalls).padStart(5)} | ${String(region.scrapedMalls).padStart(7)} | ${String(region.missingMalls).padStart(7)} | ${region.successPercentage.padStart(9)} | ${String(region.totalProducts).padStart(8)}`);
  });

  console.log('\n🏪 TOP 10 MALLS BY PRODUCT COUNT:');
  const topMalls = [...report.scrapedMalls]
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 10);
  
  topMalls.forEach((mall, index) => {
    console.log(`   ${(index + 1).toString().padStart(2)}. ${mall.name} (${mall.region}): ${mall.productCount.toLocaleString()} products`);
  });

  console.log('\n❌ MISSING MALLS BY REGION:');
  const missingByRegion = new Map();
  report.missingMalls.forEach(mall => {
    if (!missingByRegion.has(mall.region)) {
      missingByRegion.set(mall.region, []);
    }
    missingByRegion.get(mall.region).push(mall);
  });

  missingByRegion.forEach((malls, region) => {
    console.log(`\n   ${region} (${malls.length} missing):`);
    malls.forEach(mall => {
      console.log(`     - ${mall.name}${mall.district ? ` (${mall.district})` : ''} - ${mall.url}`);
    });
  });

  console.log(`\n✅ Report saved to: ${reportPath}`);
  console.log('\n📝 You can find detailed information in the JSON report file.');
}

// Run the report generation
generateScrapingReport();