import * as fs from 'fs';
import * as path from 'path';
import { Product } from '../src/types';

async function verifyEjejuProducts() {
  console.log('Verifying 이제주몰 product registration...\n');
  
  // Load products
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  
  // Filter 이제주몰 products
  const ejejuProducts = products.filter(p => p.mallUrl === 'https://mall.ejeju.net');
  
  console.log(`Total products in database: ${products.length}`);
  console.log(`이제주몰 products: ${ejejuProducts.length}`);
  console.log(`Percentage: ${((ejejuProducts.length / products.length) * 100).toFixed(1)}%\n`);
  
  // Verify data quality
  let issues = 0;
  const missingImages: Product[] = [];
  const missingPrices: Product[] = [];
  const missingUrls: Product[] = [];
  const invalidUrls: Product[] = [];
  
  ejejuProducts.forEach(product => {
    if (!product.imageUrl || product.imageUrl === '') {
      missingImages.push(product);
      issues++;
    }
    
    if (!product.price || product.price === 0) {
      missingPrices.push(product);
      issues++;
    }
    
    if (!product.productUrl) {
      missingUrls.push(product);
      issues++;
    } else if (!product.productUrl.includes('mall.ejeju.net')) {
      invalidUrls.push(product);
      issues++;
    }
  });
  
  console.log('=== Data Quality Check ===');
  console.log(`Products with missing images: ${missingImages.length}`);
  console.log(`Products with missing/zero prices: ${missingPrices.length}`);
  console.log(`Products with missing URLs: ${missingUrls.length}`);
  console.log(`Products with invalid URLs: ${invalidUrls.length}`);
  console.log(`Total issues found: ${issues}\n`);
  
  // Sample products
  console.log('=== Sample Products ===');
  const sampleProducts = ejejuProducts.slice(0, 5);
  sampleProducts.forEach((product, index) => {
    console.log(`\n${index + 1}. ${product.name}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Price: ₩${product.price.toLocaleString()}${product.originalPrice ? ` (Original: ₩${product.originalPrice.toLocaleString()})` : ''}`);
    console.log(`   Category: ${product.category}`);
    console.log(`   URL: ${product.productUrl}`);
    console.log(`   Image: ${product.imageUrl}`);
    console.log(`   Tags: ${product.tags.slice(0, 5).join(', ')}${product.tags.length > 5 ? '...' : ''}`);
  });
  
  // Category distribution
  console.log('\n=== Category Distribution ===');
  const categoryCount = ejejuProducts.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`${category}: ${count} products (${((count / ejejuProducts.length) * 100).toFixed(1)}%)`);
    });
  
  // Price analysis
  const prices = ejejuProducts.map(p => p.price).filter(p => p > 0);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  console.log('\n=== Price Analysis ===');
  console.log(`Average price: ₩${Math.round(avgPrice).toLocaleString()}`);
  console.log(`Min price: ₩${minPrice.toLocaleString()}`);
  console.log(`Max price: ₩${maxPrice.toLocaleString()}`);
  
  // Verify URLs are properly formatted
  console.log('\n=== URL Verification ===');
  const urlPattern = /^https:\/\/mall\.ejeju\.net\/goods\/(goods\/)?detail\.do\?gno=\d+&cate=\d+$/;
  const invalidUrlFormat = ejejuProducts.filter(p => !urlPattern.test(p.productUrl));
  console.log(`Products with non-standard URL format: ${invalidUrlFormat.length}`);
  
  if (invalidUrlFormat.length > 0 && invalidUrlFormat.length <= 5) {
    invalidUrlFormat.forEach(p => {
      console.log(`  - ${p.name}: ${p.productUrl}`);
    });
  }
  
  // Summary
  console.log('\n=== VERIFICATION SUMMARY ===');
  if (issues === 0 && invalidUrlFormat.length === 0) {
    console.log('✅ All 이제주몰 products registered successfully!');
    console.log('✅ All product data is complete and valid.');
  } else {
    console.log(`⚠️  Found ${issues + invalidUrlFormat.length} total issues that may need attention.`);
  }
  console.log(`\n📊 Successfully registered ${ejejuProducts.length} products from 이제주몰`);
  
  // Save verification report
  const report = {
    verificationDate: new Date().toISOString(),
    totalProducts: products.length,
    ejejuProducts: ejejuProducts.length,
    dataQuality: {
      missingImages: missingImages.length,
      missingPrices: missingPrices.length,
      missingUrls: missingUrls.length,
      invalidUrls: invalidUrls.length,
      invalidUrlFormat: invalidUrlFormat.length
    },
    categoryDistribution: categoryCount,
    priceAnalysis: {
      average: Math.round(avgPrice),
      min: minPrice,
      max: maxPrice
    },
    sampleProducts: sampleProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      url: p.productUrl
    }))
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'output', 'ejeju-verification-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  return report;
}

// Run verification
if (require.main === module) {
  verifyEjejuProducts().catch(console.error);
}

export { verifyEjejuProducts };