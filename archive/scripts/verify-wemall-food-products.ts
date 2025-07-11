import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

function verifyWemallFoodProducts() {
  console.log('🔍 Verifying 우리몰 food product registration...\n');
  
  // Read products from database
  const productsData = readFileSync('./src/data/products.json', 'utf-8');
  const products: Product[] = JSON.parse(productsData);
  
  // Filter wemall products
  const wemallProducts = products.filter(p => p.id.startsWith('wemall-'));
  
  console.log(`📊 Total products in database: ${products.length}`);
  console.log(`📦 우리몰 products: ${wemallProducts.length}`);
  
  // Analyze data quality
  const dataQuality = {
    withTitles: wemallProducts.filter(p => p.name && p.name.trim() !== '').length,
    withPrices: wemallProducts.filter(p => p.price > 0).length,
    withImages: wemallProducts.filter(p => p.image && p.image.trim() !== '').length,
    withUrls: wemallProducts.filter(p => p.url && p.url.trim() !== '').length,
    withCategories: wemallProducts.filter(p => p.category && p.category.trim() !== '').length,
    withValidPrices: wemallProducts.filter(p => p.price > 0 && p.price < 10000000).length,
    withDiscounts: wemallProducts.filter(p => p.originalPrice && p.originalPrice > p.price).length,
    foodProducts: wemallProducts.filter(p => 
      p.category === '농축수산물' || p.category === '가공식품'
    ).length
  };
  
  // Category distribution
  const categoryDistribution: { [key: string]: number } = {};
  wemallProducts.forEach(p => {
    const category = p.category || 'Unknown';
    categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
  });
  
  // Price analysis
  const pricesOnly = wemallProducts.filter(p => p.price > 0).map(p => p.price);
  const priceAnalysis = {
    min: pricesOnly.length > 0 ? Math.min(...pricesOnly) : 0,
    max: pricesOnly.length > 0 ? Math.max(...pricesOnly) : 0,
    average: pricesOnly.length > 0 ? pricesOnly.reduce((a, b) => a + b, 0) / pricesOnly.length : 0
  };
  
  // Verify all products are food/agricultural
  const nonFoodProducts = wemallProducts.filter(p => 
    p.category !== '농축수산물' && p.category !== '가공식품'
  );
  
  // Find issues
  const issues: string[] = [];
  
  wemallProducts.forEach(p => {
    if (!p.name || p.name.trim() === '') {
      issues.push(`Product ${p.id} has missing title`);
    }
    if (p.price === 0) {
      issues.push(`Product ${p.id} has invalid price: ${p.price}`);
    }
    if (!p.image || p.image.trim() === '') {
      issues.push(`Product ${p.id} has invalid image URL`);
    }
    if (p.category !== '농축수산물' && p.category !== '가공식품') {
      issues.push(`Product ${p.id} is not a food product: category ${p.category}`);
    }
  });
  
  // Sample products for verification
  const sampleProducts = wemallProducts.slice(0, 10).map(p => ({
    id: p.id,
    title: p.name || '(제목 없음)',
    price: p.price,
    originalPrice: p.originalPrice,
    category: p.category,
    hasImage: !!p.image,
    hasUrl: !!p.url,
    isFeatured: p.isFeatured
  }));
  
  // Featured products
  const featuredProducts = wemallProducts.filter(p => p.isFeatured).length;
  
  // Generate verification report
  const report = {
    totalProducts: wemallProducts.length,
    dataQuality,
    categories: categoryDistribution,
    priceRange: priceAnalysis,
    sampleProducts,
    issues: issues.slice(0, 20), // Limit to first 20 issues
    featuredProducts,
    nonFoodProducts: nonFoodProducts.length,
    verification: {
      allProductsAreFood: nonFoodProducts.length === 0,
      message: nonFoodProducts.length === 0 
        ? '✅ All products are food/agricultural products' 
        : `❌ Found ${nonFoodProducts.length} non-food products`
    }
  };
  
  writeFileSync('./scripts/output/wemall-food-verification-report.json', JSON.stringify(report, null, 2));
  
  // Display verification results
  console.log('\n📋 Data Quality Analysis:');
  console.log(`✅ With titles: ${dataQuality.withTitles}/${wemallProducts.length}`);
  console.log(`💰 With prices: ${dataQuality.withPrices}/${wemallProducts.length}`);
  console.log(`🖼️ With images: ${dataQuality.withImages}/${wemallProducts.length}`);
  console.log(`🔗 With URLs: ${dataQuality.withUrls}/${wemallProducts.length}`);
  console.log(`📂 With categories: ${dataQuality.withCategories}/${wemallProducts.length}`);
  console.log(`🥕 Food products: ${dataQuality.foodProducts}/${wemallProducts.length}`);
  
  console.log('\n💵 Price Analysis:');
  if (priceAnalysis.min > 0) {
    console.log(`Min: ₩${priceAnalysis.min.toLocaleString()}`);
    console.log(`Max: ₩${priceAnalysis.max.toLocaleString()}`);
    console.log(`Average: ₩${Math.round(priceAnalysis.average).toLocaleString()}`);
  }
  
  console.log('\n📂 Category Distribution:');
  Object.entries(categoryDistribution).forEach(([category, count]) => {
    console.log(`${category}: ${count} products`);
  });
  
  console.log('\n🔍 Food Product Verification:');
  console.log(report.verification.message);
  
  if (issues.length > 0) {
    console.log(`\n⚠️ Found ${issues.length} issues (showing first 5):`);
    issues.slice(0, 5).forEach(issue => console.log(`- ${issue}`));
  } else {
    console.log('\n✅ No issues found!');
  }
  
  console.log('\n📦 Sample Products:');
  sampleProducts.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. ${p.title} - ₩${p.price.toLocaleString()} (${p.category})`);
  });
  
  console.log(`\n⭐ Featured products: ${featuredProducts}`);
  console.log('\n✅ Verification report saved to: ./scripts/output/wemall-food-verification-report.json');
}

// Run verification
verifyWemallFoodProducts();