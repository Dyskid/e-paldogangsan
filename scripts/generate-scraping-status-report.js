const fs = require('fs');
const path = require('path');

// Read malls.json
const mallsPath = path.join(__dirname, '../assets/malls.json');
const malls = JSON.parse(fs.readFileSync(mallsPath, 'utf8'));

// Get all scraped mall IDs from the output directory
const outputDir = path.join(__dirname, 'output');
const scrapedMallIds = new Set();

// Read all files in output directory
const files = fs.readdirSync(outputDir);
files.forEach(file => {
  // Match pattern: {id}-{engname}-products.json
  const match = file.match(/^(\d+)-.*-products\.json$/);
  if (match) {
    scrapedMallIds.add(parseInt(match[1]));
  }
});

// Create report
const report = {
  report_date: new Date().toISOString().split('T')[0],
  total_malls: malls.length,
  scraped_malls: scrapedMallIds.size,
  unscraped_malls: malls.length - scrapedMallIds.size,
  scraping_status: {
    scraped: [],
    unscraped: []
  },
  mall_details: []
};

// Process each mall
malls.forEach(mall => {
  const isScraped = scrapedMallIds.has(mall.id);
  const mallDetail = {
    id: mall.id,
    engname: mall.engname,
    name: mall.name,
    url: mall.url,
    region: mall.region,
    scraped: isScraped,
    products_file: isScraped ? `${mall.id}-${mall.engname}-products.json` : null
  };
  
  report.mall_details.push(mallDetail);
  
  if (isScraped) {
    report.scraping_status.scraped.push({
      id: mall.id,
      name: mall.name,
      region: mall.region
    });
  } else {
    report.scraping_status.unscraped.push({
      id: mall.id,
      name: mall.name,
      region: mall.region,
      url: mall.url
    });
  }
});

// Sort the arrays
report.scraping_status.scraped.sort((a, b) => a.id - b.id);
report.scraping_status.unscraped.sort((a, b) => a.id - b.id);
report.mall_details.sort((a, b) => a.id - b.id);

// Add regional summary
const regionalSummary = {};
malls.forEach(mall => {
  if (!regionalSummary[mall.region]) {
    regionalSummary[mall.region] = {
      total: 0,
      scraped: 0,
      unscraped: 0
    };
  }
  regionalSummary[mall.region].total++;
  if (scrapedMallIds.has(mall.id)) {
    regionalSummary[mall.region].scraped++;
  } else {
    regionalSummary[mall.region].unscraped++;
  }
});

report.regional_summary = regionalSummary;

// Write report
const reportPath = path.join(__dirname, 'mall-scraping-status-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Create summary text
const summary = `
Mall Scraping Status Report
Generated: ${report.report_date}

OVERALL STATUS:
- Total Malls: ${report.total_malls}
- Scraped: ${report.scraped_malls} (${((report.scraped_malls / report.total_malls) * 100).toFixed(1)}%)
- Unscraped: ${report.unscraped_malls} (${((report.unscraped_malls / report.total_malls) * 100).toFixed(1)}%)

REGIONAL BREAKDOWN:
${Object.entries(regionalSummary)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([region, stats]) => 
    `- ${region}: ${stats.scraped}/${stats.total} scraped (${((stats.scraped / stats.total) * 100).toFixed(1)}%)`
  ).join('\n')}

UNSCRAPED MALLS (${report.unscraped_malls}):
${report.scraping_status.unscraped
  .map(mall => `- [${mall.id}] ${mall.name} (${mall.region})`)
  .join('\n')}
`;

console.log(summary);

// Also save summary as text file
fs.writeFileSync(path.join(__dirname, 'mall-scraping-status-summary.txt'), summary);