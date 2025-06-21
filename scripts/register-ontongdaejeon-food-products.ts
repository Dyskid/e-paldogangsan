import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  mallId: string;
  mallName: string;
  region: string;
  tags: string[];
  isFood?: boolean;
}

function registerOntongDaejeonFoodProducts() {
  console.log('📦 Starting Ontong Daejeon food products registration...');

  // Read the scraped food products
  const foodProductsPath = './scripts/output/ontongdaejeon-food-products.json';
  if (!existsSync(foodProductsPath)) {
    console.error('❌ Food products file not found!');
    return;
  }

  const foodProducts: Product[] = JSON.parse(readFileSync(foodProductsPath, 'utf-8'));
  console.log(`📦 Found ${foodProducts.length} food products to register`);

  // Read existing products database
  const productsPath = './src/data/products.json';
  let existingProducts: Product[] = [];
  
  if (existsSync(productsPath)) {
    existingProducts = JSON.parse(readFileSync(productsPath, 'utf-8'));
    console.log(`📂 Found ${existingProducts.length} existing products in database`);
  }

  // Create a map of existing product IDs for quick lookup
  const existingIds = new Set(existingProducts.map(p => p.id));

  // Filter out products that already exist
  const newProducts = foodProducts.filter(p => !existingIds.has(p.id));
  const updatedProducts = foodProducts.filter(p => existingIds.has(p.id));

  console.log(`🆕 ${newProducts.length} new products to add`);
  console.log(`🔄 ${updatedProducts.length} existing products to update`);

  // Update existing products
  if (updatedProducts.length > 0) {
    existingProducts = existingProducts.map(existing => {
      const update = updatedProducts.find(u => u.id === existing.id);
      return update || existing;
    });
  }

  // Add new products
  const allProducts = [...existingProducts, ...newProducts];

  // Sort products by mall and title
  allProducts.sort((a, b) => {
    if (!a || !b) return 0;
    if (a.mallId !== b.mallId) {
      return (a.mallId || '').localeCompare(b.mallId || '');
    }
    return (a.title || '').localeCompare(b.title || '');
  });

  // Save updated products
  writeFileSync(productsPath, JSON.stringify(allProducts, null, 2));

  // Create registration summary
  const summary = {
    timestamp: new Date().toISOString(),
    mall: 'ontongdaejeon',
    mallName: '온통대전몰 대전사랑몰',
    totalFoodProducts: foodProducts.length,
    newProducts: newProducts.length,
    updatedProducts: updatedProducts.length,
    totalInDatabase: allProducts.length,
    productsWithPrices: foodProducts.filter(p => p.price).length,
    categories: [...new Set(foodProducts.map(p => p.category))],
    sampleProducts: foodProducts.slice(0, 5).map(p => ({
      title: p.title,
      price: p.price || '가격정보없음',
      category: p.category
    }))
  };

  writeFileSync('./scripts/output/ontongdaejeon-food-registration-summary.json', JSON.stringify(summary, null, 2));

  console.log('\n✅ Registration completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Total food products: ${summary.totalFoodProducts}`);
  console.log(`   - New products added: ${summary.newProducts}`);
  console.log(`   - Products updated: ${summary.updatedProducts}`);
  console.log(`   - Products with prices: ${summary.productsWithPrices}`);
  console.log(`   - Total in database: ${summary.totalInDatabase}`);
  
  if (summary.sampleProducts.length > 0) {
    console.log('\n📦 Sample registered products:');
    summary.sampleProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} - ${p.price}`);
    });
  }
}

// Run the registration
registerOntongDaejeonFoodProducts();