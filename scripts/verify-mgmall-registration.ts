import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  mallId: string;
  mallName: string;
  url: string;
  category?: string;
}

interface RegistrationSummary {
  mallName: string;
  totalProducts: number;
  registeredProducts: number;
  skippedProducts: number;
  newTotalInDatabase: number;
  registrationDate: string;
}

async function verifyMgmallRegistration() {
  console.log('🔍 Starting verification of 문경몰 product registration...\n');

  // Read the main products database
  const productsPath = path.join(__dirname, '../src/data/products.json');
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

  // Read the registration summary
  const summaryPath = path.join(__dirname, 'output/mgmall-registration-summary.json');
  let registrationSummary: RegistrationSummary | null = null;
  
  if (fs.existsSync(summaryPath)) {
    registrationSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  }

  // Read the scraped products
  const scrapedPath = path.join(__dirname, 'output/mgmall-products.json');
  let scrapedProducts: Product[] = [];
  
  if (fs.existsSync(scrapedPath)) {
    scrapedProducts = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'));
  }

  // Filter products from 문경몰
  const mgmallProducts = products.filter(product => 
    product.mallId === 'mgmall' || product.mallName === '문경몰'
  );

  console.log('📊 Registration Verification Results:');
  console.log('=====================================\n');

  // Basic counts
  console.log(`📦 Total products in main database: ${products.length.toLocaleString()}`);
  console.log(`🏪 문경몰 products found: ${mgmallProducts.length}`);
  console.log(`📄 Originally scraped products: ${scrapedProducts.length}`);
  
  if (registrationSummary) {
    console.log(`✅ Registered according to summary: ${registrationSummary.productsAdded}`);
  }

  // Verify product data quality
  console.log('\n🔍 Data Quality Analysis:');
  console.log('-------------------------');

  let validProducts = 0;
  let invalidPrices = 0;
  let missingImages = 0;
  let shortNames = 0;
  let duplicateUrls = new Set();

  mgmallProducts.forEach(product => {
    let isValid = true;

    // Check price validity
    if (!product.price || product.price === '0원' || !product.price.match(/[\d,]+원$/)) {
      invalidPrices++;
      isValid = false;
    }

    // Check image URL
    if (!product.image || product.image === 'No image available') {
      missingImages++;
      isValid = false;
    }

    // Check name length
    if (!product.name || product.name.length < 3) {
      shortNames++;
      isValid = false;
    }

    // Check for duplicate URLs
    if (duplicateUrls.has(product.url)) {
      console.log(`⚠️ Duplicate URL found: ${product.url}`);
    } else {
      duplicateUrls.add(product.url);
    }

    if (isValid) validProducts++;
  });

  console.log(`✅ Valid products: ${validProducts}`);
  console.log(`❌ Products with invalid prices: ${invalidPrices}`);
  console.log(`🖼️ Products with missing images: ${missingImages}`);
  console.log(`📝 Products with short names: ${shortNames}`);
  console.log(`🔗 Unique product URLs: ${duplicateUrls.size}\n`);

  // Sample products for manual verification
  console.log('📋 Sample Registered Products (first 5):');
  console.log('----------------------------------------');
  mgmallProducts.slice(0, 5).forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   💰 Price: ${product.price}`);
    console.log(`   🔗 URL: ${product.url}`);
    console.log(`   🏪 Mall: ${product.mallName} (ID: ${product.mallId})`);
    console.log();
  });

  // Check for common categories/product types
  const productTypes = new Set();
  mgmallProducts.forEach(product => {
    if (product.name.includes('오미자')) productTypes.add('오미자 제품');
    if (product.name.includes('버섯')) productTypes.add('버섯');
    if (product.name.includes('감자')) productTypes.add('감자');
    if (product.name.includes('요구르트')) productTypes.add('유제품');
    if (product.name.includes('참기름') || product.name.includes('들기름')) productTypes.add('기름류');
    if (product.name.includes('돼지') || product.name.includes('한돈')) productTypes.add('돼지고기');
    if (product.name.includes('꿀')) productTypes.add('꿀');
    if (product.name.includes('쌀')) productTypes.add('쌀/곡류');
    if (product.name.includes('김치') || product.name.includes('동치미')) productTypes.add('김치/절임');
    if (product.name.includes('식초')) productTypes.add('식초');
  });

  console.log(`📂 Product types found: ${productTypes.size}`);
  if (productTypes.size > 0) {
    console.log(`   Types: ${Array.from(productTypes).join(', ')}`);
  }
  console.log();

  // Verification summary
  const verificationResult = {
    mallName: '문경몰',
    mallId: 'mgmall',
    totalInDatabase: mgmallProducts.length,
    validProducts,
    invalidPrices,
    missingImages,
    shortNames,
    uniqueUrls: duplicateUrls.size,
    productTypes: Array.from(productTypes),
    sampleProducts: mgmallProducts.slice(0, 3).map(p => ({
      name: p.name,
      price: p.price,
      url: p.url
    })),
    verificationDate: new Date().toISOString(),
    registrationSummary
  };

  // Save verification report
  const verificationPath = path.join(__dirname, 'output/mgmall-verification-report.json');
  fs.writeFileSync(verificationPath, JSON.stringify(verificationResult, null, 2));

  console.log('💾 Verification Results:');
  console.log('========================');
  console.log(`✅ Successfully verified 문경몰 product registration`);
  console.log(`📊 ${validProducts}/${mgmallProducts.length} products have valid data`);
  console.log(`📁 Verification report saved: ${verificationPath}\n`);

  // Final status
  if (validProducts === mgmallProducts.length) {
    console.log('🎉 All products passed verification! Registration is complete and successful.');
  } else {
    console.log(`⚠️ ${mgmallProducts.length - validProducts} products have data quality issues but are registered.`);
  }

  return verificationResult;
}

// Run verification
verifyMgmallRegistration()
  .then(() => {
    console.log('\n✅ Verification completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });