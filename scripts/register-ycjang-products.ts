import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  mallId: string;
  mallName: string;
  url: string;
}

async function registerYcjangProducts() {
  console.log('Registering 예천장터 products...');
  
  // Load scraped products
  const scrapedProductsPath = path.join(__dirname, 'output', 'ycjang-products.json');
  if (!fs.existsSync(scrapedProductsPath)) {
    throw new Error(`Scraped products file not found: ${scrapedProductsPath}`);
  }
  
  const scrapedProducts: Product[] = JSON.parse(fs.readFileSync(scrapedProductsPath, 'utf-8'));
  console.log(`Found ${scrapedProducts.length} scraped products`);
  
  // Load existing products
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  let existingProducts: Product[] = [];
  
  if (fs.existsSync(productsPath)) {
    existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  }
  
  console.log(`Found ${existingProducts.length} existing products`);
  
  // Filter products with valid prices
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
  
  console.log(`${validProducts.length} products have valid prices`);
  
  // Remove existing ycjang products to avoid duplicates
  const filteredExisting = existingProducts.filter(p => p.mallId !== 'ycjang');
  console.log(`Removed ${existingProducts.length - filteredExisting.length} existing ycjang products`);
  
  // Add new products
  const newProducts = [...filteredExisting, ...validProducts];
  
  // Create backup
  const backupPath = path.join(__dirname, '..', 'src', 'data', `products-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(existingProducts, null, 2));
  console.log(`✅ Backup created: ${backupPath}`);
  
  // Save updated products
  fs.writeFileSync(productsPath, JSON.stringify(newProducts, null, 2));
  
  console.log('\n=== Registration Summary ===');
  console.log(`Total products before: ${existingProducts.length}`);
  console.log(`Products added: ${validProducts.length}`);
  console.log(`Total products after: ${newProducts.length}`);
  console.log(`Mall: 예천장터 (ycjang)`);
  
  // Save summary
  const summary = {
    mallId: 'ycjang',
    mallName: '예천장터',
    timestamp: new Date().toISOString(),
    totalProductsBefore: existingProducts.length,
    productsAdded: validProducts.length,
    totalProductsAfter: newProducts.length,
    productsRemoved: existingProducts.length - filteredExisting.length,
    backupFile: backupPath
  };
  
  const summaryPath = path.join(__dirname, 'output', 'ycjang-registration-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📊 Registration summary saved: ${summaryPath}`);
  
  return summary;
}

if (require.main === module) {
  registerYcjangProducts().catch(console.error);
}

export { registerYcjangProducts };