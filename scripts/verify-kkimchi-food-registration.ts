import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

interface VerificationReport {
  timestamp: string;
  mall: {
    id: string;
    name: string;
    region: string;
  };
  totalProducts: number;
  kkimchiProducts: number;
  dataQuality: {
    withTitles: number;
    withPrices: number;
    withImages: number;
    withUrls: number;
    withCategories: number;
    withValidPrices: number;
    withDiscounts: number;
    withDescriptions: number;
    onlyFoodProducts: number;
  };
  categoryDistribution: Record<string, number>;
  priceAnalysis: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    priceRanges: {
      under10k: number;
      '10k-20k': number;
      '20k-30k': number;
      over30k: number;
    };
  };
  individualProductCheck: {
    withSpecificQuantities: number;
    withBrandNames: number;
    withDetailedDescriptions: number;
    potentialCategories: string[];
    isAllIndividualProducts: boolean;
  };
  kimchiTypes: {
    pogikimchi: number;
    gatkimchi: number;
    kkakdugi: number;
    mugeun: number;
    specialty: number;
  };
  sampleProducts: any[];
  issues: string[];
}

function verifyKKimchiFoodRegistration() {
  console.log('🔍 Verifying 광주김치몰 food product registration...');
  
  try {
    // Read current products
    const productsData = readFileSync('./src/data/products.json', 'utf-8');
    const allProducts: Product[] = JSON.parse(productsData);
    
    // Filter kkimchi products
    const kkimchiProducts = allProducts.filter(p => p.id.startsWith('kkimchi-'));
    
    console.log(`📊 Total products in database: ${allProducts.length}`);
    console.log(`🛒 광주김치몰 products: ${kkimchiProducts.length}`);
    
    const report: VerificationReport = {
      timestamp: new Date().toISOString(),
      mall: {
        id: 'kkimchi',
        name: '광주김치몰',
        region: '광주광역시'
      },
      totalProducts: allProducts.length,
      kkimchiProducts: kkimchiProducts.length,
      dataQuality: {
        withTitles: 0,
        withPrices: 0,
        withImages: 0,
        withUrls: 0,
        withCategories: 0,
        withValidPrices: 0,
        withDiscounts: 0,
        withDescriptions: 0,
        onlyFoodProducts: 0
      },
      categoryDistribution: {},
      priceAnalysis: {
        minPrice: Number.MAX_VALUE,
        maxPrice: 0,
        avgPrice: 0,
        priceRanges: {
          under10k: 0,
          '10k-20k': 0,
          '20k-30k': 0,
          over30k: 0
        }
      },
      individualProductCheck: {
        withSpecificQuantities: 0,
        withBrandNames: 0,
        withDetailedDescriptions: 0,
        potentialCategories: [],
        isAllIndividualProducts: true
      },
      kimchiTypes: {
        pogikimchi: 0,
        gatkimchi: 0,
        kkakdugi: 0,
        mugeun: 0,
        specialty: 0
      },
      sampleProducts: [],
      issues: []
    };
    
    // Analyze each kkimchi product
    let totalPrice = 0;
    const foodCategories = ['가공식품', '농축수산물', '음료', '과자', '차류'];
    
    kkimchiProducts.forEach(product => {
      // Basic data quality checks
      if (product.name && product.name.trim()) report.dataQuality.withTitles++;
      if (product.price > 0) report.dataQuality.withPrices++;
      if (product.image && !product.image.includes('no_image')) report.dataQuality.withImages++;
      if (product.url) report.dataQuality.withUrls++;
      if (product.category) report.dataQuality.withCategories++;
      if (product.price > 100 && product.price < 100000) report.dataQuality.withValidPrices++;
      if (product.originalPrice && product.originalPrice > product.price) report.dataQuality.withDiscounts++;
      if (product.description && product.description.length > 10) report.dataQuality.withDescriptions++;
      
      // Check if it's a food product
      if (foodCategories.includes(product.category)) {
        report.dataQuality.onlyFoodProducts++;
      }
      
      // Category distribution
      if (product.category) {
        report.categoryDistribution[product.category] = (report.categoryDistribution[product.category] || 0) + 1;
      }
      
      // Price analysis
      if (product.price > 0) {
        totalPrice += product.price;
        report.priceAnalysis.minPrice = Math.min(report.priceAnalysis.minPrice, product.price);
        report.priceAnalysis.maxPrice = Math.max(report.priceAnalysis.maxPrice, product.price);
        
        if (product.price < 10000) report.priceAnalysis.priceRanges.under10k++;
        else if (product.price < 20000) report.priceAnalysis.priceRanges['10k-20k']++;
        else if (product.price < 30000) report.priceAnalysis.priceRanges['20k-30k']++;
        else report.priceAnalysis.priceRanges.over30k++;
      }
      
      // Individual product checks
      const quantityPattern = /\d+\s?(g|kg|ml|L|개|봉|팩|포|세트)/i;
      const brandPattern = /\[[^\]]+\]|^(\S+)\s/;
      
      if (quantityPattern.test(product.name)) {
        report.individualProductCheck.withSpecificQuantities++;
      }
      
      const brandMatch = product.name.match(brandPattern);
      if (brandMatch) {
        report.individualProductCheck.withBrandNames++;
      }
      
      if (product.description && product.description.length > 20) {
        report.individualProductCheck.withDetailedDescriptions++;
      }
      
      // Check for potential category products
      const categoryKeywords = ['카테고리', '전체', '모든', 'ALL', '목록', '할인전'];
      if (categoryKeywords.some(keyword => product.name.includes(keyword))) {
        report.individualProductCheck.potentialCategories.push(product.id);
        report.individualProductCheck.isAllIndividualProducts = false;
      }
      
      // Analyze kimchi types
      const name = product.name.toLowerCase();
      if (name.includes('포기') || name.includes('배추')) {
        report.kimchiTypes.pogikimchi++;
      } else if (name.includes('갓김치') || name.includes('갓')) {
        report.kimchiTypes.gatkimchi++;
      } else if (name.includes('깍두기')) {
        report.kimchiTypes.kkakdugi++;
      } else if (name.includes('묵은지')) {
        report.kimchiTypes.mugeun++;
      } else {
        report.kimchiTypes.specialty++;
      }
    });
    
    // Calculate average price
    if (report.dataQuality.withPrices > 0) {
      report.priceAnalysis.avgPrice = Math.round(totalPrice / report.dataQuality.withPrices);
    }
    
    // Fix min price if no products found
    if (report.priceAnalysis.minPrice === Number.MAX_VALUE) {
      report.priceAnalysis.minPrice = 0;
    }
    
    // Identify issues
    if (kkimchiProducts.length === 0) {
      report.issues.push('No kkimchi products found in database');
    }
    
    const nonFoodProducts = kkimchiProducts.length - report.dataQuality.onlyFoodProducts;
    if (nonFoodProducts > 0) {
      report.issues.push(`Found ${nonFoodProducts} non-food products`);
    }
    
    const withoutPrices = kkimchiProducts.length - report.dataQuality.withPrices;
    if (withoutPrices > 0) {
      report.issues.push(`${withoutPrices} products without valid prices`);
    }
    
    const withoutImages = kkimchiProducts.length - report.dataQuality.withImages;
    if (withoutImages > 0) {
      report.issues.push(`${withoutImages} products without images`);
    }
    
    if (report.individualProductCheck.potentialCategories.length > 0) {
      report.issues.push(`Found ${report.individualProductCheck.potentialCategories.length} potential category listings`);
    }
    
    // Add sample products
    report.sampleProducts = kkimchiProducts.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      category: p.category,
      hasImage: !!p.image && !p.image.includes('no_image'),
      hasUrl: !!p.url,
      hasQuantity: /\d+\s?(g|kg|ml|L|개|봉|팩|포|세트)/i.test(p.name),
      hasBrand: /\[[^\]]+\]|^(\S+)\s/.test(p.name)
    }));
    
    // Save report
    writeFileSync('./scripts/output/kkimchi-food-verification-final.json', JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📊 Verification Summary:');
    console.log(`✅ 광주김치몰 products registered: ${kkimchiProducts.length}`);
    console.log(`🥕 Food products only: ${report.dataQuality.onlyFoodProducts}/${kkimchiProducts.length}`);
    console.log(`💰 Products with valid prices: ${report.dataQuality.withValidPrices}`);
    console.log(`🖼️ Products with images: ${report.dataQuality.withImages}`);
    console.log(`🔗 Products with URLs: ${report.dataQuality.withUrls}`);
    console.log(`🏷️ Products with discounts: ${report.dataQuality.withDiscounts}`);
    console.log(`📝 Products with descriptions: ${report.dataQuality.withDescriptions}`);
    
    console.log('\n💵 Price Analysis:');
    console.log(`  Min: ₩${report.priceAnalysis.minPrice.toLocaleString()}`);
    console.log(`  Max: ₩${report.priceAnalysis.maxPrice.toLocaleString()}`);
    console.log(`  Avg: ₩${report.priceAnalysis.avgPrice.toLocaleString()}`);
    
    console.log('\n📂 Category Distribution:');
    Object.entries(report.categoryDistribution).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });
    
    console.log('\n🥬 Kimchi Type Distribution:');
    console.log(`  포기김치/배추김치: ${report.kimchiTypes.pogikimchi}`);
    console.log(`  갓김치: ${report.kimchiTypes.gatkimchi}`);
    console.log(`  깍두기: ${report.kimchiTypes.kkakdugi}`);
    console.log(`  묵은지: ${report.kimchiTypes.mugeun}`);
    console.log(`  기타 특산김치: ${report.kimchiTypes.specialty}`);
    
    console.log('\n🔍 Individual Product Analysis:');
    console.log(`  With quantities: ${report.individualProductCheck.withSpecificQuantities}`);
    console.log(`  With brand names: ${report.individualProductCheck.withBrandNames}`);
    console.log(`  With detailed descriptions: ${report.individualProductCheck.withDetailedDescriptions}`);
    console.log(`  All individual products: ${report.individualProductCheck.isAllIndividualProducts}`);
    
    if (report.issues.length > 0) {
      console.log('\n⚠️ Issues Found:');
      report.issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ No issues found!');
    }
    
    return report;
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    
    writeFileSync('./scripts/output/kkimchi-food-verification-error.json', JSON.stringify(errorInfo, null, 2));
    throw error;
  }
}

// Run verification
const report = verifyKKimchiFoodRegistration();
console.log('\n✅ Verification complete!');