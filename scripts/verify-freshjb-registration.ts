import * as fs from 'fs';

interface Product {
  id: string;
  title: string;
  image: string;
  price: string;
  originalPrice?: string;
  description: string;
  category: string;
  subcategory?: string;
  mall: string;
  url: string;
  region: string;
  tags: string[];
}

interface VerificationReport {
  timestamp: string;
  mall: string;
  totalFreshjbProducts: number;
  totalDatabaseProducts: number;
  dataQualityChecks: {
    productsWithPrices: number;
    productsWithImages: number;
    productsWithDescriptions: number;
    productsWithCategories: number;
    duplicateUrls: number;
    invalidProducts: number;
  };
  categoryAnalysis: {
    [category: string]: {
      productCount: number;
      avgPrice: number;
      priceRange: { min: number; max: number };
      sampleProducts: string[];
    };
  };
  issuesFound: string[];
  recommendations: string[];
  platformNote: string;
}

function validateProduct(product: Product): string[] {
  const issues: string[] = [];
  
  // Check for missing required fields
  if (!product.title || product.title.trim().length === 0) {
    issues.push('Missing title');
  }
  if (!product.price || product.price === '0') {
    issues.push('Missing or zero price');
  }
  if (!product.category) {
    issues.push('Missing category');
  }
  if (!product.url) {
    issues.push('Missing URL');
  }
  
  // Check for category-like titles (shouldn't be products)
  const categoryKeywords = ['category', '카테고리', '분류', 'menu', '메뉴'];
  if (categoryKeywords.some(keyword => product.title.toLowerCase().includes(keyword))) {
    issues.push('Title appears to be a category, not a product');
  }
  
  // Check title length
  if (product.title && product.title.length < 3) {
    issues.push('Title too short');
  }
  
  // Check price format
  if (product.price && !/^\d+$/.test(product.price)) {
    issues.push('Invalid price format');
  }
  
  return issues;
}

function calculateStats(products: Product[]) {
  const prices = products
    .map(p => parseInt(p.price))
    .filter(p => !isNaN(p) && p > 0);
    
  if (prices.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
  };
}

