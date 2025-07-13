const fs = require('fs');
const path = require('path');

// Read mall data
const mallsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/malls/malls.json'), 'utf8'));

// Create a map of id to engname
const idToEngname = {};
mallsData.forEach(mall => {
  idToEngname[mall.id] = mall.engname;
});

// Products directory path
const productsDir = path.join(__dirname, '../src/data/products');

// Ensure products directory exists
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Generate product files for each mall
mallsData.forEach(mall => {
  const filename = `${mall.id}-${mall.engname}-products.json`;
  const filepath = path.join(productsDir, filename);
  
  // Create empty products array structure
  const productData = {
    mallId: mall.id,
    mallName: mall.name,
    mallEngName: mall.engname,
    url: mall.url,
    region: mall.region,
    lastUpdated: new Date().toISOString(),
    totalProducts: 0,
    products: []
  };
  
  // Write the file
  fs.writeFileSync(filepath, JSON.stringify(productData, null, 2));
  console.log(`Created: ${filename}`);
});

console.log(`\nTotal files created: ${mallsData.length}`);