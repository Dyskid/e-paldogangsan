import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

function verifyOntongDaejeonRegistration() {
  console.log('🔍 Verifying 온통대전몰 product registration...\n');
  
  // Read products from database
  const productsData = readFileSync('./src/data/products.json', 'utf-8');
  const products: Product[] = JSON.parse(productsData);
  
  // Filter 온통대전몰 products
  const ontongdaejeonProducts = products.filter(p => p.id.startsWith('ontongdaejeon-'));
  
  console.log(`📊 Total products in database: ${products.length}`);
  console.log(`📦 온통대전몰 products: ${ontongdaejeonProducts.length}`);
  
  // Analyze data quality
  const dataQuality = {
    withTitles: ontongdaejeonProducts.filter(p => p.name && p.name.trim() !== '').length,
    withPrices: ontongdaejeonProducts.filter(p => p.price > 0).length,
    withImages: ontongdaejeonProducts.filter(p => p.image && p.image.trim() !== '').length,
    withUrls: ontongdaejeonProducts.filter(p => p.url && p.url.trim() !== '').length,
    withCategories: ontongdaejeonProducts.filter(p => p.category && p.category.trim() !== '').length,
    withValidPrices: ontongdaejeonProducts.filter(p => p.price > 0 && p.price < 10000000).length,
    withDiscounts: ontongdaejeonProducts.filter(p => p.originalPrice && p.originalPrice > p.price).length,
    withoutTitles: ontongdaejeonProducts.filter(p => !p.name || p.name.trim() === '').length
  };
  
  // Category distribution
  const categoryDistribution: { [key: string]: number } = {};
  ontongdaejeonProducts.forEach(p => {
    const category = p.category || 'Unknown';
    categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
  });
  
  // Price analysis
  const pricesOnly = ontongdaejeonProducts.filter(p => p.price > 0).map(p => p.price);
  const priceAnalysis = {
    min: pricesOnly.length > 0 ? Math.min(...pricesOnly) : 0,
    max: pricesOnly.length > 0 ? Math.max(...pricesOnly) : 0,
    average: pricesOnly.length > 0 ? pricesOnly.reduce((a, b) => a + b, 0) / pricesOnly.length : 0
  };
  
  // Find issues
  const issues: string[] = [];
  
  ontongdaejeonProducts.forEach(p => {
    if (!p.name || p.name.trim() === '') {
      issues.push(`Product ${p.id} has missing title`);
    }
    if (p.price === 0) {
      issues.push(`Product ${p.id} has invalid price: ${p.price}`);
    }
    if (!p.image || p.image.trim() === '') {
      issues.push(`Product ${p.id} has invalid image URL`);
    }
  });
  
  // Sample products for verification
  const sampleProducts = ontongdaejeonProducts.slice(0, 10).map(p => ({
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
  const featuredProducts = ontongdaejeonProducts.filter(p => p.isFeatured).length;
  
  // Generate verification report
  const report = {
    totalProducts: ontongdaejeonProducts.length,
    dataQuality,
    categories: categoryDistribution,
    priceRange: priceAnalysis,
    sampleProducts,
    issues: issues.slice(0, 20), // Limit to first 20 issues
    featuredProducts
  };
  
  writeFileSync('./scripts/output/ontongdaejeon-verification-report.json', JSON.stringify(report, null, 2));
  
  // Display verification results
  console.log('\n📋 Data Quality Analysis:');
  console.log(`✅ With titles: ${dataQuality.withTitles}/${ontongdaejeonProducts.length}`);
  console.log(`💰 With prices: ${dataQuality.withPrices}/${ontongdaejeonProducts.length}`);
  console.log(`🖼️ With images: ${dataQuality.withImages}/${ontongdaejeonProducts.length}`);
  console.log(`🔗 With URLs: ${dataQuality.withUrls}/${ontongdaejeonProducts.length}`);
  console.log(`📂 With categories: ${dataQuality.withCategories}/${ontongdaejeonProducts.length}`);
  
  console.log('\n💵 Price Analysis:');
  if (priceAnalysis.min > 0) {
    console.log(`Min: ₩${priceAnalysis.min.toLocaleString()}`);
    console.log(`Max: ₩${priceAnalysis.max.toLocaleString()}`);
    console.log(`Average: ₩${Math.round(priceAnalysis.average).toLocaleString()}`);
  } else {
    console.log('⚠️ No valid prices found!');
  }
  
  console.log('\n📂 Category Distribution:');
  Object.entries(categoryDistribution).forEach(([category, count]) => {
    console.log(`${category}: ${count} products`);
  });
  
  if (issues.length > 0) {
    console.log(`\n⚠️ Found ${issues.length} issues (showing first 10):`);
    issues.slice(0, 10).forEach(issue => console.log(`- ${issue}`));
  } else {
    console.log('\n✅ No issues found!');
  }
  
  console.log('\n📦 Sample Products:');
  sampleProducts.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. ${p.title} - ₩${p.price.toLocaleString()}`);
  });
  
  console.log(`\n⭐ Featured products: ${featuredProducts}`);
  console.log('\n✅ Verification report saved to: ./scripts/output/ontongdaejeon-verification-report.json');
}

// Run verification
verifyOntongDaejeonRegistration();