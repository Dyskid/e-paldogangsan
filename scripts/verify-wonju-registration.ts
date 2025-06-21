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

async function verifyWonjuRegistration() {
  console.log('🔍 Starting Wonju Mall registration verification...');
  
  try {
    // Read products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    if (!fs.existsSync(productsPath)) {
      throw new Error('Products file not found');
    }
    
    const productsData = fs.readFileSync(productsPath, 'utf-8');
    const allProducts: MainProduct[] = JSON.parse(productsData);
    
    // Filter Wonju products
    const wonjuProducts = allProducts.filter(p => p.mallId === 'wonju');
    
    console.log(`📊 Found ${wonjuProducts.length} Wonju products out of ${allProducts.length} total products`);
    
    // Data quality checks
    const verification = {
      totalProducts: wonjuProducts.length,
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
        under5000: 0,
        '5000-10000': 0,
        '10000-20000': 0,
        '20000-50000': 0,
        over50000: 0
      },
      featuredProducts: 0,
      sampleProducts: [] as any[]
    };
    
    wonjuProducts.forEach((product, index) => {
      // Check data quality
      if (product.title && product.title !== '추천 상품' && product.title.length > 3) {
        verification.dataQuality.validTitles++;
      }
      
      if (product.price && product.price > 0) {
        verification.dataQuality.validPrices++;
        
        // Price ranges
        if (product.price < 5000) verification.priceRanges.under5000++;
        else if (product.price < 10000) verification.priceRanges['5000-10000']++;
        else if (product.price < 20000) verification.priceRanges['10000-20000']++;
        else if (product.price < 50000) verification.priceRanges['20000-50000']++;
        else verification.priceRanges.over50000++;
      }
      
      if (product.category && product.category !== '원주특산품') {
        verification.dataQuality.validCategories++;
      }
      
      if (product.imageUrl && product.imageUrl.length > 0) {
        verification.dataQuality.validImages++;
      }
      
      if (product.productUrl && product.productUrl.includes('wonju-mall.co.kr')) {
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
    
    // Regional specialty analysis
    const specialtyKeywords = {
      '한우': wonjuProducts.filter(p => p.title.includes('한우')).length,
      '곤드레': wonjuProducts.filter(p => p.title.includes('곤드레')).length,
      '감자': wonjuProducts.filter(p => p.title.includes('감자')).length,
      '더덕': wonjuProducts.filter(p => p.title.includes('더덕')).length,
      '대추': wonjuProducts.filter(p => p.title.includes('대추')).length,
      '떡': wonjuProducts.filter(p => p.title.includes('떡') || p.title.includes('설기')).length,
      '순대': wonjuProducts.filter(p => p.title.includes('순대')).length,
      '만두': wonjuProducts.filter(p => p.title.includes('만두')).length
    };
    
    const report = {
      timestamp: new Date().toISOString(),
      mallName: '원주몰',
      mallId: 'wonju',
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
      recommendations.push('일부 상품의 제목이 여전히 "추천 상품"으로 표시됨');
    }
    if (parseFloat(qualityPercentages.validImages) < 90) {
      recommendations.push('이미지 URL 누락된 상품들 확인 필요');
    }
    if (verification.featuredProducts === 0) {
      recommendations.push('추천 상품 설정 검토 필요');
    }
    
    report.recommendations = recommendations;
    
    // Save verification report
    const reportPath = path.join(__dirname, 'output/wonju-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    // Console output
    console.log('\n📋 Verification Results:');
    console.log(`📦 Total Wonju products: ${verification.totalProducts}`);
    console.log('\n🎯 Data Quality:');
    console.log(`✅ Valid titles: ${verification.dataQuality.validTitles} (${qualityPercentages.validTitles}%)`);
    console.log(`💰 Valid prices: ${verification.dataQuality.validPrices} (${qualityPercentages.validPrices}%)`);
    console.log(`🏷️ Valid categories: ${verification.dataQuality.validCategories} (${qualityPercentages.validCategories}%)`);
    console.log(`🖼️ Valid images: ${verification.dataQuality.validImages} (${qualityPercentages.validImages}%)`);
    console.log(`🔗 Valid URLs: ${verification.dataQuality.validUrls} (${qualityPercentages.validUrls}%)`);
    console.log(`🏷️ Valid tags: ${verification.dataQuality.validTags} (${qualityPercentages.validTags}%)`);
    
    console.log('\n🏷️ Top Categories:');
    report.topCategories.forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });
    
    console.log('\n🎯 Regional Specialties:');
    Object.entries(specialtyKeywords).forEach(([keyword, count]) => {
      if (count > 0) {
        console.log(`  ${keyword}: ${count} products`);
      }
    });
    
    console.log('\n💰 Price Distribution:');
    console.log(`  ~5,000원: ${verification.priceRanges.under5000} products`);
    console.log(`  5,000-10,000원: ${verification.priceRanges['5000-10000']} products`);
    console.log(`  10,000-20,000원: ${verification.priceRanges['10000-20000']} products`);
    console.log(`  20,000-50,000원: ${verification.priceRanges['20000-50000']} products`);
    console.log(`  50,000원+: ${verification.priceRanges.over50000} products`);
    
    if (recommendations.length > 0) {
      console.log('\n⚠️ Recommendations:');
      recommendations.forEach(rec => console.log(`  • ${rec}`));
    } else {
      console.log('\n✅ No issues found - excellent data quality!');
    }
    
    console.log(`\n💾 Full report saved to: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  }
}

// Run verification
verifyWonjuRegistration()
  .then((report) => {
    console.log('🎉 Wonju Mall verification completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });