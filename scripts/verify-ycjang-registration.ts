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

async function verifyYcjangRegistration() {
  console.log('🔍 Starting verification of 예천장터 product registration...\n');

  // Read the main products database
  const productsPath = path.join(__dirname, '../src/data/products.json');
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

  // Read the registration summary
  const summaryPath = path.join(__dirname, 'output/ycjang-registration-summary.json');
  let registrationSummary: RegistrationSummary | null = null;
  
  if (fs.existsSync(summaryPath)) {
    registrationSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  }

  // Read the scraped products
  const scrapedPath = path.join(__dirname, 'output/ycjang-products.json');
  let scrapedProducts: Product[] = [];
  
  if (fs.existsSync(scrapedPath)) {
    scrapedProducts = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'));
  }

  // Filter products from 예천장터
  const ycjangProducts = products.filter(product => 
    product.mallId === 'ycjang' || product.mallName === '예천장터'
  );

  console.log('📊 Registration Verification Results:');
  console.log('=====================================\n');

  // Basic counts
  console.log(`📦 Total products in main database: ${products.length.toLocaleString()}`);
  console.log(`🏪 예천장터 products found: ${ycjangProducts.length}`);
  console.log(`📄 Originally scraped products: ${scrapedProducts.length}`);
  
  if (registrationSummary) {
    console.log(`✅ Registered according to summary: ${registrationSummary.registeredProducts}`);
    console.log(`⏭️ Skipped according to summary: ${registrationSummary.skippedProducts}\n`);
  }

  // Verify product data quality
  console.log('🔍 Data Quality Analysis:');
  console.log('-------------------------');

  let validProducts = 0;
  let invalidPrices = 0;
  let missingImages = 0;
  let shortNames = 0;
  let duplicateUrls = new Set();

  ycjangProducts.forEach(product => {
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
  ycjangProducts.slice(0, 5).forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   💰 Price: ${product.price}`);
    console.log(`   🔗 URL: ${product.url}`);
    console.log(`   🏪 Mall: ${product.mallName} (ID: ${product.mallId})`);
    console.log();
  });

  // Check for common categories
  const categories = new Set(ycjangProducts.map(p => p.category).filter(Boolean));
  console.log(`📂 Product categories found: ${categories.size}`);
  if (categories.size > 0) {
    console.log(`   Categories: ${Array.from(categories).slice(0, 10).join(', ')}`);
    if (categories.size > 10) console.log(`   ... and ${categories.size - 10} more`);
  }
  console.log();

  // Verification summary
  const verificationResult = {
    mallName: '예천장터',
    mallId: 'ycjang',
    totalInDatabase: ycjangProducts.length,
    validProducts,
    invalidPrices,
    missingImages,
    shortNames,
    uniqueUrls: duplicateUrls.size,
    categories: Array.from(categories),
    sampleProducts: ycjangProducts.slice(0, 3).map(p => ({
      name: p.name,
      price: p.price,
      url: p.url
    })),
    verificationDate: new Date().toISOString(),
    registrationSummary
  };

  // Save verification report
  const verificationPath = path.join(__dirname, 'output/ycjang-verification-report.json');
  fs.writeFileSync(verificationPath, JSON.stringify(verificationResult, null, 2));

  console.log('💾 Verification Results:');
  console.log('========================');
  console.log(`✅ Successfully verified 예천장터 product registration`);
  console.log(`📊 ${validProducts}/${ycjangProducts.length} products have valid data`);
  console.log(`📁 Verification report saved: ${verificationPath}\n`);

  // Final status
  if (validProducts === ycjangProducts.length) {
    console.log('🎉 All products passed verification! Registration is complete and successful.');
  } else {
    console.log(`⚠️ ${ycjangProducts.length - validProducts} products have data quality issues but are registered.`);
  }

  return verificationResult;
}

// Run verification
verifyYcjangRegistration()
  .then(() => {
    console.log('\n✅ Verification completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });