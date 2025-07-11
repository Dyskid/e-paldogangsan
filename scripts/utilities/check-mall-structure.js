const fs = require('fs');

// Read products.json
const products = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

// Find products with problematic mall structure
const problematicProducts = products.filter(product => {
  return !product.mall || 
         !product.mall.mallId || 
         product.mall.mallId === '' ||
         product.mall.mallId === null ||
         product.mall.mallId === undefined;
});

console.log(`Total products: ${products.length}`);
console.log(`Products with problematic mall structure: ${problematicProducts.length}\n`);

// Show first 10 problematic products
if (problematicProducts.length > 0) {
  console.log('First 10 problematic products:');
  problematicProducts.slice(0, 10).forEach(product => {
    console.log(`ID: ${product.id}`);
    console.log(`Title: ${product.title}`);
    console.log(`Mall: ${JSON.stringify(product.mall)}`);
    console.log('---');
  });
}

// Group by mall structure type
const mallTypes = {};
problematicProducts.forEach(product => {
  const mallStr = JSON.stringify(product.mall);
  if (!mallTypes[mallStr]) {
    mallTypes[mallStr] = [];
  }
  mallTypes[mallStr].push(product.id);
});

console.log('\nGrouped by mall structure:');
Object.entries(mallTypes).forEach(([mallStr, ids]) => {
  console.log(`\nMall structure: ${mallStr}`);
  console.log(`Count: ${ids.length}`);
  console.log(`Sample IDs: ${ids.slice(0, 5).join(', ')}${ids.length > 5 ? '...' : ''}`);
});