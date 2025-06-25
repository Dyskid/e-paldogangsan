import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  image: string;
  url: string;
  category: string;
  mall: string;
  region: string;
  tags: string[];
  description?: string;
  inStock: boolean;
}

async function registerJCMallProducts() {
  console.log('🚀 Starting JC Mall product registration...');

  // Read the scraped products
  const jcmallProductsPath = '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/jcmall-products.json';
  const mainProductsPath = '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json';

  if (!fs.existsSync(jcmallProductsPath)) {
    console.error('❌ JC Mall products file not found!');
    return;
  }

  // Read JC Mall products
  const jcmallProducts: Product[] = JSON.parse(fs.readFileSync(jcmallProductsPath, 'utf-8'));
  console.log(`📦 Found ${jcmallProducts.length} JC Mall products to register`);

  // Filter products with valid prices
  const validProducts = jcmallProducts.filter(product => {
    const priceNum = parseInt(product.price.replace(/[^\d]/g, ''));
    return priceNum > 0 && product.title && !product.title.includes('자유결제');
  });

  console.log(`✅ ${validProducts.length} products have valid prices and will be registered`);

  // Read existing products
  let existingProducts: Product[] = [];
  if (fs.existsSync(mainProductsPath)) {
    existingProducts = JSON.parse(fs.readFileSync(mainProductsPath, 'utf-8'));
    console.log(`📋 Found ${existingProducts.length} existing products`);
  }

  // Remove existing JC Mall products
  const filteredProducts = existingProducts.filter(p => !p.id.startsWith('jcmall_'));
  console.log(`🗑️ Removed ${existingProducts.length - filteredProducts.length} existing JC Mall products`);

  // Add new products
  const finalProducts = [...filteredProducts, ...validProducts];
  console.log(`📦 Final product count: ${finalProducts.length}`);

  // Create backup
  const timestamp = Date.now();
  const backupPath = `/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products-backup-${timestamp}.json`;
  if (existingProducts.length > 0) {
    fs.writeFileSync(backupPath, JSON.stringify(existingProducts, null, 2));
    console.log(`💾 Backup created: products-backup-${timestamp}.json`);
  }

  // Write updated products
  fs.writeFileSync(mainProductsPath, JSON.stringify(finalProducts, null, 2));
  console.log(`✅ Successfully registered ${validProducts.length} JC Mall products`);

  // Create registration summary
  const summary = {
    timestamp: new Date().toISOString(),
    mall: '진천몰',
    region: '충청북도',
    totalScraped: jcmallProducts.length,
    totalRegistered: validProducts.length,
    categories: [...new Set(validProducts.map(p => p.category))],
    priceRange: {
      min: Math.min(...validProducts.map(p => parseInt(p.price.replace(/[^\d]/g, '')))),
      max: Math.max(...validProducts.map(p => parseInt(p.price.replace(/[^\d]/g, ''))))
    },
    averagePrice: Math.round(validProducts.reduce((sum, p) => sum + parseInt(p.price.replace(/[^\d]/g, '')), 0) / validProducts.length),
    sampleProducts: validProducts.slice(0, 5).map(p => ({
      title: p.title,
      price: p.price,
      category: p.category
    }))
  };

  const summaryPath = '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/jcmall-registration-summary.json';
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📊 Registration summary saved to: jcmall-registration-summary.json`);

  console.log('\n📊 Registration Summary:');
  console.log(`🏪 Mall: ${summary.mall}`);
  console.log(`📍 Region: ${summary.region}`);
  console.log(`📦 Products registered: ${summary.totalRegistered}`);
  console.log(`🏷️ Categories: ${summary.categories.join(', ')}`);
  console.log(`💰 Price range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
  console.log(`📈 Average price: ${summary.averagePrice.toLocaleString()}원`);
  
  console.log('\n🔝 Sample registered products:');
  summary.sampleProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.title} - ${product.price} (${product.category})`);
  });

  return summary;
}

// Run the registration
registerJCMallProducts().catch(console.error);