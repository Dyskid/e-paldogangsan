import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  mallId: string;
  mallName: string;
  url: string;
}

async function registerCgmallProducts() {
  console.log('📝 Starting registration of 칠곡몰 products...\n');

  // Read the scraped products
  const scrapedProductsPath = path.join(__dirname, 'output/cgmall-products.json');
  if (!fs.existsSync(scrapedProductsPath)) {
    throw new Error('Scraped products file not found. Please run the scraper first.');
  }

  const scrapedProducts: Product[] = JSON.parse(fs.readFileSync(scrapedProductsPath, 'utf-8'));
  console.log(`📦 Found ${scrapedProducts.length} scraped products`);

  // Read the existing products database
  const productsPath = path.join(__dirname, '../src/data/products.json');
  let existingProducts: Product[] = [];
  
  if (fs.existsSync(productsPath)) {
    existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    console.log(`📚 Current database has ${existingProducts.length} products`);
  }

  // Create backup
  const backupPath = path.join(__dirname, `../src/data/products-backup-${Date.now()}.json`);
  if (existingProducts.length > 0) {
    fs.writeFileSync(backupPath, JSON.stringify(existingProducts, null, 2));
    console.log(`💾 Backup created: ${backupPath}`);
  }

  // Filter products to add (only those with valid prices)
  const validProducts = scrapedProducts.filter(product => {
    const hasValidPrice = product.price && 
                         product.price !== '0원' && 
                         !product.price.match(/^0원$/) &&
                         product.price.match(/[\d,]+원$/);
    
    if (!hasValidPrice) {
      console.log(`⚠ Skipping product with invalid price: ${product.name} - ${product.price}`);
    }
    return hasValidPrice;
  });

  console.log(`✅ ${validProducts.length} products have valid prices and will be registered`);

  // Check for duplicates and merge
  const newProducts = [...existingProducts];
  let addedCount = 0;

  for (const product of validProducts) {
    // Check if product already exists (by ID or URL)
    const existingIndex = newProducts.findIndex(p => 
      p.id === product.id || p.url === product.url
    );

    if (existingIndex >= 0) {
      // Update existing product
      newProducts[existingIndex] = product;
      console.log(`🔄 Updated: ${product.name}`);
    } else {
      // Add new product
      newProducts.push(product);
      addedCount++;
      console.log(`➕ Added: ${product.name} - ${product.price}`);
    }
  }

  // Save updated products database
  fs.writeFileSync(productsPath, JSON.stringify(newProducts, null, 2));

  console.log('\n📊 Registration Summary:');
  console.log('========================');
  console.log(`📦 Total products before: ${existingProducts.length}`);
  console.log(`➕ Products added: ${addedCount}`);
  console.log(`📦 Total products after: ${newProducts.length}`);

  // Save registration summary
  const summary = {
    mallId: 'cgmall',
    mallName: '칠곡몰',
    timestamp: new Date().toISOString(),
    totalProductsBefore: existingProducts.length,
    productsAdded: addedCount,
    totalProductsAfter: newProducts.length,
    productsRemoved: 0,
    backupFile: backupPath
  };

  const summaryPath = path.join(__dirname, 'output/cgmall-registration-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📋 Registration summary saved: ${summaryPath}`);

  // Show sample of registered products
  console.log('\n🔍 Sample Registered Products:');
  console.log('==============================');
  const cgmallProducts = newProducts.filter(p => p.mallId === 'cgmall');
  cgmallProducts.slice(0, 5).forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   💰 ${product.price}`);
    console.log(`   🔗 ${product.url}`);
    console.log();
  });

  return summary;
}

// Run registration
registerCgmallProducts()
  .then((summary) => {
    console.log(`\n✅ Successfully registered ${summary.productsAdded} products from 칠곡몰!`);
    console.log(`📊 Total products in database: ${summary.totalProductsAfter}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Registration failed:', error);
    process.exit(1);
  });