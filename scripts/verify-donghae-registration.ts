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

async function verifyDonghaeRegistration() {
  console.log('🔍 Starting Donghae Mall registration verification...');
  
  try {
    // Read products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    if (!fs.existsSync(productsPath)) {
      throw new Error('Products file not found');
    }
    
    const productsData = fs.readFileSync(productsPath, 'utf-8');
    const allProducts: MainProduct[] = JSON.parse(productsData);
    
    // Filter Donghae products
    const donghaeProducts = allProducts.filter(p => p.mallId === 'donghae');
    
    console.log(`📊 Found ${donghaeProducts.length} Donghae products out of ${allProducts.length} total products`);
    
    // Data quality checks
    const verification = {
      totalProducts: donghaeProducts.length,
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
    
    donghaeProducts.forEach((product, index) => {
      // Check data quality
      if (product.title && product.title.length > 3) {
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
      
      if (product.category && product.category !== '동해특산품') {
        verification.dataQuality.validCategories++;
      }
      
      if (product.imageUrl && product.imageUrl.length > 0) {
        verification.dataQuality.validImages++;
      }
      
      if (product.productUrl && product.productUrl.includes('donghae-mall.com')) {
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
    
    // Donghae specialty analysis
    const specialtyKeywords = {
      '수산물': donghaeProducts.filter(p => p.category.includes('수산물')).length,
      '명태/코다리': donghaeProducts.filter(p => p.title.includes('명태') || p.title.includes('코다리') || p.title.includes('묵호태')).length,
      '오징어': donghaeProducts.filter(p => p.title.includes('오징어') || p.title.includes('한치')).length,
      '복어': donghaeProducts.filter(p => p.title.includes('복어')).length,
      '게류': donghaeProducts.filter(p => p.title.includes('홍게') || p.title.includes('대게')).length,
      '가자미': donghaeProducts.filter(p => p.title.includes('가자미')).length,
      '발효식품': donghaeProducts.filter(p => p.category.includes('발효식품')).length,
      '농산물': donghaeProducts.filter(p => p.category.includes('농산물')).length
    };
    
    const report = {
      timestamp: new Date().toISOString(),
      mallName: '동해몰',
      mallId: 'donghae',
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
    const reportPath = path.join(__dirname, 'output/donghae-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    // Console output
    console.log('\n📋 Verification Results:');
    console.log(`📦 Total Donghae products: ${verification.totalProducts}`);
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
    
    console.log('\n🎯 Donghae Regional Specialties:');
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
verifyDonghaeRegistration()
  .then((report) => {
    console.log('🎉 Donghae Mall verification completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });