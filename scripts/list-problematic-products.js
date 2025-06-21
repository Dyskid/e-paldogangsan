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

// Group by mall ID
const byMallId = {};
problematicProducts.forEach(product => {
  const mallId = product.mallId || 'unknown';
  if (!byMallId[mallId]) {
    byMallId[mallId] = [];
  }
  byMallId[mallId].push(product.id);
});

// Output results
console.log(`Total problematic products: ${problematicProducts.length}\n`);

Object.entries(byMallId).forEach(([mallId, productIds]) => {
  console.log(`Mall ID: ${mallId}`);
  console.log(`Count: ${productIds.length}`);
  console.log(`Product IDs:`);
  console.log(productIds.join('\n'));
  console.log('\n---\n');
});

// Save to file for reference
const output = {
  total: problematicProducts.length,
  byMallId: byMallId
};

fs.writeFileSync('scripts/output/problematic-mall-products.json', JSON.stringify(output, null, 2));