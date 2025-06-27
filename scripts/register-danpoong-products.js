const fs = require('fs');
const path = require('path');

async function registerDanpoongProducts() {
  console.log('📝 Registering 단풍미인 (정읍) products...');
  
  // Read the latest backup file
  const backupFile = 'scripts/danpoong-scraped-backup-1751020817925.json';
  const scrapedProducts = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  
  console.log(`Found ${scrapedProducts.length} scraped products`);
  
  // Load existing products
  const productsPath = 'src/data/products.json';
  let existingProducts = [];
  
  if (fs.existsSync(productsPath)) {
    existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  }
  
  console.log(`Existing products: ${existingProducts.length}`);
  
  // Add new products
  const updatedProducts = [...existingProducts, ...scrapedProducts];
  
  // Save updated products
  fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2));
  
  console.log(`✅ Successfully registered ${scrapedProducts.length} products`);
  console.log(`📊 Total products in database: ${updatedProducts.length}`);
  
  // Show some sample products
  console.log('\n🎯 Sample registered products:');
  scrapedProducts.slice(0, 5).forEach((product, index) => {
    console.log(`${index + 1}. ${product.name} - ${product.price}원 (${product.category})`);
  });
  
  // Show category distribution
  const categories = {};
  scrapedProducts.forEach(product => {
    categories[product.category] = (categories[product.category] || 0) + 1;
  });
  
  console.log('\n📊 Category distribution:');
  Object.entries(categories).forEach(([category, count]) => {
    console.log(`${category}: ${count} products`);
  });
}

registerDanpoongProducts().catch(console.error);