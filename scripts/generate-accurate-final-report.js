const fs = require('fs');
const path = require('path');

// Load malls data
const mallsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/malls.json'), 'utf8'));

// Get all product files from output directory
const outputDir = path.join(__dirname, 'output');
const productFiles = fs.readdirSync(outputDir)
  .filter(file => file.endsWith('-products.json'))
  .sort((a, b) => {
    const numA = parseInt(a.split('-')[0]);
    const numB = parseInt(b.split('-')[0]);
    return numA - numB;
  });

console.log('=== ACCURATE FINAL SCRAPING REPORT ===\n');
console.log(`Total product files found: ${productFiles.length}`);
console.log(`Total malls in database: ${mallsData.length}\n`);

// Create a map of scraped malls
const scrapedMalls = new Map();
const mallsByName = new Map();

// Build mall lookup maps
mallsData.forEach(mall => {
  mallsByName.set(mall.name, mall);
});

// Process each product file
console.log('=== SCRAPED MALLS ===\n');
let totalProducts = 0;
let totalScrapedMalls = 0;

productFiles.forEach((file, index) => {
  try {
    const filePath = path.join(outputDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Extract mall name from filename (remove number prefix and -products.json suffix)
    const parts = file.replace('-products.json', '').split('-');
    const fileNumber = parts[0];
    const mallNameFromFile = parts.slice(1).join('-');
    
    // Try to find the mall in our database
    let mall = null;
    let matchType = '';
    
    // First try exact match
    if (mallsByName.has(mallNameFromFile)) {
      mall = mallsByName.get(mallNameFromFile);
      matchType = 'exact';
    } else {
      // Try to find by partial match or alternative names
      for (const [name, m] of mallsByName) {
        if (name.includes(mallNameFromFile) || mallNameFromFile.includes(name) ||
            name.replace(/\s+/g, '') === mallNameFromFile.replace(/\s+/g, '')) {
          mall = m;
          matchType = 'partial';
          break;
        }
      }
    }
    
    const productCount = data.products ? data.products.length : 0;
    totalProducts += productCount;
    totalScrapedMalls++;
    
    console.log(`${index + 1}. ${file}`);
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Mall ID from file: ${fileNumber}`);
    if (mall) {
      console.log(`   - Matched to: ${mall.name} (ID: ${mall.id}) [${matchType} match]`);
      console.log(`   - Region: ${mall.region}`);
      scrapedMalls.set(mall.id, { mall, productCount, filename: file });
    } else {
      console.log(`   - ⚠️  No match found in malls.json`);
    }
    console.log();
    
  } catch (error) {
    console.log(`${index + 1}. ${file} - ERROR: ${error.message}\n`);
  }
});

// Find malls that weren't scraped
console.log('\n=== MALLS NOT SCRAPED ===\n');
const notScraped = mallsData.filter(mall => !scrapedMalls.has(mall.id));
notScraped.forEach((mall, index) => {
  console.log(`${index + 1}. ${mall.name} (ID: ${mall.id}) - ${mall.region}`);
});

// Summary by region
console.log('\n=== SUMMARY BY REGION ===\n');
const regionStats = {};
mallsData.forEach(mall => {
  if (!regionStats[mall.region]) {
    regionStats[mall.region] = { total: 0, scraped: 0, products: 0 };
  }
  regionStats[mall.region].total++;
  if (scrapedMalls.has(mall.id)) {
    regionStats[mall.region].scraped++;
    regionStats[mall.region].products += scrapedMalls.get(mall.id).productCount;
  }
});

Object.entries(regionStats).sort().forEach(([region, stats]) => {
  const percentage = ((stats.scraped / stats.total) * 100).toFixed(1);
  console.log(`${region}: ${stats.scraped}/${stats.total} malls scraped (${percentage}%), ${stats.products} products`);
});

// Recently added malls check
console.log('\n=== RECENTLY ADDED MALLS CHECK ===\n');
const recentlyAdded = [
  '30-농사랑-products.json',
  '50-순천로컬푸드함께가게-products.json',
  '52-장흥몰-products.json',
  '53-기찬들영암몰-products.json',
  '65-영주장날-products.json',
  '88-공룡나라-products.json',
  '89-함양몰-products.json',
  '91-함안몰-products.json',
  '92-김해온몰-products.json',
  '93-이제주몰-products.json'
];

recentlyAdded.forEach(filename => {
  const exists = productFiles.includes(filename);
  console.log(`${filename}: ${exists ? '✓ Found' : '✗ NOT FOUND'}`);
});

// Final summary
console.log('\n=== FINAL SUMMARY ===\n');
console.log(`Total malls in database: ${mallsData.length}`);
console.log(`Total malls scraped: ${totalScrapedMalls}`);
console.log(`Total malls NOT scraped: ${notScraped.length}`);
console.log(`Scraping completion rate: ${((totalScrapedMalls / mallsData.length) * 100).toFixed(1)}%`);
console.log(`Total products collected: ${totalProducts.toLocaleString()}`);
console.log(`Average products per scraped mall: ${Math.round(totalProducts / totalScrapedMalls)}`);

// Export results to JSON
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalMalls: mallsData.length,
    totalScraped: totalScrapedMalls,
    totalNotScraped: notScraped.length,
    completionRate: ((totalScrapedMalls / mallsData.length) * 100).toFixed(1) + '%',
    totalProducts: totalProducts,
    averageProductsPerMall: Math.round(totalProducts / totalScrapedMalls)
  },
  scrapedMalls: Array.from(scrapedMalls.values()).map(({ mall, productCount, filename }) => ({
    id: mall.id,
    name: mall.name,
    region: mall.region,
    productCount,
    filename
  })),
  notScrapedMalls: notScraped.map(mall => ({
    id: mall.id,
    name: mall.name,
    region: mall.region,
    url: mall.url
  })),
  regionStats
};

fs.writeFileSync(
  path.join(__dirname, 'output', 'final-scraping-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\nReport saved to: scripts/output/final-scraping-report.json');