function main() {
  console.log('=== Verifying 전북생생장터 Product Registration ===');

  // Read all products
  const allProducts: Product[] = JSON.parse(
    fs.readFileSync('src/data/products.json', 'utf8')
  );

  // Filter 전북생생장터 products
  const freshjbProducts = allProducts.filter(product => product.mall === '전북생생장터');
  
  console.log(`Total products in database: ${allProducts.length}`);
  console.log(`전북생생장터 products: ${freshjbProducts.length}`);

  // Data quality checks
  const dataQualityChecks = {
    productsWithPrices: freshjbProducts.filter(p => p.price && p.price !== '0').length,
    productsWithImages: freshjbProducts.filter(p => p.image && p.image.length > 0).length,
    productsWithDescriptions: freshjbProducts.filter(p => p.description && p.description.length > 0).length,
    productsWithCategories: freshjbProducts.filter(p => p.category && p.category.length > 0).length,
    duplicateUrls: 0,
    invalidProducts: 0
  };

  // Check for duplicates
  const urlCounts = new Map<string, number>();
  freshjbProducts.forEach(product => {
    const count = urlCounts.get(product.url) || 0;
    urlCounts.set(product.url, count + 1);
  });
  dataQualityChecks.duplicateUrls = Array.from(urlCounts.values()).filter(count => count > 1).length;

  // Validate products and collect issues
  const issuesFound: string[] = [];
  let invalidProductCount = 0;

  freshjbProducts.forEach((product, index) => {
    const productIssues = validateProduct(product);
    if (productIssues.length > 0) {
      invalidProductCount++;
      issuesFound.push(`Product ${index + 1} (${product.title}): ${productIssues.join(', ')}`);
    }
  });
  dataQualityChecks.invalidProducts = invalidProductCount;

  // Category analysis
  const categoryAnalysis: VerificationReport['categoryAnalysis'] = {};
  const categorizedProducts = freshjbProducts.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as { [key: string]: Product[] });

  Object.entries(categorizedProducts).forEach(([category, products]) => {
    const stats = calculateStats(products);
    categoryAnalysis[category] = {
      productCount: products.length,
      avgPrice: stats.avg,
      priceRange: { min: stats.min, max: stats.max },
      sampleProducts: products.slice(0, 3).map(p => p.title)
    };
  });

  // Generate recommendations specific to React SPA challenges
  const recommendations: string[] = [];
  
  if (freshjbProducts.length < 10) {
    recommendations.push('Consider implementing headless browser scraping (Puppeteer/Playwright) for comprehensive product extraction');
  }
  if (dataQualityChecks.productsWithPrices / freshjbProducts.length < 1) {
    recommendations.push('Some products are missing prices - verify sample data accuracy');
  }
  if (dataQualityChecks.duplicateUrls > 0) {
    recommendations.push('Remove duplicate products with the same URLs');
  }
  
  // Add React SPA specific recommendations
  recommendations.push('Contact site administrator for API access or data feed');
  recommendations.push('Monitor for site updates that might expose static content endpoints');
  recommendations.push('Consider using browser automation tools for dynamic content extraction');
  
  // Only keep significant issues
  const significantIssues = issuesFound.slice(0, 10);

  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    mall: '전북생생장터',
    totalFreshjbProducts: freshjbProducts.length,
    totalDatabaseProducts: allProducts.length,
    dataQualityChecks,
    categoryAnalysis,
    issuesFound: significantIssues,
    recommendations,
    platformNote: 'freshjb.com is a React SPA with NHN Commerce backend. Current products are samples for framework compatibility. Actual scraping requires JavaScript execution capabilities.'
  };

  // Save verification report
  fs.writeFileSync(
    'scripts/output/freshjb-verification-report.json',
    JSON.stringify(report, null, 2),
    'utf8'
  );

  // Display results
  console.log('\n=== VERIFICATION RESULTS ===');
  console.log(`전북생생장터 products verified: ${freshjbProducts.length}`);
  console.log('\nData Quality:');
  console.log(`  Products with prices: ${dataQualityChecks.productsWithPrices}/${freshjbProducts.length} (${((dataQualityChecks.productsWithPrices/freshjbProducts.length)*100).toFixed(1)}%)`);
  console.log(`  Products with images: ${dataQualityChecks.productsWithImages}/${freshjbProducts.length} (${((dataQualityChecks.productsWithImages/freshjbProducts.length)*100).toFixed(1)}%)`);
  console.log(`  Products with categories: ${dataQualityChecks.productsWithCategories}/${freshjbProducts.length} (${((dataQualityChecks.productsWithCategories/freshjbProducts.length)*100).toFixed(1)}%)`);
  console.log(`  Invalid products: ${dataQualityChecks.invalidProducts}`);
  console.log(`  Duplicate URLs: ${dataQualityChecks.duplicateUrls}`);

  console.log('\nCategory Analysis:');
  Object.entries(categoryAnalysis).forEach(([category, analysis]) => {
    console.log(`  ${category}: ${analysis.productCount} products`);
    console.log(`    Average price: ₩${analysis.avgPrice.toLocaleString()}`);
    console.log(`    Price range: ₩${analysis.priceRange.min.toLocaleString()} - ₩${analysis.priceRange.max.toLocaleString()}`);
  });

  if (significantIssues.length > 0) {
    console.log(`\nIssues Found:`);
    significantIssues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  }

  console.log('\nRecommendations:');
  recommendations.forEach(rec => {
    console.log(`  - ${rec}`);
  });

  console.log('\n⚠️  PLATFORM NOTE:');
  console.log(report.platformNote);

  console.log(`\n✓ Verification report saved to freshjb-verification-report.json`);
  
  // Final assessment
  const qualityScore = (
    (dataQualityChecks.productsWithPrices / freshjbProducts.length) * 0.4 +
    (dataQualityChecks.productsWithImages / freshjbProducts.length) * 0.2 +
    (dataQualityChecks.productsWithCategories / freshjbProducts.length) * 0.2 +
    ((freshjbProducts.length - dataQualityChecks.invalidProducts) / freshjbProducts.length) * 0.2
  ) * 100;

  console.log(`\n🎯 Sample Data Quality Score: ${qualityScore.toFixed(1)}%`);
  
  if (qualityScore >= 95) {
    console.log('✅ Excellent sample data quality - framework ready.');
  } else if (qualityScore >= 85) {
    console.log('✅ Good sample data quality with minor issues.');
  } else if (qualityScore >= 70) {
    console.log('⚠️ Acceptable sample data quality but improvements recommended.');
  } else {
    console.log('❌ Poor sample data quality - significant improvements needed.');
  }
  
  console.log('\n📋 Next Steps for Production:');
  console.log('1. Implement headless browser scraping (Puppeteer/Playwright)');
  console.log('2. Contact site administrator for API access');
  console.log('3. Monitor for platform changes that expose static endpoints');
}

if (require.main === module) {
  main();
}