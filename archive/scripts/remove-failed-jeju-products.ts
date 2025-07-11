import fs from 'fs/promises';
import path from 'path';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  mallId: string;
  mallName: string;
  category: string;
  tags: string[];
  inStock: boolean;
  lastUpdated: string;
  createdAt: string;
}

async function removeFailedJejuProducts() {
  console.log('🗑️ Removing Jeju mall products with failed price updates...');
  
  // Read current products
  const productsPath = path.join(__dirname, '../src/data/products.json');
  const productsData = await fs.readFile(productsPath, 'utf-8');
  const products: Product[] = JSON.parse(productsData);
  
  // Find Jeju mall products with bad prices (failed updates)
  const jejuProductsWithBadPrices = products.filter(p => 
    p.mallId === 'mall_100_이제주몰' && (p.price === '0' || p.price === '가격문의')
  );
  
  // Filter out the products with bad prices
  const cleanedProducts = products.filter(p => 
    !(p.mallId === 'mall_100_이제주몰' && (p.price === '0' || p.price === '가격문의'))
  );
  
  console.log(`📦 Found ${jejuProductsWithBadPrices.length} Jeju products with bad prices`);
  console.log('📋 Products to be removed:');
  jejuProductsWithBadPrices.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
  });
  
  // Save the cleaned products
  await fs.writeFile(productsPath, JSON.stringify(cleanedProducts, null, 2));
  
  // Create summary
  const summary = {
    removedProducts: jejuProductsWithBadPrices.length,
    totalProductsBefore: products.length,
    totalProductsAfter: cleanedProducts.length,
    removedAt: new Date().toISOString(),
    removedProductsList: jejuProductsWithBadPrices.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      productUrl: p.productUrl
    })),
    remainingJejuProducts: cleanedProducts.filter(p => p.mallId === 'mall_100_이제주몰').length
  };
  
  const summaryPath = path.join(__dirname, 'output/jeju-products-removal-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n✅ Removal complete!');
  console.log(`📊 Removed: ${summary.removedProducts} products`);
  console.log(`📦 Total products: ${summary.totalProductsBefore} → ${summary.totalProductsAfter}`);
  console.log(`🏪 Remaining Jeju products: ${summary.remainingJejuProducts}`);
  console.log(`📁 Updated products.json`);
  console.log(`📋 Summary saved to: ${summaryPath}`);
}

// Run the removal
removeFailedJejuProducts().catch(console.error);