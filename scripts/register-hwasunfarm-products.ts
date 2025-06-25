import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  category: string;
  mall: string;
  mallId: string;
}

async function registerHwasunfarmProducts() {
  const timestamp = Date.now();
  console.log('Starting 화순팜 product registration...');

  // Read scraped products
  const productsFile = './scripts/output/hwasunfarm-products.json';
  if (!fs.existsSync(productsFile)) {
    console.error('Products file not found:', productsFile);
    return;
  }

  const scrapedProducts: Product[] = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
  console.log(`Found ${scrapedProducts.length} scraped products`);

  // Read existing products database
  const dbPath = './src/data/products.json';
  let existingProducts: Product[] = [];
  
  if (fs.existsSync(dbPath)) {
    existingProducts = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    console.log(`Found ${existingProducts.length} existing products in database`);
  }

  // Create backup
  const backupPath = `./src/data/products-backup-${timestamp}.json`;
  if (existingProducts.length > 0) {
    fs.writeFileSync(backupPath, JSON.stringify(existingProducts, null, 2));
    console.log(`Created backup at: ${backupPath}`);
  }

  // Filter products with valid prices
  const validProducts = scrapedProducts.filter(product => {
    if (!product.price || !product.price.includes('원')) {
      console.log(`Skipping product without valid price: ${product.title}`);
      return false;
    }
    return true;
  });

  console.log(`${validProducts.length} products have valid prices`);

  // Remove any existing 화순팜 products to avoid duplicates
  const nonHwasunfarmProducts = existingProducts.filter(p => p.mallId !== 'hwasunfarm');
  console.log(`Removed ${existingProducts.length - nonHwasunfarmProducts.length} existing 화순팜 products`);

  // Add new products
  const updatedProducts = [...nonHwasunfarmProducts, ...validProducts];
  console.log(`Total products after registration: ${updatedProducts.length}`);

  // Save updated database
  fs.writeFileSync(dbPath, JSON.stringify(updatedProducts, null, 2));

  // Create registration summary
  const summary = {
    timestamp,
    mall: '화순팜',
    mallId: 'hwasunfarm',
    totalScraped: scrapedProducts.length,
    validProducts: validProducts.length,
    registered: validProducts.length,
    previousTotal: existingProducts.length,
    newTotal: updatedProducts.length,
    backup: backupPath,
    categoryCounts: validProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    sampleRegistered: validProducts.slice(0, 3).map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category
    }))
  };

  const summaryPath = './scripts/output/hwasunfarm-registration-summary.json';
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('\n=== REGISTRATION SUMMARY ===');
  console.log(`Mall: ${summary.mall}`);
  console.log(`Products scraped: ${summary.totalScraped}`);
  console.log(`Products with valid prices: ${summary.validProducts}`);
  console.log(`Products registered: ${summary.registered}`);
  console.log(`Database size: ${summary.previousTotal} → ${summary.newTotal}`);
  console.log(`Backup created: ${summary.backup}`);
  console.log('\nCategory breakdown:');
  Object.entries(summary.categoryCounts).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} products`);
  });
  console.log(`\nSummary saved: ${summaryPath}`);

  return summary;
}

if (require.main === module) {
  registerHwasunfarmProducts().catch(console.error);
}

export { registerHwasunfarmProducts };