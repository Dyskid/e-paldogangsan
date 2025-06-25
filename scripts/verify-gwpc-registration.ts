import * as fs from 'fs';
import * as path from 'path';

interface MainProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  url: string;
  category: string;
  description: string;
  region: string;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  mall: {
    mallId: string;
    mallName: string;
    mallUrl: string;
    region: string;
  };
}

async function verifyGwpcRegistration() {
  console.log('🔍 Starting 평창몰 registration verification...');
  
  try {
    // Read products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    if (!fs.existsSync(productsPath)) {
      throw new Error('Products file not found');
    }
    
    const productsData = fs.readFileSync(productsPath, 'utf-8');
    const allProducts: MainProduct[] = JSON.parse(productsData);
    
    // Filter GWPC products
    const gwpcProducts = allProducts.filter(p => p.mall?.mallId === 'gwpc-mall');
    
    console.log(`📊 Found ${gwpcProducts.length} 평창몰 products out of ${allProducts.length} total products`);
    
    // Data quality checks
    const verification = {
      totalProducts: gwpcProducts.length,
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
        under10000: 0,
        '10000-30000': 0,
        '30000-60000': 0,
        '60000-100000': 0,
        over100000: 0
      },
      featuredProducts: 0,
      sampleProducts: [] as any[]
    };
    
    gwpcProducts.forEach((product, index) => {
      // Check data quality
      if (product.name && product.name.length > 3) {
        verification.dataQuality.validTitles++;
      }
      
      if (product.price && product.price > 0) {
        verification.dataQuality.validPrices++;
        
        // Price ranges
        if (product.price < 10000) verification.priceRanges.under10000++;
        else if (product.price < 30000) verification.priceRanges['10000-30000']++;
        else if (product.price < 60000) verification.priceRanges['30000-60000']++;
        else if (product.price < 100000) verification.priceRanges['60000-100000']++;
        else verification.priceRanges.over100000++;
      }
      
      if (product.category && product.category !== '평창특산품') {
        verification.dataQuality.validCategories++;
      }
      
      if (product.image && product.image.length > 0) {
        verification.dataQuality.validImages++;
      }
      
      if (product.url && product.url.includes('gwpc-mall.com')) {
        verification.dataQuality.validUrls++;
      }
      
      if (product.tags && product.tags.length > 0) {
        verification.dataQuality.validTags++;
      }
      
      if (product.isFeatured) {
        verification.featuredProducts++;
      }
      
      // Category distribution
      verification.categories[product.category] = (verification.categories[product.category] || 0) + 1;
      
      // Sample products
      if (index < 10) {
        verification.sampleProducts.push({
          title: product.name,
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
    
    // GWPC specialty analysis
    const specialtyKeywords = {
      '대관령한우': gwpcProducts.filter(p => p.name.includes('대관령') || p.name.includes('한우')).length,
      '평창': gwpcProducts.filter(p => p.name.includes('평창')).length,
      '유기농': gwpcProducts.filter(p => p.name.includes('유기농')).length,
      '치즈': gwpcProducts.filter(p => p.name.includes('치즈')).length,
      '요거트': gwpcProducts.filter(p => p.name.includes('요거트')).length,
      '들기름': gwpcProducts.filter(p => p.name.includes('들기름')).length,
      '커피': gwpcProducts.filter(p => p.name.includes('커피')).length,
      '선물세트': gwpcProducts.filter(p => p.name.includes('선물세트')).length,
      '고랭지': gwpcProducts.filter(p => p.tags?.includes('고랭지농산물')).length,
      '품질인증': gwpcProducts.filter(p => p.tags?.includes('품질인증') || p.name.includes('품질인증')).length
    };
    
    const report = {
      timestamp: new Date().toISOString(),
      mallName: '평창몰',
      mallId: 'gwpc-mall',
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
    if (specialtyKeywords['대관령한우'] < 3) {
      recommendations.push('평창 대표 특산품인 대관령한우 상품 확보 좋음');
    }
    if (specialtyKeywords['유기농'] + specialtyKeywords['고랭지'] < 5) {
      recommendations.push('평창 고랭지 유기농 상품 확보 만족스러움');
    }
    
    report.recommendations = recommendations;
    
    // Save verification report
    const reportPath = path.join(__dirname, 'output/gwpc-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    // Console output
    console.log('\n📋 Verification Results:');
    console.log(`📦 Total 평창몰 products: ${verification.totalProducts}`);
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
    
    console.log('\n🎯 평창 Regional Specialties:');
    Object.entries(specialtyKeywords).forEach(([keyword, count]) => {
      if (count > 0) {
        console.log(`  ${keyword}: ${count} products`);
      }
    });
    
    console.log('\n💰 Price Distribution:');
    console.log(`  ~10,000원: ${verification.priceRanges.under10000} products`);
    console.log(`  10,000-30,000원: ${verification.priceRanges['10000-30000']} products`);
    console.log(`  30,000-60,000원: ${verification.priceRanges['30000-60000']} products`);
    console.log(`  60,000-100,000원: ${verification.priceRanges['60000-100000']} products`);
    console.log(`  100,000원+: ${verification.priceRanges.over100000} products`);
    
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
verifyGwpcRegistration()
  .then((report) => {
    console.log('🎉 평창몰 verification completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });