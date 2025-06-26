const fs = require('fs');
const path = require('path');

// Simulate the API route logic
const PRODUCTS_FILE = path.join(__dirname, '../src/data/products.json');

async function getProducts() {
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products file:', error);
    return [];
  }
}

async function testGmsocialProducts() {
  const products = await getProducts();
  
  // Filter for 광명가치몰 products
  const gmsocialProducts = products.filter(p => {
    const productMallId = p.mall?.mallId || p.mallId;
    return productMallId === 'gmsocial';
  });
  
  console.log(`Total products: ${products.length}`);
  console.log(`광명가치몰 products: ${gmsocialProducts.length}`);
  
  // Check for missing names
  const missingNames = gmsocialProducts.filter(p => !p.name || p.name.trim() === '');
  console.log(`광명가치몰 products missing names: ${missingNames.length}`);
  
  if (missingNames.length > 0) {
    console.log('\nProducts missing names:');
    missingNames.forEach((p, i) => {
      console.log(`${i+1}. ID: ${p.id}, Title: "${p.title}", Name: "${p.name}"`);
    });
  }
  
  // Show first 3 products with names
  const withNames = gmsocialProducts.filter(p => p.name && p.name.trim() !== '');
  console.log(`\nFirst 3 광명가치몰 products with names:`);
  withNames.slice(0, 3).forEach((p, i) => {
    console.log(`${i+1}. ${p.name} (${p.id})`);
  });
}

testGmsocialProducts();