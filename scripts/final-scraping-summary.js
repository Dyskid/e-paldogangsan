const fs = require('fs');
const path = require('path');

// Load the true scraping status report
const report = JSON.parse(fs.readFileSync(path.join(__dirname, 'output/true-scraping-status.json'), 'utf8'));

console.log('='.repeat(80));
console.log('                       FINAL SCRAPING STATUS SUMMARY');
console.log('='.repeat(80));
console.log();

console.log(`Report Generated: ${new Date(report.timestamp).toLocaleString()}`);
console.log();

console.log('📊 OVERALL STATISTICS');
console.log('-'.repeat(40));
console.log(`Total Malls in Database:    ${report.summary.totalMalls}`);
console.log(`Successfully Scraped:       ${report.summary.totalScraped} (${report.summary.completionRate})`);
console.log(`Not Scraped:               ${report.summary.totalNotScraped}`);
console.log(`Total Products Collected:   ${report.summary.totalProducts.toLocaleString()}`);
console.log(`Average Products per Mall:  ${report.summary.averageProductsPerMall}`);
console.log();

console.log('🏆 TOP MALLS BY PRODUCT COUNT');
console.log('-'.repeat(40));
const topMalls = report.scrapedMalls
  .sort((a, b) => b.productCount - a.productCount)
  .slice(0, 5);

topMalls.forEach((mall, index) => {
  console.log(`${index + 1}. ${mall.name} (${mall.region}): ${mall.productCount} products`);
});
console.log();

console.log('📍 SCRAPING STATUS BY REGION');
console.log('-'.repeat(60));
console.log('Region       Total  Scraped  %       Products   Avg/Mall');
console.log('-'.repeat(60));

Object.entries(report.regionStats)
  .sort((a, b) => b[1].scraped - a[1].scraped || b[1].products - a[1].products)
  .forEach(([region, stats]) => {
    const percentage = stats.total > 0 ? ((stats.scraped / stats.total) * 100).toFixed(1) : '0.0';
    const avgProducts = stats.scraped > 0 ? Math.round(stats.products / stats.scraped) : 0;
    console.log(
      `${region.padEnd(12)} ${stats.total.toString().padStart(5)}  ${stats.scraped.toString().padStart(7)}  ${percentage.padStart(5)}%  ${stats.products.toString().padStart(10)}  ${avgProducts.toString().padStart(9)}`
    );
  });

console.log();

console.log('✅ RECENTLY ADDED MALLS (All Successfully Scraped)');
console.log('-'.repeat(40));
const recentlyAdded = [
  '농사랑', '순천로컬푸드함께가게', '장흥몰 (산들해랑장흥몰)', 
  '기찬들영암몰', '영주장날', '공룡나라 (고성)', 
  '함양몰', '함안몰', '김해온몰', '이제주몰'
];

report.scrapedMalls
  .filter(mall => recentlyAdded.includes(mall.name))
  .forEach(mall => {
    console.log(`✓ ${mall.name}: ${mall.productCount} products`);
  });

console.log();
console.log('📝 COMPLETE LIST OF SCRAPED MALLS');
console.log('-'.repeat(80));
console.log('No.  Mall Name                              Region   Products  File');
console.log('-'.repeat(80));

report.scrapedMalls
  .sort((a, b) => a.name.localeCompare(b.name))
  .forEach((mall, index) => {
    console.log(
      `${(index + 1).toString().padStart(3)}  ${mall.name.padEnd(37)} ${mall.region.padEnd(8)} ${mall.productCount.toString().padStart(8)}  ${mall.filename}`
    );
  });

console.log();
console.log('🔗 NEXT STEPS');
console.log('-'.repeat(40));
console.log('1. Review the 81 malls that were not scraped');
console.log('2. Many may have changed URLs or be temporarily offline');
console.log('3. Consider manual verification of high-priority regions');
console.log('4. Focus on regions with low coverage (강원, 경기, 전북, 충북)');
console.log();

console.log('💾 EXPORT FILES');
console.log('-'.repeat(40));
console.log('- Full report: scripts/output/true-scraping-status.json');
console.log('- Product files: scripts/output/*-products.json');
console.log('- This summary: Run "node scripts/final-scraping-summary.js"');
console.log();

console.log('='.repeat(80));