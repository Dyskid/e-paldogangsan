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

// Check a few problematic products in detail
console.log('Detailed check of problematic products:\n');

problematicProducts.slice(0, 5).forEach(product => {
  console.log(`Product ID: ${product.id}`);
  console.log(`Title: ${product.title}`);
  console.log(`Full product object keys: ${Object.keys(product).join(', ')}`);
  
  // Check if there's any mall-related field
  const mallRelatedFields = Object.keys(product).filter(key => 
    key.toLowerCase().includes('mall') || 
    key.toLowerCase().includes('source') ||
    key.toLowerCase().includes('store')
  );
  
  if (mallRelatedFields.length > 0) {
    console.log(`Mall-related fields found: ${mallRelatedFields.join(', ')}`);
    mallRelatedFields.forEach(field => {
      console.log(`  ${field}: ${JSON.stringify(product[field])}`);
    });
  }
  
  console.log('---\n');
});

// Check if these IDs have a pattern
const idPrefixes = {};
problematicProducts.forEach(product => {
  const prefix = product.id.split('-')[0];
  if (!idPrefixes[prefix]) {
    idPrefixes[prefix] = 0;
  }
  idPrefixes[prefix]++;
});

console.log('\nID prefixes of problematic products:');
Object.entries(idPrefixes).forEach(([prefix, count]) => {
  console.log(`${prefix}: ${count} products`);
});