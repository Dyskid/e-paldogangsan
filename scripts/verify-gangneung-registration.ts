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

async function verifyGangneungRegistration() {
  console.log('🔍 Starting Gangneung Mall registration verification...');
  
  try {
    // Read products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    if (!fs.existsSync(productsPath)) {
      throw new Error('Products file not found');
    }
    
    const productsData = fs.readFileSync(productsPath, 'utf-8');
    const allProducts: MainProduct[] = JSON.parse(productsData);
    
    // Filter Gangneung products
    const gangneungProducts = allProducts.filter(p => p.mallId === 'gangneung');
    
    console.log(`📊 Found ${gangneungProducts.length} Gangneung products out of ${allProducts.length} total products`);
    
    // Data quality checks
    const verification = {
      totalProducts: gangneungProducts.length,
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
        '10000-20000': 0,
        '20000-30000': 0,
        '30000-50000': 0,
        over50000: 0
      },
      featuredProducts: 0,
      sampleProducts: [] as any[]
    };
    
    gangneungProducts.forEach((product, index) => {
      // Check data quality
      if (product.title && product.title.length > 3) {
        verification.dataQuality.validTitles++;
      }
      
      if (product.price && product.price > 0) {
        verification.dataQuality.validPrices++;
        
        // Price ranges
        if (product.price < 10000) verification.priceRanges.under10000++;
        else if (product.price < 20000) verification.priceRanges['10000-20000']++;
        else if (product.price < 30000) verification.priceRanges['20000-30000']++;
        else if (product.price < 50000) verification.priceRanges['30000-50000']++;
        else verification.priceRanges.over50000++;
      }
      
      if (product.category && product.category !== '강릉특산품') {
        verification.dataQuality.validCategories++;
      }
      
      if (product.imageUrl && product.imageUrl.length > 0) {
        verification.dataQuality.validImages++;
      }
      
      if (product.productUrl && product.productUrl.includes('gangneung-mall.com')) {
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
    
    // Specialty product analysis
    const specialtyKeywords = {
      '반려동물': gangneungProducts.filter(p => p.title.includes('반려') || p.title.includes('강아지') || p.title.includes('고양이')).length,
      '한과': gangneungProducts.filter(p => p.title.includes('한과') || p.title.includes('강정') || p.title.includes('유과')).length,
      '수산물': gangneungProducts.filter(p => p.title.includes('아귀') || p.title.includes('황태') || p.title.includes('오다리') || p.title.includes('먹태')).length,
      '발효식품': gangneungProducts.filter(p => p.title.includes('김치') || p.title.includes('청국장') || p.title.includes('고추지')).length,
      '커피': gangneungProducts.filter(p => p.title.includes('커피') || p.title.includes('원두')).length
    };
    
    const report = {
      timestamp: new Date().toISOString(),
      mallName: '강릉몰',
      mallId: 'gangneung',
      verification,
      qualityPercentages,
      specialtyKeywords,
      topCategories: Object.entries(verification.categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
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
    const reportPath = path.join(__dirname, 'output/gangneung-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    // Console output
    console.log('\n📋 Verification Results:');
    console.log(`📦 Total Gangneung products: ${verification.totalProducts}`);
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
    
    console.log('\n🎯 Product Specialties:');
    Object.entries(specialtyKeywords).forEach(([keyword, count]) => {
      if (count > 0) {
        console.log(`  ${keyword}: ${count} products`);
      }
    });
    
    console.log('\n💰 Price Distribution:');
    console.log(`  ~10,000원: ${verification.priceRanges.under10000} products`);
    console.log(`  10,000-20,000원: ${verification.priceRanges['10000-20000']} products`);
    console.log(`  20,000-30,000원: ${verification.priceRanges['20000-30000']} products`);
    console.log(`  30,000-50,000원: ${verification.priceRanges['30000-50000']} products`);
    console.log(`  50,000원+: ${verification.priceRanges.over50000} products`);
    
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
verifyGangneungRegistration()
  .then((report) => {
    console.log('🎉 Gangneung Mall verification completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });