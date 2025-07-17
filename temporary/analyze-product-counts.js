const fs = require('fs');
const path = require('path');

// Function to count products in a JSON file
function countProducts(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const products = JSON.parse(data);
    return Array.isArray(products) ? products.length : 0;
  } catch (error) {
    return 0;
  }
}

// Main function to analyze all product files
function analyzeProductCounts() {
  const productsDir = path.join(process.cwd(), 'data', 'products');
  const files = fs.readdirSync(productsDir).filter(file => file.endsWith('-products.json'));
  
  const mallCounts = {};
  
  // Focus on main mall files (exclude variations)
  const mainMallPatterns = [
    '1-we-mall-products.json',
    '3-gwangju-kimchi-mall-products.json',
    '4-daejeon-love-mall-products.json',
    '7-gwangmyeong-value-mall-products.json',
    '10-gangwon-the-mall-products.json'
  ];
  
  console.log('Product counts for main malls:\n');
  
  mainMallPatterns.forEach(pattern => {
    const filePath = path.join(productsDir, pattern);
    if (fs.existsSync(filePath)) {
      const count = countProducts(filePath);
      console.log(`${pattern}: ${count} products`);
      
      // Extract mall info
      const match = pattern.match(/(\d+)-(.+)-products\.json/);
      if (match) {
        mallCounts[match[1]] = {
          id: parseInt(match[1]),
          engName: match[2],
          count: count
        };
      }
    }
  });
  
  return mallCounts;
}

// Run analysis
const mallCounts = analyzeProductCounts();
console.log('\nSummary:', JSON.stringify(mallCounts, null, 2));