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

async function verifyEsjangRegistration() {
  console.log('🔍 Starting 이천시장 registration verification...');
  
  try {
    // Read products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    if (!fs.existsSync(productsPath)) {
      throw new Error('Products file not found');
    }
    
    const productsData = fs.readFileSync(productsPath, 'utf-8');
    const allProducts: MainProduct[] = JSON.parse(productsData);
    
    // Filter ESJang products
    const esjangProducts = allProducts.filter(p => p.mall?.mallId === 'esjang-mall');
    
    console.log(`📊 Found ${esjangProducts.length} 이천시장 products out of ${allProducts.length} total products`);
    
    // Data quality checks
    const verification = {
      totalProducts: esjangProducts.length,
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
    
    esjangProducts.forEach((product, index) => {
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
      
      if (product.category && product.category !== '이천특산품') {
        verification.dataQuality.validCategories++;
      }
      
      if (product.image && product.image.length > 0) {
        verification.dataQuality.validImages++;
      }
      
      if (product.url && product.url.includes('esjang.go.kr')) {
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
    
    // ESJang specialty analysis
    const specialtyKeywords = {
      '이천': esjangProducts.filter(p => p.name.includes('이천')).length,
      '음성': esjangProducts.filter(p => p.name.includes('음성')).length,
      '인삼': esjangProducts.filter(p => p.name.includes('인삼') || p.name.includes('수삼')).length,
      '홍삼': esjangProducts.filter(p => p.name.includes('홍삼')).length,
      '한과': esjangProducts.filter(p => p.name.includes('한과')).length,
      '표고버섯': esjangProducts.filter(p => p.name.includes('표고')).length,
      '잡곡': esjangProducts.filter(p => p.name.includes('곡')).length,
      '유기농': esjangProducts.filter(p => p.name.includes('유기농')).length,
      '수제': esjangProducts.filter(p => p.name.includes('수제')).length,
      '전통': esjangProducts.filter(p => p.name.includes('전통')).length,
      '국내산': esjangProducts.filter(p => p.name.includes('국내산')).length
    };
    
    const report = {
      timestamp: new Date().toISOString(),
      mallName: '이천시장',
      mallId: 'esjang-mall',
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
    if (specialtyKeywords['이천'] < 5) {
      recommendations.push('이천 지역 특산품 확보 필요');
    }
    if (specialtyKeywords['인삼'] + specialtyKeywords['홍삼'] < 3) {
      recommendations.push('인삼/홍삼 제품 충분함');
    }
    
    report.recommendations = recommendations;
    
    // Save verification report
    const reportPath = path.join(__dirname, 'output/esjang-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    // Console output
    console.log('\n📋 Verification Results:');
    console.log(`📦 Total 이천시장 products: ${verification.totalProducts}`);
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
    
    console.log('\n🎯 이천시장 Regional Specialties:');
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
verifyEsjangRegistration()
  .then((report) => {
    console.log('🎉 이천시장 verification completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });