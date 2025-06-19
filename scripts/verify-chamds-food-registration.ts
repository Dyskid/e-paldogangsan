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
  chamdsProducts: number;
  dataQuality: {
    withTitles: number;
    withPrices: number;
    withImages: number;
    withUrls: number;
    withCategories: number;
    withValidPrices: number;
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
      '10k-30k': number;
      '30k-50k': number;
      over50k: number;
    };
  };
  individualProductCheck: {
    withSpecificQuantities: number;
    withBrandNames: number;
    withDetailedDescriptions: number;
    potentialCategories: string[];
    isAllIndividualProducts: boolean;
  };
  sampleProducts: any[];
  issues: string[];
}

function verifyChamdsFoodRegistration() {
  console.log('🔍 Verifying 참달성 food product registration...');
  
  try {
    // Read current products
    const productsData = readFileSync('./src/data/products.json', 'utf-8');
    const allProducts: Product[] = JSON.parse(productsData);
    
    // Filter chamds products
    const chamdsProducts = allProducts.filter(p => p.id.startsWith('chamds-'));
    
    console.log(`📊 Total products in database: ${allProducts.length}`);
    console.log(`🛒 참달성 products: ${chamdsProducts.length}`);
    
    const report: VerificationReport = {
      timestamp: new Date().toISOString(),
      mall: {
        id: 'chamds',
        name: '참달성',
        region: '경상북도'
      },
      totalProducts: allProducts.length,
      chamdsProducts: chamdsProducts.length,
      dataQuality: {
        withTitles: 0,
        withPrices: 0,
        withImages: 0,
        withUrls: 0,
        withCategories: 0,
        withValidPrices: 0,
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
          '10k-30k': 0,
          '30k-50k': 0,
          over50k: 0
        }
      },
      individualProductCheck: {
        withSpecificQuantities: 0,
        withBrandNames: 0,
        withDetailedDescriptions: 0,
        potentialCategories: [],
        isAllIndividualProducts: true
      },
      sampleProducts: [],
      issues: []
    };
    
    // Analyze each chamds product
    let totalPrice = 0;
    const foodCategories = ['가공식품', '농축수산물', '음료', '과자', '차류'];
    
    chamdsProducts.forEach(product => {
      // Basic data quality checks
      if (product.name && product.name.trim()) report.dataQuality.withTitles++;
      if (product.price > 0) report.dataQuality.withPrices++;
      if (product.image && !product.image.includes('no_image')) report.dataQuality.withImages++;
      if (product.url) report.dataQuality.withUrls++;
      if (product.category) report.dataQuality.withCategories++;
      if (product.price > 100 && product.price < 1000000) report.dataQuality.withValidPrices++;
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
        else if (product.price < 30000) report.priceAnalysis.priceRanges['10k-30k']++;
        else if (product.price < 50000) report.priceAnalysis.priceRanges['30k-50k']++;
        else report.priceAnalysis.priceRanges.over50k++;
      }
      
      // Individual product checks
      const quantityPattern = /\d+\s?(g|kg|ml|L|개|봉|팩|포|세트|병)/i;
      const brandPattern = /행원정|농부\s+\w+|미드미/;
      
      if (quantityPattern.test(product.name)) {
        report.individualProductCheck.withSpecificQuantities++;
      }
      
      if (brandPattern.test(product.name)) {
        report.individualProductCheck.withBrandNames++;
      }
      
      if (product.description && product.description.length > 20) {
        report.individualProductCheck.withDetailedDescriptions++;
      }
      
      // Check for potential category products
      const categoryKeywords = ['카테고리', '전체', '모든', 'ALL', '목록'];
      if (categoryKeywords.some(keyword => product.name.includes(keyword))) {
        report.individualProductCheck.potentialCategories.push(product.id);
        report.individualProductCheck.isAllIndividualProducts = false;
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
    if (chamdsProducts.length === 0) {
      report.issues.push('No chamds products found in database');
    }
    
    const nonFoodProducts = chamdsProducts.length - report.dataQuality.onlyFoodProducts;
    if (nonFoodProducts > 0) {
      report.issues.push(`Found ${nonFoodProducts} non-food products`);
    }
    
    const withoutPrices = chamdsProducts.length - report.dataQuality.withPrices;
    if (withoutPrices > 0) {
      report.issues.push(`${withoutPrices} products without valid prices`);
    }
    
    const withoutImages = chamdsProducts.length - report.dataQuality.withImages;
    if (withoutImages > 0) {
      report.issues.push(`${withoutImages} products without images`);
    }
    
    if (report.individualProductCheck.potentialCategories.length > 0) {
      report.issues.push(`Found ${report.individualProductCheck.potentialCategories.length} potential category listings`);
    }
    
    // Add sample products
    report.sampleProducts = chamdsProducts.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      hasImage: !!p.image && !p.image.includes('no_image'),
      hasUrl: !!p.url,
      hasQuantity: /\d+\s?(g|kg|ml|L|개|봉|팩|포|세트|병)/i.test(p.name),
      hasBrand: /행원정|농부\s+\w+|미드미/.test(p.name)
    }));
    
    // Save report
    writeFileSync('./scripts/output/chamds-food-verification-final.json', JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📊 Verification Summary:');
    console.log(`✅ 참달성 products registered: ${chamdsProducts.length}`);
    console.log(`🥕 Food products only: ${report.dataQuality.onlyFoodProducts}/${chamdsProducts.length}`);
    console.log(`💰 Products with valid prices: ${report.dataQuality.withValidPrices}`);
    console.log(`🖼️ Products with images: ${report.dataQuality.withImages}`);
    console.log(`🔗 Products with URLs: ${report.dataQuality.withUrls}`);
    console.log(`📝 Products with descriptions: ${report.dataQuality.withDescriptions}`);
    
    console.log('\n💵 Price Analysis:');
    console.log(`  Min: ₩${report.priceAnalysis.minPrice.toLocaleString()}`);
    console.log(`  Max: ₩${report.priceAnalysis.maxPrice.toLocaleString()}`);
    console.log(`  Avg: ₩${report.priceAnalysis.avgPrice.toLocaleString()}`);
    
    console.log('\n📂 Category Distribution:');
    Object.entries(report.categoryDistribution).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });
    
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
    
    writeFileSync('./scripts/output/chamds-food-verification-error.json', JSON.stringify(errorInfo, null, 2));
    throw error;
  }
}

// Run verification
const report = verifyChamdsFoodRegistration();
console.log('\n✅ Verification complete!');