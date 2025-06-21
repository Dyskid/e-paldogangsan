import * as fs from 'fs';
import * as path from 'path';

interface MainProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  category: string;
  description: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
}

async function verifySamcheokRegistration() {
  console.log('🔍 Starting Samcheok Mall registration verification...');
  
  try {
    // Read products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    if (!fs.existsSync(productsPath)) {
      throw new Error('Products file not found');
    }
    
    const productsData = fs.readFileSync(productsPath, 'utf-8');
    const allProducts: MainProduct[] = JSON.parse(productsData);
    
    // Filter Samcheok products
    const samcheokProducts = allProducts.filter(p => p.mallId === 'samcheok');
    
    console.log(`📊 Found ${samcheokProducts.length} Samcheok products out of ${allProducts.length} total products`);
    
    // Data quality checks
    const verification = {
      totalProducts: samcheokProducts.length,
      dataQuality: {
        validTitles: 0,
        validPrices: 0,
        validCategories: 0,
        validImages: 0,
        validUrls: 0,
        validTags: 0
      },
      categories: {} as Record<string, number>,
      priceRanges: {
        under20000: 0,
        '20000-50000': 0,
        '50000-100000': 0,
        '100000-200000': 0,
        over200000: 0
      },
      featuredProducts: 0,
      sampleProducts: [] as any[]
    };
    
    samcheokProducts.forEach((product, index) => {
      // Check data quality
      if (product.title && product.title.length > 3) {
        verification.dataQuality.validTitles++;
      }
      
      if (product.price && product.price > 0) {
        verification.dataQuality.validPrices++;
        
        // Price ranges
        if (product.price < 20000) verification.priceRanges.under20000++;
        else if (product.price < 50000) verification.priceRanges['20000-50000']++;
        else if (product.price < 100000) verification.priceRanges['50000-100000']++;
        else if (product.price < 200000) verification.priceRanges['100000-200000']++;
        else verification.priceRanges.over200000++;
      }
      
      if (product.category && product.category !== '삼척특산품') {
        verification.dataQuality.validCategories++;
      }
      
      if (product.imageUrl && product.imageUrl.length > 0) {
        verification.dataQuality.validImages++;
      }
      
      if (product.productUrl && product.productUrl.includes('samcheok-mall.com')) {
        verification.dataQuality.validUrls++;
      }
      
      if (product.tags && product.tags.length > 0) {
        verification.dataQuality.validTags++;
      }
      
      if (product.featured) {
        verification.featuredProducts++;
      }
      
      // Category distribution
      verification.categories[product.category] = (verification.categories[product.category] || 0) + 1;
      
      // Sample products
      if (index < 10) {
        verification.sampleProducts.push({
          title: product.title,
          price: product.price,
          category: product.category,
          tags: product.tags
        });
      }
    });
    
    // Calculate percentages
    const qualityPercentages = {
      validTitles: (verification.dataQuality.validTitles / verification.totalProducts * 100).toFixed(1),
      validPrices: (verification.dataQuality.validPrices / verification.totalProducts * 100).toFixed(1),
      validCategories: (verification.dataQuality.validCategories / verification.totalProducts * 100).toFixed(1),
      validImages: (verification.dataQuality.validImages / verification.totalProducts * 100).toFixed(1),
      validUrls: (verification.dataQuality.validUrls / verification.totalProducts * 100).toFixed(1),
      validTags: (verification.dataQuality.validTags / verification.totalProducts * 100).toFixed(1)
    };
    
    // Samcheok specialty analysis
    const specialtyKeywords = {
      '약과': samcheokProducts.filter(p => p.title.includes('약과') || p.title.includes('왕기')).length,
      '한우': samcheokProducts.filter(p => p.title.includes('한우') || p.title.includes('등심')).length,
      '도라지': samcheokProducts.filter(p => p.title.includes('도라지')).length,
      '청국장': samcheokProducts.filter(p => p.title.includes('청국장') || p.title.includes('천국장')).length,
      '꿀': samcheokProducts.filter(p => p.title.includes('꿀') || p.title.includes('벌꿀')).length,
      '오미자': samcheokProducts.filter(p => p.title.includes('오미자')).length,
      '수산물': samcheokProducts.filter(p => p.category.includes('수산물')).length,
      '건강식품': samcheokProducts.filter(p => p.category.includes('건강식품')).length
    };
    
    const report = {
      timestamp: new Date().toISOString(),
      mallName: '삼척몰',
      mallId: 'samcheok',
      verification,
      qualityPercentages,
      specialtyKeywords,
      topCategories: Object.entries(verification.categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6),
      recommendations: []
    };
    
    // Generate recommendations
    const recommendations = [];
    if (parseFloat(qualityPercentages.validTitles) < 95) {
      recommendations.push('일부 상품의 제목 데이터 품질 확인 필요');
    }
    if (parseFloat(qualityPercentages.validImages) < 90) {
      recommendations.push('이미지 URL 누락된 상품들 확인 필요');
    }
    if (verification.featuredProducts === 0) {
      recommendations.push('추천 상품 설정 검토 필요');
    }
    if (parseFloat(qualityPercentages.validCategories) < 80) {
      recommendations.push('카테고리 분류 개선 필요');
    }
    
    report.recommendations = recommendations;
    
    // Save verification report
    const reportPath = path.join(__dirname, 'output/samcheok-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    // Console output
    console.log('\n📋 Verification Results:');
    console.log(`📦 Total Samcheok products: ${verification.totalProducts}`);
    console.log('\n🎯 Data Quality:');
    console.log(`✅ Valid titles: ${verification.dataQuality.validTitles} (${qualityPercentages.validTitles}%)`);
    console.log(`💰 Valid prices: ${verification.dataQuality.validPrices} (${qualityPercentages.validPrices}%)`);
    console.log(`🏷️ Valid categories: ${verification.dataQuality.validCategories} (${qualityPercentages.validCategories}%)`);
    console.log(`🖼️ Valid images: ${verification.dataQuality.validImages} (${qualityPercentages.validImages}%)`);
    console.log(`🔗 Valid URLs: ${verification.dataQuality.validUrls} (${qualityPercentages.validUrls}%)`);
    console.log(`🏷️ Valid tags: ${verification.dataQuality.validTags} (${qualityPercentages.validTags}%)`);
    
    console.log('\n🏷️ Category Distribution:');
    report.topCategories.forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });
    
    console.log('\n🎯 Samcheok Regional Specialties:');
    Object.entries(specialtyKeywords).forEach(([keyword, count]) => {
      if (count > 0) {
        console.log(`  ${keyword}: ${count} products`);
      }
    });
    
    console.log('\n💰 Price Distribution:');
    console.log(`  ~20,000원: ${verification.priceRanges.under20000} products`);
    console.log(`  20,000-50,000원: ${verification.priceRanges['20000-50000']} products`);
    console.log(`  50,000-100,000원: ${verification.priceRanges['50000-100000']} products`);
    console.log(`  100,000-200,000원: ${verification.priceRanges['100000-200000']} products`);
    console.log(`  200,000원+: ${verification.priceRanges.over200000} products`);
    
    console.log(`\n⭐ Featured products: ${verification.featuredProducts}`);
    
    if (recommendations.length > 0) {
      console.log('\n⚠️ Recommendations:');
      recommendations.forEach(rec => console.log(`  • ${rec}`));
    } else {
      console.log('\n✅ Excellent data quality - no issues found!');
    }
    
    console.log(`\n💾 Full report saved to: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  }
}

// Run verification
verifySamcheokRegistration()
  .then((report) => {
    console.log('🎉 Samcheok Mall verification completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });