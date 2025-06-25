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
  totalIksanProducts: number;
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
  console.log('=== Verifying 익산몰 Product Registration ===');

  // Read all products
  const allProducts: Product[] = JSON.parse(
    fs.readFileSync('src/data/products.json', 'utf8')
  );

  // Filter 익산몰 products
  const iksanProducts = allProducts.filter(product => product.mall === '익산몰');
  
  console.log(`Total products in database: ${allProducts.length}`);
  console.log(`익산몰 products: ${iksanProducts.length}`);

  // Data quality checks
  const dataQualityChecks = {
    productsWithPrices: iksanProducts.filter(p => p.price && p.price !== '0').length,
    productsWithImages: iksanProducts.filter(p => p.image && p.image.length > 0).length,
    productsWithDescriptions: iksanProducts.filter(p => p.description && p.description.length > 0).length,
    productsWithCategories: iksanProducts.filter(p => p.category && p.category.length > 0).length,
    duplicateUrls: 0,
    invalidProducts: 0
  };

  // Check for duplicates
  const urlCounts = new Map<string, number>();
  iksanProducts.forEach(product => {
    const count = urlCounts.get(product.url) || 0;
    urlCounts.set(product.url, count + 1);
  });
  dataQualityChecks.duplicateUrls = Array.from(urlCounts.values()).filter(count => count > 1).length;

  // Validate products and collect issues
  const issuesFound: string[] = [];
  let invalidProductCount = 0;

  iksanProducts.forEach((product, index) => {
    const productIssues = validateProduct(product);
    if (productIssues.length > 0) {
      invalidProductCount++;
      issuesFound.push(`Product ${index + 1} (${product.title}): ${productIssues.join(', ')}`);
    }
  });
  dataQualityChecks.invalidProducts = invalidProductCount;

  // Category analysis
  const categoryAnalysis: VerificationReport['categoryAnalysis'] = {};
  const categorizedProducts = iksanProducts.reduce((acc, product) => {
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

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (dataQualityChecks.productsWithPrices / iksanProducts.length < 1) {
    recommendations.push('Some products are missing prices - consider re-scraping or manual entry');
  }
  if (dataQualityChecks.productsWithImages / iksanProducts.length < 0.8) {
    recommendations.push('Many products are missing images - consider improving image extraction');
  }
  if (dataQualityChecks.duplicateUrls > 0) {
    recommendations.push('Remove duplicate products with the same URLs');
  }
  if (dataQualityChecks.invalidProducts > 0) {
    recommendations.push(`${dataQualityChecks.invalidProducts} products have validation issues - review and fix`);
  }
  
  // Only keep significant issues
  const significantIssues = issuesFound.slice(0, 10); // Limit to first 10 issues

  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    mall: '익산몰',
    totalIksanProducts: iksanProducts.length,
    totalDatabaseProducts: allProducts.length,
    dataQualityChecks,
    categoryAnalysis,
    issuesFound: significantIssues,
    recommendations
  };

  // Save verification report
  fs.writeFileSync(
    'scripts/output/iksan-verification-report.json',
    JSON.stringify(report, null, 2),
    'utf8'
  );

  // Display results
  console.log('\n=== VERIFICATION RESULTS ===');
  console.log(`익산몰 products verified: ${iksanProducts.length}`);
  console.log('\nData Quality:');
  console.log(`  Products with prices: ${dataQualityChecks.productsWithPrices}/${iksanProducts.length} (${((dataQualityChecks.productsWithPrices/iksanProducts.length)*100).toFixed(1)}%)`);
  console.log(`  Products with images: ${dataQualityChecks.productsWithImages}/${iksanProducts.length} (${((dataQualityChecks.productsWithImages/iksanProducts.length)*100).toFixed(1)}%)`);
  console.log(`  Products with categories: ${dataQualityChecks.productsWithCategories}/${iksanProducts.length} (${((dataQualityChecks.productsWithCategories/iksanProducts.length)*100).toFixed(1)}%)`);
  console.log(`  Invalid products: ${dataQualityChecks.invalidProducts}`);
  console.log(`  Duplicate URLs: ${dataQualityChecks.duplicateUrls}`);

  console.log('\nCategory Analysis:');
  Object.entries(categoryAnalysis).forEach(([category, analysis]) => {
    console.log(`  ${category}: ${analysis.productCount} products`);
    console.log(`    Average price: ₩${analysis.avgPrice.toLocaleString()}`);
    console.log(`    Price range: ₩${analysis.priceRange.min.toLocaleString()} - ₩${analysis.priceRange.max.toLocaleString()}`);
  });

  if (significantIssues.length > 0) {
    console.log(`\nIssues Found (showing first ${significantIssues.length}):`);
    significantIssues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  }

  if (recommendations.length > 0) {
    console.log('\nRecommendations:');
    recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
  }

  console.log(`\n✓ Verification report saved to iksan-verification-report.json`);
  
  // Final assessment
  const qualityScore = (
    (dataQualityChecks.productsWithPrices / iksanProducts.length) * 0.4 +
    (dataQualityChecks.productsWithImages / iksanProducts.length) * 0.2 +
    (dataQualityChecks.productsWithCategories / iksanProducts.length) * 0.2 +
    ((iksanProducts.length - dataQualityChecks.invalidProducts) / iksanProducts.length) * 0.2
  ) * 100;

  console.log(`\n🎯 Overall Data Quality Score: ${qualityScore.toFixed(1)}%`);
  
  if (qualityScore >= 95) {
    console.log('✅ Excellent data quality! Ready for production.');
  } else if (qualityScore >= 85) {
    console.log('✅ Good data quality with minor issues.');
  } else if (qualityScore >= 70) {
    console.log('⚠️ Acceptable data quality but improvements recommended.');
  } else {
    console.log('❌ Poor data quality - significant improvements needed.');
  }
}

if (require.main === module) {
  main();
}