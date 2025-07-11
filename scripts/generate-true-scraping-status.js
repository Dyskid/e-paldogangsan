const fs = require('fs');
const path = require('path');

// Load malls data
const mallsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/malls.json'), 'utf8'));

// Get all product files from output directory
const outputDir = path.join(__dirname, 'output');
const productFiles = fs.readdirSync(outputDir)
  .filter(file => file.endsWith('-products.json'))
  .sort((a, b) => {
    const numA = parseInt(a.split('-')[0]) || 999;
    const numB = parseInt(b.split('-')[0]) || 999;
    return numA - numB;
  });

console.log('=== TRUE SCRAPING STATUS REPORT ===\n');
console.log(`Total malls in database: ${mallsData.length}`);
console.log(`Total product files found: ${productFiles.length}\n`);

// Create maps for tracking
const scrapedMalls = new Map();
const mallsByName = new Map();
const mallsById = new Map();

// Build mall lookup maps
mallsData.forEach(mall => {
  mallsByName.set(mall.name, mall);
  mallsById.set(mall.id, mall);
});

// Track which product files match which malls
const matchedFiles = [];
const unmatchedFiles = [];

// Process Korean named files (these are the most reliable)
const koreanFiles = productFiles.filter(file => /[\u3131-\uD79D]/.test(file));
console.log(`Korean-named product files: ${koreanFiles.length}\n`);

koreanFiles.forEach(file => {
  const filePath = path.join(outputDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const productCount = data.products ? data.products.length : 0;
  
  // Extract mall name from filename
  const mallNameFromFile = file.replace(/-products\.json$/, '').replace(/^\d+-/, '');
  
  // Find matching mall
  let mall = mallsByName.get(mallNameFromFile);
  
  // If not found, try to find by partial match
  if (!mall) {
    for (const [name, m] of mallsByName) {
      // Check if the file name is part of the mall name or vice versa
      if (name.includes(mallNameFromFile) || 
          mallNameFromFile.includes(name.split(' ')[0]) ||
          name.replace(/\s*\([^)]*\)/g, '').trim() === mallNameFromFile) {
        mall = m;
        break;
      }
    }
  }
  
  if (mall) {
    scrapedMalls.set(mall.id, { mall, productCount, filename: file });
    matchedFiles.push({ file, mall, productCount });
  } else {
    unmatchedFiles.push({ file, productCount });
  }
});

// Check the specific files mentioned
console.log('=== VERIFICATION OF RECENTLY ADDED MALLS ===\n');
const recentlyAdded = [
  { file: '30-농사랑-products.json', expectedMall: '농사랑' },
  { file: '50-순천로컬푸드함께가게-products.json', expectedMall: '순천로컬푸드함께가게' },
  { file: '52-장흥몰-products.json', expectedMall: '장흥몰 (산들해랑장흥몰)' },
  { file: '53-기찬들영암몰-products.json', expectedMall: '기찬들영암몰' },
  { file: '65-영주장날-products.json', expectedMall: '영주장날' },
  { file: '88-공룡나라-products.json', expectedMall: '공룡나라 (고성)' },
  { file: '89-함양몰-products.json', expectedMall: '함양몰' },
  { file: '91-함안몰-products.json', expectedMall: '함안몰' },
  { file: '92-김해온몰-products.json', expectedMall: '김해온몰' },
  { file: '93-이제주몰-products.json', expectedMall: '이제주몰' }
];

recentlyAdded.forEach(({ file, expectedMall }) => {
  const exists = productFiles.includes(file);
  if (exists) {
    const filePath = path.join(outputDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const productCount = data.products ? data.products.length : 0;
    console.log(`✓ ${file}: ${productCount} products`);
  } else {
    console.log(`✗ ${file}: NOT FOUND`);
  }
});

// List successfully scraped malls
console.log('\n=== SUCCESSFULLY SCRAPED MALLS ===\n');
let totalProducts = 0;
matchedFiles.forEach(({ file, mall, productCount }, index) => {
  totalProducts += productCount;
  console.log(`${index + 1}. ${mall.name} (${mall.region})`);
  console.log(`   - File: ${file}`);
  console.log(`   - Products: ${productCount}`);
  console.log(`   - URL: ${mall.url}`);
});

// Find malls that weren't scraped
console.log('\n=== MALLS NOT SCRAPED ===\n');
const notScraped = mallsData.filter(mall => !scrapedMalls.has(mall.id));
notScraped.forEach((mall, index) => {
  console.log(`${index + 1}. ${mall.name} (${mall.region}) - ${mall.url}`);
});

// Summary by region
console.log('\n=== SUMMARY BY REGION ===\n');
const regionStats = {};
mallsData.forEach(mall => {
  if (!regionStats[mall.region]) {
    regionStats[mall.region] = { total: 0, scraped: 0, products: 0, malls: [] };
  }
  regionStats[mall.region].total++;
  if (scrapedMalls.has(mall.id)) {
    regionStats[mall.region].scraped++;
    regionStats[mall.region].products += scrapedMalls.get(mall.id).productCount;
    regionStats[mall.region].malls.push(mall.name);
  }
});

Object.entries(regionStats).sort().forEach(([region, stats]) => {
  const percentage = ((stats.scraped / stats.total) * 100).toFixed(1);
  console.log(`${region}: ${stats.scraped}/${stats.total} malls scraped (${percentage}%)`);
  console.log(`   - Total products: ${stats.products}`);
  if (stats.malls.length > 0) {
    console.log(`   - Scraped: ${stats.malls.join(', ')}`);
  }
  console.log();
});

// Final summary
console.log('=== FINAL SUMMARY ===\n');
console.log(`Total malls in database: ${mallsData.length}`);
console.log(`Total malls successfully scraped: ${scrapedMalls.size}`);
console.log(`Total malls NOT scraped: ${notScraped.length}`);
console.log(`Scraping completion rate: ${((scrapedMalls.size / mallsData.length) * 100).toFixed(1)}%`);
console.log(`Total products collected: ${totalProducts.toLocaleString()}`);
console.log(`Average products per scraped mall: ${Math.round(totalProducts / scrapedMalls.size)}`);

// Additional files that don't match
console.log(`\nAdditional product files (test/duplicate/unmatched): ${productFiles.length - matchedFiles.length}`);

// Export clean results
const cleanReport = {
  timestamp: new Date().toISOString(),
  summary: {
    totalMalls: mallsData.length,
    totalScraped: scrapedMalls.size,
    totalNotScraped: notScraped.length,
    completionRate: ((scrapedMalls.size / mallsData.length) * 100).toFixed(1) + '%',
    totalProducts: totalProducts,
    averageProductsPerMall: Math.round(totalProducts / scrapedMalls.size)
  },
  scrapedMalls: Array.from(scrapedMalls.values()).map(({ mall, productCount, filename }) => ({
    id: mall.id,
    name: mall.name,
    region: mall.region,
    productCount,
    filename,
    url: mall.url
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
  path.join(__dirname, 'output', 'true-scraping-status.json'),
  JSON.stringify(cleanReport, null, 2)
);

console.log('\nClean report saved to: scripts/output/true-scraping-status.json');