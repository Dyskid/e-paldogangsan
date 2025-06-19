import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

function verifyIndividualProductsAllMalls() {
  console.log('🔍 Verifying individual products across all malls...\n');
  
  // Read products from database
  const productsData = readFileSync('./src/data/products.json', 'utf-8');
  const products: Product[] = JSON.parse(productsData);
  
  console.log(`📊 Total products in database: ${products.length}`);
  
  // Group by mall
  const productsByMall: { [mall: string]: Product[] } = {};
  products.forEach(product => {
    const mallId = product.mall?.mallId || 'unknown';
    if (!productsByMall[mallId]) {
      productsByMall[mallId] = [];
    }
    productsByMall[mallId].push(product);
  });
  
  const mallAnalysis: any[] = [];
  
  Object.entries(productsByMall).forEach(([mallId, mallProducts]) => {
    // Individual product indicators
    const withQuantities = mallProducts.filter(p => 
      /\d+\s*(g|kg|ml|L|개|포|병|통|팩|리터|그램|킬로|미터|센치|인치)/.test(p.name || '')
    ).length;
    
    const withBrands = mallProducts.filter(p => 
      /\[.*?\]/.test(p.name || '') || /\(.*?\)/.test(p.name || '')
    ).length;
    
    const withPrices = mallProducts.filter(p => p.price > 0).length;
    
    const withImages = mallProducts.filter(p => p.image && p.image.trim() !== '').length;
    
    const avgNameLength = mallProducts.reduce((sum, p) => sum + (p.name?.length || 0), 0) / mallProducts.length;
    
    const foodProducts = mallProducts.filter(p => 
      p.category === '농축수산물' || p.category === '가공식품' || p.category === 'food'
    ).length;
    
    // Quality score calculation
    const quantityScore = (withQuantities / mallProducts.length) * 100;
    const brandScore = (withBrands / mallProducts.length) * 100;
    const priceScore = (withPrices / mallProducts.length) * 100;
    const imageScore = (withImages / mallProducts.length) * 100;
    const nameScore = avgNameLength > 10 ? 100 : (avgNameLength / 10) * 100;
    
    const overallScore = (quantityScore + brandScore + priceScore + imageScore + nameScore) / 5;
    
    const analysis = {
      mallId,
      mallName: mallProducts[0]?.mall?.mallName || 'Unknown',
      totalProducts: mallProducts.length,
      qualityMetrics: {
        withQuantities,
        withBrands,
        withPrices,
        withImages,
        foodProducts,
        avgNameLength: Math.round(avgNameLength * 100) / 100
      },
      qualityScores: {
        quantity: Math.round(quantityScore),
        brand: Math.round(brandScore),
        price: Math.round(priceScore),
        image: Math.round(imageScore),
        nameLength: Math.round(nameScore),
        overall: Math.round(overallScore)
      },
      sampleProducts: mallProducts.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        hasQuantity: /\d+\s*(g|kg|ml|L|개|포|병|통|팩)/.test(p.name || ''),
        hasBrand: /\[.*?\]/.test(p.name || ''),
        category: p.category
      }))
    };
    
    mallAnalysis.push(analysis);
  });
  
  // Sort by overall score (best first)
  mallAnalysis.sort((a, b) => b.qualityScores.overall - a.qualityScores.overall);
  
  const report = {
    timestamp: new Date().toISOString(),
    totalProducts: products.length,
    totalMalls: mallAnalysis.length,
    overallMetrics: {
      avgProductsPerMall: Math.round(products.length / mallAnalysis.length),
      highQualityMalls: mallAnalysis.filter(m => m.qualityScores.overall >= 80).length,
      mediumQualityMalls: mallAnalysis.filter(m => m.qualityScores.overall >= 60 && m.qualityScores.overall < 80).length,
      lowQualityMalls: mallAnalysis.filter(m => m.qualityScores.overall < 60).length
    },
    mallAnalysis
  };
  
  writeFileSync('./scripts/output/individual-products-verification-all-malls.json', JSON.stringify(report, null, 2));
  
  // Display results
  console.log('🏪 Mall Quality Analysis:');
  console.log(`✅ High quality malls (80%+): ${report.overallMetrics.highQualityMalls}`);
  console.log(`🔶 Medium quality malls (60-79%): ${report.overallMetrics.mediumQualityMalls}`);
  console.log(`❌ Low quality malls (<60%): ${report.overallMetrics.lowQualityMalls}`);
  
  console.log('\n📊 Top 5 Quality Malls:');
  mallAnalysis.slice(0, 5).forEach((mall, i) => {
    console.log(`${i + 1}. ${mall.mallName} (${mall.mallId})`);
    console.log(`   Products: ${mall.totalProducts} | Overall Score: ${mall.qualityScores.overall}%`);
    console.log(`   Quantities: ${mall.qualityMetrics.withQuantities}/${mall.totalProducts} | Brands: ${mall.qualityMetrics.withBrands}/${mall.totalProducts}`);
  });
  
  if (report.overallMetrics.lowQualityMalls > 0) {
    console.log('\n❌ Low Quality Malls (Need Re-scraping):');
    mallAnalysis.filter(m => m.qualityScores.overall < 60).forEach(mall => {
      console.log(`   ${mall.mallName} (${mall.mallId}) - Score: ${mall.qualityScores.overall}%`);
      console.log(`     Sample: "${mall.sampleProducts[0]?.name}"`);
    });
  }
  
  console.log('\n✅ Analysis saved to: ./scripts/output/individual-products-verification-all-malls.json');
}

// Run verification
verifyIndividualProductsAllMalls();