import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  mallId: string;
  mallName: string;
  url: string;
}

async function verifyOnsimRegistration() {
  console.log('Verifying 영양온심마켓 product registration...');
  
  // Load products from main database
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  
  // Filter onsim products
  const onsimProducts = products.filter(p => p.mallId === 'onsim');
  
  console.log(`\n=== Registration Verification ===`);
  console.log(`Total products in database: ${products.length}`);
  console.log(`영양온심마켓 products: ${onsimProducts.length}`);
  
  // Verify data quality
  let validProducts = 0;
  let missingNames = 0;
  let missingPrices = 0;
  let missingImages = 0;
  let missingUrls = 0;
  
  const issues: string[] = [];
  
  onsimProducts.forEach((product, index) => {
    const productIssues: string[] = [];
    
    if (!product.name || product.name.trim() === '') {
      missingNames++;
      productIssues.push('missing name');
    }
    
    if (!product.price || product.price.trim() === '' || product.price === '0원') {
      missingPrices++;
      productIssues.push('missing/invalid price');
    }
    
    if (!product.image || product.image.trim() === '') {
      missingImages++;
      productIssues.push('missing image');
    }
    
    if (!product.url || product.url.trim() === '') {
      missingUrls++;
      productIssues.push('missing URL');
    }
    
    if (!product.mallName || product.mallName !== '영양온심마켓') {
      productIssues.push('incorrect mall name');
    }
    
    if (!product.mallId || product.mallId !== 'onsim') {
      productIssues.push('incorrect mall ID');
    }
    
    if (productIssues.length === 0) {
      validProducts++;
    } else {
      issues.push(`Product ${index + 1} (${product.id}): ${productIssues.join(', ')}`);
    }
  });
  
  console.log(`\n=== Data Quality Report ===`);
  console.log(`✅ Valid products: ${validProducts}/${onsimProducts.length}`);
  console.log(`⚠ Missing names: ${missingNames}`);
  console.log(`⚠ Missing prices: ${missingPrices}`);
  console.log(`⚠ Missing images: ${missingImages}`);
  console.log(`⚠ Missing URLs: ${missingUrls}`);
  
  if (issues.length > 0) {
    console.log(`\n❌ Issues found:`);
    issues.slice(0, 10).forEach(issue => console.log(`  ${issue}`));
    if (issues.length > 10) {
      console.log(`  ... and ${issues.length - 10} more issues`);
    }
  }
  
  // Category analysis
  const categories: { [key: string]: number } = {};
  onsimProducts.forEach(product => {
    const firstWord = product.name.split(' ')[0] || product.name.split('')[0];
    categories[firstWord] = (categories[firstWord] || 0) + 1;
  });
  
  console.log(`\n=== Category Distribution ===`);
  Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([category, count]) => {
      console.log(`${category}: ${count}개`);
    });
  
  // Price range analysis
  const prices = onsimProducts
    .map(p => parseInt(p.price.replace(/[^\d]/g, '')))
    .filter(p => !isNaN(p))
    .sort((a, b) => a - b);
  
  if (prices.length > 0) {
    console.log(`\n=== Price Range Analysis ===`);
    console.log(`Lowest price: ${prices[0].toLocaleString()}원`);
    console.log(`Highest price: ${prices[prices.length - 1].toLocaleString()}원`);
    console.log(`Average price: ${Math.round(prices.reduce((a, b) => a + b, 0) / prices.length).toLocaleString()}원`);
    console.log(`Median price: ${prices[Math.floor(prices.length / 2)].toLocaleString()}원`);
  }
  
  // Sample products
  console.log(`\n=== Sample Products ===`);
  onsimProducts.slice(0, 5).forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Price: ${product.price}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   URL: ${product.url}`);
    console.log('');
  });
  
  const verificationReport = {
    timestamp: new Date().toISOString(),
    mallId: 'onsim',
    mallName: '영양온심마켓',
    totalProductsInDatabase: products.length,
    onsimProducts: onsimProducts.length,
    validProducts,
    dataQuality: {
      missingNames,
      missingPrices,
      missingImages,
      missingUrls
    },
    categories,
    priceAnalysis: prices.length > 0 ? {
      count: prices.length,
      min: prices[0],
      max: prices[prices.length - 1],
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      median: prices[Math.floor(prices.length / 2)]
    } : null,
    sampleProducts: onsimProducts.slice(0, 5),
    issues: issues.slice(0, 20)
  };
  
  const reportPath = path.join(__dirname, 'output', 'onsim-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
  console.log(`📋 Verification report saved: ${reportPath}`);
  
  return verificationReport;
}

if (require.main === module) {
  verifyOnsimRegistration().catch(console.error);
}

export { verifyOnsimRegistration };