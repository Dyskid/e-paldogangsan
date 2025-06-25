import * as fs from 'fs';

async function verifyBoseongRegistration() {
  try {
    console.log('🔍 Verifying Boseong Mall product registration...');
    
    // Read products database
    const products = JSON.parse(
      fs.readFileSync('./src/data/products.json', 'utf-8')
    );
    
    // Read registration summary
    const registrationSummary = JSON.parse(
      fs.readFileSync('./scripts/output/boseong-registration-summary.json', 'utf-8')
    );
    
    // Find Boseong products
    const boseongProducts = products.filter((p: any) => p.mall === '보성몰');
    
    console.log(`📊 Found ${boseongProducts.length} Boseong Mall products in database`);
    
    // Verify data quality
    const verificationResults = {
      totalProducts: boseongProducts.length,
      validProducts: 0,
      invalidProducts: 0,
      issues: [] as string[],
      categories: {} as Record<string, number>,
      priceRange: { min: Infinity, max: 0 },
      sampleProducts: [] as any[]
    };
    
    boseongProducts.forEach((product: any, index: number) => {
      let isValid = true;
      
      // Check required fields
      if (!product.title || !product.price || !product.image || !product.url) {
        verificationResults.issues.push(`Product ${index + 1}: Missing required fields`);
        isValid = false;
      }
      
      // Check price format
      if (!product.price.includes('원')) {
        verificationResults.issues.push(`Product ${index + 1}: Invalid price format - ${product.price}`);
        isValid = false;
      }
      
      // Check URL
      if (!product.url.includes('boseongmall.co.kr')) {
        verificationResults.issues.push(`Product ${index + 1}: Invalid URL - ${product.url}`);
        isValid = false;
      }
      
      // Check image URL
      if (!product.image.startsWith('http')) {
        verificationResults.issues.push(`Product ${index + 1}: Invalid image URL - ${product.image}`);
        isValid = false;
      }
      
      if (isValid) {
        verificationResults.validProducts++;
        
        // Track categories
        const category = product.category || '미분류';
        verificationResults.categories[category] = (verificationResults.categories[category] || 0) + 1;
        
        // Track price range
        const priceValue = parseInt(product.price.replace(/[^\d]/g, ''));
        if (priceValue < verificationResults.priceRange.min) {
          verificationResults.priceRange.min = priceValue;
        }
        if (priceValue > verificationResults.priceRange.max) {
          verificationResults.priceRange.max = priceValue;
        }
      } else {
        verificationResults.invalidProducts++;
      }
      
      // Collect sample products
      if (verificationResults.sampleProducts.length < 10) {
        verificationResults.sampleProducts.push({
          title: product.title,
          price: product.price,
          category: product.category,
          url: product.url,
          valid: isValid
        });
      }
    });
    
    // Final verification report
    const report = {
      verificationDate: new Date().toISOString(),
      mall: '보성몰',
      region: '전남',
      ...verificationResults,
      successRate: ((verificationResults.validProducts / verificationResults.totalProducts) * 100).toFixed(2),
      averagePrice: Math.round((verificationResults.priceRange.min + verificationResults.priceRange.max) / 2)
    };
    
    // Save verification report
    fs.writeFileSync('./scripts/output/boseong-verification-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n📊 Verification Results:');
    console.log(`Total products: ${report.totalProducts}`);
    console.log(`Valid products: ${report.validProducts}`);
    console.log(`Invalid products: ${report.invalidProducts}`);
    console.log(`Success rate: ${report.successRate}%`);
    console.log(`Price range: ${report.priceRange.min.toLocaleString()}원 - ${report.priceRange.max.toLocaleString()}원`);
    console.log(`Categories: ${Object.keys(report.categories).join(', ')}`);
    
    console.log('\n📋 Category breakdown:');
    Object.entries(report.categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });
    
    if (report.issues.length > 0) {
      console.log('\n⚠️ Issues found:');
      report.issues.slice(0, 5).forEach(issue => {
        console.log(`  - ${issue}`);
      });
      if (report.issues.length > 5) {
        console.log(`  ... and ${report.issues.length - 5} more issues`);
      }
    }
    
    console.log('\n✅ Sample verified products:');
    report.sampleProducts.slice(0, 5).forEach((product, index) => {
      const status = product.valid ? '✅' : '❌';
      console.log(`  ${status} ${product.title} - ${product.price} (${product.category})`);
    });
    
    if (report.successRate === '100.00') {
      console.log('\n🎉 All Boseong Mall products passed verification!');
    } else {
      console.log(`\n⚠️ ${report.invalidProducts} products have issues that need attention.`);
    }
    
    console.log('\n✅ Verification report saved to boseong-verification-report.json');
    return report;
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  }
}

// Run verification
verifyBoseongRegistration()
  .then((report) => {
    console.log(`\n✅ Verification completed! Success rate: ${report.successRate}%`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error.message);
    process.exit(1);
  });