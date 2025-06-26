const fs = require('fs');
const path = require('path');

// Read products data
const productsFile = path.join(__dirname, 'src', 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));

console.log('🔍 Analyzing Product Name Display Issues\n');

// Group products by mall
const productsByMall = {};
products.forEach(product => {
  const mallName = product.mallName || 'Unknown';
  if (!productsByMall[mallName]) {
    productsByMall[mallName] = [];
  }
  productsByMall[mallName].push(product);
});

// Analyze each mall
Object.keys(productsByMall).sort().forEach(mallName => {
  const mallProducts = productsByMall[mallName];
  
  // Count name field issues
  const missingNames = mallProducts.filter(p => !p.name || p.name === '');
  const hasTitle = mallProducts.filter(p => p.title && p.title !== '');
  const hasBothTitleAndName = mallProducts.filter(p => p.title && p.name && p.title !== '' && p.name !== '');
  
  console.log(`📊 ${mallName}:`);
  console.log(`   Total products: ${mallProducts.length}`);
  console.log(`   Missing name field: ${missingNames.length}`);
  console.log(`   Has title field: ${hasTitle.length}`);
  console.log(`   Has both title and name: ${hasBothTitleAndName.length}`);
  
  // Show sample structure
  if (mallProducts.length > 0) {
    const sample = mallProducts[0];
    console.log(`   Sample structure:`);
    console.log(`     - id: "${sample.id}"`);
    console.log(`     - name: "${sample.name || 'MISSING'}" (${typeof sample.name})`);
    console.log(`     - title: "${sample.title || 'MISSING'}" (${typeof sample.title})`);
    console.log(`     - price: "${sample.price}" (${typeof sample.price})`);
    console.log(`     - mallId: "${sample.mallId}"`);
    console.log(`     - mallName: "${sample.mallName}"`);
  }
  
  // Flag problematic malls
  if (missingNames.length > 0) {
    console.log(`   ❌ ISSUE: ${missingNames.length} products missing name field`);
    if (missingNames.length <= 3) {
      missingNames.forEach(p => {
        console.log(`      - ${p.id}: title="${p.title || 'NONE'}" name="${p.name || 'NONE'}"`);
      });
    }
  } else {
    console.log(`   ✅ All products have name field`);
  }
  
  console.log('');
});

// Summary of issues
console.log('\n📋 SUMMARY:');
const problematicMalls = Object.keys(productsByMall).filter(mallName => {
  const mallProducts = productsByMall[mallName];
  const missingNames = mallProducts.filter(p => !p.name || p.name === '');
  return missingNames.length > 0;
});

console.log(`Malls with product name issues: ${problematicMalls.length}`);
problematicMalls.forEach(mallName => {
  const mallProducts = productsByMall[mallName];
  const missingNames = mallProducts.filter(p => !p.name || p.name === '');
  console.log(`  - ${mallName}: ${missingNames.length}/${mallProducts.length} products missing names`);
});

const workingMalls = Object.keys(productsByMall).filter(mallName => {
  const mallProducts = productsByMall[mallName];
  const missingNames = mallProducts.filter(p => !p.name || p.name === '');
  return missingNames.length === 0;
});

console.log(`\nMalls with working product names: ${workingMalls.length}`);
workingMalls.slice(0, 5).forEach(mallName => {
  console.log(`  ✅ ${mallName}`);
});