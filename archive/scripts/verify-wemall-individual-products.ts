import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

function verifyWemallIndividualProducts() {
  console.log('🔍 Verifying 우리몰 individual products (not categories)...\n');
  
  // Read products from database
  const productsData = readFileSync('./src/data/products.json', 'utf-8');
  const products: Product[] = JSON.parse(productsData);
  
  // Filter wemall products
  const wemallProducts = products.filter(p => p.id.startsWith('wemall-'));
  
  console.log(`📊 Total products in database: ${products.length}`);
  console.log(`📦 우리몰 products: ${wemallProducts.length}`);
  
  // Check for category-like patterns (these would indicate categories were registered as products)
  const categoryPatterns = [
    /^식품\/농산품$/,
    /^차\/음료\/과자\/가공식품$/,
    /^건강식품\/다이어트$/,
    /^생활용품$/,
    /^사무용품$/,
    /^디지털\/가전$/,
    /^스포츠\/건강$/,
    /^아동용품\/취미$/,
    /^청소용품$/,
    /^공사\/인쇄$/,
    /^기타$/,
    /^BEST상품$/,
    /^관공서구매상품$/,
    /^공동구매상품$/,
    /^장애인\s*기업\s*제품$/
  ];
  
  // Analyze individual product characteristics
  const individualProductChecks = {
    withSpecificQuantities: 0,
    withBrandNames: 0,
    withDetailedDescriptions: 0,
    withSpecificWeights: 0,
    potentialCategories: [] as string[]
  };
  
  wemallProducts.forEach(product => {
    const title = product.name || '';
    
    // Check for quantity indicators (individual products should have these)
    if (/\d+g|\d+kg|\d+ml|\d+L|\d+개|\d+포|\d+병|\d+통|\d+팩/.test(title)) {
      individualProductChecks.withSpecificQuantities++;
    }
    
    // Check for brand names in brackets (individual products should have these)
    if (/\[.*?\]/.test(title)) {
      individualProductChecks.withBrandNames++;
    }
    
    // Check for detailed descriptions (individual products should have these)
    if (title.length > 20) {
      individualProductChecks.withDetailedDescriptions++;
    }
    
    // Check for weight/volume specifications
    if (/\d+\.?\d*\s*(g|kg|ml|L|개|포|병|통|팩)/.test(title)) {
      individualProductChecks.withSpecificWeights++;
    }
    
    // Check if title matches category patterns
    const isCategory = categoryPatterns.some(pattern => pattern.test(title.trim()));
    if (isCategory) {
      individualProductChecks.potentialCategories.push(title);
    }
  });
  
  // Data quality analysis
  const dataQuality = {
    withTitles: wemallProducts.filter(p => p.name && p.name.trim() !== '').length,
    withPrices: wemallProducts.filter(p => p.price > 0).length,
    withImages: wemallProducts.filter(p => p.image && p.image.trim() !== '').length,
    withUrls: wemallProducts.filter(p => p.url && p.url.trim() !== '').length,
    withCategories: wemallProducts.filter(p => p.category && p.category.trim() !== '').length,
    withValidPrices: wemallProducts.filter(p => p.price > 0 && p.price < 10000000).length,
    withDiscounts: wemallProducts.filter(p => p.originalPrice && p.originalPrice > p.price).length,
    foodProducts: wemallProducts.filter(p => 
      p.category === '농축수산물' || p.category === '가공식품'
    ).length
  };
  
  // Generate verification report
  const report = {
    timestamp: new Date().toISOString(),
    totalProducts: wemallProducts.length,
    individualProductVerification: {
      withSpecificQuantities: individualProductChecks.withSpecificQuantities,
      withBrandNames: individualProductChecks.withBrandNames,
      withDetailedDescriptions: individualProductChecks.withDetailedDescriptions,
      withSpecificWeights: individualProductChecks.withSpecificWeights,
      potentialCategories: individualProductChecks.potentialCategories,
      isAllIndividualProducts: individualProductChecks.potentialCategories.length === 0
    },
    dataQuality,
    foodProductsOnly: {
      allAreFoodProducts: dataQuality.foodProducts === wemallProducts.length,
      foodProductCount: dataQuality.foodProducts,
      nonFoodProductCount: wemallProducts.length - dataQuality.foodProducts
    },
    sampleProducts: wemallProducts.slice(0, 10).map(p => ({
      id: p.id,
      title: p.name || '(제목 없음)',
      price: p.price,
      category: p.category,
      hasQuantity: /\d+g|\d+kg|\d+ml|\d+L|\d+개|\d+포|\d+병|\d+통|\d+팩/.test(p.name || ''),
      hasBrand: /\[.*?\]/.test(p.name || ''),
      hasImage: !!p.image,
      hasUrl: !!p.url
    }))
  };
  
  writeFileSync('./scripts/output/wemall-individual-products-verification.json', JSON.stringify(report, null, 2));
  
  // Display results
  console.log('\n🔍 Individual Product Verification:');
  console.log(`✅ Products with specific quantities: ${individualProductChecks.withSpecificQuantities}/${wemallProducts.length}`);
  console.log(`✅ Products with brand names: ${individualProductChecks.withBrandNames}/${wemallProducts.length}`);
  console.log(`✅ Products with detailed descriptions: ${individualProductChecks.withDetailedDescriptions}/${wemallProducts.length}`);
  console.log(`✅ Products with specific weights/volumes: ${individualProductChecks.withSpecificWeights}/${wemallProducts.length}`);
  
  if (individualProductChecks.potentialCategories.length === 0) {
    console.log('✅ All products are individual products (no categories detected)');
  } else {
    console.log(`❌ Found ${individualProductChecks.potentialCategories.length} potential categories:`);
    individualProductChecks.potentialCategories.forEach(cat => console.log(`  - ${cat}`));
  }
  
  console.log('\n🥕 Food Product Verification:');
  if (dataQuality.foodProducts === wemallProducts.length) {
    console.log('✅ All products are food/agricultural products');
  } else {
    console.log(`❌ Found ${wemallProducts.length - dataQuality.foodProducts} non-food products`);
  }
  
  console.log('\n📋 Data Quality:');
  console.log(`✅ With titles: ${dataQuality.withTitles}/${wemallProducts.length}`);
  console.log(`💰 With prices: ${dataQuality.withPrices}/${wemallProducts.length}`);
  console.log(`🖼️ With images: ${dataQuality.withImages}/${wemallProducts.length}`);
  console.log(`🔗 With URLs: ${dataQuality.withUrls}/${wemallProducts.length}`);
  
  console.log('\n📦 Sample Individual Products:');
  report.sampleProducts.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
    console.log(`   Quantity: ${p.hasQuantity ? '✅' : '❌'} | Brand: ${p.hasBrand ? '✅' : '❌'} | Price: ₩${p.price.toLocaleString()}`);
  });
  
  console.log('\n✅ Verification report saved to: ./scripts/output/wemall-individual-products-verification.json');
}

// Run verification
verifyWemallIndividualProducts();