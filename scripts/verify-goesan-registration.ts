import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  mall: string;
  tags: string[];
  category: string;
  featured: boolean;
}

async function verifyGoesanRegistration() {
  try {
    console.log('Starting Goesan Marketplace registration verification...');
    
    // Read the products database
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const allProducts: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    // Filter Goesan products
    const goesanProducts = allProducts.filter(p => p.id.startsWith('goesan_'));
    
    console.log(`Found ${goesanProducts.length} Goesan products in database`);
    
    // Verification checks
    const verificationResults = {
      totalProducts: goesanProducts.length,
      validProducts: 0,
      invalidProducts: 0,
      issues: [] as string[],
      categoryBreakdown: {} as Record<string, number>,
      priceRange: { min: Infinity, max: 0, average: 0 },
      validImages: 0,
      validUrls: 0,
      mallConsistency: 0
    };
    
    let totalPrice = 0;
    let priceCount = 0;
    
    // Check each product
    goesanProducts.forEach((product, index) => {
      let isValid = true;
      
      // Check required fields
      if (!product.title || product.title.trim().length === 0) {
        verificationResults.issues.push(`Product ${product.id}: Missing or empty title`);
        isValid = false;
      }
      
      if (!product.price || product.price.trim().length === 0) {
        verificationResults.issues.push(`Product ${product.id}: Missing or empty price`);
        isValid = false;
      } else {
        // Extract numeric price for analysis
        const priceMatch = product.price.match(/[\d,]+/);
        if (priceMatch) {
          const numericPrice = parseInt(priceMatch[0].replace(/,/g, ''));
          totalPrice += numericPrice;
          priceCount++;
          verificationResults.priceRange.min = Math.min(verificationResults.priceRange.min, numericPrice);
          verificationResults.priceRange.max = Math.max(verificationResults.priceRange.max, numericPrice);
        }
      }
      
      if (!product.image || !product.image.startsWith('http')) {
        verificationResults.issues.push(`Product ${product.id}: Invalid or missing image URL`);
        isValid = false;
      } else {
        verificationResults.validImages++;
      }
      
      if (!product.url || !product.url.startsWith('https://www.gsjangter.go.kr')) {
        verificationResults.issues.push(`Product ${product.id}: Invalid or missing product URL`);
        isValid = false;
      } else {
        verificationResults.validUrls++;
      }
      
      if (!product.category || product.category.trim().length === 0) {
        verificationResults.issues.push(`Product ${product.id}: Missing or empty category`);
        isValid = false;
      } else {
        // Count categories
        verificationResults.categoryBreakdown[product.category] = 
          (verificationResults.categoryBreakdown[product.category] || 0) + 1;
      }
      
      if (product.mall === '괴산장터') {
        verificationResults.mallConsistency++;
      } else {
        verificationResults.issues.push(`Product ${product.id}: Incorrect mall name: ${product.mall}`);
        isValid = false;
      }
      
      if (!Array.isArray(product.tags) || product.tags.length === 0) {
        verificationResults.issues.push(`Product ${product.id}: Missing or empty tags`);
        isValid = false;
      }
      
      if (isValid) {
        verificationResults.validProducts++;
      } else {
        verificationResults.invalidProducts++;
      }
    });
    
    // Calculate average price
    verificationResults.priceRange.average = priceCount > 0 ? Math.round(totalPrice / priceCount) : 0;
    
    // Check for potential categories (products without proper categorization)
    const potentialCategories = goesanProducts.filter(p => 
      p.title.includes('카테고리') || 
      p.title.includes('분류') || 
      p.title.length < 5
    );
    
    if (potentialCategories.length > 0) {
      verificationResults.issues.push(`Found ${potentialCategories.length} potential category items that should be filtered out`);
    }
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      mall: 'Goesan Marketplace',
      verification: verificationResults,
      dataQuality: {
        overallValid: verificationResults.validProducts,
        dataCompleteness: Math.round((verificationResults.validProducts / verificationResults.totalProducts) * 100),
        imageUrlValidity: Math.round((verificationResults.validImages / verificationResults.totalProducts) * 100),
        productUrlValidity: Math.round((verificationResults.validUrls / verificationResults.totalProducts) * 100),
        mallConsistency: Math.round((verificationResults.mallConsistency / verificationResults.totalProducts) * 100)
      },
      sampleProducts: goesanProducts.slice(0, 3).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category,
        mall: p.mall
      }))
    };
    
    // Save verification report
    const reportPath = path.join(__dirname, 'output', 'goesan-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n=== GOESAN MARKETPLACE VERIFICATION REPORT ===');
    console.log(`Total products: ${verificationResults.totalProducts}`);
    console.log(`Valid products: ${verificationResults.validProducts}`);
    console.log(`Invalid products: ${verificationResults.invalidProducts}`);
    console.log(`Data completeness: ${report.dataQuality.dataCompleteness}%`);
    console.log(`Image URL validity: ${report.dataQuality.imageUrlValidity}%`);
    console.log(`Product URL validity: ${report.dataQuality.productUrlValidity}%`);
    console.log(`Mall consistency: ${report.dataQuality.mallConsistency}%`);
    
    console.log(`\nPrice range: ${verificationResults.priceRange.min.toLocaleString()}원 - ${verificationResults.priceRange.max.toLocaleString()}원`);
    console.log(`Average price: ${verificationResults.priceRange.average.toLocaleString()}원`);
    
    console.log('\nCategory breakdown:');
    Object.entries(verificationResults.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} products`);
      });
    
    if (verificationResults.issues.length > 0) {
      console.log(`\n⚠️  Found ${verificationResults.issues.length} issues:`);
      verificationResults.issues.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue}`);
      });
      if (verificationResults.issues.length > 10) {
        console.log(`  ... and ${verificationResults.issues.length - 10} more issues`);
      }
    } else {
      console.log('\n✅ No data quality issues found!');
    }
    
    console.log(`\nVerification report saved to: ${reportPath}`);
    console.log('Goesan Marketplace verification completed!');
    
  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
}

verifyGoesanRegistration();