import * as fs from 'fs';

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

async function verifyJCMallRegistration() {
  console.log('🔍 Starting JC Mall registration verification...');

  // Read products data
  const productsPath = '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json';
  
  if (!fs.existsSync(productsPath)) {
    console.error('❌ Products file not found!');
    return;
  }

  const allProducts: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  
  // Filter JC Mall products
  const jcmallProducts = allProducts.filter(p => p.mall === '진천몰' || p.id.startsWith('jcmall_'));
  
  console.log(`📊 Found ${jcmallProducts.length} 진천몰 products out of ${allProducts.length} total products`);

  if (jcmallProducts.length === 0) {
    console.log('❌ No JC Mall products found!');
    return;
  }

  // Data quality checks
  const dataQuality = {
    validTitles: jcmallProducts.filter(p => p.title && p.title.length > 0).length,
    validPrices: jcmallProducts.filter(p => p.price && p.price !== '0원').length,
    validCategories: jcmallProducts.filter(p => p.category && p.category.length > 0).length,
    validImages: jcmallProducts.filter(p => p.image && p.image.length > 0).length,
    validUrls: jcmallProducts.filter(p => p.url && p.url.startsWith('http')).length,
    validTags: jcmallProducts.filter(p => p.tags && p.tags.length > 0).length
  };

  // Category distribution
  const categories = jcmallProducts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Tag analysis
  const tagCount = jcmallProducts.reduce((acc, p) => {
    p.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Price analysis
  const prices = jcmallProducts.map(p => parseInt(p.price.replace(/[^\d]/g, ''))).filter(p => p > 0);
  const priceDistribution = {
    '~10,000원': prices.filter(p => p <= 10000).length,
    '10,000-30,000원': prices.filter(p => p > 10000 && p <= 30000).length,
    '30,000-60,000원': prices.filter(p => p > 30000 && p <= 60000).length,
    '60,000-100,000원': prices.filter(p => p > 60000 && p <= 100000).length,
    '100,000원+': prices.filter(p => p > 100000).length
  };

  // Featured products count
  const featuredCount = jcmallProducts.filter(p => parseInt(p.price.replace(/[^\d]/g, '')) >= 50000).length;

  console.log('\n📋 Verification Results:');
  console.log(`📦 Total 진천몰 products: ${jcmallProducts.length}`);

  console.log('\n🎯 Data Quality:');
  console.log(`✅ Valid titles: ${dataQuality.validTitles} (${(dataQuality.validTitles/jcmallProducts.length*100).toFixed(1)}%)`);
  console.log(`💰 Valid prices: ${dataQuality.validPrices} (${(dataQuality.validPrices/jcmallProducts.length*100).toFixed(1)}%)`);
  console.log(`🏷️ Valid categories: ${dataQuality.validCategories} (${(dataQuality.validCategories/jcmallProducts.length*100).toFixed(1)}%)`);
  console.log(`🖼️ Valid images: ${dataQuality.validImages} (${(dataQuality.validImages/jcmallProducts.length*100).toFixed(1)}%)`);
  console.log(`🔗 Valid URLs: ${dataQuality.validUrls} (${(dataQuality.validUrls/jcmallProducts.length*100).toFixed(1)}%)`);
  console.log(`🏷️ Valid tags: ${dataQuality.validTags} (${(dataQuality.validTags/jcmallProducts.length*100).toFixed(1)}%)`);

  console.log('\n🏷️ Category Distribution:');
  Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });

  console.log('\n🎯 진천몰 Regional Specialties:');
  Object.entries(tagCount)
    .sort(([,a], [,b]) => b - a)
    .forEach(([tag, count]) => {
      console.log(`  ${tag}: ${count} products`);
    });

  console.log('\n💰 Price Distribution:');
  Object.entries(priceDistribution).forEach(([range, count]) => {
    console.log(`  ${range}: ${count} products`);
  });

  console.log(`\n⭐ Featured products: ${featuredCount}`);

  // Recommendations
  console.log('\n⚠️ Recommendations:');
  if (categories['쌀/곡류'] > 20) {
    console.log('  • 쌀/곡류 제품이 풍부함');
  }
  if (categories['발효식품'] > 15) {
    console.log('  • 발효식품 라인업 우수');
  }
  if (categories['정육류'] > 5) {
    console.log('  • 한우 제품 보유');
  }

  // Create verification report
  const report = {
    timestamp: new Date().toISOString(),
    mall: '진천몰',
    totalProducts: jcmallProducts.length,
    dataQuality,
    categories,
    regionalTags: tagCount,
    priceDistribution,
    featuredProducts: featuredCount,
    averagePrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    },
    sampleProducts: jcmallProducts.slice(0, 10).map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      tags: p.tags
    }))
  };

  // Save verification report
  const reportPath = '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/jcmall-verification-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n💾 Full report saved to: ${reportPath}`);
  console.log('🎉 진천몰 verification completed successfully!');

  return report;
}

// Run verification
verifyJCMallRegistration().catch(console.error);